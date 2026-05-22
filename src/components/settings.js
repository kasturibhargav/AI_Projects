// Settings View Controller
import { getAppState, updateSettings, exportDataAsJSON, importDataFromJSON, loginWithGoogle, logoutFromGoogle, decodeJwt } from '../state.js';


export function initSettings(onStateUpdated) {
  const usernameInput = document.getElementById('settings-username-input');
  const unitSelect = document.getElementById('settings-unit-select');
  const saveBtn = document.getElementById('btn-save-profile');
  
  const exportBtn = document.getElementById('btn-export-data');
  const importTriggerBtn = document.getElementById('btn-import-trigger');
  const importFileInput = document.getElementById('settings-import-file');
  
  const resetBtn = document.getElementById('btn-reset-data');

  // Google Integration DOM Elements
  const googleSignedOutZone = document.getElementById('google-signed-out-zone');
  const googleSignedInZone = document.getElementById('google-signed-in-zone');
  const clientIdInput = document.getElementById('settings-client-id-input');
  const demoLoginBtn = document.getElementById('btn-google-demo-login');
  const googleProfilePic = document.getElementById('google-profile-pic');
  const googleProfileName = document.getElementById('google-profile-name');
  const googleProfileEmail = document.getElementById('google-profile-email');
  const googleSignoutBtn = document.getElementById('btn-google-signout');
  const gsiButtonContainer = document.getElementById('gsi-button-container');

  // Callback for Google Sign-In SDK
  function handleCredentialResponse(response) {
    const profileData = decodeJwt(response.credential);
    if (profileData) {
      const profile = {
        id: profileData.sub,
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture
      };
      loginWithGoogle(profile);
      alert(`Successfully signed in as ${profile.name}!`);
      onStateUpdated();
    } else {
      alert('Failed to parse Google login credentials.');
    }
  }

  // Initialize official Google button if SDK is loaded and client ID exists
  function initGoogleGSI() {
    if (!gsiButtonContainer) return;
    
    // Clear previous rendering
    gsiButtonContainer.innerHTML = '';

    const state = getAppState();
    const clientId = state.settings.googleClientId;

    if (clientId && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          gsiButtonContainer,
          { theme: 'filled_black', size: 'large', width: 280 }
        );
      } catch (err) {
        console.error('Error initializing Google GIS:', err);
      }
    } else {
      // Show hint if Client ID is missing but API is available
      if (window.google && window.google.accounts) {
        const hint = document.createElement('div');
        hint.style.fontSize = '12px';
        hint.style.color = 'var(--text-muted)';
        hint.style.textAlign = 'center';
        hint.textContent = 'Enter a Client ID above to enable Google Sign-In';
        gsiButtonContainer.appendChild(hint);
      } else {
        // SDK not loaded yet
        const hint = document.createElement('div');
        hint.style.fontSize = '12px';
        hint.style.color = 'var(--text-muted)';
        hint.style.textAlign = 'center';
        hint.textContent = 'Google API loading...';
        gsiButtonContainer.appendChild(hint);
      }
    }
  }

  // Set up polling for SDK loading
  if (!window.google) {
    const checkInterval = setInterval(() => {
      if (window.google) {
        clearInterval(checkInterval);
        initGoogleGSI();
      }
    }, 1000);
  } else {
    // Already loaded, init immediately
    setTimeout(initGoogleGSI, 100);
  }

  // Save client ID on input
  clientIdInput.addEventListener('input', () => {
    const val = clientIdInput.value.trim();
    updateSettings({ googleClientId: val });
    initGoogleGSI();
  });

  // Handle Demo Sign-in
  demoLoginBtn.addEventListener('click', () => {
    const mockProfile = {
      id: 'demo-athlete-12345',
      name: 'Flex Wheeler',
      email: 'flex.wheeler@irontrack.com',
      picture: './demo_avatar.png'
    };
    loginWithGoogle(mockProfile);
    alert('Signed in via Demo Mode!');
    onStateUpdated();
  });

  // Handle Google Sign-out
  googleSignoutBtn.addEventListener('click', () => {
    logoutFromGoogle();
    alert('Signed out successfully.');
    onStateUpdated();
  });

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
    
    // Toggle active google profile details
    if (state.settings.googleProfile) {
      googleSignedOutZone.style.display = 'none';
      googleSignedInZone.style.display = 'block';
      googleProfilePic.src = state.settings.googleProfile.picture;
      googleProfileName.textContent = state.settings.googleProfile.name;
      googleProfileEmail.textContent = state.settings.googleProfile.email;
      usernameInput.value = state.settings.googleProfile.name;
    } else {
      googleSignedOutZone.style.display = 'block';
      googleSignedInZone.style.display = 'none';
      usernameInput.value = state.settings.userName || 'Lifter';
      clientIdInput.value = state.settings.googleClientId || '';
      initGoogleGSI(); // Render Google button if settings visible
    }

    unitSelect.value = state.settings.unit || 'kg';
  };
}
