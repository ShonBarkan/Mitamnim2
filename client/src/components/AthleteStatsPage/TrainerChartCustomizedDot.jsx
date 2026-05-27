import React from 'react';

const TrainerChartCustomizedDot = (props) => {
  const { cx, cy, dataKey, userAvatarMap, payload, value, stroke } = props;
  
  if (!cx || !cy) return null;

  // Find how many users share this exact value on this point
  let offset = 0;
  if (payload) {
    const overlappingKeys = Object.keys(payload).filter(
      key => key !== 'date' && key !== 'timestamp' && payload[key] === value
    ).sort(); // Sort to ensure consistent order

    const index = overlappingKeys.indexOf(dataKey);
    if (index > 0) {
      // Offset overlapping avatars horizontally to the right
      offset = index * 14; 
    }
  }

  const avatarUrl = userAvatarMap?.[dataKey];
  const size = 24;

  return (
    <svg x={cx - size / 2 + offset} y={cy - size / 2} width={size} height={size} className="overflow-visible" style={{ zIndex: 10 + offset }}>
      {avatarUrl ? (
        <foreignObject width={size} height={size} style={{ overflow: 'visible' }}>
          <img 
            src={avatarUrl} 
            alt={dataKey} 
            className="w-full h-full rounded-full object-cover shadow-sm bg-zinc-900"
            style={{ border: `2px solid ${stroke}` }}
          />
        </foreignObject>
      ) : (
        <g>
          <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#27272a" stroke={stroke} strokeWidth={2} />
          <text x={size / 2} y={size / 2 + 4} fill="#a1a1aa" fontSize={10} textAnchor="middle" fontWeight="bold">
            {dataKey.charAt(0)}
          </text>
        </g>
      )}
    </svg>
  );
};

export default TrainerChartCustomizedDot;