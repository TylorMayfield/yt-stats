/* eslint-disable no-undef */
// utils/timerValidation.js
// src/utils/timerValidation.js
export const validateTimers = (timers) => {
  if (typeof timers !== "object" || timers === null) return false;

  return Object.values(timers).every((timer) => {
    return (
      typeof timer === "object" &&
      timer !== null &&
      typeof timer.interval === "number" &&
      typeof timer.lastRefresh === "number" &&
      typeof timer.timerId === "number"
    );
  });
};

export const REFRESH_INTERVAL = 3000; // 3 seconds

export const chromeApi = {
  isAvailable: () => {
    return Boolean(chrome?.runtime?.sendMessage);
  },

  sendMessage: async (action, data = {}) => {
    if (!chromeApi.isAvailable()) {
      throw new Error("Chrome runtime not available");
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action,
        timestamp: Date.now(),
        ...data,
      });
      return response;
    } catch (error) {
      console.error(`Chrome message error (${action}):`, error);
      throw error;
    }
  },
};
