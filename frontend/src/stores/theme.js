import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light');

  function applyTheme(newTheme) {
    theme.value = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('studyhub_theme', newTheme);
  }

  function initializeTheme() {
    const saved = localStorage.getItem('studyhub_theme');
    if (saved && ['light', 'dark'].includes(saved)) {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const nextTheme = theme.value === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  return {
    theme,
    initializeTheme,
    toggleTheme
  };
});
