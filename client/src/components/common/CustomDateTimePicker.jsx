import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const CustomDateTimePicker = ({ initialDate, onChange }) => {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  
  // State to control the custom time popover
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  
  // Refs for positioning, detecting outside clicks, and auto-scrolling
  const timeMenuRef = useRef(null);
  const dropdownRef = useRef(null);
  const activeHourRef = useRef(null);
  const activeMinuteRef = useRef(null);
  
  // State to store the exact coordinates for the portal dropdown
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Generate options
  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minuteOptions = ["00", "15", "30", "45"];

  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) {
        setDate(d.toISOString().split("T")[0]);
        setHours(d.getHours().toString().padStart(2, "0"));
        
        const mins = d.getMinutes();
        const roundedMins = Math.round(mins / 15) * 15;
        const finalMins = roundedMins === 60 ? 0 : roundedMins;
        setMinutes(finalMins.toString().padStart(2, "0"));
      }
    }
  }, [initialDate]);

  // Handle opening menu and calculating its position on the screen
  const handleOpenMenu = () => {
    if (timeMenuRef.current) {
      const rect = timeMenuRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        zIndex: 99999, // Ensure it's above absolutely everything
      });
      setIsTimeMenuOpen(true);
    }
  };

  // Auto-scroll to selected time when the menu opens
  useEffect(() => {
    if (isTimeMenuOpen) {
      // Use setTimeout to ensure the portal DOM is fully painted before scrolling
      const timer = setTimeout(() => {
        if (activeHourRef.current) {
          activeHourRef.current.scrollIntoView({ block: "center", behavior: "instant" });
        }
        if (activeMinuteRef.current) {
          activeMinuteRef.current.scrollIntoView({ block: "center", behavior: "instant" });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isTimeMenuOpen]);

  // Close menu on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideTrigger = timeMenuRef.current && !timeMenuRef.current.contains(event.target);
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (clickedOutsideTrigger && clickedOutsideDropdown) {
        setIsTimeMenuOpen(false);
      }
    };

    const handleScrollOrResize = (event) => {
      // If the scroll happens INSIDE the dropdown, do not close it
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      
      if (isTimeMenuOpen) setIsTimeMenuOpen(false);
    };
    
    if (isTimeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Capture phase true so it catches scroll events from any scrollable parent
      window.addEventListener("scroll", handleScrollOrResize, true); 
      window.addEventListener("resize", handleScrollOrResize);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isTimeMenuOpen]);

  const handleUpdate = (newDate, newHours, newMinutes) => {
    if (newDate && onChange) {
      const formattedDateTime = `${newDate}T${newHours}:${newMinutes}:00`;
      onChange(formattedDateTime);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    handleUpdate(newDate, hours, minutes);
  };

  const handleHourSelect = (selectedHour) => {
    setHours(selectedHour);
    handleUpdate(date, selectedHour, minutes);
  };

  const handleMinuteSelect = (selectedMinute) => {
    setMinutes(selectedMinute);
    handleUpdate(date, hours, selectedMinute);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-2 rounded-xl bg-zinc-50/80 border border-zinc-200">
      
      {/* Date Picker */}
      <div className="flex flex-col">
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer p-2 rounded-lg hover:bg-zinc-200/50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
        />
      </div>

      <div className="text-slate-300 font-medium">|</div>

      {/* Custom Unified Time Picker */}
      <div className="relative">
        
        {/* Time Trigger Button */}
        <button
          ref={timeMenuRef}
          type="button"
          dir="ltr"
          onClick={() => isTimeMenuOpen ? setIsTimeMenuOpen(false) : handleOpenMenu()}
          className={`flex items-center gap-1 text-base font-bold outline-none cursor-pointer p-2 rounded-lg transition-all duration-200 ${
            isTimeMenuOpen 
              ? "bg-white ring-2 ring-indigo-200 text-indigo-700" 
              : "text-slate-700 hover:bg-zinc-200/50"
          }`}
        >
          <span>{hours}</span>
          <span>:</span>
          <span>{minutes}</span>
        </button>

        {/* Dropdown Popover - Rendered using createPortal */}
        {isTimeMenuOpen && createPortal(
          <div 
            ref={dropdownRef}
            dir="ltr" 
            style={dropdownStyle}
            className="bg-white border border-zinc-200 rounded-xl shadow-lg p-2 flex gap-2 animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* Hours Column */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 text-center mb-1">שעות</span>
              <ul className="h-[200px] overflow-y-auto w-14 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {hourOptions.map((h) => {
                  const isActive = h === hours;
                  return (
                    <li key={h} ref={isActive ? activeHourRef : null}>
                      <button
                        type="button"
                        onClick={() => handleHourSelect(h)}
                        className={`w-full text-center py-2 text-base font-bold rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {h}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="w-px bg-slate-100 my-4"></div>

            {/* Minutes Column */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 text-center mb-1">דקות</span>
              <ul className="h-[200px] overflow-y-auto w-14 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {minuteOptions.map((m) => {
                  const isActive = m === minutes;
                  return (
                    <li key={m} ref={isActive ? activeMinuteRef : null}>
                      <button
                        type="button"
                        onClick={() => handleMinuteSelect(m)}
                        className={`w-full text-center py-2 text-base font-bold rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {m}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default CustomDateTimePicker;