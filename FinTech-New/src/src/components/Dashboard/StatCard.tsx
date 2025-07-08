import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'gray';
  trend?: 'up' | 'down';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color = 'gray',
  trend
}) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const bgColors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    gray: 'bg-gray-100'
  };

  // Animated number
  const [displayValue, setDisplayValue] = useState('0');
  const prevValue = useRef('0');
  useEffect(() => {
    if (!value.startsWith('$')) {
      setDisplayValue(value);
      return;
    }
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    let start = 0;
    let frame: number;
    const duration = 800;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = start + (num - start) * progress;
      setDisplayValue(`$${current.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      if (progress < 1) {
        frame = requestAnimationFrame((t) => step(t, startTime));
      }
    };
    frame = requestAnimationFrame((t) => step(t, t));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-1 transition-all duration-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{displayValue}</p>
          {change && (
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[changeType]}`}>
              {change}
            </div>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend === 'up' ? '↑' : '↓'}
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColors[color]} dark:bg-opacity-20 shadow-inner`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </div>
      </div>
    </div>
  );
};