import React from 'react';

/**
 * TagDisplay Component
 * Renders a stylized tag badge with intelligent text-contrast detection.
 * * @param {string} name - The label to display.
 * @param {string} color - The background hex color of the tag.
 */
const TagDisplay = ({ name, color }) => {
  
  /**
   * Calculates the contrast-optimized text color based on background luminance.
   * Uses the W3C formula for relative luminance.
   */
  const getContrastColor = (hex) => {
    // Remove hash if present
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    
    // YIQ formula: (R*299 + G*587 + B*114) / 1000
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Return white if dark background, black if light background
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  return (
    <span
      className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border border-black/5 select-none inline-flex items-center justify-center transition-all duration-300"
      style={{
        backgroundColor: color,
        color: getContrastColor(color)
      }}
    >
      {name}
    </span>
  );
};

export default TagDisplay;