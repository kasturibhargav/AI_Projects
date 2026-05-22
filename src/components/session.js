// Active Workout Session Controller
import { 
  getAppState, 
  cancelWorkout, 
  addExerciseToSession, 
  removeExerciseFromSession, 
  addSetToExercise, 
  removeSetFromExercise, 
  updateSet, 
  saveSessionNotes,
  finishWorkout,
  getPreviousPerformance
} from '../state.js';
import { openExercisePicker } from './exercisePicker.js';

let stopwatchInterval = null;

export function initSession(onNavigate) {
  // Main app shell elements
  const stickyStrip = document.getElementById('sticky-session-strip');
  const stripRoutineTitle = document.getElementById('strip-routine-title');
  const stripTimer = document.getElementById('strip-timer');
  const stripCompletedSets = document.getElementById('strip-completed-sets');
  const btnMaximize = document.getElementById('btn-maximize-session');

  // Modal active session elements
  const sessionModal = document.getElementById('modal-active-session');
  const sessionModalTitle = document.getElementById('session-modal-title');
  const sessionModalTimer = document.getElementById('session-modal-timer');
  const sessionNotesInput = document.getElementById('session-notes-input');
  const exercisesContainer = document.getElementById('session-exercises-list');
  
  const btnMinimize = document.getElementById('btn-minimize-session');
  const btnAddExercise = document.getElementById('btn-session-add-exercise');
  const btnCancel = document.getElementById('btn-session-cancel');
  const btnFinish = document.getElementById('btn-session-finish');

  // Rest Timer overlay elements
  const restOverlay = document.getElementById('rest-timer-overlay');
  const restDisplay = document.getElementById('rest-timer-display');
  const restProgressBar = document.getElementById('rest-timer-progress-bar');
  const btnRestSub10 = document.getElementById('btn-rest-sub-10');
  const btnRestAdd10 = document.getElementById('btn-rest-add-10');
  const btnRestSkip = document.getElementById('btn-rest-skip');

  let restInterval = null;
  let restTimeRemaining = 0;
  let restTimeTotal = 90; // Default 90 seconds rest

  // Web Audio Alarm Chime Synthesizer
  function playRestChime() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playNote = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Soft volume envelope to avoid speaker clicks
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // High-low alert sound: C5 (523Hz) then E5 (659Hz)
      playNote(523.25, now, 0.15);
      playNote(659.25, now + 0.15, 0.25);
    } catch (e) {
      console.warn('Web Audio Alarm failed to synthesize:', e);
    }
  }

  // Stopwatch timer trigger
  function startStopwatch() {
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    
    function updateTimerDisplay() {
      const state = getAppState();
      if (!state.activeSession) {
        clearInterval(stopwatchInterval);
        return;
      }
      const elapsedMs = Date.now() - state.activeSession.startTime;
      const totalSecs = Math.floor(elapsedMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      stripTimer.textContent = formatted;
      sessionModalTimer.textContent = formatted;
    }

    updateTimerDisplay();
    stopwatchInterval = setInterval(updateTimerDisplay, 1000);
  }

  // Rest Timer Controls
  function triggerRestTimer(seconds = 90) {
    if (restInterval) clearInterval(restInterval);
    
    restTimeTotal = seconds;
    restTimeRemaining = seconds;
    restOverlay.classList.add('active');
    updateRestDisplay();

    restInterval = setInterval(() => {
      restTimeRemaining--;
      if (restTimeRemaining <= 0) {
        clearInterval(restInterval);
        restOverlay.classList.remove('active');
        
        // Play audio alert and vibrate
        playRestChime();
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        updateRestDisplay();
      }
    }, 1000);
  }

  function updateRestDisplay() {
    restDisplay.textContent = restTimeRemaining;
    const progressCircumference = 628; // 2 * pi * r (r=100)
    const offset = progressCircumference * (1 - restTimeRemaining / restTimeTotal);
    restProgressBar.style.strokeDashoffset = offset;
  }

  btnRestSkip.addEventListener('click', () => {
    clearInterval(restInterval);
    restOverlay.classList.remove('active');
  });

  btnRestSub10.addEventListener('click', () => {
    restTimeRemaining = Math.max(1, restTimeRemaining - 10);
    updateRestDisplay();
  });

  btnRestAdd10.addEventListener('click', () => {
    restTimeRemaining += 10;
    if (restTimeRemaining > restTimeTotal) {
      restTimeTotal = restTimeRemaining;
    }
    updateRestDisplay();
  });

  // Maximize active workout
  btnMaximize.addEventListener('click', () => {
    sessionModal.classList.add('active');
  });

  // Minimize active workout
  btnMinimize.addEventListener('click', () => {
    sessionModal.classList.remove('active');
  });

  // Add Exercise inside session
  btnAddExercise.addEventListener('click', () => {
    openExercisePicker((name, cat) => {
      addExerciseToSession(name, cat);
    });
  });

  // Cancel workout session
  btnCancel.addEventListener('click', () => {
    if (confirm('Cancel this workout? All current progress will be lost.')) {
      cancelWorkout();
      sessionModal.classList.remove('active');
      onNavigate('dashboard');
    }
  });

  // Finish workout session
  btnFinish.addEventListener('click', () => {
    const state = getAppState();
    if (!state.activeSession) return;
    
    const completedSets = state.activeSession.exercises.reduce((count, ex) => {
      return count + ex.sets.filter(s => s.completed).length;
    }, 0);

    if (completedSets === 0) {
      if (!confirm('You have not checked off any completed sets. Finish workout anyway?')) {
        return;
      }
    }

    finishWorkout();
    sessionModal.classList.remove('active');
    alert('Workout logged successfully!');
    onNavigate('history');
  });

  // Listen to notes field modifications
  sessionNotesInput.addEventListener('input', (e) => {
    saveSessionNotes(e.target.value);
  });

  // Render Live Session
  return function render() {
    const state = getAppState();
    const session = state.activeSession;

    if (!session) {
      stickyStrip.style.display = 'none';
      if (sessionModal.classList.contains('active')) {
        sessionModal.classList.remove('active');
      }
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
      return;
    }

    if (!stopwatchInterval) {
      startStopwatch();
    }

    // Render Sticky Strip details
    stickyStrip.style.display = 'flex';
    stripRoutineTitle.textContent = session.routineName;
    
    let totalCompleted = 0;
    session.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) totalCompleted++;
      });
    });
    stripCompletedSets.textContent = totalCompleted;

    // Render Modal details
    sessionModalTitle.textContent = session.routineName;
    if (document.activeElement !== sessionNotesInput) {
      sessionNotesInput.value = session.notes || '';
    }

    // Render exercises list in modal
    exercisesContainer.innerHTML = '';
    
    if (session.exercises.length === 0) {
      exercisesContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
          No exercises in this workout. Tap "Add Custom Exercise" below to start.
        </div>
      `;
      return;
    }

    session.exercises.forEach((ex, exIdx) => {
      const exCard = document.createElement('div');
      exCard.className = 'session-exercise-card';

      // Header row (clickable to toggle tips guide)
      const exHeader = document.createElement('div');
      exHeader.className = 'session-exercise-header';
      exHeader.style.cursor = 'pointer';
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'session-exercise-title';
      titleSpan.innerHTML = `${ex.name} <span style="font-size: 11px; color: var(--primary); font-weight: normal; margin-left: 6px;">(tap for tip)</span>`;

      const rightDiv = document.createElement('div');
      rightDiv.style.display = 'flex';
      rightDiv.style.alignItems = 'center';
      rightDiv.style.gap = '8px';

      const catSpan = document.createElement('span');
      catSpan.className = 'session-exercise-cat';
      catSpan.textContent = ex.category;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'set-remove-btn';
      removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      `;
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid expanding tips when deleting
        if (confirm(`Remove "${ex.name}" from this workout?`)) {
          removeExerciseFromSession(exIdx);
        }
      });

      rightDiv.appendChild(catSpan);
      rightDiv.appendChild(removeBtn);
      exHeader.appendChild(titleSpan);
      exHeader.appendChild(rightDiv);
      exCard.appendChild(exHeader);

      // Inline Guide / Tips container
      const guideContainer = document.createElement('div');
      guideContainer.style.display = 'none';
      guideContainer.style.padding = '0 20px 12px 20px';
      guideContainer.style.fontSize = '13px';
      guideContainer.style.color = 'var(--text-muted)';
      guideContainer.style.borderBottom = '1px solid rgba(255, 255, 255, 0.02)';

      const exerciseTips = {
        'Barbell Bench Press': 'Keep feet flat, retract shoulder blades, touch mid-chest with controlled descent. Press straight up and do not flare elbows.',
        'Overhead Press': 'Brace core/glutes. Press straight up in front of face and push head slightly forward at lockout. Keep wrists straight.',
        'Barbell Row': 'Hinge at hip, keep back flat. Pull bar to lower ribcage pulling through the elbows to isolate back muscles.',
        'Barbell Squat': 'Keep weight on mid-foot. Hips back, knees out tracking over toes. Squat to parallel depth while bracing core.',
        'Romanian Deadlift': 'Push hips back keeping back flat. Keep bar touching shins. Feel hamstring tension; squeeze glutes to stand up.'
      };

      const tipText = exerciseTips[ex.name] || `Maintain controlled concentric reps, brace core muscles, and ensure correct warm-ups before lifting your working sets.`;
      const searchUrl = `https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(ex.name)}+form`;

      guideContainer.innerHTML = `
        <div style="background: rgba(255,255,255,0.015); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display:flex; flex-direction:column; gap:8px; margin-bottom: 4px;">
          <div><strong>💡 Form Tip:</strong> ${tipText}</div>
          <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="align-self: flex-start; text-decoration: none; padding: 4px 10px; font-size:11px; display:inline-flex; align-items:center; gap: 6px; font-family:inherit;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="red" stroke="currentColor" stroke-width="0"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            Watch Form Guide on YouTube
          </a>
        </div>
      `;
      exCard.appendChild(guideContainer);

      // Bind toggle action
      exHeader.addEventListener('click', () => {
        const isGuideHidden = guideContainer.style.display === 'none';
        guideContainer.style.display = isGuideHidden ? 'block' : 'none';
      });

      // Previous workout helper stats
      const prevSets = getPreviousPerformance(ex.name);
      if (prevSets) {
        const prevText = prevSets.map((s, sIdx) => `${s.weight}kg x ${s.reps}`).join(' | ');
        const prevDiv = document.createElement('div');
        prevDiv.className = 'session-exercise-prev';
        prevDiv.innerHTML = `Last performance: <span style="color:var(--text-main);">${prevText}</span>`;
        exCard.appendChild(prevDiv);
      }

      // Sets log table
      const table = document.createElement('table');
      table.className = 'sets-table';
      table.innerHTML = `
        <thead>
          <tr class="sets-table-header">
            <th style="width: 15%;">Set</th>
            <th style="width: 35%;">Weight (${state.settings.unit || 'kg'})</th>
            <th style="width: 30%;">Reps</th>
            <th style="width: 20%;">Log</th>
          </tr>
        </thead>
        <tbody id="sets-tbody-${exIdx}">
        </tbody>
      `;

      const tbody = table.querySelector('tbody');

      ex.sets.forEach((set, setIdx) => {
        const row = document.createElement('tr');
        row.className = `sets-table-row ${set.completed ? 'completed' : ''}`;

        const indexTd = document.createElement('td');
        indexTd.className = 'set-index';
        
        if (ex.sets.length > 1) {
          const dBtn = document.createElement('button');
          dBtn.className = 'set-remove-btn';
          dBtn.style.marginRight = '6px';
          dBtn.style.verticalAlign = 'middle';
          dBtn.innerHTML = `&times;`;
          dBtn.addEventListener('click', () => {
            removeSetFromExercise(exIdx, setIdx);
          });
          indexTd.appendChild(dBtn);
        }
        const indexSpan = document.createElement('span');
        indexSpan.textContent = setIdx + 1;
        indexSpan.style.verticalAlign = 'middle';
        indexTd.appendChild(indexSpan);

        const weightTd = document.createElement('td');
        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.className = 'set-input';
        weightInput.pattern = '[0-9]*';
        weightInput.inputMode = 'decimal';
        weightInput.value = set.weight;
        weightInput.addEventListener('change', (e) => {
          updateSet(exIdx, setIdx, { weight: e.target.value });
        });
        weightTd.appendChild(weightInput);

        const repsTd = document.createElement('td');
        const repsInput = document.createElement('input');
        repsInput.type = 'number';
        repsInput.className = 'set-input';
        repsInput.pattern = '[0-9]*';
        repsInput.inputMode = 'numeric';
        repsInput.value = set.reps;
        repsInput.addEventListener('change', (e) => {
          updateSet(exIdx, setIdx, { reps: e.target.value });
        });
        repsTd.appendChild(repsInput);

        const checkTd = document.createElement('td');
        const checkBtn = document.createElement('button');
        checkBtn.className = 'set-check-btn';
        checkBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        `;
        checkBtn.addEventListener('click', () => {
          const isNowCompleted = !set.completed;
          updateSet(exIdx, setIdx, { completed: isNowCompleted });
          
          if (isNowCompleted) {
            triggerRestTimer(90); // default 90s rest
          }
        });
        checkTd.appendChild(checkBtn);

        row.appendChild(indexTd);
        row.appendChild(weightTd);
        row.appendChild(repsTd);
        row.appendChild(checkTd);
        tbody.appendChild(row);
      });

      exCard.appendChild(table);

      const addSetRow = document.createElement('div');
      addSetRow.className = 'session-add-set-row';
      addSetRow.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="btn-add-set-${exIdx}" style="padding: 4px 10px; font-size:12px;">+ Add Set</button>
      `;
      addSetRow.querySelector('button').addEventListener('click', () => {
        addSetToExercise(exIdx);
      });

      exCard.appendChild(addSetRow);
      exercisesContainer.appendChild(exCard);
    });
  };
}
