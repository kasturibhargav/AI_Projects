// Settings View Controller
import { getAppState, updateSettings, exportDataAsJSON, importDataFromJSON } from '../state.js';

export function initSettings(onStateUpdated) {
  const usernameInput = document.getElementById('settings-username-input');
  const unitSelect = document.getElementById('settings-unit-select');
  const saveBtn = document.getElementById('btn-save-profile');
  
  const exportBtn = document.getElementById('btn-export-data');
  const importTriggerBtn = document.getElementById('btn-import-trigger');
  const importFileInput = document.getElementById('settings-import-file');
  
  const resetBtn = document.getElementById('btn-reset-data');

  // Save profile settings
  saveBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    const unit = unitSelect.value;

    if (!name) {
      alert('Please enter a display name.');
      return;
    }

    updateSettings({
      userName: name,
      unit: unit
    });

    alert('Profile saved successfully!');
    onStateUpdated(); // Trigger render across application
  });

  // Export JSON backup file
  exportBtn.addEventListener('click', () => {
    try {
      const dataStr = exportDataAsJSON();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const tempLink = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      
      tempLink.href = url;
      tempLink.download = `irontrack-backup-${dateStr}.json`;
      document.body.appendChild(tempLink);
      tempLink.click();
      
      // Cleanup
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error exporting workout data.');
    }
  });

  // Trigger import file selector
  importTriggerBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  // Handle uploaded backup file
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = importDataFromJSON(content);
      if (success) {
        alert('Workouts and routines imported successfully!');
        importFileInput.value = ''; // Reset input
        onStateUpdated(); // Trigger full app re-render
      } else {
        alert('Failed to import backup. Please ensure the file is a valid IronTrack JSON backup.');
        importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Reset entire application data
  resetBtn.addEventListener('click', () => {
    if (confirm('WARNING: Are you absolutely sure you want to delete all workouts, custom routines, and settings? This cannot be undone.')) {
      if (confirm('Type YES to confirm deletion. (Last warning: All historical data will be lost)')) {
        localStorage.clear();
        location.reload();
      }
    }
  });

  // Render settings page
  return function render() {
    const state = getAppState();
    usernameInput.value = state.settings.userName || 'Lifter';
    unitSelect.value = state.settings.unit || 'kg';
  };
}
