// History & Calendar View Controller
import { getAppState, deleteHistoryLog } from '../state.js';

export function initHistory() {
  const prevMonthBtn = document.getElementById('cal-prev-month');
  const nextMonthBtn = document.getElementById('cal-next-month');
  const monthTitle = document.getElementById('cal-month-title');
  const calendarGrid = document.getElementById('calendar-days-grid');
  const logsContainer = document.getElementById('history-logs-container');

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-indexed
  let selectedDateFilter = null; // YYYY-MM-DD string or null

  // Month navigation
  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  // Render Calendar Grid
  function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Add weekday header labels
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    daysOfWeek.forEach(day => {
      const label = document.createElement('div');
      label.className = 'calendar-day-label';
      label.textContent = day;
      calendarGrid.appendChild(label);
    });

    const state = getAppState();
    // Get list of workout dates (YYYY-MM-DD)
    const workoutDates = new Set(state.history.map(log => log.date.split('T')[0]));

    // Get first day of the month and total days
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Render empty slots for days from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'calendar-day other-month';
      calendarGrid.appendChild(emptySlot);
    }

    // Render actual days of current month
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      dayCell.textContent = dayNum;

      // Construct date string YYYY-MM-DD
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      
      const hasWorkout = workoutDates.has(dateStr);
      if (hasWorkout) {
        dayCell.classList.add('workout-day');
      }

      if (selectedDateFilter === dateStr) {
        dayCell.classList.add('selected');
      }

      dayCell.addEventListener('click', () => {
        if (selectedDateFilter === dateStr) {
          selectedDateFilter = null; // Clear filter
          dayCell.classList.remove('selected');
        } else {
          selectedDateFilter = dateStr;
          // Unselect all other days
          Array.from(calendarGrid.querySelectorAll('.calendar-day')).forEach(cell => {
            cell.classList.remove('selected');
          });
          dayCell.classList.add('selected');
        }
        renderLogs();
      });

      calendarGrid.appendChild(dayCell);
    }
  }

  // Render logs list
  function renderLogs() {
    logsContainer.innerHTML = '';
    const state = getAppState();

    let filteredLogs = state.history;
    
    // Apply date filter if active
    if (selectedDateFilter) {
      filteredLogs = state.history.filter(log => log.date.split('T')[0] === selectedDateFilter);
      
      // Add a header for the filter
      const filterHeader = document.createElement('div');
      filterHeader.style.display = 'flex';
      filterHeader.style.justifyContent = 'space-between';
      filterHeader.style.alignItems = 'center';
      filterHeader.style.marginBottom = '12px';
      
      const filterDate = new Date(selectedDateFilter);
      filterHeader.innerHTML = `
        <span style="font-size: 13px; font-weight:600; color: var(--accent);">
          Workouts on ${filterDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <button class="btn btn-secondary btn-sm" id="btn-clear-date-filter" style="padding: 2px 8px; font-size:11px;">Clear Filter</button>
      `;
      logsContainer.appendChild(filterHeader);

      filterHeader.querySelector('#btn-clear-date-filter').addEventListener('click', () => {
        selectedDateFilter = null;
        renderCalendar();
        renderLogs();
      });
    }

    if (filteredLogs.length === 0) {
      logsContainer.innerHTML += `
        <div class="empty-state">
          <p class="empty-state-text">No workouts logged on this day.</p>
        </div>
      `;
      return;
    }

    filteredLogs.forEach(log => {
      const card = document.createElement('div');
      card.className = 'card log-card';
      
      // Calculate workout volume
      let workoutVolume = 0;
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) workoutVolume += s.weight * s.reps;
        });
      });

      const logDate = new Date(log.date);

      const headerDiv = document.createElement('div');
      headerDiv.style.display = 'flex';
      headerDiv.style.justifyContent = 'space-between';
      headerDiv.style.alignItems = 'flex-start';

      const titleDiv = document.createElement('div');
      titleDiv.innerHTML = `
        <div class="routine-name" style="font-size: 17px;">${log.routineName}</div>
        <div class="log-summary-row" style="margin: 2px 0 0 0; gap: 8px;">
          <span>${logDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${logDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.style.background = 'none';
      deleteBtn.style.border = 'none';
      deleteBtn.style.color = 'var(--text-dark)';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.padding = '4px';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Permanently delete this workout log from your history?')) {
          deleteHistoryLog(log.id);
          if (selectedDateFilter) {
            // Refresh calendar state in case this was the last workout on that day
            renderCalendar();
          }
          renderLogs();
        }
      });

      headerDiv.appendChild(titleDiv);
      headerDiv.appendChild(deleteBtn);

      const statsSummary = document.createElement('div');
      statsSummary.style.display = 'flex';
      statsSummary.style.gap = '16px';
      statsSummary.style.fontSize = '12px';
      statsSummary.style.color = 'var(--text-muted)';
      statsSummary.style.marginTop = '8px';
      statsSummary.innerHTML = `
        <span>Duration: <strong>${log.duration} mins</strong></span>
        <span>Volume: <strong>${workoutVolume.toLocaleString()} ${state.settings.unit || 'kg'}</strong></span>
      `;

      // Expandable section details
      const detailsContainer = document.createElement('div');
      detailsContainer.style.display = 'none'; // Collapsed by default
      detailsContainer.style.marginTop = '16px';
      detailsContainer.style.borderTop = '1px solid rgba(255, 255, 255, 0.04)';
      detailsContainer.style.paddingTop = '12px';

      if (log.notes) {
        const notesDiv = document.createElement('div');
        notesDiv.style.fontSize = '12px';
        notesDiv.style.fontStyle = 'italic';
        notesDiv.style.color = 'var(--accent)';
        notesDiv.style.marginBottom = '10px';
        notesDiv.style.background = 'rgba(0, 245, 212, 0.04)';
        notesDiv.style.padding = '6px 10px';
        notesDiv.style.borderRadius = '6px';
        notesDiv.textContent = `Notes: ${log.notes}`;
        detailsContainer.appendChild(notesDiv);
      }

      log.exercises.forEach(ex => {
        const exRow = document.createElement('div');
        exRow.className = 'log-exercise-row';
        
        const exName = document.createElement('div');
        exName.className = 'log-exercise-name';
        exName.textContent = ex.name;

        const setsList = document.createElement('div');
        setsList.className = 'log-sets-list';

        ex.sets.forEach((set, sIdx) => {
          const badge = document.createElement('span');
          badge.className = 'log-set-badge';
          badge.style.color = set.completed ? 'var(--text-main)' : 'var(--text-dark)';
          badge.style.textDecoration = set.completed ? 'none' : 'line-through';
          if (set.completed) {
            badge.style.borderColor = 'var(--success-glow)';
            badge.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
          }
          badge.innerHTML = `Set ${sIdx + 1}: ${set.weight}kg x ${set.reps}`;
          setsList.appendChild(badge);
        });

        exRow.appendChild(exName);
        exRow.appendChild(setsList);
        detailsContainer.appendChild(exRow);
      });

      // Expand / Collapse click handler on card
      card.addEventListener('click', () => {
        const isCollapsed = detailsContainer.style.display === 'none';
        detailsContainer.style.display = isCollapsed ? 'block' : 'none';
        card.style.borderColor = isCollapsed ? 'var(--accent)' : 'var(--primary)';
      });

      card.appendChild(headerDiv);
      card.appendChild(statsSummary);
      card.appendChild(detailsContainer);
      logsContainer.appendChild(card);
    });
  }

  // Trigger calendar focus on a specific workout ID if passed in navigation
  function focusWorkoutId(logId) {
    const state = getAppState();
    const log = state.history.find(l => l.id === logId);
    if (log) {
      const logDate = new Date(log.date);
      currentYear = logDate.getFullYear();
      currentMonth = logDate.getMonth();
      selectedDateFilter = log.date.split('T')[0];
    }
  }

  // Return render function
  return function render(focusedLogId = null) {
    if (focusedLogId) {
      focusWorkoutId(focusedLogId);
    }
    renderCalendar();
    renderLogs();
  };
}
