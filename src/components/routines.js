// Routines View Controller
import { getAppState, addRoutine, deleteRoutine, startWorkout } from '../state.js';
import { openExercisePicker } from './exercisePicker.js';

export function initRoutines(onNavigate) {
  const container = document.getElementById('routines-container');
  const createTriggerBtn = document.getElementById('btn-create-routine-trigger');
  
  // Routine Builder elements
  const builderModal = document.getElementById('modal-routine-builder');
  const closeBuilderBtn = document.getElementById('btn-close-routine-builder');
  const routineNameInput = document.getElementById('routine-name-input');
  const routineDescInput = document.getElementById('routine-desc-input');
  const builderExercisesContainer = document.getElementById('routine-builder-exercises');
  const builderAddExBtn = document.getElementById('btn-routine-builder-add-ex');
  const saveRoutineBtn = document.getElementById('btn-save-routine');

  let builderExercises = [];

  // Open Routine Builder
  createTriggerBtn.addEventListener('click', () => {
    builderExercises = [];
    routineNameInput.value = '';
    routineDescInput.value = '';
    renderBuilderExercises();
    builderModal.classList.add('active');
  });

  // Close Routine Builder
  closeBuilderBtn.addEventListener('click', () => {
    builderModal.classList.remove('active');
  });

  // Add Exercise to Routine Builder
  builderAddExBtn.addEventListener('click', () => {
    openExercisePicker((name, cat) => {
      builderExercises.push({
        name,
        category: cat,
        sets: [
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 } // Default 3 sets
        ]
      });
      renderBuilderExercises();
    });
  });

  // Save Routine
  saveRoutineBtn.addEventListener('click', () => {
    const name = routineNameInput.value.trim();
    const desc = routineDescInput.value.trim();

    if (!name) {
      alert('Please enter a routine name.');
      return;
    }

    if (builderExercises.length === 0) {
      alert('Please add at least one exercise.');
      return;
    }

    addRoutine(name, desc, builderExercises);
    builderModal.classList.remove('active');
  });

  // Render exercises inside the builder modal
  function renderBuilderExercises() {
    builderExercisesContainer.innerHTML = '';

    if (builderExercises.length === 0) {
      builderExercisesContainer.innerHTML = `
        <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 13px; border: 1px dashed var(--border-color); border-radius: var(--border-radius-sm);">
          No exercises added yet. Tap "Add Exercise" to start building.
        </div>
      `;
      return;
    }

    builderExercises.forEach((ex, idx) => {
      const exDiv = document.createElement('div');
      exDiv.style.background = 'rgba(255, 255, 255, 0.02)';
      exDiv.style.border = '1px solid var(--border-color)';
      exDiv.style.borderRadius = 'var(--border-radius-sm)';
      exDiv.style.padding = '12px';
      exDiv.style.display = 'flex';
      exDiv.style.justifyContent = 'space-between';
      exDiv.style.alignItems = 'center';

      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `
        <div style="font-weight:600; font-size:14px; margin-bottom: 2px;">${ex.name}</div>
        <div style="font-size:11px; color:var(--text-muted);">${ex.category} &bull; <span id="builder-ex-sets-count-${idx}">${ex.sets.length}</span> sets</div>
      `;

      const controlsDiv = document.createElement('div');
      controlsDiv.style.display = 'flex';
      controlsDiv.style.alignItems = 'center';
      controlsDiv.style.gap = '8px';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'btn btn-secondary btn-sm';
      minusBtn.style.padding = '4px 8px';
      minusBtn.textContent = '-';
      minusBtn.addEventListener('click', () => {
        if (ex.sets.length > 1) {
          ex.sets.pop();
          renderBuilderExercises();
        }
      });

      const plusBtn = document.createElement('button');
      plusBtn.className = 'btn btn-secondary btn-sm';
      plusBtn.style.padding = '4px 8px';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => {
        const lastSet = ex.sets[ex.sets.length - 1];
        ex.sets.push({ weight: lastSet ? lastSet.weight : 20, reps: lastSet ? lastSet.reps : 10 });
        renderBuilderExercises();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary btn-sm';
      deleteBtn.style.color = 'var(--danger)';
      deleteBtn.style.padding = '4px 8px';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      `;
      deleteBtn.addEventListener('click', () => {
        builderExercises.splice(idx, 1);
        renderBuilderExercises();
      });

      controlsDiv.appendChild(minusBtn);
      controlsDiv.appendChild(plusBtn);
      controlsDiv.appendChild(deleteBtn);

      exDiv.appendChild(infoDiv);
      exDiv.appendChild(controlsDiv);
      builderExercisesContainer.appendChild(exDiv);
    });
  }

  // Render Routines Screen List
  return function render() {
    const state = getAppState();
    container.innerHTML = '';

    if (state.routines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">No workout routines yet. Create a custom one!</p>
        </div>
      `;
      return;
    }

    state.routines.forEach(routine => {
      const isDefault = routine.id.startsWith('routine-push') || routine.id.startsWith('routine-pull') || routine.id.startsWith('routine-legs');
      
      const card = document.createElement('div');
      card.className = 'card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '14px';

      const headerDiv = document.createElement('div');
      headerDiv.style.display = 'flex';
      headerDiv.style.justifyContent = 'space-between';
      headerDiv.style.alignItems = 'flex-start';

      const titleDiv = document.createElement('div');
      titleDiv.innerHTML = `
        <div class="routine-name">${routine.name}</div>
        <div class="card-subtitle" style="margin-bottom: 0;">${routine.description || 'No description.'}</div>
      `;

      headerDiv.appendChild(titleDiv);

      // Add delete option for custom routines
      if (!isDefault) {
        const trashBtn = document.createElement('button');
        trashBtn.style.background = 'none';
        trashBtn.style.border = 'none';
        trashBtn.style.color = 'var(--text-dark)';
        trashBtn.style.cursor = 'pointer';
        trashBtn.style.padding = '6px';
        trashBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        `;
        trashBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete the custom routine "${routine.name}"?`)) {
            deleteRoutine(routine.id);
          }
        });
        headerDiv.appendChild(trashBtn);
      }

      const exercisesSummary = document.createElement('div');
      exercisesSummary.style.fontSize = '13px';
      exercisesSummary.style.color = 'var(--text-muted)';
      exercisesSummary.style.lineHeight = '1.5';
      
      const exItems = routine.exercises.map(ex => `${ex.sets.length}x ${ex.name}`);
      exercisesSummary.textContent = exItems.join(', ');

      const actionDiv = document.createElement('div');
      actionDiv.style.display = 'flex';
      actionDiv.style.justifyContent = 'flex-end';

      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-primary btn-sm';
      startBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px; height:14px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Workout
      `;
      startBtn.addEventListener('click', () => {
        startWorkout(routine.id);
        onNavigate('active-session');
      });

      actionDiv.appendChild(startBtn);

      card.appendChild(headerDiv);
      card.appendChild(exercisesSummary);
      card.appendChild(actionDiv);
      container.appendChild(card);
    });
  };
}
