/* ===================== STORAGE & UTILITIES ===================== */
const STORAGE_KEY = 'lifesystem_tasks';
const SCHEDULE_STATUS_KEY = 'lifesystem_schedule_status';
const SCHEDULE_NOTES_KEY = 'lifesystem_schedule_notes';

// Default weekly schedule
const DEFAULT_SCHEDULE = {
    0: { // Sunday
        blocks: [
            { time: '6:00 AM - 8:00 AM', title: 'Sleep In', description: 'No alarm, sleep at your pace' },
            { time: '8:00 AM - 10:00 AM', title: 'Morning at your pace', description: 'Relax, no rush' },
            { time: '10:00 AM - 1:00 PM', title: 'Family / Walk / Read', description: 'Fully offline' },
            { time: '1:00 PM - 3:00 PM', title: 'Light Music / Journaling', description: 'Optional' },
            { time: '3:00 PM - 3:30 PM', title: 'Weekly Planning', description: 'Prep for the week (30 min max)' },
            { time: '5:00 PM - 6:00 PM', title: 'Dinner / Family', description: '' },
            { time: '9:00 PM', title: 'Sleep (Earlier)', description: '3:30 AM comes fast' }
        ],
        rest: true
    },
    1: { // Monday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax, power nap OK (20 min)' },
            { time: '1:00 PM - 5:00 PM', title: 'Music Production', description: 'Tutorials, DAW, workflow, sound design' },
            { time: '5:00 PM - 7:00 PM', title: 'Gym', description: 'Energy + consistency' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day, no perfection pressure' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: 'Protect aggressively' }
        ]
    },
    2: { // Tuesday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax, power nap OK' },
            { time: '1:00 PM - 5:00 PM', title: 'Coding Day', description: 'React, projects, DSA, portfolio' },
            { time: '5:00 PM - 7:00 PM', title: 'Gym', description: 'Energy + consistency' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: '' }
        ]
    },
    3: { // Wednesday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax' },
            { time: '1:00 PM - 5:00 PM', title: 'Piano Day', description: 'Practice, jazz, improv, pieces' },
            { time: '5:00 PM - 7:00 PM', title: 'Free Time / Buffer / Rest', description: '' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: '' }
        ]
    },
    4: { // Thursday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax' },
            { time: '1:00 PM - 5:00 PM', title: 'Music Production (Apply)', description: 'Experiment, apply Monday concepts' },
            { time: '5:00 PM - 7:00 PM', title: 'Gym', description: 'Energy + consistency' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: '' }
        ]
    },
    5: { // Friday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax' },
            { time: '1:00 PM - 5:00 PM', title: 'Deep Coding Day', description: 'Build, push — end with 20 min free listening' },
            { time: '5:00 PM - 7:00 PM', title: 'Gym', description: 'Energy + consistency' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: '' }
        ]
    },
    6: { // Saturday
        blocks: [
            { time: '3:30 AM', title: 'Wake-up Ritual', description: 'Water, wash face, light food, no doomscrolling' },
            { time: '9:00 AM - 11:00 AM', title: 'Internship', description: '[2 hrs]' },
            { time: '11:00 AM - 1:00 PM', title: 'Recovery / Human Time', description: 'Eat, read, family, relax' },
            { time: '1:00 PM - 5:00 PM', title: 'Piano + Light Work Day', description: 'Lighter schedule — extra classes' },
            { time: '5:00 PM - 7:00 PM', title: 'Free Time / Buffer / Rest', description: '' },
            { time: '7:00 PM - 8:00 PM', title: 'Dinner / Reset / Relax', description: '' },
            { time: '8:00 PM - 9:00 PM', title: 'Daily Music Production Hour', description: 'Create every day' },
            { time: '9:00 PM', title: 'Wind-down → Sleep', description: '' }
        ]
    }
};

const CATEGORY_COLORS = {
    'teaching': '#667eea',
    'internship': '#764ba2',
    'music-prod': '#f6ad55',
    'coding': '#48bb78',
    'piano': '#f56565',
    'gym': '#06b6d4',
    'personal': '#ec4899',
    'other': '#6b7280'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ===================== STATE MANAGEMENT ===================== */
let currentDate = new Date();
let tasks = [];
let scheduleStatus = {}; // Tracks completion of default schedule items
let scheduleNotes = {}; // Tracks notes for schedule items
let currentView = 'week';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let editingTaskId = null;
let editingScheduleBlock = null;

// Load tasks from storage
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
    
    const statusStored = localStorage.getItem(SCHEDULE_STATUS_KEY);
    scheduleStatus = statusStored ? JSON.parse(statusStored) : {};
    
    const notesStored = localStorage.getItem(SCHEDULE_NOTES_KEY);
    scheduleNotes = notesStored ? JSON.parse(notesStored) : {};
}

// Save tasks to storage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Save schedule status
function saveScheduleStatus() {
    localStorage.setItem(SCHEDULE_STATUS_KEY, JSON.stringify(scheduleStatus));
}

// Save schedule notes
function saveScheduleNotes() {
    localStorage.setItem(SCHEDULE_NOTES_KEY, JSON.stringify(scheduleNotes));
}

// Add new task
function addTask(task) {
    task.id = Date.now().toString();
    task.createdAt = new Date().toISOString();
    tasks.push(task);
    saveTasks();
    render();
}

// Update task
function updateTask(id, updates) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        Object.assign(task, updates);
        saveTasks();
        render();
    }
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

// Toggle schedule item completion
function toggleScheduleItem(dateStr, blockIndex) {
    const key = `${dateStr}_${blockIndex}`;
    scheduleStatus[key] = !scheduleStatus[key];
    saveScheduleStatus();
    render();
}

// Check if schedule item is completed
function isScheduleItemCompleted(dateStr, blockIndex) {
    const key = `${dateStr}_${blockIndex}`;
    return scheduleStatus[key] || false;
}

// Get schedule notes
function getScheduleNotes(dateStr, blockIndex) {
    const key = `${dateStr}_${blockIndex}`;
    return scheduleNotes[key] || '';
}

// Set schedule notes
function setScheduleNotes(dateStr, blockIndex, notes) {
    const key = `${dateStr}_${blockIndex}`;
    scheduleNotes[key] = notes;
    saveScheduleNotes();
}

// Get tasks for specific date
function getTasksForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
}

// Get week start (Monday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Format date
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Format date display
function formatDateDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/* ===================== DOM HELPERS ===================== */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* ===================== THEME TOGGLE ===================== */
function initTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        $('#themeToggle').textContent = '☀️';
    }
}

$('#themeToggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    document.body.classList.toggle('dark-mode');
    $('#themeToggle').textContent = isDarkMode ? '☀️' : '🌙';
});

/* ===================== MODAL MANAGEMENT ===================== */
const modal = $('#taskModal');
const taskForm = $('#taskForm');
const taskModal = $('#taskModal');

function openModal() {
    editingTaskId = null;
    editingScheduleBlock = null;
    const today = formatDate(new Date());
    $('#taskDate').value = today;
    $('#taskTime').value = '12:00';
    taskForm.reset();
    $('#deleteBtn').style.display = 'none';
    $('#submitBtn').textContent = 'Add Task';
    $('#scheduleNotesSection').style.display = 'none';
    modal.classList.add('active');
}

function openScheduleBlockEditor(dateStr, blockIndex) {
    editingScheduleBlock = { dateStr, blockIndex };
    editingTaskId = null;
    const notes = getScheduleNotes(dateStr, blockIndex);
    $('#scheduleBlockNotes').value = notes;
    $('#scheduleNotesSection').style.display = 'block';
    $('#taskDate').value = dateStr;
    taskForm.reset();
    $('#submitBtn').textContent = 'Save Notes';
    $('#deleteBtn').style.display = 'none';
    $('#scheduleBlockNotes').value = notes;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    taskForm.reset();
    editingTaskId = null;
    editingScheduleBlock = null;
}

$('.close-btn').addEventListener('click', closeModal);
$('#cancelBtn').addEventListener('click', closeModal);
$('#addTaskBtn').addEventListener('click', openModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (editingScheduleBlock) {
        const { dateStr, blockIndex } = editingScheduleBlock;
        const notes = $('#scheduleBlockNotes').value;
        setScheduleNotes(dateStr, blockIndex, notes);
        closeModal();
    } else {
        const task = {
            date: $('#taskDate').value,
            time: $('#taskTime').value,
            title: $('#taskTitle').value,
            category: $('#taskCategory').value,
            status: $('#taskStatus').value,
            notes: $('#taskNotes').value
        };
        
        if (editingTaskId) {
            updateTask(editingTaskId, task);
        } else {
            addTask(task);
        }
        closeModal();
    }
});

$('#deleteBtn').addEventListener('click', () => {
    if (editingTaskId && confirm('Delete this task?')) {
        deleteTask(editingTaskId);
        closeModal();
    }
});

/* ===================== DATE NAVIGATION ===================== */
function updateDateDisplay() {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    $('#currentDate').textContent = `${formatDateDisplay(weekStart)} → ${formatDateDisplay(weekEnd)}`;
}

$('#prevWeek').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    render();
});

$('#nextWeek').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    render();
});

$('#todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    render();
});

/* ===================== VIEW MANAGEMENT ===================== */
$$('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        $$('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentView = e.target.dataset.view;
        render();
    });
});

/* ===================== RENDERING ===================== */
function renderWeekView() {
    const weekStart = getWeekStart(currentDate);
    let html = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        const dayName = DAY_NAMES[dayOfWeek];
        const isToday = formatDate(new Date()) === dateStr;
        const dayTasks = getTasksForDate(date);
        const scheduleBlocks = DEFAULT_SCHEDULE[dayOfWeek].blocks;
        
        // Count completed schedule blocks
        let completedBlocks = 0;
        scheduleBlocks.forEach((block, idx) => {
            if (isScheduleItemCompleted(dateStr, idx)) completedBlocks++;
        });

        html += `
            <div class="day-card ${isToday ? 'today' : ''}" onclick="openDayView('${dateStr}')">
                <div class="day-header">
                    <div>
                        <div class="day-name">${dayName}</div>
                        <div class="day-date">${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}</div>
                    </div>
                    <div style="text-align: right;">
                        ${dayTasks.length > 0 ? `<span class="day-badge">${dayTasks.length} tasks</span>` : ''}
                        ${scheduleBlocks.length > 0 ? `<span class="day-badge" style="background: var(--accent); margin-top: 0.3rem; display: block;">✓ ${completedBlocks}/${scheduleBlocks.length}</span>` : ''}
                    </div>
                </div>
                <div class="tasks-list">
                    ${scheduleBlocks.length > 0 ? `
                        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-light); margin-bottom: 0.5rem;">Schedule:</div>
                            ${scheduleBlocks.map((block, idx) => {
                                const isCompleted = isScheduleItemCompleted(dateStr, idx);
                                return `
                                    <div class="schedule-check-item ${isCompleted ? 'completed' : ''}" onclick="event.stopPropagation(); toggleScheduleItem('${dateStr}', ${idx})">
                                        <input type="checkbox" ${isCompleted ? 'checked' : ''}>
                                        <span class="check-time">${block.time.split(' - ')[0]}</span>
                                        <span class="check-title">${block.title}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                    ${dayTasks.length > 0 ? `
                        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-light); margin-bottom: 0.5rem;">Custom Tasks:</div>
                        ${dayTasks.map(task => `
                            <div class="task-item ${task.status}" onclick="event.stopPropagation()">
                                <div class="task-content">
                                    <div class="task-time">${task.time}</div>
                                    <div class="task-title">${task.title}</div>
                                    <span class="task-category">${task.category}</span>
                                </div>
                                <div class="task-actions">
                                    <button class="task-btn edit" onclick="editTask('${task.id}')">✏️</button>
                                    <button class="task-btn delete" onclick="deleteTaskAndRender('${task.id}')">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    ` : (scheduleBlocks.length === 0 ? `<div class="empty-state"><p>No schedule or tasks</p></div>` : '')}
                </div>
            </div>
        `;
    }

    $('#weekGrid').innerHTML = html;
}

function renderDayView() {
    const dateStr = formatDate(currentDate);
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];
    const dayTasks = getTasksForDate(date);
    const scheduleBlocks = DEFAULT_SCHEDULE[dayOfWeek].blocks;

    let html = `
        <div class="day-detail-header">
            <div>
                <h2>${dayName}</h2>
                <p style="color: var(--text-light); margin-top: 0.3rem;">${formatDateDisplay(date)}</p>
            </div>
            <button class="nav-btn" onclick="switchToWeekView()">← Week View</button>
        </div>
        <div class="schedule-blocks">
            ${scheduleBlocks.map((block, idx) => {
                const isCompleted = isScheduleItemCompleted(dateStr, idx);
                const taskInBlock = dayTasks.filter(t => {
                    const [startTime] = block.time.split(' - ');
                    return t.time.includes(startTime.trim());
                });

                return `
                    <div class="schedule-block ${isCompleted ? 'completed' : ''}">
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <input type="checkbox" class="schedule-checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleScheduleItem('${dateStr}', ${idx})">
                            <div style="flex: 1;">
                                <div class="schedule-time">⏰ ${block.time}</div>
                                <div class="schedule-title">${block.title}</div>
                                <div class="schedule-desc">${block.description}</div>
                                ${getScheduleNotes(dateStr, idx) ? `<div style="margin-top: 0.8rem; padding: 0.8rem; background: rgba(72, 187, 120, 0.1); border-radius: 6px; border-left: 3px solid var(--success); font-size: 0.9rem; color: var(--text-light);">📝 ${getScheduleNotes(dateStr, idx)}</div>` : ''}
                            </div>
                            <button class="task-btn edit" style="margin-left: 0.5rem; align-self: flex-start; margin-top: 0.2rem;" onclick="openScheduleBlockEditor('${dateStr}', ${idx})">✏️</button>
                        </div>
                        ${taskInBlock.length > 0 ? `
                            <div class="tasks-list" style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                                ${taskInBlock.map(task => `
                                    <div class="task-item ${task.status}">
                                        <div class="task-content">
                                            <div class="task-title">${task.title}</div>
                                            <span class="task-category">${task.category}</span>
                                            ${task.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.3rem;">${task.notes}</p>` : ''}
                                        </div>
                                        <div class="task-actions">
                                            <button class="task-btn edit" onclick="editTask('${task.id}')">✏️</button>
                                            <button class="task-btn delete" onclick="deleteTaskAndRender('${task.id}')">🗑️</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
        ${dayTasks.length > 0 ? `
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">Custom Tasks</h3>
                <div class="schedule-blocks">
                    ${dayTasks.map(task => `
                        <div class="schedule-block">
                            <div style="display: flex; align-items: center; gap: 0.8rem;">
                                <div style="flex: 1;">
                                    <div class="schedule-time">⏰ ${task.time}</div>
                                    <div class="schedule-title">${task.title}</div>
                                    <span class="task-category">${task.category}</span>
                                    ${task.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">${task.notes}</p>` : ''}
                                </div>
                                <div class="task-actions">
                                    <button class="task-btn edit" onclick="editTask('${task.id}')">✏️</button>
                                    <button class="task-btn delete" onclick="deleteTaskAndRender('${task.id}')">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    $('#dayDetail').innerHTML = html;
}

function render() {
    updateDateDisplay();

    // Hide all views
    $$('.view').forEach(v => v.classList.remove('active'));

    if (currentView === 'week') {
        $('#weekView').classList.add('active');
        renderWeekView();
    } else {
        $('#dayView').classList.add('active');
        renderDayView();
    }
}

function openDayView(dateStr) {
    currentDate = new Date(dateStr);
    currentView = 'day';
    $$('.view-btn').forEach(b => b.classList.remove('active'));
    $$('.view-btn')[1].classList.add('active');
    render();
}

function switchToWeekView() {
    currentView = 'week';
    $$('.view-btn').forEach(b => b.classList.remove('active'));
    $$('.view-btn')[0].classList.add('active');
    render();
}

function deleteTaskAndRender(id) {
    if (confirm('Delete this task?')) {
        deleteTask(id);
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = id;
        $('#taskDate').value = task.date;
        $('#taskTime').value = task.time;
        $('#taskTitle').value = task.title;
        $('#taskCategory').value = task.category;
        $('#taskStatus').value = task.status;
        $('#taskNotes').value = task.notes || '';
        
        $('#deleteBtn').style.display = 'flex';
        $('#submitBtn').textContent = 'Update Task';
        openModal();
    }
}

/* ===================== INITIALIZATION ===================== */
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initTheme();
    render();
});
