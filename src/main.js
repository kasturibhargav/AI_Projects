// Main Orchestrator File
import './style.css';
import { subscribe, loadState, startWorkout } from './state.js';
import { initExercisePicker } from './components/exercisePicker.js';
import { initDashboard } from './components/dashboard.js';
import { initRoutines } from './components/routines.js';
import { initSession } from './components/session.js';
import { initHistory } from './components/history.js';
import { initAnalytics } from './components/analytics.js';
import { initSettings } from './components/settings.js';

// DOM Elements
const screenElements = {
  dashboard: document.getElementById('screen-dashboard'),
  routines: document.getElementById('screen-routines'),
  history: document.getElementById('screen-history'),
  analytics: document.getElementById('screen-analytics'),
  settings: document.getElementById('screen-settings')
};

const navTabs = document.querySelectorAll('.nav-tab');
const appHeaderTitle = document.getElementById('app-header-title');
const headerActionBtn = document.getElementById('header-action-btn');

let currentScreen = 'dashboard';
let navigationParam = null; // Used to pass parameter like focused workout ID

// Navigation Function
function navigate(screenName, param = null) {
  if (screenName === 'active-session') {
    // Open full active workout modal sheet overlay
    const sessionModal = document.getElementById('modal-active-session');
    if (sessionModal) {
      sessionModal.classList.add('active');
      renderViews();
    }
    return;
  }

  if (!screenElements[screenName]) return;

  currentScreen = screenName;
  navigationParam = param;

  // Toggle active screen visibility
  Object.keys(screenElements).forEach(name => {
    if (name === screenName) {
      screenElements[name].classList.add('active');
    } else {
      screenElements[name].classList.remove('active');
    }
  });

  // Update navbar tab highlights
  navTabs.forEach(tab => {
    if (tab.getAttribute('data-screen') === screenName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update header text based on screen
  const titles = {
    dashboard: 'IronTrack',
    routines: 'Routines',
    history: 'History',
    analytics: 'Analytics',
    settings: 'Settings'
  };
  appHeaderTitle.textContent = titles[screenName] || 'IronTrack';

  // Render the newly visible view
  renderViews();
}

// Initialise Shared Components
initExercisePicker();

// Initialise View Controllers
const renderDashboard = initDashboard(navigate);
const renderRoutines = initRoutines(navigate);
const renderSession = initSession(navigate);
const renderHistory = initHistory();
const renderAnalytics = initAnalytics();
const renderSettings = initSettings(renderViews);

// Central view refresh dispatcher
function renderViews() {
  renderSession(); // Always render active session (strip state depends on it)
  
  if (currentScreen === 'dashboard') {
    renderDashboard();
  } else if (currentScreen === 'routines') {
    renderRoutines();
  } else if (currentScreen === 'history') {
    renderHistory(navigationParam);
    navigationParam = null; // Clear param after consuming
  } else if (currentScreen === 'analytics') {
    renderAnalytics();
  } else if (currentScreen === 'settings') {
    renderSettings();
  }
}

// Subscribe to state modifications for auto-updates
subscribe(() => {
  renderViews();
});

// Setup Tab Navigation Listeners
navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const screenName = tab.getAttribute('data-screen');
    navigate(screenName);
  });
});

// Header quick action button: Quick Start empty session
headerActionBtn.addEventListener('click', () => {
  startWorkout(); // Starts an empty workout
  navigate('active-session');
});

// Load saved data and initialize
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  navigate('dashboard');
  
  // Register Service Worker for PWA capabilities
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('ServiceWorker registered successfully: ', reg.scope);
        })
        .catch(err => {
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }
});
