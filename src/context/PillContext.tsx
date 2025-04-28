import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from './UserContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';

export interface PillSchedule {
  id: string;
  userId: string;
  pillName: string;
  dosage: string;
  time: 'morning' | 'afternoon' | 'night';
  timeHour: number;
  timeMinute: number;
  daysOfWeek: string[];
  active: boolean;
  color: string;
  totalPills: number;
  remainingPills: number;
  expiryDate: string;
  lastRefillDate: string;
  refillReminderSent: boolean;
  expiryReminderSent: boolean;
}

export interface PillHistory {
  id: string;
  scheduleId: string;
  takenAt: Date;
  wasReminded: boolean;
  status: 'taken' | 'missed' | 'pending';
}

interface PillContextType {
  schedules: PillSchedule[];
  history: PillHistory[];
  addSchedule: (schedule: Omit<PillSchedule, 'id' | 'userId'>) => void;
  updateSchedule: (id: string, schedule: Partial<PillSchedule>) => void;
  deleteSchedule: (id: string) => void;
  recordPillTaken: (scheduleId: string, wasReminded: boolean) => void;
  getTodaySchedules: () => Promise<PillSchedule[]>;
  getUpcomingReminders: () => Promise<PillSchedule[]>;
  updateRemainingPills: (scheduleId: string) => Promise<void>;
  loadSchedules: () => Promise<(() => void) | undefined>;
  loading: boolean;
  error: string | null;
}

const PillContext = createContext<PillContextType | undefined>(undefined);

export const PillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [schedules, setSchedules] = useState<PillSchedule[]>([]);
  const [history, setHistory] = useState<PillHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get schedules from Firestore
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("userId", "==", user.id)
      );
      
      const snapshot = await getDocs(schedulesQuery);
      const schedulesData: PillSchedule[] = [];
      snapshot.forEach((doc) => {
        schedulesData.push({ id: doc.id, ...doc.data() } as PillSchedule);
      });
      console.log('Schedules loaded:', schedulesData);
      setSchedules(schedulesData);

      // Set up real-time listener for schedules
      const unsubscribe = onSnapshot(schedulesQuery, 
        (snapshot) => {
          const updatedSchedules: PillSchedule[] = [];
          snapshot.forEach((doc) => {
            updatedSchedules.push({ id: doc.id, ...doc.data() } as PillSchedule);
          });
          console.log('Schedules updated:', updatedSchedules);
          setSchedules(updatedSchedules);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching schedules:', error);
          setError('Failed to load schedules');
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load schedules');
      setLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      let unsubscribeSchedules: (() => void) | undefined;
      
      // Load schedules immediately when user changes
      loadSchedules().then(unsubscribe => {
        unsubscribeSchedules = unsubscribe;
      });
      
      // Subscribe to history collection
      const historyQuery = query(
        collection(db, "history"),
        where("userId", "==", user.id)
      );

      const unsubscribeHistory = onSnapshot(historyQuery, 
        (snapshot) => {
          const historyData: PillHistory[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            historyData.push({
              id: doc.id,
              ...data,
              takenAt: data.takenAt.toDate()
            } as PillHistory);
          });
          console.log('History updated:', historyData);
          setHistory(historyData);
        },
        (error) => {
          console.error('Error fetching history:', error);
        }
      );

      return () => {
        if (unsubscribeSchedules) {
          unsubscribeSchedules();
        }
        unsubscribeHistory();
      };
    }
  }, [user]);

  const addSchedule = async (schedule: Omit<PillSchedule, 'id' | 'userId'>) => {
    if (!user) {
      throw new Error('User must be logged in to add a schedule');
    }
    
    try {
      if (!schedule.pillName || !schedule.dosage) {
        throw new Error('Pill name and dosage are required');
      }

      if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
        throw new Error('At least one day of the week must be selected');
      }

      const newSchedule = {
        ...schedule,
        userId: user.id,
        createdAt: serverTimestamp(),
        active: true
      };
      
      console.log('Adding new schedule:', newSchedule);
      
      const schedulesRef = collection(db, "schedules");
      const docRef = await addDoc(schedulesRef, newSchedule);
      
      console.log('Schedule added successfully with ID:', docRef.id);
      
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Failed to verify schedule creation');
      }
      
      return docRef.id;
    } catch (error) {
      console.error("Error adding schedule:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to add schedule: ${error.message}`);
      }
      throw new Error('Failed to add schedule: Unknown error');
    }
  };

  const updateSchedule = async (id: string, updates: Partial<PillSchedule>) => {
    try {
      const scheduleRef = doc(db, "schedules", id);
      console.log('Updating schedule:', id, updates);
      await updateDoc(scheduleRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Schedule updated successfully');
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      console.log('Deleting schedule:', id);
      await deleteDoc(doc(db, "schedules", id));
      console.log('Schedule deleted successfully');
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  };

  const recordPillTaken = async (scheduleId: string, wasReminded: boolean) => {
    if (!user) {
      throw new Error('User must be logged in to record pill taken');
    }

    try {
      const newHistoryEntry = {
        scheduleId,
        userId: user.id,
        takenAt: serverTimestamp(),
        wasReminded,
        status: 'taken'
      };
      
      console.log('Recording pill taken:', newHistoryEntry);
      const docRef = await addDoc(collection(db, "history"), newHistoryEntry);
      console.log('Pill taken recorded with ID:', docRef.id);
    } catch (error) {
      console.error("Error recording pill taken:", error);
      throw error;
    }
  };

  const getTodaySchedules = async (): Promise<PillSchedule[]> => {
    if (!user) {
      console.error('No user found when trying to get schedules');
      throw new Error('User must be logged in to get schedules');
    }

    try {
      console.log('Starting getTodaySchedules for user:', user.id);
      
      // Validate schedules array
      if (!Array.isArray(schedules)) {
        console.error('Schedules is not an array:', schedules);
        throw new Error('Invalid schedules data');
      }

      const today = new Date();
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
      console.log('Current day of week:', dayOfWeek);
      
      // Set time to start of day in UTC
      const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      console.log('Start of day (UTC):', startOfDay.toISOString());
      
      // Get all schedules for today
      console.log('Current schedules:', schedules);
      const todaySchedules = schedules.filter(schedule => {
        if (!schedule || typeof schedule !== 'object') {
          console.error('Invalid schedule object:', schedule);
          return false;
        }
        return schedule.active && schedule.daysOfWeek && schedule.daysOfWeek.includes(dayOfWeek);
      });
      console.log('Filtered schedules for today:', todaySchedules);

      if (todaySchedules.length === 0) {
        console.log('No active schedules found for today');
        return [];
      }
      
      // Get history for today - using a simpler query first
      console.log('Fetching history for user:', user.id);
      const historySnapshot = await getDocs(
        query(
          collection(db, "history"),
          where("userId", "==", user.id)
        )
      );
      
      // Filter history items in memory instead of in the query
      const takenScheduleIds = new Set();
      historySnapshot.forEach(doc => {
        const historyItem = doc.data();
        console.log('History item:', historyItem);
        if (historyItem && historyItem.status === 'taken') {
          const takenAt = historyItem.takenAt?.toDate();
          if (takenAt && takenAt >= startOfDay) {
            takenScheduleIds.add(historyItem.scheduleId);
          }
        }
      });
      console.log('Taken schedule IDs:', Array.from(takenScheduleIds));
      
      // Filter out schedules that have already been taken today
      const remainingSchedules = todaySchedules.filter(schedule => !takenScheduleIds.has(schedule.id));
      console.log('Remaining schedules for today:', remainingSchedules);
      
      return remainingSchedules;
    } catch (error) {
      console.error('Error getting today\'s schedules:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
        throw new Error(`Failed to load today's schedules: ${error.message}`);
      }
      throw new Error('Failed to load today\'s schedules. Please try again.');
    }
  };

  const getUpcomingReminders = async (): Promise<PillSchedule[]> => {
    const todaySchedules = await getTodaySchedules();
    const currentHour = new Date().getHours();
    
    return todaySchedules.filter(schedule => schedule.timeHour >= currentHour);
  };

  const updateRemainingPills = async (scheduleId: string) => {
    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      const scheduleDoc = await getDoc(scheduleRef);
      
      if (!scheduleDoc.exists()) {
        throw new Error('Schedule not found');
      }
      
      const schedule = scheduleDoc.data() as PillSchedule;
      const newRemainingPills = Math.max(0, schedule.remainingPills - 1);
      
      await updateDoc(scheduleRef, {
        remainingPills: newRemainingPills
      });
      
      setSchedules(schedules.map(s => 
        s.id === scheduleId 
          ? { ...s, remainingPills: newRemainingPills }
          : s
      ));
      
      console.log(`Updated remaining pills for schedule ${scheduleId}: ${newRemainingPills}`);
    } catch (error) {
      console.error('Error updating remaining pills:', error);
      throw error;
    }
  };

  return (
    <PillContext.Provider value={{
      schedules,
      history,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      recordPillTaken,
      getTodaySchedules,
      getUpcomingReminders,
      updateRemainingPills,
      loadSchedules,
      loading,
      error
    }}>
      {children}
    </PillContext.Provider>
  );
};

export const usePills = (): PillContextType => {
  const context = useContext(PillContext);
  if (context === undefined) {
    throw new Error('usePills must be used within a PillProvider');
  }
  return context;
};