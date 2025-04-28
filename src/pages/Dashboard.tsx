import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PillSchedule, usePills } from '../context/PillContext';
import { useUser } from '../context/UserContext';
import PillCard from '../components/PillCard';
import { Bell, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { schedules, history, getTodaySchedules, getUpcomingReminders, loadSchedules } = usePills();
  const [todaySchedules, setTodaySchedules] = useState<PillSchedule[]>([]);
  const [nextReminder, setNextReminder] = useState<PillSchedule | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      console.log('Starting to load dashboard data');
      setLoading(true);
      setError(null);

      if (!user) {
        console.error('No user found when loading dashboard');
        throw new Error('User must be logged in to view dashboard');
      }

      // First, ensure schedules are loaded
      console.log('Loading schedules...');
      await loadSchedules();
      console.log('Schedules loaded successfully');

      // Get today's schedules
      console.log('Fetching today\'s schedules');
      const today = await getTodaySchedules();
      console.log('Today\'s schedules:', today);
      setTodaySchedules(today);
      
      // Get upcoming reminders
      console.log('Fetching upcoming reminders');
      const upcoming = await getUpcomingReminders();
      console.log('Upcoming reminders:', upcoming);
      if (upcoming.length > 0) {
        setNextReminder(upcoming[0]);
      } else {
        setNextReminder(null);
      }
      
      // Count completed for today - only if we have schedules
      if (today.length > 0) {
        const today2 = new Date();
        const todayStr = today2.toISOString().split('T')[0];
        console.log('Counting completed pills for date:', todayStr);
        
        const completedCount = history.filter(item => {
          if (!item || !item.takenAt) return false;
          const itemDate = new Date(item.takenAt).toISOString().split('T')[0];
          return itemDate === todayStr && item.status === 'taken';
        }).length;
        console.log('Completed count:', completedCount);
        
        setCompletedToday(completedCount);
      } else {
        setCompletedToday(0);
      }
      
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message, err.stack);
        // Check for specific error messages
        if (err.message.includes('Invalid schedules data')) {
          setError('There was a problem with the schedule data. Please try again.');
        } else if (err.message.includes('User must be logged in')) {
          setError('Please log in to view your dashboard.');
        } else if (err.message.includes('Failed to load today\'s schedules')) {
          setError('Unable to load your pill schedule. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('Retrying dashboard data load...');
    loadDashboardData();
  };

  useEffect(() => {
    if (user) {
      console.log('User changed, loading dashboard data...');
      loadDashboardData();
    }
  }, [user]);

  const handleReminderClick = (id: string) => {
    navigate(`/reminder/${id}`);
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getGreeting = () => {
    const timeOfDay = getTimeOfDay();
    return `Good ${timeOfDay}, ${user?.name?.split(' ')[0] || 'User'}`;
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute} ${period}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-xl shadow-md max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-700">Error Loading Dashboard</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0 md:pl-64">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>
        <p className="text-gray-600 mt-1">Here's your pill schedule for today</p>
      </header>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Overview Card */}
        <div className="pill-card panel-gradient overflow-hidden col-span-1 md:col-span-2">
          <div className="p-5">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Today's Overview</h3>
            </div>
            
            <div className="flex flex-wrap">
              <div className="w-1/2 p-2">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium">Today's Pills</span>
                  </div>
                  <p className="text-2xl font-bold">{todaySchedules.length}</p>
                </div>
              </div>
              
              <div className="w-1/2 p-2">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold">{completedToday} of {todaySchedules.length}</p>
                </div>
              </div>
            </div>
            
            {nextReminder && (
              <div className="mt-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium">Next Reminder</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{nextReminder.pillName}</h4>
                    <p className="text-sm text-gray-600">{nextReminder.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatTime(nextReminder.timeHour, nextReminder.timeMinute)}</p>
                    <p className="text-sm text-gray-600">{nextReminder.time}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleReminderClick(nextReminder.id)}
                  className="mt-3 w-full btn btn-primary"
                >
                  Take Now
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Weekly Progress */}
        <div className="pill-card panel-gradient">
          <div className="p-5">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Weekly Progress</h3>
            </div>
            
            <div className="space-y-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                const isToday = new Date().getDay() === index;
                const progress = isToday 
                  ? todaySchedules.length > 0 
                    ? (completedToday / todaySchedules.length) * 100 
                    : 0
                  : Math.random() > 0.3 ? 100 : Math.floor(Math.random() * 100);
                
                return (
                  <div key={day} className="flex items-center space-x-3">
                    <span className={`text-sm w-24 ${isToday ? 'font-bold' : ''}`}>{day}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Today's Pills</h2>
        {todaySchedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todaySchedules.map(schedule => (
              <PillCard 
                key={schedule.id}
                schedule={schedule}
                status="upcoming"
                onClick={() => handleReminderClick(schedule.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">No pills scheduled for today.</p>
            <button 
              onClick={() => navigate('/schedule')}
              className="mt-4 btn btn-primary"
            >
              Add New Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;