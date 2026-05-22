/* ===================== FIREBASE INTEGRATION ===================== */
let db = null;
let currentUserId = 'anonymous_user';
let useFirebase = false;

// Initialize Firebase
async function initializeFirebase() {
    try {
        // Get config from firebase-config.js
        if (typeof firebaseConfig !== 'undefined' && firebaseConfig) {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
            console.log('✅ Firebase initialized');
            updateSyncStatus('Synced', true);
            return true;
        } else {
            console.log('⚠️ Firebase config not available, using localStorage');
            updateSyncStatus('Local Storage', false);
            return false;
        }
    } catch (error) {
        console.error('Firebase init error:', error);
        updateSyncStatus('Offline', false);
        return false;
    }
}

function updateSyncStatus(status, synced) {
    const statusEl = document.getElementById('syncStatus');
    if (statusEl) {
        statusEl.textContent = synced ? `📡 ${status}` : `⚠️ ${status}`;
        statusEl.style.color = synced ? 'var(--success)' : 'var(--warning)';
    }
}

/* ===================== STORAGE & UTILITIES ===================== */
const STORAGE_KEY = 'lifesystem_tasks';
const SCHEDULE_STATUS_KEY = 'lifesystem_schedule_status';
const SCHEDULE_NOTES_KEY = 'lifesystem_schedule_notes';

// Default weekly schedule (User's healthy routine inspiration)
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
let scheduleStatus = {};
let scheduleNotes = {};
let currentView = 'week';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let editingTaskId = null;
let editingScheduleBlock = null;

// User custom weekly schedule
let weeklySchedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
let editingTemplateBlockIdx = null;

// Load data from Firestore or localStorage
async function loadTasks() {
    try {
        if (useFirebase && db) {
            updateSyncStatus('Loading...', false);
            
            // Load tasks
            const tasksSnapshot = await db.collection('users').doc(currentUserId).collection('tasks').get();
            tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load schedule status
            const statusDoc = await db.collection('users').doc(currentUserId).collection('data').doc('scheduleStatus').get();
            scheduleStatus = statusDoc.exists ? statusDoc.data() : {};

            // Load schedule notes
            const notesDoc = await db.collection('users').doc(currentUserId).collection('data').doc('scheduleNotes').get();
            scheduleNotes = notesDoc.exists ? notesDoc.data() : {};

            // Load weekly template
            const templateDoc = await db.collection('users').doc(currentUserId).collection('data').doc('scheduleTemplate').get();
            if (templateDoc.exists) {
                weeklySchedule = templateDoc.data().template;
            } else {
                // Brand new user detected! Show onboarding choice modal
                showOnboardingModal();
            }

            updateSyncStatus('Synced', true);
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            tasks = stored ? JSON.parse(stored) : [];
            
            const statusStored = localStorage.getItem(SCHEDULE_STATUS_KEY);
            scheduleStatus = statusStored ? JSON.parse(statusStored) : {};
            
            const notesStored = localStorage.getItem(SCHEDULE_NOTES_KEY);
            scheduleNotes = notesStored ? JSON.parse(notesStored) : {};

            const templateStored = localStorage.getItem('lifesystem_schedule_template');
            if (templateStored) {
                weeklySchedule = JSON.parse(templateStored);
            }
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        updateSyncStatus('Offline', false);
    }
}

// Save tasks
async function saveTasks() {
    try {
        if (useFirebase && db) {
            updateSyncStatus('Saving...', false);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            await Promise.all(tasks.map(task => {
                const { id, ...data } = task;
                return db.collection('users').doc(currentUserId).collection('tasks').doc(id).set(data, { merge: true });
            }));
            updateSyncStatus('Synced', true);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        }
    } catch (error) {
        console.error('Error saving tasks:', error);
        updateSyncStatus('Save failed', false);
    }
}

// Save schedule status
async function saveScheduleStatus() {
    try {
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('scheduleStatus').set(scheduleStatus);
        } else {
            localStorage.setItem(SCHEDULE_STATUS_KEY, JSON.stringify(scheduleStatus));
        }
    } catch (error) {
        console.error('Error saving status:', error);
    }
}

// Save schedule notes
async function saveScheduleNotes() {
    try {
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('scheduleNotes').set(scheduleNotes);
        } else {
            localStorage.setItem(SCHEDULE_NOTES_KEY, JSON.stringify(scheduleNotes));
        }
    } catch (error) {
        console.error('Error saving notes:', error);
    }
}

// Save dynamic weekly schedule
async function saveWeeklySchedule() {
    try {
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('scheduleTemplate').set({ template: weeklySchedule });
        } else {
            localStorage.setItem('lifesystem_schedule_template', JSON.stringify(weeklySchedule));
        }
    } catch (error) {
        console.error('Error saving template:', error);
    }
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
async function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    try {
        if (useFirebase && db) {
            updateSyncStatus('Saving...', false);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            await db.collection('users').doc(currentUserId).collection('tasks').doc(id).delete();
            updateSyncStatus('Synced', true);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        }
    } catch (error) {
        console.error('Error deleting task from Firestore:', error);
        updateSyncStatus('Save failed', false);
    }
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
    if (currentView === 'analytics') {
        const activeYear = currentDate.getFullYear();
        const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
        $('#currentDate').textContent = `📈 ${monthName} ${activeYear}`;
        return;
    }

    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    $('#currentDate').textContent = `${formatDateDisplay(weekStart)} → ${formatDateDisplay(weekEnd)}`;
}

$('#prevWeek').addEventListener('click', () => {
    if (currentView === 'analytics') {
        adjustMonth(-1);
    } else {
        currentDate.setDate(currentDate.getDate() - 7);
        render();
    }
});

$('#nextWeek').addEventListener('click', () => {
    if (currentView === 'analytics') {
        adjustMonth(1);
    } else {
        currentDate.setDate(currentDate.getDate() + 7);
        render();
    }
});

$('#todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    render();
});

/* ===================== VIEW MANAGEMENT ===================== */
$$('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.id === 'editTemplateBtn') return; // Bypass layout selection logic
        $$('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentView = e.target.dataset.view;
        render();
    });
});

/* ===================== TASK QUICK TOGGLES ===================== */
window.toggleTaskStatus = function(id, statusToSet) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newStatus = task.status === statusToSet ? 'pending' : statusToSet;
        updateTask(id, { status: newStatus });
    }
};

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
        
        const dayData = weeklySchedule[dayOfWeek] || { blocks: [] };
        const scheduleBlocks = dayData.blocks;
        
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
                                    <span class="task-category" style="background-color: ${CATEGORY_COLORS[task.category] || 'var(--primary)'};">${task.category}</span>
                                </div>
                                <div class="task-actions" style="align-items: center; gap: 0.25rem;">
                                    <button class="task-btn check" style="background: ${task.status === 'completed' ? 'var(--success)' : 'transparent'}; color: ${task.status === 'completed' ? 'white' : 'inherit'}; border-color: ${task.status === 'completed' ? 'var(--success)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'completed')">✔️</button>
                                    <button class="task-btn cross" style="background: ${task.status === 'failed' ? 'var(--danger)' : 'transparent'}; color: ${task.status === 'failed' ? 'white' : 'inherit'}; border-color: ${task.status === 'failed' ? 'var(--danger)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'failed')">❌</button>
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
    
    const dayData = weeklySchedule[dayOfWeek] || { blocks: [] };
    const scheduleBlocks = dayData.blocks;

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
                                            <span class="task-category" style="background-color: ${CATEGORY_COLORS[task.category] || 'var(--primary)'};">${task.category}</span>
                                            ${task.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.3rem;">${task.notes}</p>` : ''}
                                        </div>
                                        <div class="task-actions" style="align-items: center; gap: 0.25rem;">
                                            <button class="task-btn check" style="background: ${task.status === 'completed' ? 'var(--success)' : 'transparent'}; color: ${task.status === 'completed' ? 'white' : 'inherit'}; border-color: ${task.status === 'completed' ? 'var(--success)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'completed')">✔️</button>
                                            <button class="task-btn cross" style="background: ${task.status === 'failed' ? 'var(--danger)' : 'transparent'}; color: ${task.status === 'failed' ? 'white' : 'inherit'}; border-color: ${task.status === 'failed' ? 'var(--danger)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'failed')">❌</button>
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
                                    <span class="task-category" style="background-color: ${CATEGORY_COLORS[task.category] || 'var(--primary)'};">${task.category}</span>
                                    ${task.notes ? `<p style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem;">${task.notes}</p>` : ''}
                                </div>
                                <div class="task-actions" style="align-items: center; gap: 0.25rem;">
                                    <button class="task-btn check" style="background: ${task.status === 'completed' ? 'var(--success)' : 'transparent'}; color: ${task.status === 'completed' ? 'white' : 'inherit'}; border-color: ${task.status === 'completed' ? 'var(--success)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'completed')">✔️</button>
                                    <button class="task-btn cross" style="background: ${task.status === 'failed' ? 'var(--danger)' : 'transparent'}; color: ${task.status === 'failed' ? 'white' : 'inherit'}; border-color: ${task.status === 'failed' ? 'var(--danger)' : 'var(--border)'};" onclick="toggleTaskStatus('${task.id}', 'failed')">❌</button>
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

/* ===================== ANALYTICS VIEW RENDERING ===================== */
function renderAnalyticsView() {
    const activeMonth = currentDate.getMonth(); // 0-11
    const activeYear = currentDate.getFullYear();
    
    // Get month name
    const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
    
    // Filter tasks for the selected month
    const monthlyTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getMonth() === activeMonth && taskDate.getFullYear() === activeYear;
    });
    
    // Calculate custom task stats
    const totalTasks = monthlyTasks.length;
    const completedTasks = monthlyTasks.filter(t => t.status === 'completed').length;
    const failedTasks = monthlyTasks.filter(t => t.status === 'failed').length;
    const pendingTasks = monthlyTasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
    
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const taskFailureRate = totalTasks > 0 ? Math.round((failedTasks / totalTasks) * 100) : 0;
    
    // Calculate schedule template block stats for this month
    let totalScheduleBlocks = 0;
    let completedScheduleBlocks = 0;
    
    // Days in current month
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(activeYear, activeMonth, day);
        const dayOfWeek = date.getDay();
        const dateStr = formatDate(date);
        
        const dayData = weeklySchedule[dayOfWeek] || { blocks: [] };
        const blocks = dayData.blocks || [];
        
        totalScheduleBlocks += blocks.length;
        blocks.forEach((_, idx) => {
            if (isScheduleItemCompleted(dateStr, idx)) {
                completedScheduleBlocks++;
            }
        });
    }
    
    const scheduleConsistencyRate = totalScheduleBlocks > 0 ? Math.round((completedScheduleBlocks / totalScheduleBlocks) * 100) : 0;
    
    // Category counts for tasks
    const categoryStats = {};
    Object.keys(CATEGORY_COLORS).forEach(cat => {
        categoryStats[cat] = 0;
    });
    
    monthlyTasks.forEach(t => {
        if (t.status === 'completed' && categoryStats[t.category] !== undefined) {
            categoryStats[t.category]++;
        }
    });
    
    // Generate actionable insights coach logs
    let insightHeader = "Keep pushing forward! 🚀";
    let insightText = "Add more custom tasks and track your schedule to generate detailed personal productivity insights.";
    
    if (totalTasks > 0 || totalScheduleBlocks > 0) {
        if (taskCompletionRate >= 75 && scheduleConsistencyRate >= 70) {
            insightHeader = "Outstanding Performance! 🏆";
            insightText = `You are absolutely crushing it! Your monthly completion rate is ${taskCompletionRate}% and you followed ${scheduleConsistencyRate}% of your routine blocks. You are protecting your habits aggressively!`;
        } else if (taskCompletionRate >= 50) {
            insightHeader = "Strong Habits Building! 🌱";
            insightText = `Good consistency! You completed ${completedTasks} custom tasks this month. Tip: Look at the tasks marked 'Not Done' (${failedTasks}) to see if they can be scheduled for a different time range.`;
        } else {
            insightHeader = "Focus & Realignment Time ⚓";
            insightText = `Every step is progress. You completed ${completedTasks} tasks and logged ${completedScheduleBlocks} schedule blocks this month. Let's aim to simplify your template block titles to build momentum!`;
        }
    }

    const html = `
        <div class="analytics-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h2 style="font-size: 1.8rem; font-weight: 800; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">📈 Performance Analytics</h2>
                <p style="color: var(--text-light); margin-top: 0.3rem;">Monthly progress coach & calendar insights for <strong>${monthName} ${activeYear}</strong></p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="nav-btn" onclick="adjustMonth(-1)">◀ Prev Month</button>
                <button class="nav-btn" onclick="adjustMonth(1)">Next Month ▶</button>
            </div>
        </div>
        
        <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            
            <!-- Custom Tasks Analytics Card -->
            <div class="analytics-card" style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 1.5rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <h3 style="color: var(--primary); font-size: 1.2rem; font-weight: 700; margin-bottom: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">🎯 Task Progress</h3>
                
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <!-- Circular visual progress indicator -->
                    <div style="position: relative; width: 90px; height: 90px; border-radius: 50%; background: conic-gradient(var(--success) ${taskCompletionRate * 3.6}deg, var(--border) 0deg); display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 74px; height: 74px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; color: var(--text);">
                            ${taskCompletionRate}%
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-light);">COMPLETION RATE</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--success); margin-top: 0.1rem;">${completedTasks} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-light);">/ ${totalTasks} Done</span></div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                            <span>Completed Tasks</span>
                            <span style="font-weight: 700; color: var(--success);">${completedTasks}</span>
                        </div>
                        <div style="height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${taskCompletionRate}%; height: 100%; background: var(--success);"></div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                            <span>Not Done (Failed)</span>
                            <span style="font-weight: 700; color: var(--danger);">${failedTasks}</span>
                        </div>
                        <div style="height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${taskFailureRate}%; height: 100%; background: var(--danger);"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; border-top: 1px solid var(--border); padding-top: 0.8rem; margin-top: 0.2rem;">
                        <span>Pending / In Progress</span>
                        <span style="font-weight: 700; color: var(--warning);">${pendingTasks}</span>
                    </div>
                </div>
            </div>
            
            <!-- Schedule Consistency Analytics Card -->
            <div class="analytics-card" style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 1.5rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <h3 style="color: var(--primary); font-size: 1.2rem; font-weight: 700; margin-bottom: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">📅 Schedule Consistency</h3>
                
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <!-- Circular visual progress indicator -->
                    <div style="position: relative; width: 90px; height: 90px; border-radius: 50%; background: conic-gradient(var(--accent) ${scheduleConsistencyRate * 3.6}deg, var(--border) 0deg); display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 74px; height: 74px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; color: var(--text);">
                            ${scheduleConsistencyRate}%
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-light);">ROUTINE INTEGRITY</div>
                        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent); margin-top: 0.1rem;">${completedScheduleBlocks} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-light);">/ ${totalScheduleBlocks} blocks</span></div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    <p style="font-size: 0.85rem; color: var(--text-light); line-height: 1.5;">
                        This tracking score measures how consistently you follow and mark completion of your pre-defined daily routine block schedules configured in your template manager.
                    </p>
                    <div style="background: rgba(102, 126, 234, 0.08); padding: 0.8rem; border-radius: 8px; border-left: 3px solid var(--primary); font-size: 0.85rem; margin-top: 0.2rem;">
                        <strong>Daily Habit Tracker:</strong> Protect your wake-up time blocks aggressively to build routine strength!
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Insights & Coach Logs Column -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
            
            <!-- Category breakdown mini bars -->
            <div class="analytics-card" style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 1.5rem; border-radius: 16px;">
                <h3 style="color: var(--primary); font-size: 1.2rem; font-weight: 700; margin-bottom: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">📊 Categories Completed</h3>
                
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    ${Object.entries(categoryStats).map(([cat, count]) => {
                        const maxCount = Math.max(...Object.values(categoryStats), 1);
                        const percentage = Math.round((count / maxCount) * 100);
                        const color = CATEGORY_COLORS[cat] || '#6b7280';
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.2rem; text-transform: capitalize;">
                                    <span style="font-weight: 600;">${cat}</span>
                                    <span>${count} tasks</span>
                                </div>
                                <div style="height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- AI Progress Coach Advice Box -->
            <div class="analytics-card" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border: 1px solid var(--primary); padding: 1.5rem; border-radius: 16px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.05; pointer-events: none; transform: rotate(15deg);">💡</div>
                <div style="font-size: 1.5rem; margin-bottom: 0.6rem;">💡</div>
                <h3 style="color: var(--primary); font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem;">${insightHeader}</h3>
                <p style="color: var(--text); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem;">
                    "${insightText}"
                </p>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-light); text-transform: uppercase; letter-spacing: 1px;">
                    ⚡ Personal Progress Coach
                </div>
            </div>
        </div>
    `;
    
    $('#analyticsContent').innerHTML = html;
}

window.adjustMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateDateDisplay();
    renderAnalyticsView();
};

function render() {
    updateDateDisplay();

    $$('.view').forEach(v => v.classList.remove('active'));

    if (currentView === 'week') {
        $('#weekView').classList.add('active');
        renderWeekView();
    } else if (currentView === 'day') {
        $('#dayView').classList.add('active');
        renderDayView();
    } else if (currentView === 'analytics') {
        $('#analyticsView').classList.add('active');
        renderAnalyticsView();
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
        $('#scheduleNotesSection').style.display = 'none';
        openModal();
    }
}

/* ===================== AUTHENTICATION SYSTEM ===================== */
let isGuestModeActive = false;
let authMode = 'login'; // 'login' or 'signup'

function initAuth() {
    if (!useFirebase || !db) {
        // If Firebase failed to initialize, default to offline guest mode automatically
        isGuestModeActive = true;
        useFirebase = false;
        $('#authModal').style.display = 'none';
        loadTasks().then(() => render());
        return;
    }

    const auth = firebase.auth();

    // Listen for auth state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            currentUserId = user.uid;
            isGuestModeActive = false;
            useFirebase = true;
            
            // Extract username from virtual email
            const username = user.email.split('@')[0];
            $('#usernameDisplay').textContent = username;
            $('#userProfile').style.display = 'flex';
            $('#authModal').style.display = 'none';
            
            updateSyncStatus('Synced', true);
            await loadTasks();
            render();
        } else {
            // User is signed out
            currentUserId = 'anonymous_user';
            $('#userProfile').style.display = 'none';
            
            if (isGuestModeActive) {
                // If they bypassed it with guest mode
                useFirebase = false;
                $('#authModal').style.display = 'none';
                updateSyncStatus('Local Storage', false);
                await loadTasks();
                render();
            } else {
                // Show Auth modal
                showAuthModal();
            }
        }
    });

    // Form submission (Login / Sign Up)
    $('#authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#authUsername').value.trim().toLowerCase();
        const password = $('#authPassword').value;
        const errorEl = $('#authError');
        
        // Hide previous error
        errorEl.style.display = 'none';
        errorEl.textContent = '';
        
        // Programmatically translate username to virtual email
        const email = `${username}@lifescheduler.local`;
        
        const submitBtn = $('#authSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = authMode === 'login' ? 'Logging in...' : 'Signing up...';

        try {
            if (authMode === 'login') {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                await auth.createUserWithEmailAndPassword(email, password);
            }
        } catch (error) {
            console.error('Auth error:', error);
            errorEl.textContent = getAuthErrorMessage(error);
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = authMode === 'login' ? 'Log In' : 'Sign Up';
        }
    });

    // Toggle Link (Login <-> Signup)
    $('#authToggleLink').addEventListener('click', () => {
        const errorEl = $('#authError');
        errorEl.style.display = 'none';
        
        if (authMode === 'login') {
            authMode = 'signup';
            $('#authTitle').textContent = 'Sign Up';
            $('#authSubtitle').textContent = 'Create your secure personal schedule';
            $('#authSubmitBtn').textContent = 'Sign Up';
            $('#authToggleText').textContent = 'Already have an account?';
            $('#authToggleLink').textContent = 'Log In';
        } else {
            authMode = 'login';
            $('#authTitle').textContent = 'Log In';
            $('#authSubtitle').textContent = 'Access your personal Life System schedule';
            $('#authSubmitBtn').textContent = 'Log In';
            $('#authToggleText').textContent = "Don't have an account?";
            $('#authToggleLink').textContent = 'Sign Up';
        }
    });

    // Sign Out Button
    $('#signOutBtn').addEventListener('click', async () => {
        try {
            isGuestModeActive = false; // Reset guest mode on active log out
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });

    // Guest Mode Button
    $('#authGuestBtn').addEventListener('click', async () => {
        isGuestModeActive = true;
        useFirebase = false;
        $('#authModal').style.display = 'none';
        updateSyncStatus('Local Storage', false);
        await loadTasks();
        render();
    });
}

function showAuthModal() {
    $('#authModal').style.display = 'flex';
    $('#authForm').reset();
    $('#authError').style.display = 'none';
    
    // Set default mode to login
    authMode = 'login';
    $('#authTitle').textContent = 'Log In';
    $('#authSubtitle').textContent = 'Access your personal Life System schedule';
    $('#authSubmitBtn').textContent = 'Log In';
    $('#authToggleText').textContent = "Don't have an account?";
    $('#authToggleLink').textContent = 'Sign Up';
    $('#authSubmitBtn').disabled = false;
}

function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid username format. Try simple alphanumeric characters.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'Username not found. Create a new account by clicking "Sign Up" below!';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
            return 'This username is already taken. Please choose another one.';
        case 'auth/weak-password':
            return 'Password is too weak. Make it at least 6 characters long.';
        case 'auth/operation-not-allowed':
            return 'Signing up with email/password is currently disabled in your Firebase console. Go to Auth settings and enable Email/Password!';
        default:
            return error.message;
    }
}

/* ===================== ONBOARDING & TEMPLATE EDITOR SYSTEM ===================== */
function showOnboardingModal() {
    $('#onboardingModal').style.display = 'flex';
}

$('#onboardingHealthyBtn').addEventListener('click', async () => {
    weeklySchedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    await saveWeeklySchedule();
    $('#onboardingModal').style.display = 'none';
    render();
});

$('#onboardingBlankBtn').addEventListener('click', async () => {
    weeklySchedule = {
        0: { blocks: [], rest: true },
        1: { blocks: [] },
        2: { blocks: [] },
        3: { blocks: [] },
        4: { blocks: [] },
        5: { blocks: [] },
        6: { blocks: [] }
    };
    await saveWeeklySchedule();
    $('#onboardingModal').style.display = 'none';
    render();
});

// Template Editor Modal Logic
function openTemplateEditor() {
    $('#templateModal').style.display = 'flex';
    $('#templateDaySelect').value = "1"; // Default to Monday
    editingTemplateBlockIdx = null;
    $('#templateBlockForm').reset();
    $('#templateCancelEditBtn').style.display = 'none';
    $('#templateFormTitle').textContent = 'Add New Block';
    $('#templateSaveBlockBtn').textContent = 'Add to Template';
    renderTemplateBlocksList();
}

function closeTemplateEditor() {
    $('#templateModal').style.display = 'none';
}

$('#editTemplateBtn').addEventListener('click', openTemplateEditor);
$('#closeTemplateBtn').addEventListener('click', closeTemplateEditor);

$('#templateCancelEditBtn').addEventListener('click', () => {
    editingTemplateBlockIdx = null;
    $('#templateBlockForm').reset();
    $('#templateCancelEditBtn').style.display = 'none';
    $('#templateFormTitle').textContent = 'Add New Block';
    $('#templateSaveBlockBtn').textContent = 'Add to Template';
});

$('#templateDaySelect').addEventListener('change', () => {
    editingTemplateBlockIdx = null;
    $('#templateBlockForm').reset();
    $('#templateCancelEditBtn').style.display = 'none';
    $('#templateFormTitle').textContent = 'Add New Block';
    $('#templateSaveBlockBtn').textContent = 'Add to Template';
    renderTemplateBlocksList();
});

// Render the list of blocks for the selected day in the editor
function renderTemplateBlocksList() {
    const day = parseInt($('#templateDaySelect').value);
    const dayData = weeklySchedule[day];
    const container = $('#templateBlocksList');
    
    if (!dayData || !dayData.blocks || dayData.blocks.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 1rem; font-size: 0.9rem;">No blocks configured for this day. Add one below!</div>';
        return;
    }
    
    container.innerHTML = dayData.blocks.map((block, idx) => `
        <div class="task-item" style="border-left: 3px solid var(--accent); margin-bottom: 0.5rem; background: var(--bg-secondary); padding: 0.6rem 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div class="task-content">
                <div class="task-time" style="color: var(--accent); font-weight: 600; font-size: 0.85rem;">⏰ ${block.time}</div>
                <div class="task-title" style="font-weight: 600; margin-top: 0.1rem; font-size: 0.95rem;">${block.title}</div>
                ${block.description ? `<p style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.1rem;">${block.description}</p>` : ''}
            </div>
            <div class="task-actions" style="display: flex; gap: 0.3rem;">
                <button class="task-btn edit" onclick="editTemplateBlock(${idx})">✏️</button>
                <button class="task-btn delete" onclick="deleteTemplateBlock(${idx})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Edit a template block
window.editTemplateBlock = function(idx) {
    const day = parseInt($('#templateDaySelect').value);
    const block = weeklySchedule[day].blocks[idx];
    if (block) {
        editingTemplateBlockIdx = idx;
        $('#templateTime').value = block.time;
        $('#templateTitle').value = block.title;
        $('#templateDesc').value = block.description || '';
        
        $('#templateFormTitle').textContent = 'Edit Block';
        $('#templateSaveBlockBtn').textContent = 'Update Block';
        $('#templateCancelEditBtn').style.display = 'block';
    }
};

// Delete a template block
window.deleteTemplateBlock = function(idx) {
    if (confirm('Are you sure you want to delete this template block?')) {
        const day = parseInt($('#templateDaySelect').value);
        weeklySchedule[day].blocks.splice(idx, 1);
        renderTemplateBlocksList();
    }
};

// Form submit to add or update a block
$('#templateBlockForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const day = parseInt($('#templateDaySelect').value);
    const time = $('#templateTime').value.trim();
    const title = $('#templateTitle').value.trim();
    const description = $('#templateDesc').value.trim();
    
    const blockData = { time, title, description };
    
    if (!weeklySchedule[day]) {
        weeklySchedule[day] = { blocks: [] };
    }
    
    if (editingTemplateBlockIdx !== null) {
        // Update block
        weeklySchedule[day].blocks[editingTemplateBlockIdx] = blockData;
        editingTemplateBlockIdx = null;
        $('#templateCancelEditBtn').style.display = 'none';
        $('#templateFormTitle').textContent = 'Add New Block';
        $('#templateSaveBlockBtn').textContent = 'Add to Template';
    } else {
        // Add new block
        weeklySchedule[day].blocks.push(blockData);
    }
    
    $('#templateBlockForm').reset();
    renderTemplateBlocksList();
});

// Save all changes to cloud
$('#templateSaveAllBtn').addEventListener('click', async () => {
    const btn = $('#templateSaveAllBtn');
    btn.disabled = true;
    btn.textContent = 'Saving to Cloud...';
    
    await saveWeeklySchedule();
    
    btn.disabled = false;
    btn.textContent = '💾 Save Template & Close';
    closeTemplateEditor();
    render();
});

/* ===================== INITIALIZATION ===================== */
document.addEventListener('DOMContentLoaded', async () => {
    await initializeFirebase();
    initTheme();
    initAuth();
});
