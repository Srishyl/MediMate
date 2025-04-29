import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PillSchedule, usePills } from '../context/PillContext';
import { useUser } from '../context/UserContext';
import PillCard from '../components/PillCard';
import MediMateChat from '../components/MediMateChat';
import RobotIcon from '../components/RobotIcon';
import { Bell, Calendar, Clock, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { schedules, history } = usePills();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get today's day of week and date string
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  const todayStr = today.toISOString().split('T')[0];

  // All schedules for today
  const todaySchedules = schedules.filter(
    s => s.active && s.daysOfWeek.includes(dayOfWeek)
  );
  const totalPillsScheduled = todaySchedules.length;
  const todayScheduleIds = todaySchedules.map(s => s.id);

  // Unique schedule IDs that have been taken today
  const takenScheduleIds = new Set(
    history
      .filter(item => {
        if (!item || !item.takenAt) return false;
        const itemDate = new Date(item.takenAt).toISOString().split('T')[0];
        return (
          itemDate === todayStr &&
          item.status === 'taken' &&
          todayScheduleIds.includes(item.scheduleId)
        );
      })
      .map(item => item.scheduleId)
  );
  const pillsTakenToday = takenScheduleIds.size;

  // Pills still to be taken today
  const pillsToBeTakenToday = todaySchedules.filter(s => !takenScheduleIds.has(s.id));

  // Next reminder: the next pill that is still to be taken today
  const nextReminder = pillsToBeTakenToday
    .filter(s => {
      const now = new Date();
      const scheduleTime = new Date();
      scheduleTime.setHours(s.timeHour, s.timeMinute, 0, 0);
      return scheduleTime > now;
    })
    .sort((a, b) => {
      const aTime = a.timeHour * 60 + a.timeMinute;
      const bTime = b.timeHour * 60 + b.timeMinute;
      return aTime - bTime;
    })[0] || null;

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

  const handleReminderClick = (id: string) => {
    navigate(`/reminder/${id}`);
  };

  return (
    <div className="pb-16 px-4 md:px-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>
        <p className="text-gray-600 mt-1">Here's your pill schedule for today</p>
      </header>
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Today's Overview Card */}
          <div className="pill-card panel-gradient overflow-hidden">
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
                    <p className="text-2xl font-bold">{pillsToBeTakenToday.length}</p>
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
                    <p className="text-2xl font-bold">{pillsTakenToday} of {totalPillsScheduled}</p>
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
        </div>
      </div>
      {/* Today's Pills Section */}
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="pill-card panel-gradient overflow-hidden">
            <div className="p-5">
              <h2 className="text-xl font-bold mb-4">Today's Pills</h2>
              {pillsToBeTakenToday.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {pillsToBeTakenToday.map(schedule => (
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
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-2 transition-transform duration-300 hover:scale-110 focus:outline-none"
        aria-label="Open chat with MediMate"
      >
        <RobotIcon className="w-16 h-16" />
      </button>

      {/* Floating Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] z-50">
          <MediMateChat onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;