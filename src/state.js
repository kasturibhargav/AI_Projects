// Core App State Manager

const STORAGE_KEY = 'gym_progress_tracker_state';

const DEFAULT_ROUTINES = [
  {
    id: 'routine-push',
    name: 'Push Day',
    description: 'Chest, Shoulders & Triceps focus',
    exercises: [
      { id: 'ex-bench', name: 'Barbell Bench Press', category: 'Chest', sets: [{ reps: 8, weight: 60, completed: false }, { reps: 8, weight: 60, completed: false }, { reps: 8, weight: 60, completed: false }] },
      { id: 'ex-ohp', name: 'Overhead Press', category: 'Shoulders', sets: [{ reps: 8, weight: 40, completed: false }, { reps: 8, weight: 40, completed: false }, { reps: 8, weight: 40, completed: false }] },
      { id: 'ex-inc-db', name: 'Incline Dumbbell Press', category: 'Chest', sets: [{ reps: 10, weight: 20, completed: false }, { reps: 10, weight: 20, completed: false }, { reps: 10, weight: 20, completed: false }] },
      { id: 'ex-tri-pd', name: 'Tricep Pushdown', category: 'Arms', sets: [{ reps: 12, weight: 25, completed: false }, { reps: 12, weight: 25, completed: false }, { reps: 12, weight: 25, completed: false }] },
      { id: 'ex-lat-raise', name: 'Dumbbell Lateral Raise', category: 'Shoulders', sets: [{ reps: 12, weight: 10, completed: false }, { reps: 12, weight: 10, completed: false }, { reps: 12, weight: 10, completed: false }] }
    ]
  },
  {
    id: 'routine-pull',
    name: 'Pull Day',
    description: 'Back, Biceps & Rear Delts focus',
    exercises: [
      { id: 'ex-row', name: 'Barbell Row', category: 'Back', sets: [{ reps: 8, weight: 50, completed: false }, { reps: 8, weight: 50, completed: false }, { reps: 8, weight: 50, completed: false }] },
      { id: 'ex-lat-pd', name: 'Lat Pulldown', category: 'Back', sets: [{ reps: 10, weight: 45, completed: false }, { reps: 10, weight: 45, completed: false }, { reps: 10, weight: 45, completed: false }] },
      { id: 'ex-curl', name: 'Barbell Bicep Curl', category: 'Arms', sets: [{ reps: 10, weight: 25, completed: false }, { reps: 10, weight: 25, completed: false }, { reps: 10, weight: 25, completed: false }] },
      { id: 'ex-ham-curl', name: 'Dumbbell Hammer Curl', category: 'Arms', sets: [{ reps: 12, weight: 12, completed: false }, { reps: 12, weight: 12, completed: false }] },
      { id: 'ex-facepull', name: 'Cable Face Pull', category: 'Shoulders', sets: [{ reps: 15, weight: 15, completed: false }, { reps: 15, weight: 15, completed: false }, { reps: 15, weight: 15, completed: false }] }
    ]
  },
  {
    id: 'routine-legs',
    name: 'Legs Day',
    description: 'Quads, Hamstrings & Calves focus',
    exercises: [
      { id: 'ex-squat', name: 'Barbell Squat', category: 'Legs', sets: [{ reps: 8, weight: 80, completed: false }, { reps: 8, weight: 80, completed: false }, { reps: 8, weight: 80, completed: false }] },
      { id: 'ex-rdl', name: 'Romanian Deadlift', category: 'Legs', sets: [{ reps: 8, weight: 70, completed: false }, { reps: 8, weight: 70, completed: false }, { reps: 8, weight: 70, completed: false }] },
      { id: 'ex-legpress', name: 'Leg Press', category: 'Legs', sets: [{ reps: 10, weight: 120, completed: false }, { reps: 10, weight: 120, completed: false }] },
      { id: 'ex-calf', name: 'Standing Calf Raise', category: 'Legs', sets: [{ reps: 15, weight: 40, completed: false }, { reps: 15, weight: 40, completed: false }, { reps: 15, weight: 40, completed: false }] },
      { id: 'ex-core', name: 'Hanging Leg Raise', category: 'Core', sets: [{ reps: 12, weight: 0, completed: false }, { reps: 12, weight: 0, completed: false }] }
    ]
  }
];

// Exercise library for custom routines selection
export const EXERCISE_LIBRARY = [
  { name: 'Barbell Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Chest Fly (Cable/Dumbbell)', category: 'Chest' },
  { name: 'Push-Up', category: 'Chest' },
  
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Pull-Up / Chin-Up', category: 'Back' },
  { name: 'Cable Seated Row', category: 'Back' },
  { name: 'Hyperextension', category: 'Back' },

  { name: 'Barbell Squat', category: 'Legs' },
  { name: 'Romanian Deadlift', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Leg Curl', category: 'Legs' },
  { name: 'Leg Extension', category: 'Legs' },
  { name: 'Standing Calf Raise', category: 'Legs' },
  { name: 'Lunge', category: 'Legs' },

  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders' },
  { name: 'Cable Face Pull', category: 'Shoulders' },
  { name: 'Dumbbell Front Raise', category: 'Shoulders' },

  { name: 'Barbell Bicep Curl', category: 'Arms' },
  { name: 'Dumbbell Hammer Curl', category: 'Arms' },
  { name: 'Cable Tricep Pushdown', category: 'Arms' },
  { name: 'Overhead Tricep Extension', category: 'Arms' },

  { name: 'Hanging Leg Raise', category: 'Core' },
  { name: 'Crunch', category: 'Core' },
  { name: 'Plank', category: 'Core' }
];

// Initial App State Schema
const defaultState = {
  routines: DEFAULT_ROUTINES,
  history: [],
  activeSession: null, // null or active session object
  settings: {
    unit: 'kg', // 'kg' or 'lbs'
    userName: 'Lifter',
    googleProfile: null, // null or { name, email, picture, id }
    googleClientId: '' // custom client id configured by user
  }
};

let AppState = { ...defaultState };

// Subscribers
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  // Trigger initial callback
  listener(AppState);
  return () => listeners.delete(listener);
}

function notify() {
  saveState();
  listeners.forEach(l => l({ ...AppState }));
}

// LocalStorage helpers
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with default values in case of schema updates
      AppState = {
        routines: parsed.routines || DEFAULT_ROUTINES,
        history: parsed.history || [],
        activeSession: parsed.activeSession || null,
        settings: { ...defaultState.settings, ...(parsed.settings || {}) }
      };
    } else {
      AppState = { ...defaultState };
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    AppState = { ...defaultState };
  }
  return AppState;
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

export function getAppState() {
  return AppState;
}

// ROUTINES MANAGEMENT
export function addRoutine(name, description, exercises) {
  const newRoutine = {
    id: 'routine-' + Date.now(),
    name,
    description: description || '',
    exercises: exercises.map(ex => ({
      id: 'ex-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: ex.name,
      category: ex.category || 'Other',
      sets: ex.sets || [{ reps: 10, weight: 20, completed: false }]
    }))
  };
  AppState.routines.push(newRoutine);
  notify();
  return newRoutine;
}

export function deleteRoutine(routineId) {
  AppState.routines = AppState.routines.filter(r => r.id !== routineId);
  notify();
}

// ACTIVE WORKOUT SESSION MANAGEMENT
export function startWorkout(routineId = null) {
  let session = {
    id: 'session-' + Date.now(),
    startTime: Date.now(),
    routineName: 'Empty Workout',
    routineId: null,
    exercises: [],
    notes: ''
  };

  if (routineId) {
    const routine = AppState.routines.find(r => r.id === routineId);
    if (routine) {
      session.routineName = routine.name;
      session.routineId = routine.id;
      // Deep clone exercises to avoid modifying routine templates
      session.exercises = routine.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        sets: ex.sets.map(s => ({
          weight: s.weight,
          reps: s.reps,
          completed: false
        }))
      }));
    }
  }

  AppState.activeSession = session;
  notify();
}

export function cancelWorkout() {
  AppState.activeSession = null;
  notify();
}

export function addExerciseToSession(name, category) {
  if (!AppState.activeSession) return;
  const newExercise = {
    id: 'ex-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name,
    category: category || 'Other',
    sets: [{ weight: 20, reps: 10, completed: false }]
  };
  AppState.activeSession.exercises.push(newExercise);
  notify();
}

export function removeExerciseFromSession(exerciseIndex) {
  if (!AppState.activeSession) return;
  AppState.activeSession.exercises.splice(exerciseIndex, 1);
  notify();
}

export function addSetToExercise(exerciseIndex) {
  if (!AppState.activeSession) return;
  const exercise = AppState.activeSession.exercises[exerciseIndex];
  if (!exercise) return;
  
  // Clone last set values if available
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const newSet = lastSet 
    ? { weight: lastSet.weight, reps: lastSet.reps, completed: false }
    : { weight: 20, reps: 10, completed: false };

  exercise.sets.push(newSet);
  notify();
}

export function removeSetFromExercise(exerciseIndex, setIndex) {
  if (!AppState.activeSession) return;
  const exercise = AppState.activeSession.exercises[exerciseIndex];
  if (!exercise || exercise.sets.length <= 1) return; // Keep at least 1 set
  
  exercise.sets.splice(setIndex, 1);
  notify();
}

export function updateSet(exerciseIndex, setIndex, fields) {
  if (!AppState.activeSession) return;
  const exercise = AppState.activeSession.exercises[exerciseIndex];
  if (!exercise) return;
  const set = exercise.sets[setIndex];
  if (!set) return;

  if (fields.weight !== undefined) set.weight = parseFloat(fields.weight) || 0;
  if (fields.reps !== undefined) set.reps = parseInt(fields.reps) || 0;
  if (fields.completed !== undefined) set.completed = !!fields.completed;

  notify();
}

export function saveSessionNotes(notes) {
  if (!AppState.activeSession) return;
  AppState.activeSession.notes = notes;
  notify();
}

export function finishWorkout() {
  if (!AppState.activeSession) return;

  const session = AppState.activeSession;
  const endTime = Date.now();
  const durationMinutes = Math.max(1, Math.round((endTime - session.startTime) / 60000));

  // Only keep exercises and sets that were completed, or keep all sets but filter empty exercises?
  // Let's filter out exercises that have no sets, and mark any uncompleted sets as not completed or exclude them?
  // It is usually better to log everything completed, and log uncompleted sets as skipped or just save them.
  const loggedExercises = session.exercises
    .filter(ex => ex.sets.length > 0)
    .map(ex => ({
      name: ex.name,
      category: ex.category,
      sets: ex.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        completed: s.completed
      }))
    }));

  const logEntry = {
    id: 'log-' + Date.now(),
    date: new Date().toISOString(),
    routineName: session.routineName,
    duration: durationMinutes,
    exercises: loggedExercises,
    notes: session.notes
  };

  AppState.history.unshift(logEntry); // Add to top of history
  AppState.activeSession = null;      // Clear session
  notify();
}

// HISTORY MANAGEMENT
export function deleteHistoryLog(logId) {
  AppState.history = AppState.history.filter(log => log.id !== logId);
  notify();
}

// SETTINGS MANAGEMENT
export function updateSettings(fields) {
  AppState.settings = { ...AppState.settings, ...fields };
  notify();
}

export function loginWithGoogle(profile) {
  AppState.settings.googleProfile = profile;
  if (profile && profile.name) {
    AppState.settings.userName = profile.name;
  }
  notify();
}

export function logoutFromGoogle() {
  AppState.settings.googleProfile = null;
  AppState.settings.userName = 'Lifter';
  notify();
}


// DATA EXPORT/IMPORT
export function exportDataAsJSON() {
  return JSON.stringify(AppState, null, 2);
}

export function importDataFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.routines || parsed.history) {
      AppState = {
        routines: parsed.routines || DEFAULT_ROUTINES,
        history: parsed.history || [],
        activeSession: parsed.activeSession || null,
        settings: { ...defaultState.settings, ...(parsed.settings || {}) }
      };
      notify();
      return true;
    }
  } catch (e) {
    console.error('Invalid JSON file format for import:', e);
  }
  return false;
}

// ANALYTICS & STATS HELPERS
export function getStats() {
  const history = AppState.history;
  const totalWorkouts = history.length;
  
  // Calculate total volume (completed sets only)
  let totalVolume = 0;
  history.forEach(log => {
    log.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalVolume += s.weight * s.reps;
        }
      });
    });
  });

  // Calculate current weekly streak
  const streak = calculateWeeklyStreak(history);

  return {
    totalWorkouts,
    totalVolume,
    streak
  };
}

function calculateWeeklyStreak(history) {
  if (history.length === 0) return 0;
  
  // Group workouts by calendar date (YYYY-MM-DD)
  const workoutDates = new Set(history.map(log => log.date.split('T')[0]));
  
  let streak = 0;
  let today = new Date();
  
  // Simple check: start checking from today backwards.
  // Count consecutive days.
  let checkDate = new Date(today);
  
  // If no workout today, check if there was one yesterday.
  const todayStr = checkDate.toISOString().split('T')[0];
  checkDate.setDate(checkDate.getDate() - 1);
  const yesterdayStr = checkDate.toISOString().split('T')[0];
  
  const hasWorkoutToday = workoutDates.has(todayStr);
  const hasWorkoutYesterday = workoutDates.has(yesterdayStr);
  
  if (!hasWorkoutToday && !hasWorkoutYesterday) {
    return 0; // Streak broken
  }

  // Restart check from today or yesterday depending on which has a workout
  checkDate = new Date(today);
  if (!hasWorkoutToday && hasWorkoutYesterday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (workoutDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Estimates 1-Rep Max using Brzycki formula: Weight / (1.0278 - (0.0278 * Reps))
export function estimate1RM(weight, reps) {
  if (reps === 1) return weight;
  if (reps <= 0) return 0;
  return Math.round(weight / (1.0278 - (0.0278 * reps)));
}

// Find previous workout's performance for an exercise
export function getPreviousPerformance(exerciseName) {
  const history = AppState.history;
  for (let i = 0; i < history.length; i++) {
    const log = history[i];
    const foundEx = log.exercises.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
    if (foundEx) {
      // Find max weight lifted, or return list of sets
      const completedSets = foundEx.sets.filter(s => s.completed);
      if (completedSets.length > 0) {
        return completedSets;
      }
    }
  }
  return null;
}
