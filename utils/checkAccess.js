const freeApis = require('../data/freeApis');

module.exports = function hasAccess(endpoint, userPlan) {
  if (userPlan === 'pro') return true; // Full access
  return freeApis.includes(endpoint); // Only free APIs allowed
};
