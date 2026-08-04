import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

const TimeInput = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  fontClass = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Parse time value (HH:MM format)
  const parseTime = (val) => {
    if (!val) return { hours: '', minutes: '', period: 'AM' };
    const match = val.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3]?.toUpperCase() || (hours >= 12 ? 'PM' : 'AM');
      
      // Convert to 12-hour format for display
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours - 12;
      
      return { hours: String(hours), minutes, period };
    }
    return { hours: '', minutes: '', period: 'AM' };
  };
  
  const { hours, minutes, period } = parseTime(value);
  
  const formatTime = (h, m, p) => {
    if (!h || !m) return '';
    // Store in 24-hour format internally
    let hour24 = parseInt(h, 10);
    if (p === 'PM' && hour24 !== 12) hour24 += 12;
    if (p === 'AM' && hour24 === 12) hour24 = 0;
    return `${String(hour24).padStart(2, '0')}:${m}`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHoursChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val, 10);
    if (num > 12) val = '12';
    if (num < 0) val = '1';
    onChange(formatTime(val || '12', minutes || '00', period));
  };

  const handleMinutesChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) val = val.slice(0, 2);
    const num = parseInt(val, 10);
    if (num > 59) val = '59';
    if (num < 0) val = '00';
    onChange(formatTime(hours || '12', val.padStart(2, '0'), period));
  };

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    onChange(formatTime(hours || '12', minutes || '00', newPeriod));
  };

  const incrementHours = () => {
    let h = parseInt(hours, 10) || 12;
    h = h >= 12 ? 1 : h + 1;
    onChange(formatTime(String(h), minutes || '00', period));
  };

  const decrementHours = () => {
    let h = parseInt(hours, 10) || 12;
    h = h <= 1 ? 12 : h - 1;
    onChange(formatTime(String(h), minutes || '00', period));
  };

  const incrementMinutes = () => {
    let m = parseInt(minutes, 10) || 0;
    m = m >= 55 ? 0 : m + 5;
    onChange(formatTime(hours || '12', String(m).padStart(2, '0'), period));
  };

  const decrementMinutes = () => {
    let m = parseInt(minutes, 10) || 0;
    m = m <= 0 ? 55 : m - 5;
    onChange(formatTime(hours || '12', String(m).padStart(2, '0'), period));
  };

  const quickTimes = [
    { label: '9:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '2:00 PM', value: '14:00' },
    { label: '5:00 PM', value: '17:00' },
    { label: '6:00 PM', value: '18:00' },
  ];

  return (
    <div className="space-y-1" ref={dropdownRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-full border border-gray-200 bg-white/50 hover:bg-white/80 transition-colors text-sm text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${error ? 'border-red-300 ring-1 ring-red-300' : ''} ${fontClass}`}
        >
          <Clock className="h-4 w-4 text-gray-400" />
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? `${hours}:${minutes} ${period}` : (question.placeholder || 'Select time')}
          </span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl bg-white shadow-xl border border-gray-200 p-4">
            {/* Time Spinner */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={hours}
                  onChange={handleHoursChange}
                  className="w-12 text-center text-2xl font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0 bg-transparent"
                  placeholder="12"
                />
                <button
                  type="button"
                  onClick={decrementHours}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-2xl font-semibold text-gray-400">:</span>
              
              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={minutes}
                  onChange={handleMinutesChange}
                  className="w-12 text-center text-2xl font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0 bg-transparent"
                  placeholder="00"
                />
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              
              {/* AM/PM Toggle */}
              <button
                type="button"
                onClick={togglePeriod}
                className="ml-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
              >
                {period}
              </button>
            </div>
            
            {/* Quick Times */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">Quick select</p>
              <div className="flex flex-wrap gap-1">
                {quickTimes.map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => {
                      onChange(time.value);
                      setIsOpen(false);
                    }}
                    className="px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-primary-100 hover:text-primary-700 transition-colors"
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Done Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-2 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default TimeInput;
