import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePills, PillSchedule } from '../context/PillContext';
import CameraDetection from '../components/CameraDetection';
import { Clock, Bell, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

const PillReminder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schedules, recordPillTaken } = usePills();
  
  const [schedule, setSchedule] = useState<PillSchedule | null>(null);
  const [reminderActive, setReminderActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pillTaken, setPillTaken] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audio] = useState<HTMLAudioElement | null>(
    typeof Audio !== 'undefined' ? new Audio('/sounds/reminder.mp3') : null
  );
  
  useEffect(() => {
    if (id) {
      const foundSchedule = schedules.find(s => s.id === id);
      if (foundSchedule) {
        setSchedule(foundSchedule);
      } else {
        navigate('/');
      }
    }
  }, [id, schedules, navigate]);

  useEffect(() => {
    // Start reminder automatically
    const timer = setTimeout(() => {
      setReminderActive(true);
      playSound();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  const playSound = () => {
    if (soundEnabled && audio && !pillTaken) {
      audio.loop = true;
      audio.play().catch(e => console.error('Error playing sound:', e));
    }
  };

  const stopSound = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const toggleSound = () => {
    if (soundEnabled) {
      stopSound();
    } else {
      playSound();
    }
    setSoundEnabled(!soundEnabled);
  };

  const handleTakePill = () => {
    stopSound();
    setShowCamera(true);
  };

  const handlePillTaken = () => {
    if (id) {
      recordPillTaken(id, reminderActive);
      setPillTaken(true);
      setShowCamera(false);
      stopSound();
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute} ${period}`;
  };

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0 md:pl-64 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {pillTaken ? (
          // Success state
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pill Taken Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Great job! We've recorded that you've taken your {schedule.pillName}.
            </p>
            <div className="animate-pulse">
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        ) : showCamera ? (
          // Camera detection state
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Verifying Pill Intake</h2>
            <CameraDetection onPillTaken={handlePillTaken} />
          </div>
        ) : (
          // Reminder state
          <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${
            reminderActive ? 'animate-pulse border-2 border-red-500' : ''
          }`}>
            <div className={`h-2 bg-${schedule.color}`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{schedule.pillName}</h2>
                <button
                  onClick={toggleSound}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label={soundEnabled ? 'Mute reminder' : 'Unmute reminder'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-6 w-6 text-gray-600" />
                  ) : (
                    <VolumeX className="h-6 w-6 text-gray-600" />
                  )}
                </button>
              </div>
              
              <div className="text-gray-600 text-lg mt-2">
                {schedule.dosage}
              </div>
              
              <div className="mt-8 flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-2 mx-auto">
                    <Clock className="h-10 w-10 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-lg font-bold">{formatTime(schedule.timeHour, schedule.timeMinute)}</p>
                </div>
                
                {reminderActive && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-2 mx-auto animate-pulse">
                      <Bell className="h-10 w-10 text-red-500" />
                    </div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-lg font-bold text-red-500">Reminder Active</p>
                  </div>
                )}
              </div>
              
              <div className="mt-10 flex flex-col space-y-4">
                <button
                  onClick={handleTakePill}
                  className="btn btn-primary py-4 text-lg"
                >
                  Take Pill Now
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-outline border-gray-300 text-gray-700"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PillReminder;