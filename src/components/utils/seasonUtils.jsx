// Utility functions for season management

export const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';  // March-May
  if (month >= 5 && month <= 7) return 'summer';  // June-August
  if (month >= 8 && month <= 10) return 'fall';   // September-November
  return 'winter'; // December-February
};

export const getSeasonName = (season) => {
  const names = {
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
    winter: 'Winter',
    year_round: 'Year Round'
  };
  return names[season] || season;
};

export const getSeasonEmoji = (season) => {
  const emojis = {
    spring: '🌸',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️',
    year_round: '📅'
  };
  return emojis[season] || '📅';
};

export const getSeasonColor = (season) => {
  const colors = {
    spring: 'from-green-500 to-emerald-500',
    summer: 'from-yellow-500 to-orange-500',
    fall: 'from-orange-500 to-red-500',
    winter: 'from-blue-500 to-cyan-500',
    year_round: 'from-gray-500 to-slate-500'
  };
  return colors[season] || 'from-gray-500 to-slate-500';
};

export const getAllSeasons = () => {
  return ['spring', 'summer', 'fall', 'winter', 'year_round'];
};

export const getSeasonMonths = (season) => {
  const months = {
    spring: ['March', 'April', 'May'],
    summer: ['June', 'July', 'August'],
    fall: ['September', 'October', 'November'],
    winter: ['December', 'January', 'February'],
    year_round: ['All Year']
  };
  return months[season] || [];
};