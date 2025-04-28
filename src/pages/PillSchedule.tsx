import React, { useState } from 'react';
import { PillSchedule as PillScheduleType, usePills } from '../context/PillContext';
import { Plus, Clock, Edit2, Trash2, Save, X } from 'lucide-react';

const PillSchedule: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = usePills();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [newPill, setNewPill] = useState({
    pillName: '',
    dosage: '',
    time: 'morning' as 'morning' | 'afternoon' | 'night',
    timeHour: 8,
    timeMinute: 0,
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    active: true,
    color: 'blue-500'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPill({
      ...newPill,
      [name]: value
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    
    let timeHour = newPill.timeHour;
    if (value === 'morning') timeHour = 8;
    if (value === 'afternoon') timeHour = 13;
    if (value === 'night') timeHour = 20;
    
    setNewPill({
      ...newPill,
      time: value as 'morning' | 'afternoon' | 'night',
      timeHour
    });
  };

  const handleDayToggle = (day: string) => {
    const updatedDays = newPill.daysOfWeek.includes(day)
      ? newPill.daysOfWeek.filter(d => d !== day)
      : [...newPill.daysOfWeek, day];
    
    setNewPill({
      ...newPill,
      daysOfWeek: updatedDays
    });
  };

  const handleColorSelect = (color: string) => {
    setNewPill({
      ...newPill,
      color
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validate form data
      if (!newPill.pillName.trim()) {
        throw new Error('Pill name is required');
      }
      
      if (!newPill.dosage.trim()) {
        throw new Error('Dosage is required');
      }
      
      if (newPill.daysOfWeek.length === 0) {
        throw new Error('Please select at least one day of the week');
      }

      if (editingId) {
        await updateSchedule(editingId, newPill);
        setEditingId(null);
      } else {
        await addSchedule(newPill);
      }
      
      setNewPill({
        pillName: '',
        dosage: '',
        time: 'morning',
        timeHour: 8,
        timeMinute: 0,
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        active: true,
        color: 'blue-500'
      });
      
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error saving schedule:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save schedule. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule: PillScheduleType) => {
    setNewPill(schedule);
    setEditingId(schedule.id);
    setIsAddingNew(true);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setNewPill({
      pillName: '',
      dosage: '',
      time: 'morning',
      timeHour: 8,
      timeMinute: 0,
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      active: true,
      color: 'blue-500'
    });
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute} ${period}`;
  };

  return (
    <div className="pb-16 md:pb-0 md:pl-64">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Pill Schedule</h1>
        {!isAddingNew && (
          <button 
            onClick={() => setIsAddingNew(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </button>
        )}
      </header>
      
      {isAddingNew ? (
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Pill Schedule' : 'Add New Pill Schedule'}</h2>
            <button 
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label htmlFor="pillName" className="block text-gray-700 font-medium mb-2">
                    Pill Name
                  </label>
                  <input
                    type="text"
                    id="pillName"
                    name="pillName"
                    value={newPill.pillName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Vitamin D, Multivitamin"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="dosage" className="block text-gray-700 font-medium mb-2">
                    Dosage
                  </label>
                  <input
                    type="text"
                    id="dosage"
                    name="dosage"
                    value={newPill.dosage}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., 1 tablet, 500mg"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="time" className="block text-gray-700 font-medium mb-2">
                    Time of Day
                  </label>
                  <select
                    id="time"
                    name="time"
                    value={newPill.time}
                    onChange={handleTimeChange}
                    className="input-field"
                    required
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="specificTime" className="block text-gray-700 font-medium mb-2">
                    Specific Time
                  </label>
                  <div className="flex space-x-2">
                    <select
                      id="timeHour"
                      name="timeHour"
                      value={newPill.timeHour}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</option>
                      ))}
                    </select>
                    <span className="flex items-center">:</span>
                    <select
                      id="timeMinute"
                      name="timeMinute"
                      value={newPill.timeMinute}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                      const fullDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index];
                      const isSelected = newPill.daysOfWeek.includes(fullDay);
                      
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(fullDay)}
                          className={`rounded-full w-10 h-10 flex items-center justify-center text-sm transition-colors ${
                            isSelected 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['blue-500', 'emerald-500', 'orange-500', 'purple-500', 'pink-500', 'red-500'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`w-8 h-8 rounded-full bg-${color} ${
                          newPill.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingId ? 'Update Schedule' : 'Save Schedule'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline border-gray-300 text-gray-700"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Your Schedules</h2>
        
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {/* Morning schedules */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-blue-50 p-4 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="font-semibold">Morning</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {schedules
                  .filter(schedule => schedule.time === 'morning')
                  .map(schedule => (
                    <div key={schedule.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${schedule.color}`}></div>
                          <h4 className="font-medium">{schedule.pillName}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-4">
                          {formatTime(schedule.timeHour, schedule.timeMinute)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {schedules.filter(schedule => schedule.time === 'morning').length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No morning schedules
                  </div>
                )}
              </div>
            </div>
            
            {/* Afternoon schedules */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-emerald-50 p-4 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="font-semibold">Afternoon</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {schedules
                  .filter(schedule => schedule.time === 'afternoon')
                  .map(schedule => (
                    <div key={schedule.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${schedule.color}`}></div>
                          <h4 className="font-medium">{schedule.pillName}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-4">
                          {formatTime(schedule.timeHour, schedule.timeMinute)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {schedules.filter(schedule => schedule.time === 'afternoon').length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No afternoon schedules
                  </div>
                )}
              </div>
            </div>
            
            {/* Night schedules */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-orange-50 p-4 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="font-semibold">Night</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {schedules
                  .filter(schedule => schedule.time === 'night')
                  .map(schedule => (
                    <div key={schedule.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${schedule.color}`}></div>
                          <h4 className="font-medium">{schedule.pillName}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{schedule.dosage}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-4">
                          {formatTime(schedule.timeHour, schedule.timeMinute)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-2 rounded-full hover:bg-gray-100"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {schedules.filter(schedule => schedule.time === 'night').length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No night schedules
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Pill Schedules Yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first pill schedule to get started with MediMate.
            </p>
            <button
              onClick={() => setIsAddingNew(true)}
              className="btn btn-primary"
            >
              Add Your First Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PillSchedule;