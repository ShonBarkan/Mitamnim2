import React, { useState, useEffect } from 'react';
import { useStatistics } from '../../contexts/StatisticsContext';
import { useUsers } from '../../contexts/UserContext';
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const DashboardLeaderboard = () => {
  const { dashboardStats, fetchDashboardStats, loadingStats } = useStatistics();
  const { users } = useUsers();

  const [period, setPeriod] = useState('week');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchDashboardStats(period);
  }, [period, fetchDashboardStats]);

  if (loadingStats && !dashboardStats) {
    return (
      <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl p-10 min-h-[400px] flex items-center justify-center">
        <span className="text-zinc-400 font-bold animate-pulse">
          טוען נתונים...
        </span>
      </div>
    );
  }

  if (
    !dashboardStats ||
    !dashboardStats.stats ||
    Object.keys(dashboardStats.stats).length === 0
  ) {
    return (
      <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl p-10 min-h-[400px] flex flex-col justify-center items-center text-center">
        <h2 className="text-3xl font-black text-zinc-900">
          אין נתונים לתצוגה
        </h2>

        <p className="mt-4 text-sm text-zinc-500 max-w-xl">
          המאמן טרם הגדיר מדדים עבור הקבוצה, או שלא תועדו אימונים בתקופה זו.
        </p>
      </div>
    );
  }

  const podiumStyles = [
    {
      place: 1,
      label: 'זהב',
      height: 'h-32 md:h-36',
      heightMobile: 'h-24',
      bg: 'from-yellow-300 to-yellow-500',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      order: 'order-2 md:order-2',
      size: 'w-16 h-16 md:w-24 md:h-24',
      crown: true
    },
    {
      place: 2,
      label: 'כסף',
      height: 'h-24 md:h-28',
      heightMobile: 'h-20',
      bg: 'from-zinc-300 to-zinc-400',
      border: 'border-zinc-200',
      text: 'text-zinc-700',
      order: 'order-1 md:order-1',
      size: 'w-14 h-14 md:w-20 md:h-20'
    },
    {
      place: 3,
      label: 'ארד',
      height: 'h-16 md:h-20',
      heightMobile: 'h-14',
      bg: 'from-amber-600 to-amber-700',
      border: 'border-amber-400',
      text: 'text-amber-100',
      order: 'order-3 md:order-3',
      size: 'w-14 h-14 md:w-20 md:h-20'
    }
  ];

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl shadow-zinc-200/40 p-6 md:p-10 min-h-[400px] flex flex-col transition-all duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">

        <div className="flex items-center gap-2 md:gap-4 bg-zinc-100 p-2 rounded-2xl border border-zinc-200 flex-wrap md:flex-nowrap">

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-xs md:text-sm font-bold text-zinc-700 outline-none cursor-pointer pr-2 md:pr-4"
          >
            <option value="today">היום</option>
            <option value="week">השבוע</option>
            <option value="month">החודש</option>
          </select>

          <div className="w-px h-6 bg-zinc-300"></div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl hover:bg-zinc-200 transition-colors text-zinc-600 hidden md:flex items-center gap-1"
            title={isExpanded ? 'צמצם תצוגה' : 'הרחב תצוגה'}
          >
            {isExpanded ? (
              <>
                <ArrowsPointingInIcon className="w-4 md:w-5 h-4 md:h-5" />
                <span className="text-xs md:text-sm">הסתר</span>
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="w-4 md:w-5 h-4 md:h-5" />
                <span className="text-xs md:text-sm">הצג</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

        {Object.entries(dashboardStats.stats).map(([displayName, data]) => {

          const allUsers = users.filter(
            (user) => user.role === 'trainee' || user.role === 'trainer'
          );

          const allUsersWithStats = allUsers.map((user) => ({
            ...user,
            value: data.user_data[user.id] ?? null,
            participated: data.user_data[user.id] !== undefined
          }));

          // Sorting
          const sortedUsers = [...allUsersWithStats].sort((a, b) => {

            // משתתפים תמיד מעל לא משתתפים
            if (a.participated && !b.participated) return -1;
            if (!a.participated && b.participated) return 1;

            if (!a.participated && !b.participated) return 0;

            return data.config.higher_better
              ? b.value - a.value
              : a.value - b.value;
          });

          const rankedUsers = sortedUsers.filter((user) => user.participated);
          const podiumUsers = rankedUsers.slice(0, 3);
          const rankedRestUsers = rankedUsers.slice(3);
          const nonParticipatingUsers = sortedUsers.filter(
            (user) => !user.participated
          );

          const unitLabel = data.config.parameter_unit || '';
          const unitSuffix = unitLabel ? ` ${unitLabel}` : '';

          // Group Result
          const userValues = Object.values(data.user_data);

          let groupResult = 0;

          if (userValues.length > 0) {
            if (data.config.aggregation === 'SUM') {
              groupResult = userValues.reduce((a, b) => a + b, 0);
            }

            if (data.config.aggregation === 'MAX') {
              groupResult = Math.max(...userValues);
            }

            if (data.config.aggregation === 'AVG') {
              groupResult = (
                userValues.reduce((a, b) => a + b, 0) / userValues.length
              ).toFixed(1);
            }
          }

          return (
            <div
              key={displayName}
              className="bg-white rounded-3xl border border-zinc-100 p-4 md:p-6 shadow-sm flex flex-col relative overflow-hidden group"
            >

              {/* Category Header */}
              <div className="flex justify-between items-start mb-4 md:mb-6 gap-2">

                <div className="flex-1">
                  <h3 className="text-base md:text-xl font-black text-zinc-800 leading-tight pr-1 border-r-4 border-blue-500">
                    {displayName}
                  </h3>

                  <p className="text-[9px] md:text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
                    {data.config.aggregation} | {data.config.higher_better ? 'גבוה עדיף' : 'נמוך עדיף'}
                  </p>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="block text-2xl md:text-3xl font-black text-blue-600 leading-none">
                    {groupResult}{unitSuffix}
                  </span>

                  <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    קבוצה
                  </span>
                </div>
              </div>

              {/* PODIUM */}
              <div className="mb-4 md:mb-6">

                <div className="flex justify-center items-end gap-2 md:gap-3 min-h-[200px] md:min-h-[260px]">

                  {podiumStyles.map((style, index) => {

                    const user = podiumUsers.find((_, i) => i === index);

                    if (!user) {
                      return (
                        <div
                          key={style.place}
                          className={`flex flex-col items-center justify-end ${style.order}`}
                        >
                          <div className={`${style.heightMobile} md:${style.height} w-16 md:w-24 rounded-t-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs md:text-2xl font-black`}>
                            <span className="text-zinc-400">
                              #{style.place}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={user.id}
                        className={`flex flex-col items-center justify-end ${style.order}`}
                      >

                        {/* Avatar */}
                        <div className="relative mb-2 md:mb-3">

                          {style.crown && (
                            <div className="absolute -top-4 md:-top-7 left-1/2 -translate-x-1/2">
                              <TrophyIcon className="w-5 h-5 md:w-7 md:h-7 text-yellow-500" />
                            </div>
                          )}

                          <img
                            src={
                              user.profile_picture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${user.first_name} ${user.second_name}`
                              )}&background=random`
                            }
                            alt={user.first_name}
                            className={`${style.size} rounded-full object-cover border-4 ${style.border} shadow-xl`}
                          />
                        </div>

                        {/* Name */}
                        <div className="text-center mb-1 md:mb-2">
                          <p className="font-black text-xs md:text-sm text-zinc-800 leading-none">
                            {user.first_name}
                          </p>

                          <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5 md:mt-1">
                            {user.second_name}
                          </p>
                        </div>

                        {/* Podium */}
                        <div
                          className={`
                            w-16
                            md:w-24
                            ${style.heightMobile}
                            md:${style.height}
                            rounded-t-3xl
                            bg-gradient-to-b
                            ${style.bg}
                            flex
                            flex-col
                            items-center
                            justify-center
                            shadow-lg
                            border
                            ${style.border}
                          `}
                        >
                          <span className={`text-2xl md:text-4xl font-black ${style.text}`}>
                            {style.place}
                          </span>

                          <span className={`text-[9px] md:text-xs font-black mt-0.5 md:mt-1 ${style.text}`}>
                            {style.label}
                          </span>

                          <span className={`text-[10px] md:text-sm font-black mt-1 md:mt-2 ${style.text}`}>
                            {user.value}{unitSuffix}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expandable List */}
              {(isExpanded || window.innerWidth < 768) && (
                <div className="flex-1 space-y-2 mt-2 pt-4 border-t border-zinc-100">

                  {rankedRestUsers.length === 0 && nonParticipatingUsers.length === 0 ? (
                    <p className="text-xs md:text-sm text-zinc-400 text-center font-bold py-4">
                      אין נתונים לתקופה זו
                    </p>
                  ) : (
                    <>
                      {rankedRestUsers.map((user, index) => {
                        const actualPlace = index + 4;

                        return (
                          <div
                            key={user.id}
                            className="
                              flex
                              justify-between
                              items-center
                              p-2 md:p-3
                              rounded-2xl
                              transition-all
                              border
                              bg-zinc-50 hover:bg-zinc-100 border-zinc-100
                            "
                          >

                            {/* User */}
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">

                              <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] md:text-xs font-black shrink-0">
                                {actualPlace}
                              </span>

                              <img
                                src={
                                  user.profile_picture ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${user.first_name} ${user.second_name}`
                                  )}&background=random`
                                }
                                alt={user.first_name}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow shrink-0"
                              />

                              <div className="min-w-0">
                                <p className="text-xs md:text-sm font-black text-zinc-800 leading-none truncate">
                                  {user.first_name} {user.second_name}
                                </p>

                                <p className="text-[10px] md:text-[11px] text-zinc-400 mt-0.5 md:mt-1">
                                  השתתף באימון
                                </p>
                              </div>
                            </div>

                            {/* Score */}
                            <div className="shrink-0">
                              <span className="font-black text-base md:text-xl text-zinc-900">
                                {user.value}{unitSuffix}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {nonParticipatingUsers.length > 0 && (
                        <div className="space-y-2">
                          {nonParticipatingUsers.map((user) => (
                            <div
                              key={user.id}
                              className="
                                flex
                                justify-between
                                items-center
                                p-2 md:p-3
                                rounded-2xl
                                transition-all
                                border
                                bg-zinc-50
                                border-zinc-100
                              "
                            >

                              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-zinc-300 text-zinc-600 text-[10px] md:text-xs font-black shrink-0">
                                  -
                                </div>

                                <img
                                  src={
                                    user.profile_picture ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      `${user.first_name} ${user.second_name}`
                                    )}&background=random`
                                  }
                                  alt={user.first_name}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow shrink-0"
                                />

                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm font-black text-zinc-800 leading-none truncate">
                                    {user.first_name} {user.second_name}
                                  </p>

                                  <p className="text-[10px] md:text-[11px] text-zinc-400 mt-0.5 md:mt-1">
                                    עדיין לא תועדו נתונים
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <span className="font-black text-xs md:text-sm text-zinc-500">
                                  לא עשה
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardLeaderboard;