// Exercise Picker Shared Modal Controller
import { EXERCISE_LIBRARY } from '../state.js';

let currentOnSelectCallback = null;
const modal = document.getElementById('modal-exercise-picker');
const searchInput = document.getElementById('exercise-search-input');
const catsContainer = document.getElementById('exercise-picker-cats');
const listContainer = document.getElementById('exercise-picker-list-container');
const closeBtn = document.getElementById('btn-close-exercise-picker');

const customNameInput = document.getElementById('custom-exercise-name-input');
const customCatSelect = document.getElementById('custom-exercise-cat-select');
const createCustomBtn = document.getElementById('btn-create-custom-exercise');

let selectedCategory = 'All';

export function initExercisePicker() {
  // Close event listener
  closeBtn.addEventListener('click', closeExercisePicker);
  
  // Search event listener
  searchInput.addEventListener('input', renderPickerList);

  // Custom exercise creation
  createCustomBtn.addEventListener('click', () => {
    const name = customNameInput.value.trim();
    const cat = customCatSelect.value;
    if (name) {
      if (currentOnSelectCallback) {
        currentOnSelectCallback(name, cat);
      }
      customNameInput.value = '';
      closeExercisePicker();
    }
  });

  // Render category tabs once
  renderCategories();
}

export function openExercisePicker(onSelect) {
  currentOnSelectCallback = onSelect;
  selectedCategory = 'All';
  searchInput.value = '';
  customNameInput.value = '';
  modal.classList.add('active');
  renderPickerList();
}

export function closeExercisePicker() {
  modal.classList.remove('active');
  currentOnSelectCallback = null;
}

function renderCategories() {
  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];
  catsContainer.innerHTML = '';
  
  categories.forEach(cat => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'btn btn-secondary btn-sm';
    tabBtn.style.whiteSpace = 'nowrap';
    tabBtn.style.padding = '4px 12px';
    tabBtn.textContent = cat;
    
    if (cat === selectedCategory) {
      tabBtn.classList.remove('btn-secondary');
      tabBtn.classList.add('btn-primary');
    }

    tabBtn.addEventListener('click', () => {
      // Toggle categories
      selectedCategory = cat;
      Array.from(catsContainer.children).forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      });
      tabBtn.classList.remove('btn-secondary');
      tabBtn.classList.add('btn-primary');
      renderPickerList();
    });

    catsContainer.appendChild(tabBtn);
  });
}

function renderPickerList() {
  const query = searchInput.value.toLowerCase().trim();
  listContainer.innerHTML = '';

  const filtered = EXERCISE_LIBRARY.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">
        No matches found. Create a custom exercise below!
      </div>
    `;
    return;
  }

  filtered.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'picker-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'picker-item-name';
    nameSpan.textContent = ex.name;

    const catSpan = document.createElement('span');
    catSpan.className = 'picker-item-cat';
    catSpan.textContent = ex.category;

    item.appendChild(nameSpan);
    item.appendChild(catSpan);

    item.addEventListener('click', () => {
      if (currentOnSelectCallback) {
        currentOnSelectCallback(ex.name, ex.category);
      }
      closeExercisePicker();
    });

    listContainer.appendChild(item);
  });
}
