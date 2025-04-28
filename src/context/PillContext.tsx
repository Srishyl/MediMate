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
  getTodaySchedules: () => PillSchedule[];
  getUpcomingReminders: () => PillSchedule[];
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

  useEffect(() => {
    if (user) {
      setLoading(true);
      setError(null);

      // Subscribe to schedules collection
      const schedulesQuery = query(
        collection(db, "schedules"),
        where("userId", "==", user.id)
      );

      const unsubscribe = onSnapshot(schedulesQuery, 
        (snapshot) => {
          const schedulesData: PillSchedule[] = [];
          snapshot.forEach((doc) => {
            schedulesData.push({ id: doc.id, ...doc.data() } as PillSchedule);
          });
          console.log('Schedules updated:', schedulesData);
          setSchedules(schedulesData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching schedules:', error);
          setError('Failed to load schedules');
          setLoading(false);
        }
      );

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
        unsubscribe();
        unsubscribeHistory();
      };
    }
  }, [user]);

  const addSchedule = async (schedule: Omit<PillSchedule, 'id' | 'userId'>) => {
    if (!user) {
      throw new Error('User must be logged in to add a schedule');
    }
    
    try {
      // Validate schedule data
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
      
      // Add to Firestore
      const schedulesRef = collection(db, "schedules");
      const docRef = await addDoc(schedulesRef, newSchedule);
      
      console.log('Schedule added successfully with ID:', docRef.id);
      
      // Verify the document was created
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

  const getTodaySchedules = () => {
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    return schedules.filter(schedule => 
      schedule.active && schedule.daysOfWeek.includes(dayOfWeek)
    );
  };

  const getUpcomingReminders = () => {
    const todaySchedules = getTodaySchedules();
    const currentHour = new Date().getHours();
    
    return todaySchedules.filter(schedule => schedule.timeHour >= currentHour);
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