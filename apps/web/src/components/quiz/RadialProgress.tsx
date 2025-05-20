import React from 'react';

interface RadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  passed?: boolean;
}

const RadialProgress: React.FC<RadialProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  passed = false,
}) => {
  // Calculate values for SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Center position
  const center = size / 2;
  
  // Determine color based on passed status
  const getColor = () => {
    if (passed) return '#10B981'; // Green for passed
    return '#EF4444'; // Red for failed
  };
  
  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          className="dark:stroke-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Percentage text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {percentage}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {passed ? 'Bestået' : 'Ikke bestået'}
        </span>
      </div>
    </div>
  );
};

export default RadialProgress;