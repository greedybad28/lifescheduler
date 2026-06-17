/* ===================== DOM SELECTOR HELPER ===================== */
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

/* ===================== STATE VARIABLES ===================== */
let db = null;
let currentUserId = 'anonymous_user';
let useFirebase = false;
let isGuestModeActive = false;

let tasks = []; // Array of quests: { id, category, title, completed, completedAt, notes, date }
let questSettings = {
    techGoals: 'Learn React, Build projects, Practice DSA',
    techLevel: 'Beginner',
    techFocus: 'React Fundamentals',
    pianoGoals: 'Improve Technique, Learn classical pieces, Sight reading',
    pianoLevel: 'Beginner',
    pianoFocus: 'Sight Reading',
    musicGoals: 'Learn Ableton, Improve mixing, Finish tracks',
    musicLevel: 'Beginner',
    musicFocus: 'Ableton Workflow'
};

let activeTab = 'dashboard';
let activeCategory = null;
let isGeneratingQuests = false;

/* ===================== DEFAULT QUESTS FALLBACK ===================== */
const DEFAULT_QUESTS = {
    tech: {
        Beginner: [
            'Read 10 pages of a basic programming tutorial',
            'Write a simple Hello World program in a new language',
            'Watch an intro coding video for 20 minutes'
        ],
        Intermediate: [
            'Build a simple form component with validation',
            'Solve one LeetCode medium coding problem',
            'Read a technical blog post about database design'
        ],
        Advanced: [
            'Refactor a bottleneck function in one of your projects',
            'Review open issues on your favorite GitHub repository',
            'Sketch out a system architecture diagram for a new app idea'
        ]
    },
    piano: {
        Beginner: [
            'Practice C Major scale slowly for 15 minutes',
            'Learn the notes of the first 4 bars of a simple melody',
            'Sight-read 5 lines of beginner sheet music'
        ],
        Intermediate: [
            'Practice major and minor scales in 3 different keys',
            'Learn 8 new bars of your current repertoire pieces',
            'Sight-read 1 page of an intermediate piece'
        ],
        Advanced: [
            'Work on a challenging section of your repertoire for 30 minutes',
            'Improvise over a jazz chord progression for 15 minutes',
            'Sight-read 2 pages of a complex piece'
        ]
    },
    music: {
        Beginner: [
            'Watch a 15-minute video tutorial on your DAW interface',
            'Create a simple 4-bar drum pattern in your DAW',
            'Load a synthesizer preset and experiment with filter controls'
        ],
        Intermediate: [
            'Recreate a drum groove from a track you enjoy',
            'Analyze the arrangement/sections of a popular song',
            'Balance the levels and panning of a 4-track project'
        ],
        Advanced: [
            'Spend 45 minutes designing custom presets or synth patches',
            'Apply advanced serial/parallel compression to a vocal track',
            'Finalize the arrangement structure of a project in progress'
        ]
    }
};

/* ===================== MOTIVATIONAL QUOTES ===================== */
const MOTIVATIONAL_QUOTES = [
    { text: "Consistency is the mother of mastery.", author: "Robin Sharma" },
    { text: "It is not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins" },
    { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { text: "Amateurs perform when they feel like it. Professionals perform daily.", author: "Wynton Marsalis" },
    { text: "If you don't practice, you don't deserve to win.", author: "Andre Agassi" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" }
];

/* ===================== FIREBASE INITIALIZATION ===================== */
async function initializeFirebase() {
    try {
        if (typeof firebaseConfig !== 'undefined' && firebaseConfig) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
            console.log('✅ Firebase initialized');
            updateSyncBadge('Synced', true);
            return true;
        } else {
            console.log('⚠️ Firebase config missing. Fallback to localStorage');
            updateSyncBadge('Local Storage', false);
            return false;
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        updateSyncBadge('Offline', false);
        return false;
    }
}

function updateSyncBadge(status, synced) {
    const badge = $('#syncStatus');
    if (badge) {
        badge.textContent = synced ? `📡 ${status}` : `⚠️ ${status}`;
        badge.style.color = synced ? 'var(--success)' : 'var(--warning)';
    }
    const label = $('#syncStatusLabel');
    if (label) {
        label.textContent = synced ? `Cloud Sync Active (${currentUserId.substring(0,6)}...)` : 'Guest Mode (Offline)';
        label.style.color = synced ? 'var(--success)' : 'var(--warning)';
    }
}

/* ===================== PERSISTENCE OPERATIONS ===================== */
async function loadData() {
    toggleLoading(true);
    try {
        if (useFirebase && db) {
            // 1. Load Quests (Legacy Tasks collection)
            const tasksSnapshot = await db.collection('users').doc(currentUserId).collection('tasks').get();
            tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Load Quest Settings
            const settingsDoc = await db.collection('users').doc(currentUserId).collection('data').doc('questSettings').get();
            if (settingsDoc.exists) {
                questSettings = { ...questSettings, ...settingsDoc.data() };
            } else {
                // First-time user: prompt settings setup
                showOnboarding();
            }
            updateSyncBadge('Synced', true);
        } else {
            // Load LocalStorage Fallback
            const storedTasks = localStorage.getItem('lifesystem_quests');
            tasks = storedTasks ? JSON.parse(storedTasks) : [];
            
            const storedSettings = localStorage.getItem('lifesystem_quest_settings');
            if (storedSettings) {
                questSettings = { ...questSettings, ...JSON.parse(storedSettings) };
            } else {
                showOnboarding();
            }
            updateSyncBadge('Local Storage', false);
        }

        // Apply loaded settings to form controls
        populateSettingsFields();

        // Check date and auto-generate today's quests if needed
        await checkDailyQuestReset();

    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        toggleLoading(false);
    }
}

async function saveQuests() {
    try {
        if (useFirebase && db) {
            localStorage.setItem('lifesystem_quests', JSON.stringify(tasks));
            // Firestore write in batch or set individually
            await Promise.all(tasks.map(t => {
                const { id, ...data } = t;
                return db.collection('users').doc(currentUserId).collection('tasks').doc(id).set(data);
            }));
        } else {
            localStorage.setItem('lifesystem_quests', JSON.stringify(tasks));
        }
    } catch (error) {
        console.error('Error saving quests:', error);
    }
}

async function saveQuestSettings() {
    try {
        if (useFirebase && db) {
            localStorage.setItem('lifesystem_quest_settings', JSON.stringify(questSettings));
            await db.collection('users').doc(currentUserId).collection('data').doc('questSettings').set(questSettings);
            updateSyncBadge('Synced', true);
        } else {
            localStorage.setItem('lifesystem_quest_settings', JSON.stringify(questSettings));
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function toggleLoading(show) {
    const indicator = $('#loadingIndicator');
    if (indicator) {
        if (show) indicator.classList.add('active');
        else indicator.classList.remove('active');
    }
}

/* ===================== AUTHENTICATION HANDLING ===================== */
let authMode = 'login'; // 'login' or 'signup'

function initAuth() {
    if (!useFirebase || !db) {
        isGuestModeActive = true;
        useFirebase = false;
        $('#authModal').classList.remove('active');
        loadData().then(() => render());
        return;
    }

    const auth = firebase.auth();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            isGuestModeActive = false;
            useFirebase = true;
            
            const username = user.email.split('@')[0];
            $('#usernameDisplay').textContent = username;
            $('#userProfile').style.display = 'flex';
            $('#authModal').classList.remove('active');
            
            updateSyncBadge('Synced', true);
            await loadData();
            render();
            checkDailyQuotePopup();
        } else {
            currentUserId = 'anonymous_user';
            $('#userProfile').style.display = 'none';
            
            if (isGuestModeActive) {
                useFirebase = false;
                $('#authModal').classList.remove('active');
                updateSyncBadge('Local Storage', false);
                await loadData();
                render();
            } else {
                showAuthModal();
            }
        }
    });

    // Form submission
    $('#authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#authUsername').value.trim().toLowerCase();
        const password = $('#authPassword').value;
        const errorEl = $('#authError');
        
        errorEl.style.display = 'none';
        errorEl.textContent = '';
        
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
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = authMode === 'login' ? 'Log In' : 'Sign Up';
        }
    });

    // Toggle between Login and Signup
    $('#authToggleLink').addEventListener('click', () => {
        const errorEl = $('#authError');
        errorEl.style.display = 'none';
        
        if (authMode === 'login') {
            authMode = 'signup';
            $('#authTitle').textContent = 'Sign Up';
            $('#authSubtitle').textContent = 'Create your Bubble Quest account';
            $('#authSubmitBtn').textContent = 'Sign Up';
            $('#authToggleText').textContent = 'Already have an account?';
            $('#authToggleLink').textContent = 'Log In';
        } else {
            authMode = 'login';
            $('#authTitle').textContent = 'Log In';
            $('#authSubtitle').textContent = 'Access your Bubble Quest account';
            $('#authSubmitBtn').textContent = 'Log In';
            $('#authToggleText').textContent = "Don't have an account?";
            $('#authToggleLink').textContent = 'Sign Up';
        }
    });

    // Sign Out
    $('#signOutBtn').addEventListener('click', async () => {
        try {
            isGuestModeActive = false;
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });

    // Offline / Guest Mode Bypassing
    $('#authGuestBtn').addEventListener('click', () => {
        isGuestModeActive = true;
        useFirebase = false;
        $('#authModal').classList.remove('active');
        updateSyncBadge('Local Storage', false);
        loadData().then(() => render());
    });
}

function showAuthModal() {
    $('#authModal').classList.add('active');
    $('#authForm').reset();
    $('#authError').style.display = 'none';
    authMode = 'login';
}

/* ===================== GEMINI AI QUEST GENERATION ===================== */
async function generateDailyQuests(category, force = false) {
    if (isGeneratingQuests) return;
    isGeneratingQuests = true;

    // Show loading indicators
    const loader = $('#aiModalLoader');
    if (loader) {
        $('#aiModalLoaderText').textContent = `Generating custom ${category} quests via Gemini...`;
        loader.style.display = 'flex';
    }

    const todayStr = getTodayDateStr();
    const apiKey = localStorage.getItem('lifesystem_gemini_api_key') || $('#settingsApiKey').value.trim();
    
    // Read category settings
    let goals = '', level = 'Beginner', focus = '';
    if (category === 'tech') {
        goals = questSettings.techGoals;
        level = questSettings.techLevel;
        focus = questSettings.techFocus;
    } else if (category === 'piano') {
        goals = questSettings.pianoGoals;
        level = questSettings.pianoLevel;
        focus = questSettings.pianoFocus;
    } else if (category === 'music') {
        goals = questSettings.musicGoals;
        level = questSettings.musicLevel;
        focus = questSettings.musicFocus;
    }

    // Get recently completed tasks to avoid repetition
    const categoryQuests = tasks.filter(t => t.category === category);
    const recentCompletedTitles = categoryQuests
        .filter(t => t.completed)
        .slice(-10)
        .map(t => t.title);

    // If key is missing, fallback to predefined tasks
    if (!apiKey) {
        console.warn('⚠️ Gemini API Key not found. Falling back to default list.');
        generateFallbackQuests(category, level, todayStr);
        await saveQuests();
        isGeneratingQuests = false;
        if (loader) loader.style.display = 'none';
        render();
        if (activeCategory === category) openQuestModal(category);
        return;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const promptText = `
        Category: "${category}"
        User's Skill Level: "${level}"
        User's Goals: "${goals}"
        Current Monthly Focus: "${focus}"
        Recently Completed Quests (DO NOT REPEAT):
        ${recentCompletedTitles.length > 0 ? recentCompletedTitles.map(t => `- ${t}`).join('\n') : 'None'}
        `;

        const systemPrompt = `
        You are the AI Quest Master for a gamified RPG skill progression app.
        Your job is to generate exactly 3 daily tasks for the category: "${category}".
        
        The tasks must be:
        1. Specific and Actionable (no vague descriptions like "Learn React" or "Practice Piano").
        2. Finishable in one sitting (15 to 60 minutes).
        3. Small enough to complete today.
        4. Aligned with the user's monthly focus, goals, and skill level.
        
        Examples of Good Specific Tasks:
        - "Watch React Lesson 12 about State Hook"
        - "Build a basic login component UI with controlled inputs"
        - "Practice C Major scale and arpeggios slowly for 15 minutes"
        - "Sight-read 1 page from Bartok Mikrokosmos Book 2"
        - "Program a basic drum grid pattern in Ableton DAW"
        - "Recreate the bass synth patch of a favorite song using Serum"

        You MUST output a JSON object with a single key "tasks" containing an array of exactly 3 strings. Do not include markdown wraps or anything else.
        Example:
        {
          "tasks": [
            "Watch React Lesson 12",
            "Build Login Component UI",
            "Push today's code changes to GitHub"
          ]
        }
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Gemini API call failed');
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('Empty response from AI engine');

        const parsed = JSON.parse(textResponse);
        if (!parsed.tasks || parsed.tasks.length < 3) {
            throw new Error('Malformed JSON received from AI');
        }

        // Remove old tasks for today to prevent duplicates if regenerating
        tasks = tasks.filter(t => !(t.category === category && t.date === todayStr));

        // Add today's generated tasks
        parsed.tasks.forEach(title => {
            tasks.push({
                id: (Date.now() + Math.random()).toString(),
                category: category,
                title: title.trim(),
                completed: false,
                completedAt: null,
                notes: '',
                date: todayStr
            });
        });

        await saveQuests();

    } catch (error) {
        console.error('AI Quest Generation failed, utilizing fallbacks:', error);
        generateFallbackQuests(category, level, todayStr);
        await saveQuests();
    } finally {
        isGeneratingQuests = false;
        if (loader) loader.style.display = 'none';
        render();
        if (activeCategory === category) openQuestModal(category);
    }
}

function generateFallbackQuests(category, level, dateStr) {
    // Clear today's quests in this category
    tasks = tasks.filter(t => !(t.category === category && t.date === dateStr));

    const defaults = DEFAULT_QUESTS[category]?.[level] || DEFAULT_QUESTS[category]?.['Beginner'];
    defaults.forEach(title => {
        tasks.push({
            id: (Date.now() + Math.random()).toString(),
            category: category,
            title: title,
            completed: false,
            completedAt: null,
            notes: '',
            date: dateStr
        });
    });
}

/* ===================== RESET & SCHEDULER LOGIC ===================== */
async function checkDailyQuestReset() {
    const todayStr = getTodayDateStr();
    
    // Check if we already have quests generated for today
    const categories = ['tech', 'piano', 'music'];
    let needsGeneration = false;

    categories.forEach(cat => {
        const todayQuests = tasks.filter(t => t.category === cat && t.date === todayStr);
        if (todayQuests.length === 0) {
            needsGeneration = true;
        }
    });

    if (needsGeneration) {
        console.log('🌅 New day detected. Generating today\'s quests...');
        // Generate quests for all categories
        for (const cat of categories) {
            const todayQuests = tasks.filter(t => t.category === cat && t.date === todayStr);
            if (todayQuests.length === 0) {
                await generateDailyQuests(cat);
            }
        }
    }
}

/* ===================== RPG PROGRESSION ENGINE ===================== */
function calculateProgression() {
    let totalXp = 0;
    let totalBubblesCompletedCount = 0;
    
    // 100 XP per completed task
    const completedTasks = tasks.filter(t => t.completed);
    totalXp += completedTasks.length * 100;

    // Group tasks by date & category to reward 300 XP completion bonus
    const completionsByDay = {};
    
    tasks.forEach(t => {
        const key = `${t.date}_${t.category}`;
        if (!completionsByDay[key]) {
            completionsByDay[key] = { total: 0, completed: 0 };
        }
        completionsByDay[key].total++;
        if (t.completed) completionsByDay[key].completed++;
    });

    // Award bonus
    Object.values(completionsByDay).forEach(stat => {
        if (stat.total === 3 && stat.completed === 3) {
            totalXp += 300;
            totalBubblesCompletedCount++;
        }
    });

    // Level formula: Level = Math.floor(XP / 1000) + 1
    const level = Math.floor(totalXp / 1000) + 1;
    const nextLevelXpThreshold = level * 1000;
    const currentLevelBaseXp = (level - 1) * 1000;
    const xpEarnedInCurrentLevel = totalXp - currentLevelBaseXp;
    
    const xpPercent = Math.min(Math.floor((xpEarnedInCurrentLevel / 1000) * 100), 100);

    return {
        xp: totalXp,
        level: level,
        xpProgress: xpEarnedInCurrentLevel,
        xpPercent: xpPercent,
        bubblesCompleted: totalBubblesCompletedCount,
        completedCount: completedTasks.length
    };
}

/* ===================== RENDER LAYOUT & VIEWS ===================== */
function render() {
    renderDashboard();
    renderAnalytics();
    renderSettings();
}

function renderDashboard() {
    const todayStr = getTodayDateStr();
    const categories = ['tech', 'piano', 'music'];
    
    let totalTasksToday = 0;
    let completedTasksToday = 0;
    let completedBubblesToday = 0;

    categories.forEach(cat => {
        const todayQuests = tasks.filter(t => t.category === cat && t.date === todayStr);
        const completedQuests = todayQuests.filter(t => t.completed);
        
        totalTasksToday += todayQuests.length;
        completedTasksToday += completedQuests.length;

        // Render Focus & Stats under Bubbles
        let focusText = 'None';
        if (cat === 'tech') focusText = questSettings.techFocus;
        if (cat === 'piano') focusText = questSettings.pianoFocus;
        if (cat === 'music') focusText = questSettings.musicFocus;

        $(`#focus-${cat}`).textContent = focusText || 'Define Focus';
        $(`#stats-${cat}`).textContent = `${completedQuests.length}/3 Completed`;

        // Calculate progress ring circle
        const ring = $(`#ring-${cat}`);
        const bubbleEl = $(`#bubble-${cat}`);
        
        if (ring) {
            const ratio = todayQuests.length > 0 ? (completedQuests.length / todayQuests.length) : 0;
            const circumference = 515.22; // 2 * PI * 82
            const strokeDashoffset = circumference - (ratio * circumference);
            ring.style.strokeDashoffset = strokeDashoffset;
        }

        // Completion indicator
        if (todayQuests.length === 3 && completedQuests.length === 3) {
            bubbleEl.classList.add('completed');
            completedBubblesToday++;
        } else {
            bubbleEl.classList.remove('completed');
        }
    });

    // Update Overall daily stats
    const progressPercent = totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0;
    $('#overallProgressText').textContent = `${progressPercent}%`;
    $('#overallProgressBar').style.width = `${progressPercent}%`;
    $('#dailyQuestsStatus').textContent = `${completedTasksToday} of ${totalTasksToday} Quests Cleared`;
    $('#dailyBubblesStatus').textContent = `${completedBubblesToday} of 3 Bubbles Completed`;
}

function renderAnalytics() {
    const prog = calculateProgression();
    
    $('#rpgLevel').textContent = prog.level;
    $('#rpgXpText').textContent = `${prog.xpProgress} / 1000 XP`;
    $('#rpgXpPercent').textContent = `${prog.xpPercent}%`;
    $('#rpgXpBar').style.width = `${prog.xpPercent}%`;

    // Set metrics
    $('#statTotalCompleted').textContent = prog.completedCount;
    $('#statTotalBubbles').textContent = prog.bubblesCompleted;

    // Weekly completion rate calculation
    const weeklyRate = calculateRateForPastDays(7);
    $('#statWeeklyRate').textContent = `${weeklyRate}%`;

    // Monthly completion rate calculation
    const monthlyRate = calculateRateForPastDays(30);
    $('#statMonthlyRate').textContent = `${monthlyRate}%`;

    // Render Weekly Bar Graph
    renderWeeklyChart();

    // Render Category Balance Graph
    renderCategoryBalanceChart();

    // Render Recent Completed Quest Logs
    renderHistoryLog();
}

function calculateRateForPastDays(daysCount) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysCount);
    cutoffDate.setHours(0, 0, 0, 0);

    const relevantTasks = tasks.filter(t => {
        const itemDate = new Date(t.date);
        return itemDate >= cutoffDate;
    });

    if (relevantTasks.length === 0) return 0;
    const completedCount = relevantTasks.filter(t => t.completed).length;
    return Math.round((completedCount / relevantTasks.length) * 100);
}

function renderWeeklyChart() {
    const chartContainer = $('#weeklyChart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get last 7 days dates
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push({
            dateStr: d.toLocaleDateString('en-CA'), // YYYY-MM-DD
            dayLabel: weekdays[d.getDay()]
        });
    }

    dates.forEach(dayInfo => {
        const dayTasks = tasks.filter(t => t.date === dayInfo.dateStr);
        const completed = dayTasks.filter(t => t.completed).length;
        const total = dayTasks.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        const barWrap = document.createElement('div');
        barWrap.className = 'chart-bar-wrap';
        
        barWrap.innerHTML = `
            <div class="chart-bar" style="height: ${pct}%">
                <span class="chart-bar-val">${completed}/${total}</span>
            </div>
            <span class="chart-label">${dayInfo.dayLabel}</span>
        `;
        chartContainer.appendChild(barWrap);
    });
}

function renderCategoryBalanceChart() {
    const chartContainer = $('#categoryBalanceChart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const categories = [
        { key: 'tech', label: '💻 Tech', color: 'var(--tech-color)' },
        { key: 'piano', label: '🎹 Piano', color: 'var(--piano-color)' },
        { key: 'music', label: '🎛️ Music Production', color: 'var(--music-color)' }
    ];

    categories.forEach(cat => {
        const catQuests = tasks.filter(t => t.category === cat.key);
        const completed = catQuests.filter(t => t.completed).length;
        const total = catQuests.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        const row = document.createElement('div');
        row.className = `balance-row ${cat.key}-row`;
        
        row.innerHTML = `
            <div class="balance-info">
                <span>${cat.label}</span>
                <span>${completed}/${total} (${pct}%)</span>
            </div>
            <div class="balance-track">
                <div class="balance-fill" style="width: ${pct}%; background-color: ${cat.color}"></div>
            </div>
        `;
        chartContainer.appendChild(row);
    });
}

function renderHistoryLog() {
    const logContainer = $('#historyLog');
    if (!logContainer) return;
    logContainer.innerHTML = '';

    const completedQuests = tasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 15);

    if (completedQuests.length === 0) {
        logContainer.innerHTML = '<p class="empty-state">No completed quests logged yet. Go crush today\'s tasks!</p>';
        return;
    }

    completedQuests.forEach(t => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const dateString = new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + t.date;
        const categoryBadgeText = t.category === 'music' ? 'Music Prod' : t.category;

        item.innerHTML = `
            <div class="history-details">
                <span class="history-title">${t.title}</span>
                <span class="history-meta">${dateString} ${t.notes ? `| Notes: "${t.notes}"` : ''}</span>
            </div>
            <span class="history-badge ${t.category}">${categoryBadgeText}</span>
        `;
        logContainer.appendChild(item);
    });
}

function renderSettings() {
    // Handled on load/saving mostly.
}

function populateSettingsFields() {
    $('#techGoals').value = questSettings.techGoals || '';
    $('#techLevel').value = questSettings.techLevel || 'Beginner';
    $('#techFocus').value = questSettings.techFocus || '';

    $('#pianoGoals').value = questSettings.pianoGoals || '';
    $('#pianoLevel').value = questSettings.pianoLevel || 'Beginner';
    $('#pianoFocus').value = questSettings.pianoFocus || '';

    $('#musicGoals').value = questSettings.musicGoals || '';
    $('#musicLevel').value = questSettings.musicLevel || 'Beginner';
    $('#musicFocus').value = questSettings.musicFocus || '';

    // Load key if exists
    const key = localStorage.getItem('lifesystem_gemini_api_key') || '';
    $('#settingsApiKey').value = key;
}

/* ===================== EXPANDED BUBBLE DETAIL VIEW ===================== */
function openQuestModal(category) {
    activeCategory = category;
    const todayStr = getTodayDateStr();
    
    // Configure header based on category
    let title = 'Tech Quests';
    let icon = '💻';
    let focus = questSettings.techFocus;

    if (category === 'piano') {
        title = 'Piano Quests';
        icon = '🎹';
        focus = questSettings.pianoFocus;
    } else if (category === 'music') {
        title = 'Music Production Quests';
        icon = '🎛️';
        focus = questSettings.musicFocus;
    }

    $('#questModalTitle').textContent = title;
    $('#questModalIcon').textContent = icon;
    $('#questModalFocus').textContent = focus || 'None';
    $('#questModalDate').textContent = `TODAY: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    // Filter quests
    const todayQuests = tasks.filter(t => t.category === category && t.date === todayStr);

    // Render quest list items
    const listContainer = $('#questsList');
    listContainer.innerHTML = '';

    if (todayQuests.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No quests loaded. Generate below to start!</p>';
        $('#categoryCompleteBanner').style.display = 'none';
    } else {
        todayQuests.forEach((quest, index) => {
            const item = document.createElement('div');
            item.className = `quest-item ${quest.completed ? 'completed' : ''}`;
            
            item.innerHTML = `
                <div class="quest-main-row">
                    <label class="quest-checkbox-label ${quest.completed ? 'line-through' : ''}">
                        <input type="checkbox" class="quest-checkbox" data-id="${quest.id}" ${quest.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        ${quest.title}
                    </label>
                    <button class="quest-notes-toggle" data-id="${quest.id}">📝 Notes</button>
                </div>
                <div class="quest-notes-area" id="notes-area-${quest.id}" style="${quest.notes ? '' : 'display: none;'}">
                    <textarea class="quest-notes-input" placeholder="Type a note about what you accomplished..." data-id="${quest.id}">${quest.notes || ''}</textarea>
                    ${quest.completedAt ? `<span class="quest-completed-timestamp">Done at ${new Date(quest.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                </div>
            `;
            listContainer.appendChild(item);
        });

        // Check category completion banner status
        const isDone = todayQuests.every(q => q.completed);
        const banner = $('#categoryCompleteBanner');
        if (isDone && todayQuests.length === 3) {
            $('#categoryCompleteTitle').textContent = `✅ Daily ${category === 'music' ? 'Music Prod' : category.charAt(0).toUpperCase() + category.slice(1)} Quest Complete!`;
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }

    // Hide manual edit form if it was open
    $('#manualEditForm').style.display = 'none';

    // Show modal
    $('#questModal').classList.add('active');
}

function closeQuestModal() {
    $('#questModal').classList.remove('active');
    activeCategory = null;
    render();
}

/* ===================== MOTIVATION POPUP SYSTEM ===================== */
function checkDailyQuotePopup() {
    const lastQuoteStr = localStorage.getItem('lifesystem_last_quote_date');
    const todayStr = getTodayDateStr();

    if (lastQuoteStr !== todayStr) {
        // First load of the day, show motivational quotes
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        const quote = MOTIVATIONAL_QUOTES[randomIndex];

        $('#quoteText').textContent = `"${quote.text}"`;
        $('#quoteAuthor').textContent = `— ${quote.author}`;
        $('#quoteModal').classList.add('active');

        localStorage.setItem('lifesystem_last_quote_date', todayStr);
    }
}

/* ===================== ONBOARDING SYSTEM ===================== */
function showOnboarding() {
    $('#onboardingModal').classList.add('active');
}

/* ===================== UTILITY FUNCTIONS ===================== */
function getTodayDateStr() {
    return new Date().toLocaleDateString('en-CA'); // Outputs YYYY-MM-DD local
}

/* ===================== EVENT HANDLERS & BINDINGS ===================== */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialise Auth and Firebase
    await initializeFirebase();
    initAuth();

    // 2. Tab Navigation
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            if (!targetTab) return;

            // Update tab button classes
            $$('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Toggle active views
            $$('.tab-view').forEach(view => view.classList.remove('active'));
            $(`#${targetTab}View`).classList.add('active');
            
            activeTab = targetTab;
            render();
        });
    });

    // 3. Interactive Skill Bubbles click handler
    $$('.skill-bubble').forEach(bubble => {
        bubble.addEventListener('click', () => {
            const category = bubble.getAttribute('data-category');
            openQuestModal(category);
        });
    });

    // 4. Modal Close events
    $('#closeQuestModalBtn').addEventListener('click', closeQuestModal);
    $('#questModal').addEventListener('click', (e) => {
        if (e.target === $('#questModal')) closeQuestModal();
    });

    // 5. Quest Completed Checkbox Toggle
    $('#questsList').addEventListener('change', async (e) => {
        if (e.target.classList.contains('quest-checkbox')) {
            const id = e.target.getAttribute('data-id');
            const checked = e.target.checked;
            
            const quest = tasks.find(t => t.id === id);
            if (quest) {
                quest.completed = checked;
                quest.completedAt = checked ? new Date().toISOString() : null;
                
                await saveQuests();
                
                // Redraw Quest list to trigger completion status
                openQuestModal(activeCategory);
                render();
            }
        }
    });

    // 6. Toggle Notes Textareas
    $('#questsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('quest-notes-toggle')) {
            const id = e.target.getAttribute('data-id');
            const notesArea = $(`#notes-area-${id}`);
            if (notesArea) {
                notesArea.style.display = notesArea.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    // 7. Save Quest Notes on change
    $('#questsList').addEventListener('input', async (e) => {
        if (e.target.classList.contains('quest-notes-input')) {
            const id = e.target.getAttribute('data-id');
            const text = e.target.value;
            
            const quest = tasks.find(t => t.id === id);
            if (quest) {
                quest.notes = text;
                // Defer saving notes until blur or timeout to prevent excessive database calling
            }
        }
    });

    $('#questsList').addEventListener('focusout', async (e) => {
        if (e.target.classList.contains('quest-notes-input')) {
            await saveQuests();
        }
    });

    // 8. Regenerate Quests through AI
    $('#aiRegenerateBtn').addEventListener('click', async () => {
        if (activeCategory) {
            await generateDailyQuests(activeCategory, true);
        }
    });

    // 9. Manual Quests Edit Trigger
    $('#manualEditBtn').addEventListener('click', () => {
        const todayStr = getTodayDateStr();
        const todayQuests = tasks.filter(t => t.category === activeCategory && t.date === todayStr);

        $('#manualQuest0').value = todayQuests[0]?.title || '';
        $('#manualQuest1').value = todayQuests[1]?.title || '';
        $('#manualQuest2').value = todayQuests[2]?.title || '';

        $('#manualEditForm').style.display = 'block';
    });

    $('#cancelManualQuestsBtn').addEventListener('click', () => {
        $('#manualEditForm').style.display = 'none';
    });

    $('#saveManualQuestsBtn').addEventListener('click', async () => {
        const todayStr = getTodayDateStr();
        const q0 = $('#manualQuest0').value.trim();
        const q1 = $('#manualQuest1').value.trim();
        const q2 = $('#manualQuest2').value.trim();

        if (!q0 || !q1 || !q2) {
            alert('Please fill out all 3 quests.');
            return;
        }

        // Clean out and rewrite
        tasks = tasks.filter(t => !(t.category === activeCategory && t.date === todayStr));
        
        const inputQuests = [q0, q1, q2];
        inputQuests.forEach(title => {
            tasks.push({
                id: (Date.now() + Math.random()).toString(),
                category: activeCategory,
                title: title,
                completed: false,
                completedAt: null,
                notes: '',
                date: todayStr
            });
        });

        await saveQuests();
        $('#manualEditForm').style.display = 'none';
        openQuestModal(activeCategory);
        render();
    });

    // 10. Save Settings Form
    $('#settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        questSettings.techGoals = $('#techGoals').value.trim();
        questSettings.techLevel = $('#techLevel').value;
        questSettings.techFocus = $('#techFocus').value.trim();

        questSettings.pianoGoals = $('#pianoGoals').value.trim();
        questSettings.pianoLevel = $('#pianoLevel').value;
        questSettings.pianoFocus = $('#pianoFocus').value.trim();

        questSettings.musicGoals = $('#musicGoals').value.trim();
        questSettings.musicLevel = $('#musicLevel').value;
        questSettings.musicFocus = $('#musicFocus').value.trim();

        await saveQuestSettings();
        alert('Configuration saved successfully!');
        render();
    });

    // 11. Save API Key separately
    $('#saveApiKeyBtn').addEventListener('click', () => {
        const key = $('#settingsApiKey').value.trim();
        localStorage.setItem('lifesystem_gemini_api_key', key);
        alert('API Key updated successfully!');
    });

    // 12. Trigger Login/Signup Modal
    $('#triggerAuthModalBtn').addEventListener('click', () => {
        showAuthModal();
    });

    // 13. Motivational Quote modal close
    $('#closeQuoteBtn').addEventListener('click', () => {
        $('#quoteModal').classList.remove('active');
    });
    $('#quoteAcknowledgeBtn').addEventListener('click', () => {
        $('#quoteModal').classList.remove('active');
    });

    // 14. Onboarding modal close & triggers
    $('#onboardingSetupBtn').addEventListener('click', () => {
        const key = $('#onboardingApiKey').value.trim();
        if (key) {
            localStorage.setItem('lifesystem_gemini_api_key', key);
            $('#settingsApiKey').value = key;
        }
        $('#onboardingModal').classList.remove('active');
        // Switch to settings tab automatically
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        $('[data-tab="settings"]').classList.add('active');
        $$('.tab-view').forEach(view => view.classList.remove('active'));
        $('#settingsView').classList.add('active');
        activeTab = 'settings';
    });

    $('#onboardingGuestBtn').addEventListener('click', () => {
        $('#onboardingModal').classList.remove('active');
        // Just render default
        render();
    });
});
