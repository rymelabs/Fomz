import React, { useMemo } from 'react';

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`rounded-3xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur ${className}`}>
    <h3 className="font-display text-base text-gray-900 mb-4">{title}</h3>
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
