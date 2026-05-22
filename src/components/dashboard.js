// Dashboard View Controller
import { getAppState, getStats, startWorkout } from '../state.js';

export function initDashboard(onNavigate) {
  const dashUsername = document.getElementById('dash-username');
  const dashAvatar = document.getElementById('dash-avatar');
  const statWorkouts = document.getElementById('stat-workouts');
  const statStreak = document.getElementById('stat-streak');
  const statVolume = document.getElementById('stat-volume');
  const streakWeekDays = document.getElementById('streak-week-days');
  const btnQuickStart = document.getElementById('btn-quick-start');
  const recentCardContainer = document.getElementById('dashboard-recent-card');

  // Quick start event listener
  btnQuickStart.addEventListener('click', () => {
    startWorkout(); // Starts an empty workout
    onNavigate('active-session'); // Triggers navigation to session view/modal
  });

  // Render Dashboard
  return function render() {
    const state = getAppState();
    const stats = getStats();

    // Set user profile details
    const userName = state.settings.userName || 'Lifter';
    dashUsername.textContent = userName;
    dashAvatar.textContent = userName.charAt(0).toUpperCase();

    // Set stats values
    statWorkouts.textContent = stats.totalWorkouts;
    statStreak.textContent = stats.streak;
    
    const unit = state.settings.unit || 'kg';
    statVolume.innerHTML = `${stats.totalVolume.toLocaleString()} <span style="font-size: 10px; font-weight:500;">${unit}</span>`;

    // Render Weekly Streak dot indicators (last 7 days)
    streakWeekDays.innerHTML = '';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Get history date strings (YYYY-MM-DD)
    const workoutDates = new Set(state.history.map(log => log.date.split('T')[0]));

    // Generate last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isCompleted = workoutDates.has(dateStr);
      const isToday = i === 0;

      const dayDiv = document.createElement('div');
      dayDiv.className = `streak-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}`;
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'stat-label';
      labelSpan.style.fontSize = '9px';
      labelSpan.textContent = weekdays[d.getDay()];

      const dotDiv = document.createElement('div');
      dotDiv.className = 'streak-dot';
      dotDiv.textContent = d.getDate();

      dayDiv.appendChild(labelSpan);
      dayDiv.appendChild(dotDiv);
      streakWeekDays.appendChild(dayDiv);
    }

    // Render Recent Workout Card
    recentCardContainer.innerHTML = '';
    if (state.history.length > 0) {
      const lastWorkout = state.history[0];
      const workoutDate = new Date(lastWorkout.date);
      
      const card = document.createElement('div');
      card.className = 'card log-card';
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        // Navigate to history tab and select this date
        onNavigate('history', lastWorkout.id);
      });

      const title = document.createElement('div');
      title.className = 'card-title';
      title.style.fontSize = '16px';
      title.innerHTML = `
        <span>Recent: ${lastWorkout.routineName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      `;

      const summaryRow = document.createElement('div');
      summaryRow.className = 'log-summary-row';
      summaryRow.style.margin = '4px 0 12px 0';
      summaryRow.innerHTML = `
        <span>${workoutDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} &bull; ${lastWorkout.duration} mins</span>
        <span>${lastWorkout.exercises.length} Exercises</span>
      `;

      const exercisesSample = document.createElement('div');
      exercisesSample.style.fontSize = '13px';
      exercisesSample.style.color = 'var(--text-muted)';
      
      const sampleNames = lastWorkout.exercises.slice(0, 3).map(e => e.name).join(', ');
      const dots = lastWorkout.exercises.length > 3 ? '...' : '';
      exercisesSample.textContent = sampleNames + dots;

      card.appendChild(title);
      card.appendChild(summaryRow);
      card.appendChild(exercisesSample);
      recentCardContainer.appendChild(card);
    } else {
      const emptyState = document.createElement('div');
      emptyState.className = 'card';
      emptyState.style.textAlign = 'center';
      emptyState.style.padding = '24px';
      emptyState.innerHTML = `
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 12px;">No workouts logged yet.</p>
        <button class="btn btn-secondary btn-sm" id="btn-dash-routines-goto">Choose a Routine</button>
      `;
      recentCardContainer.appendChild(emptyState);
      
      document.getElementById('btn-dash-routines-goto').addEventListener('click', () => {
        onNavigate('routines');
      });
    }
  };
}
