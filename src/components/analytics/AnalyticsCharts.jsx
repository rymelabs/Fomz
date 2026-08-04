import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ChartCard = ({ title, children, className = '', rightElement }) => (
  <div className={`rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display text-base text-gray-900">{title}</h3>
      {rightElement}
    </div>
    {children}
  </div>
);

export const TimelineChart = ({ responses }) => {
  const { data, maxCount } = useMemo(() => {
    if (!responses.length) return { data: [], maxCount: 0 };

    // Get date range
    const dates = responses.map(r => new Date(r.submittedAt));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Normalize to start of day
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    // If range is less than 7 days, show at least 7 days ending at maxDate
    const dayDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
    if (dayDiff < 6) {
      minDate.setDate(maxDate.getDate() - 6);
    }

    // Generate all dates in range
    const allDates = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      allDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Group responses by date
    const grouped = responses.reduce((acc, r) => {
      const date = new Date(r.submittedAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const chartData = allDates.map(date => ({
      date,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: date.toLocaleDateString(),
      count: grouped[date.toLocaleDateString()] || 0
    }));

    return {
      data: chartData,
      maxCount: Math.max(...chartData.map(d => d.count), 1) // Ensure at least 1 for scale
    };
  }, [responses]);

  if (!data.length) return null;

  return (
    <ChartCard title="Response Timeline">
      <div className="relative h-64 w-full pl-8 pb-6">
        {/* Grid Lines & Y-Axis */}
        <div className="absolute inset-0 left-8 bottom-6 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => {
            const val = Math.round(maxCount - (maxCount * i / 4));
            return (
              <div key={i} className="border-b border-gray-100 w-full h-0 relative flex items-center">
                <span className="absolute right-full mr-3 text-xs text-gray-400 w-8 text-right font-medium">
                  {val}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 left-8 bottom-6 flex items-end justify-between gap-1 pt-4">
          {data.map(({ date, label, count, fullDate }) => (
            <div key={fullDate} className="relative flex-1 h-full flex items-end group">
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center">
                  <span className="font-medium">{count} responses</span>
                  <span className="text-gray-400 text-[10px]">{fullDate}</span>
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>

              {/* Bar */}
              <div className="w-full h-full flex items-end justify-center relative">
                <div 
                  className={`w-full max-w-[40px] rounded-full transition-all duration-500 ease-out relative group-hover:opacity-90 ${
                    count > 0 ? 'bg-gradient-to-t from-primary-500 to-primary-400 shadow-sm' : 'bg-gray-50'
                  }`}
                  style={{ height: count > 0 ? `${(count / maxCount) * 100}%` : '4px' }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* X-Axis Labels */}
        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
          {data.map((d, i) => {
            // Show label if it's the first, last, or roughly every 5th item (adjust based on total items)
            // If items < 8, show all. If more, distribute.
            const total = data.length;
            const step = Math.ceil(total / 6);
            const showLabel = i === 0 || i === total - 1 || i % step === 0;
            
            return (
              <div key={i} className="relative flex justify-center" style={{ width: `${100 / total}%` }}>
                {showLabel && (
                  <span className="absolute top-0 whitespace-nowrap transform -translate-x-1/2 left-1/2">
                    {d.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
};

export const DeviceStats = ({ responses }) => {
  const stats = useMemo(() => {
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };
    
    responses.forEach(r => {
      const ua = r.metadata?.userAgent || '';
      if (/mobile/i.test(ua)) {
        devices.Mobile++;
      } else if (/tablet|ipad/i.test(ua)) {
        devices.Tablet++;
      } else {
        devices.Desktop++;
      }
    });

    const total = responses.length;
    return Object.entries(devices)
      .filter(([_, count]) => count > 0)
      .map(([device, count]) => ({
        device,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [responses]);

  return (
    <ChartCard title="Devices">
      <div className="space-y-5">
        {stats.map(({ device, count, percentage }) => (
          <div key={device} className="group">
            <div className="flex justify-between text-sm mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  device === 'Desktop' ? 'bg-primary-500' : 
                  device === 'Mobile' ? 'bg-primary-400' : 'bg-primary-300'
                }`}></span>
                <span className="text-gray-600 font-medium">{device}</span>
              </div>
              <span className="text-gray-900 font-bold">{percentage}% <span className="text-gray-400 font-normal text-xs">({count})</span></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-90 ${
                  device === 'Desktop' ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 
                  device === 'Mobile' ? 'bg-gradient-to-r from-primary-400 to-primary-500' : 
                  'bg-gradient-to-r from-primary-300 to-primary-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <p className="text-sm">No device data available</p>
          </div>
        )}
      </div>
    </ChartCard>
  );
};

export const ResponsePatterns = ({ responses }) => {
  const hourlyData = useMemo(() => {
    const hours = new Array(24).fill(0);
    responses.forEach(r => {
      const hour = new Date(r.submittedAt).getHours();
      hours[hour]++;
    });
    return hours;
  }, [responses]);

  const maxCount = Math.max(...hourlyData, 1);

  return (
    <ChartCard title="Activity by Hour">
      <div className="flex items-end gap-[2px] h-32 pt-6">
        {hourlyData.map((count, hour) => (
          <div key={hour} className="flex-1 h-full flex items-end group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
              <div className="bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap">
                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                <span className="mx-1">•</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
            </div>

            {/* Bar */}
            <div 
              className={`w-full rounded-full transition-all duration-300 ${
                count > 0 
                  ? 'bg-gradient-to-t from-primary-500 to-primary-300 opacity-80 group-hover:opacity-100' 
                  : 'bg-gray-100 h-[2px]'
              }`}
              style={{ height: count > 0 ? `${(count / maxCount) * 100}%` : '2px' }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wider">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </ChartCard>
  );
};

// Completion Rate Component
export const CompletionRate = ({ responses, totalStarted = null }) => {
  const stats = useMemo(() => {
    const completed = responses.length;
    // If totalStarted is not provided, estimate based on completed (assuming 70-90% completion rate as placeholder)
    const started = totalStarted ?? Math.ceil(completed * 1.2);
    const rate = started > 0 ? Math.round((completed / started) * 100) : 0;
    
    // Calculate trend (compare last 7 days to previous 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    
    const lastWeekResponses = responses.filter(r => new Date(r.submittedAt) >= oneWeekAgo);
    const previousWeekResponses = responses.filter(r => {
      const date = new Date(r.submittedAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });
    
    let trend = 'stable';
    let trendPercentage = 0;
    
    if (previousWeekResponses.length > 0) {
      const change = lastWeekResponses.length - previousWeekResponses.length;
      trendPercentage = Math.round((change / previousWeekResponses.length) * 100);
      if (trendPercentage > 10) trend = 'up';
      else if (trendPercentage < -10) trend = 'down';
    }
    
    return { completed, started, rate, trend, trendPercentage };
  }, [responses, totalStarted]);

  return (
    <ChartCard title="Completion Rate">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{stats.rate}%</span>
            <div className={`flex items-center gap-1 text-sm mb-1 ${
              stats.trend === 'up' ? 'text-green-600' :
              stats.trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {stats.trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {stats.trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {stats.trend === 'stable' && <Minus className="h-4 w-4" />}
              <span>{stats.trendPercentage > 0 ? '+' : ''}{stats.trendPercentage}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.completed} completed of ~{stats.started} started
          </p>
        </div>
        
        {/* Circular Progress */}
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-100"
              strokeDasharray="100, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-primary-500"
              strokeDasharray={`${stats.rate}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </ChartCard>
  );
};

// Date Range Picker Component
export const DateRangePicker = ({ startDate, endDate, onDateChange, presets = true }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const presetRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This year', days: 365 },
    { label: 'All time', days: null }
  ];

  const applyPreset = (days) => {
    const end = new Date();
    const start = days ? new Date(end - days * 24 * 60 * 60 * 1000) : null;
    onDateChange(start, end);
    setShowPicker(false);
  };

  const formatDateDisplay = () => {
    if (!startDate && !endDate) return 'All time';
    if (!startDate) return `Until ${endDate.toLocaleDateString()}`;
    if (!endDate) return `From ${startDate.toLocaleDateString()}`;
    
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startOpts = { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) };
    const endOpts = { month: 'short', day: 'numeric', year: 'numeric' };
    
    return `${startDate.toLocaleDateString(undefined, startOpts)} - ${endDate.toLocaleDateString(undefined, endOpts)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700">{formatDateDisplay()}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {showPicker && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)} 
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[280px]">
            {presets && (
              <div className="space-y-1 mb-4 pb-4 border-b border-gray-100">
                {presetRanges.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.days)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart ? tempStart.toISOString().split('T')[0] : ''}
                  onChange={(e) => setTempStart(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd ? tempEnd.toISOString().split('T')[0] : ''}
                  onChange={(e) => setTempEnd(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={() => {
                  onDateChange(tempStart, tempEnd);
                  setShowPicker(false);
                }}
                className="w-full py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Question-Level Stats Component
export const QuestionStats = ({ responses, questions }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const questionStats = useMemo(() => {
    if (!questions || !responses.length) return [];

    return questions.map((question, index) => {
      // Get all answers for this question
      const answers = responses.map(r => {
        if (Array.isArray(r.answers)) {
          const answer = r.answers.find(a => a.questionId === question.id);
          return answer?.value;
        }
        return r.answers?.[question.id];
      }).filter(a => a !== undefined && a !== null && a !== '');

      const totalResponses = responses.length;
      const answered = answers.length;
      const skipped = totalResponses - answered;
      const responseRate = Math.round((answered / totalResponses) * 100);

      // Calculate distribution based on question type
      let distribution = null;
      
      if (['multiple-choice', 'dropdown', 'checkbox'].includes(question.type)) {
        // Count occurrences of each option
        const counts = {};
        answers.forEach(answer => {
          const values = Array.isArray(answer) ? answer : [answer];
          values.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
          });
        });
        
        distribution = (question.options || []).map(opt => ({
          option: opt,
          count: counts[opt] || 0,
          percentage: answered > 0 ? Math.round((counts[opt] || 0) / answered * 100) : 0
        }));
      } else if (question.type === 'rating') {
        // Rating distribution
        const maxRating = question.maxRating || 5;
        const counts = {};
        answers.forEach(answer => {
          const rating = parseInt(answer);
          if (!isNaN(rating)) {
            counts[rating] = (counts[rating] || 0) + 1;
          }
        });
        
        distribution = Array.from({ length: maxRating }, (_, i) => i + 1).map(rating => ({
          option: `${rating} star${rating > 1 ? 's' : ''}`,
          count: counts[rating] || 0,
          percentage: answered > 0 ? Math.round((counts[rating] || 0) / answered * 100) : 0
        }));
        
        // Calculate average rating
        const sum = answers.reduce((acc, a) => acc + parseInt(a), 0);
        distribution.average = answered > 0 ? (sum / answered).toFixed(1) : null;
      } else if (question.type === 'slider') {
        // Slider average and range
        const numericAnswers = answers.map(a => parseFloat(a)).filter(n => !isNaN(n));
        if (numericAnswers.length) {
          const sum = numericAnswers.reduce((acc, n) => acc + n, 0);
          const avg = sum / numericAnswers.length;
          const min = Math.min(...numericAnswers);
          const max = Math.max(...numericAnswers);
          distribution = { average: avg.toFixed(1), min, max };
        }
      }

      return {
        id: question.id,
        title: question.title,
        type: question.type,
        index: index + 1,
        answered,
        skipped,
        responseRate,
        distribution
      };
    });
  }, [responses, questions]);

  if (!questionStats.length) {
    return (
      <ChartCard title="Question Analytics">
        <p className="text-gray-500 text-center py-8">No question data available</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Question Analytics" className="col-span-full">
      <div className="space-y-3">
        {questionStats.map((stat) => (
          <div
            key={stat.id}
            className="border border-gray-100 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedQuestion(expandedQuestion === stat.id ? null : stat.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-medium text-gray-400 w-6">Q{stat.index}</span>
                <span className="text-sm text-gray-900 truncate">{stat.title}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize whitespace-nowrap">
                  {stat.type.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{stat.responseRate}%</p>
                  <p className="text-xs text-gray-400">{stat.answered} answers</p>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    expandedQuestion === stat.id ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </button>

            {expandedQuestion === stat.id && stat.distribution && (
              <div className="p-3 pt-0 border-t border-gray-100 bg-gray-50/50">
                {Array.isArray(stat.distribution) ? (
                  <div className="space-y-2 mt-3">
                    {stat.distribution.average && (
                      <p className="text-sm text-gray-600 mb-3">
                        Average rating: <span className="font-semibold text-primary-600">{stat.distribution.average}</span>
                      </p>
                    )}
                    {stat.distribution.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-24 truncate">{item.option}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Average: <span className="font-semibold text-primary-600">{stat.distribution.average}</span></p>
                    <p className="text-xs text-gray-400 mt-1">
                      Range: {stat.distribution.min} - {stat.distribution.max}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ChartCard>
  );
};
