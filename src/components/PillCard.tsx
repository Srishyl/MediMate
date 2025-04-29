import React from 'react';
import { PillSchedule } from '../context/PillContext';
import { Clock, Check, AlertCircle } from 'lucide-react';

interface PillCardProps {
  schedule: PillSchedule;
  status?: 'upcoming' | 'taken' | 'missed';
  onClick?: () => void;
}

const PillCard: React.FC<PillCardProps> = ({ schedule, status = 'upcoming', onClick }) => {
  const { pillName, dosage, time, timeHour, timeMinute, color } = schedule;
  
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute} ${period}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'taken':
        return <Check className="h-5 w-5 text-emerald-500" />;
      case 'missed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTimeLabel = () => {
    switch (time) {
      case 'morning':
        return 'Morning';
      case 'afternoon':
        return 'Afternoon';
      case 'night':
        return 'Night';
      default:
        return formatTime(timeHour, timeMinute);
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'taken':
        return 'bg-emerald-50';
      case 'missed':
        return 'bg-red-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div 
      className={`pill-card ${getBgColor()} hover:scale-[1.02] cursor-pointer transition-transform duration-200`}
      onClick={onClick}
    >
      <div className={`h-3 bg-${color}`}></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-xl">{pillName}</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {status === 'upcoming' && 'Upcoming'}
              {status === 'taken' && 'Taken'}
              {status === 'missed' && 'Missed'}
            </span>
          </div>
        </div>
        
        <div className="text-gray-600 text-base mb-4">
          {dosage}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-full bg-${color} bg-opacity-20 flex items-center justify-center`}>
              <Clock className={`h-5 w-5 text-${color}`} />
            </div>
            <span className="text-base font-medium">{getTimeLabel()}</span>
          </div>
          <span className="text-base text-gray-600">
            {formatTime(timeHour, timeMinute)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PillCard;