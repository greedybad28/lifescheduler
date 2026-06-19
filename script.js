/* ===================== DOM SELECTOR HELPER ===================== */
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

/* ===================== STATE VARIABLES ===================== */
let db = null;
let currentUserId = 'anonymous_user';
let useFirebase = false;
let isGuestModeActive = false;

// Core data models
let tasks = []; // Array of quests: { id, category, title, status ('pending'|'in_progress'|'completed'|'skipped'|'carried_forward'), date, completedAt, notes, parentTaskId }
let projects = []; // Array of active projects: { id, name, category, status ('active'|'archived'), currentStage, nextMilestone }
let suggestions = { date: '', tech: [], piano: [], music: [] }; // Today's AI Suggestions
let chatHistory = []; // Conversation history: { role: 'user'|'assistant', text, timestamp }
let narrativeProfile = { profileText: 'No behavioral patterns analyzed yet. Keep completing quests to build your profile, then run the weekly reflection job.', lastUpdated: 'Never' };

let questSettings = {
    techGoals: 'Learn React, Build projects, Practice DSA',
    techLevel: 'Beginner',
    techFocus: 'React Fundamentals',
    pianoGoals: 'Improve Technique, Learn classical pieces, Sight reading',
    pianoLevel: 'Beginner',
    pianoFocus: 'Sight Reading',
    musicGoals: 'Learn Ableton, Improve mixing, Finish tracks',
    musicLevel: 'Beginner',
    musicFocus: 'Ableton Workflow',
    onboardingCompleted: false
};

let activeTab = 'dashboard';
let activeCategory = null;
let modalSubTab = 'quests'; // 'quests' or 'suggestions'
let isGeneratingQuests = false;
let isProcessingChat = false;

/* ===================== DEFAULT QUESTS FALLBACK ===================== */
const DEFAULT_QUESTS = {
    tech: {
        Beginner: [
            'Watch React Lesson 12',
            'Build Login Component UI',
            'Read 5 pages of React Documentation'
        ],
        Intermediate: [
            'Build a simple React form with hooks',
            'Solve one LeetCode medium coding problem',
            'Outline a Django model structure for a blog app'
        ],
        Advanced: [
            'Refactor state management in your current project',
            'Debug an open-source issue on GitHub',
            'Write unit tests for a utility service'
        ]
    },
    piano: {
        Beginner: [
            'Practice Scales for 15 Minutes',
            'Learn 8 New Bars of a simple piece',
            'Sight read 1 Page of easy music'
        ],
        Intermediate: [
            'Practice scales and arpeggios in G and D Major',
            'Learn 12 new bars of a classical piece',
            'Sight read 2 pages of intermediate sheet music'
        ],
        Advanced: [
            'Refine phrasing in a complex section for 30 minutes',
            'Improvise over a standard 12-bar blues in 3 keys',
            'Sight read a challenging romantic piece'
        ]
    },
    music: {
        Beginner: [
            'Complete Ableton Lesson on automation',
            'Recreate a simple drum pattern',
            'Analyze a song arrangement of a pop track'
        ],
        Intermediate: [
            'Recreate a complex reference track drum beat',
            'Practice EQ and compression balance in a current mix',
            'Complete a lesson on advanced delay mapping'
        ],
        Advanced: [
            'Design a custom synth patch from scratch',
            'Apply parallel compression to vocals in your active track',
            'Spend 45 minutes structuring arrangement of a project'
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
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" }
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

/* ===================== DATA LOAD/SAVE MANAGEMENT ===================== */
async function loadData() {
    toggleLoading(true);
    try {
        if (useFirebase && db) {
            // 1. Load Quests/Tasks
            const tasksSnapshot = await db.collection('users').doc(currentUserId).collection('tasks').get();
            tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Load Active Projects
            const projectsSnapshot = await db.collection('users').doc(currentUserId).collection('projects').get();
            projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 3. Load Quest Settings
            const settingsDoc = await db.collection('users').doc(currentUserId).collection('data').doc('questSettings').get();
            if (settingsDoc.exists) {
                questSettings = { ...questSettings, ...settingsDoc.data() };
            }

            // 4. Load AI Suggestions
            const suggestionsDoc = await db.collection('users').doc(currentUserId).collection('data').doc('suggestions').get();
            if (suggestionsDoc.exists) {
                suggestions = { ...suggestions, ...suggestionsDoc.data() };
            }

            // 5. Load Narrative Profile
            const profileDoc = await db.collection('users').doc(currentUserId).collection('data').doc('narrativeProfile').get();
            if (profileDoc.exists) {
                narrativeProfile = { ...narrativeProfile, ...profileDoc.data() };
            }

            // 6. Load Chat History
            const chatDoc = await db.collection('users').doc(currentUserId).collection('data').doc('chatHistory').get();
            if (chatDoc.exists) {
                chatHistory = chatDoc.data().messages || [];
            }
            
            updateSyncBadge('Synced', true);
        } else {
            // Load LocalStorage Fallback
            tasks = JSON.parse(localStorage.getItem('lifesystem_quests')) || [];
            projects = JSON.parse(localStorage.getItem('lifesystem_projects')) || [];
            questSettings = JSON.parse(localStorage.getItem('lifesystem_quest_settings')) || questSettings;
            suggestions = JSON.parse(localStorage.getItem('lifesystem_suggestions')) || { date: '', tech: [], piano: [], music: [] };
            narrativeProfile = JSON.parse(localStorage.getItem('lifesystem_narrative_profile')) || narrativeProfile;
            chatHistory = JSON.parse(localStorage.getItem('lifesystem_chat_history')) || [];
            
            updateSyncBadge('Local Storage', false);
        }

        // Apply settings to form inputs
        populateSettingsFields();

        // Check if day changed & suggestions need refresh
        await checkDailySuggestionsReset();

        // Trigger onboarding modal if not completed
        if (!questSettings.onboardingCompleted) {
            showOnboarding();
        }

    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        toggleLoading(false);
    }
}

async function saveQuests() {
    try {
        localStorage.setItem('lifesystem_quests', JSON.stringify(tasks));
        if (useFirebase && db) {
            // Perform batch write or individual writes
            await Promise.all(tasks.map(t => {
                const { id, ...data } = t;
                return db.collection('users').doc(currentUserId).collection('tasks').doc(id).set(data);
            }));
        }
    } catch (error) {
        console.error('Error saving quests:', error);
    }
}

async function saveProjects() {
    try {
        localStorage.setItem('lifesystem_projects', JSON.stringify(projects));
        if (useFirebase && db) {
            // Sync all active projects
            await Promise.all(projects.map(p => {
                const { id, ...data } = p;
                return db.collection('users').doc(currentUserId).collection('projects').doc(id).set(data);
            }));
        }
    } catch (error) {
        console.error('Error saving projects:', error);
    }
}

async function saveQuestSettings() {
    try {
        localStorage.setItem('lifesystem_quest_settings', JSON.stringify(questSettings));
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('questSettings').set(questSettings);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

async function saveSuggestions() {
    try {
        localStorage.setItem('lifesystem_suggestions', JSON.stringify(suggestions));
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('suggestions').set(suggestions);
        }
    } catch (error) {
        console.error('Error saving suggestions:', error);
    }
}

async function saveNarrativeProfile() {
    try {
        localStorage.setItem('lifesystem_narrative_profile', JSON.stringify(narrativeProfile));
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('narrativeProfile').set(narrativeProfile);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
    }
}

async function saveChatHistory() {
    try {
        localStorage.setItem('lifesystem_chat_history', JSON.stringify(chatHistory));
        if (useFirebase && db) {
            await db.collection('users').doc(currentUserId).collection('data').doc('chatHistory').set({ messages: chatHistory });
        }
    } catch (error) {
        console.error('Error saving chat history:', error);
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

    // Form sign in
    $('#authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = $('#authUsername').value.trim().toLowerCase();
        const password = $('#authPassword').value;
        const errorEl = $('#authError');
        
        errorEl.style.display = 'none';
        
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

    // Toggle Link (Login <-> Signup)
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

    // Guest Bypass
    $('#authGuestBtn').addEventListener('click', () => {
        isGuestModeActive = true;
        useFirebase = false;
        $('#authModal').classList.remove('active');
        updateSyncBadge('Local Storage', false);
        loadData().then(() => render());
    });

    // Sign out trigger
    $('#signOutBtn').addEventListener('click', async () => {
        try {
            isGuestModeActive = false;
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
}

function showAuthModal() {
    $('#authModal').classList.add('active');
    $('#authForm').reset();
    $('#authError').style.display = 'none';
    authMode = 'login';
}

/* ===================== LAYER 1: STRUCTURED STATISTICS ENGINE ===================== */
function calculateLayer1Stats() {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const skippedTasks = tasks.filter(t => t.status === 'skipped');
    
    // Streaks calculation (days with at least 1 completed task)
    let streakCount = 0;
    const completedDates = new Set(completedTasks.map(t => t.date));
    const checkDate = new Date();
    
    // Check backwards
    while (true) {
        const dateStr = checkDate.toLocaleDateString('en-CA');
        if (completedDates.has(dateStr)) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Check if yesterday had it (to allow keeping streak active today)
            const todayStr = new Date().toLocaleDateString('en-CA');
            if (dateStr === todayStr) {
                checkDate.setDate(checkDate.getDate() - 1); // skip today check and continue to yesterday
            } else {
                break;
            }
        }
    }

    // Category completion stats
    const totalTech = tasks.filter(t => t.category === 'tech').length;
    const completedTech = tasks.filter(t => t.category === 'tech' && t.status === 'completed').length;
    const techRate = totalTech > 0 ? Math.round((completedTech / totalTech) * 100) : 0;

    const totalPiano = tasks.filter(t => t.category === 'piano').length;
    const completedPiano = tasks.filter(t => t.category === 'piano' && t.status === 'completed').length;
    const pianoRate = totalPiano > 0 ? Math.round((completedPiano / totalPiano) * 100) : 0;

    const totalMusic = tasks.filter(t => t.category === 'music').length;
    const completedMusic = tasks.filter(t => t.category === 'music' && t.status === 'completed').length;
    const musicRate = totalMusic > 0 ? Math.round((completedMusic / totalMusic) * 100) : 0;

    // Completed / Skipped last 30 days
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const dateLimitStr = cutoff30.toLocaleDateString('en-CA');

    const completed30 = completedTasks.filter(t => t.date >= dateLimitStr).length;
    const skipped30 = skippedTasks.filter(t => t.date >= dateLimitStr).length;

    // Top topics based on simple word count parsing of titles
    const findFavTopic = (taskList) => {
        if (taskList.length === 0) return 'None yet';
        const counts = {};
        const ignoreList = ['and', 'the', 'for', 'with', 'your', 'about', 'lesson', 'practice', 'read', 'learn', 'minutes', 'page', 'bars', 'study', 'build', 'complete'];
        
        taskList.forEach(t => {
            const words = t.title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
            words.forEach(w => {
                if (w.length > 2 && !ignoreList.includes(w)) {
                    counts[w] = (counts[w] || 0) + 1;
                }
            });
        });
        
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1) : 'General';
    };

    return {
        techRate,
        pianoRate,
        musicRate,
        streak: streakCount,
        completed30,
        skipped30,
        favTopic: findFavTopic(completedTasks),
        skippedTopic: findFavTopic(skippedTasks)
    };
}

/* ===================== LAYER 2: NARRATIVE PROFILE / WEEKLY REFLECTION JOB ===================== */
async function runWeeklyReflectionJob() {
    const apiKey = localStorage.getItem('lifesystem_gemini_api_key');
    if (!apiKey) {
        alert('Please save your Gemini API Key in Settings to run the reflection coach analysis!');
        return;
    }

    toggleLoading(true);
    try {
        const stats = calculateLayer1Stats();
        
        // Fetch tasks of past 30 days
        const cutoff30 = new Date();
        cutoff30.setDate(cutoff30.getDate() - 30);
        const limitStr = cutoff30.toLocaleDateString('en-CA');
        const tasks30Days = tasks.filter(t => t.date >= limitStr);

        const summaryData = tasks30Days.map(t => `- [${t.category.toUpperCase()}] "${t.title}" -> status: ${t.status} ${t.notes ? `(notes: ${t.notes})` : ''}`).join('\n');

        const systemPrompt = `
        You are the AI Reflection Architect for the Bubble Quest gamified RPG operating system.
        Your job is to analyze the user's logged progress history from the last 30 days and write a new "Narrative Profile".
        
        Write a short, compact, analytical, and highly personalized paragraph (maximum 4 sentences) describing the user's habits, learning style, favorite subjects, skipped topics, and task duration preferences.
        Do not output list items, timeline logs, or dates. Rebuild a fresh stable profile summary.
        Refer to the user in third person or address them directly. Be constructive and specific.
        
        CRITICAL RULE: Observed behavior outweighs stated intentions. If the user stated during onboarding that they want to focus on X, but they consistently complete tasks in Y, adapt the profile to highlight Y. Strive to describe who they are becoming based on their actual completed actions.
        
        Example Output:
        "Remo consistently completes hands-on coding tasks and prefers practical project work over theory. Piano practice is most successful when tasks are short and measurable. Music production engagement increases when tasks involve creativity rather than technical study. Tasks longer than 45 minutes are often postponed."
        `;

        const promptText = `
        Recent 30-Day Logs:
        ${summaryData || 'No logged activities.'}
        
        Layer 1 Statistics:
        - Tech Rate: ${stats.techRate}%
        - Piano Rate: ${stats.pianoRate}%
        - Music Rate: ${stats.musicRate}%
        - Top Completed Subject: ${stats.favTopic}
        - Top Skipped Subject: ${stats.skippedTopic}
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        if (!response.ok) throw new Error('Gemini API call failed');
        
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textResponse) {
            narrativeProfile.profileText = textResponse.trim();
            narrativeProfile.lastUpdated = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            await saveNarrativeProfile();
            alert('Coach Narrative Profile updated successfully!');
            render();
        } else {
            throw new Error('Empty coach reflection response');
        }

    } catch (error) {
        console.error('Reflection job failed:', error);
        alert(`Failed to complete reflection analysis: ${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

/* ===================== HELPER JSON PARSER FOR AI RESPONSES ===================== */
function cleanAndParseJson(text) {
    if (!text) throw new Error("Empty JSON response");
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanText);
}

/* ===================== AI DAILY QUEST SUGGESTIONS GENERATOR ===================== */
async function generateAllDailySuggestions(force = false) {
    if (isGeneratingQuests) return;
    isGeneratingQuests = true;

    // Show spinner in modal
    const loader = $('#aiModalLoader');
    if (loader) {
        $('#aiModalLoaderText').textContent = 'Consulting the Quest Master for suggestions...';
        loader.style.display = 'flex';
    }

    const todayStr = getTodayDateStr();
    const apiKey = localStorage.getItem('lifesystem_gemini_api_key');
    
    // Fallback if no API Key
    if (!apiKey) {
        console.warn('⚠️ Gemini key missing. Generating offline fallback suggestions.');
        generateFallbackSuggestions(todayStr);
        await saveSuggestions();
        isGeneratingQuests = false;
        if (loader) loader.style.display = 'none';
        render();
        if (activeCategory) openQuestModal(activeCategory);
        return;
    }

    try {
        const stats = calculateLayer1Stats();
        
        // Scan for unfinished 'in_progress' tasks from the last 3 days
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 3);
        const limitStr = limitDate.toLocaleDateString('en-CA');
        const inProgressQuests = tasks.filter(t => t.status === 'in_progress' && t.date >= limitStr);

        // Fetch active projects (Layer 4)
        const activeProjsStr = projects
            .filter(p => p.status === 'active')
            .map(p => `- [${p.category.toUpperCase()}] Project: "${p.name}", Stage: "${p.currentStage}", Milestone: "${p.nextMilestone}"`)
            .join('\n');

        // Compile prompt context
        const promptText = `
        Goals:
        - Tech: "${questSettings.techGoals}"
        - Piano: "${questSettings.pianoGoals}"
        - Music Prod: "${questSettings.musicGoals}"

        Monthly Focuses:
        - Tech Focus: "${questSettings.techFocus}"
        - Piano Focus: "${questSettings.pianoFocus}"
        - Music Focus: "${questSettings.musicFocus}"

        Current Skill Levels:
        - Tech: ${questSettings.techLevel}
        - Piano: ${questSettings.pianoLevel}
        - Music: ${questSettings.musicLevel}

        Active Projects (Layer 4):
        ${activeProjsStr || 'None.'}

        Narrative Profile (Layer 2 User Profile):
        "${narrativeProfile.profileText}"

        Structured Stats (Layer 1):
        - Tech Rate: ${stats.techRate}%, Piano: ${stats.pianoRate}%, Music: ${stats.musicRate}%
        - Favorite Focus: ${stats.favTopic}, Often Skipped: ${stats.skippedTopic}

        Yesterday's Unfinished Tasks:
        ${inProgressQuests.length > 0 ? inProgressQuests.map(q => `- Category: ${q.category}, Task: "${q.title}"`).join('\n') : 'None.'}
        `;

        const systemPrompt = `
        You are the AI Quest Master for the Bubble Quest skill progression app.
        Your job is to generate exactly 3 daily suggested tasks for EACH of the three categories: "tech", "piano", and "music".
        
        Generate:
        - 3 suggested tasks for "tech"
        - 3 suggested tasks for "piano"
        - 3 suggested tasks for "music"

        Rules:
        1. Be extremely specific, actionable, and finishable in one sitting (15 to 60 minutes).
        2. Ensure they support the user's active projects milestones first. If a project is defined in that category, write tasks to build that project!
        3. If there are yesterday's unfinished tasks in a category, write a SEQUENTIAL CONTINUATION task for it today (e.g. if yesterday's task was "Learn bars 1-16 of piece", suggest "Practice bars 17-32 of piece" for today).
        4. Match the user's specified skill levels.
        5. Avoid repeating recently completed or skipped topics.
        
        Format your response in a single JSON block:
        {
          "tech": [
            "Suggested task 1 description",
            "Suggested task 2 description",
            "Suggested task 3 description"
          ],
          "piano": [
            "Suggested task 1 description",
            "Suggested task 2",
            "Suggested task 3"
          ],
          "music": [
            "Suggested task 1",
            "Suggested task 2",
            "Suggested task 3"
          ]
        }
        Do not wrap in markdown or any other tags.
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error('API Request failed');
        
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('No suggestions returned');

        const parsed = cleanAndParseJson(textResponse);
        suggestions.date = todayStr;
        suggestions.tech = parsed.tech || [];
        suggestions.piano = parsed.piano || [];
        suggestions.music = parsed.music || [];

        await saveSuggestions();

    } catch (error) {
        console.error('Quest generation failed, falling back:', error);
        generateFallbackSuggestions(todayStr);
        await saveSuggestions();
    } finally {
        isGeneratingQuests = false;
        if (loader) loader.style.display = 'none';
        render();
        if (activeCategory) openQuestModal(activeCategory);
    }
}

function generateFallbackSuggestions(dateStr) {
    suggestions.date = dateStr;
    suggestions.tech = DEFAULT_QUESTS.tech[questSettings.techLevel] || DEFAULT_QUESTS.tech.Beginner;
    suggestions.piano = DEFAULT_QUESTS.piano[questSettings.pianoLevel] || DEFAULT_QUESTS.piano.Beginner;
    suggestions.music = DEFAULT_QUESTS.music[questSettings.musicLevel] || DEFAULT_QUESTS.music.Beginner;
}

async function checkDailySuggestionsReset() {
    const todayStr = getTodayDateStr();
    if (suggestions.date !== todayStr) {
        console.log('🌅 New day detected. Fetching new daily AI suggestions...');
        await generateAllDailySuggestions();
    }
}

/* ===================== CHAT-BASED NATURAL LOGGING INTERFACE ===================== */
async function processChatCoach(messageText) {
    if (isProcessingChat) return;
    isProcessingChat = true;

    $('#chatLoader').style.display = 'block';

    const apiKey = localStorage.getItem('lifesystem_gemini_api_key');
    const todayStr = getTodayDateStr();

    if (!apiKey) {
        // Simple offline fallback
        if (!questSettings.onboardingCompleted) {
            if (messageText.toLowerCase().includes('complete') || messageText.toLowerCase().includes('skip')) {
                questSettings.onboardingCompleted = true;
                await saveQuestSettings();
                appendMessage('assistant', "Gemini API Key is missing, so I have bypassed the conversational onboarding and unlocked default fallback suggestions for you. Your dashboard is now open!");
                generateFallbackSuggestions(todayStr);
                await saveSuggestions();
                render();
            } else {
                appendMessage('assistant', "Offline Mode: Save a Gemini API Key in Settings to run the conversational AI onboarding! (Type 'complete' or 'skip' to bypass onboarding and unlock default offline suggestions).");
            }
        } else {
            appendMessage('assistant', `Offline Mode: I received your message: "${messageText}". Save a Gemini API Key in Settings to get conversational progress logging!`);
        }
        isProcessingChat = false;
        $('#chatLoader').style.display = 'none';
        return;
    }

    try {
        let systemPrompt = '';
        let promptText = '';
        
        if (!questSettings.onboardingCompleted) {
            // Conversational Onboarding Mode
            systemPrompt = `
            You are the Onboarding Coach for Bubble Quest, a gamified RPG skill progression app.
            Your goal is to conduct a short, friendly, and structured onboarding interview to gather:
            1. General (current life focus, goals for the next 6-12 months, what they feel stuck on).
            2. Tech background (known stacks, active projects, confidence level 1-10, what to learn next).
            3. Piano background (duration playing, current pieces, skills to improve).
            4. Music Production background (DAW used, songs completed, skills to improve).
            5. Time & Energy (hours per week, productive times, short tasks vs deep work preference).

            Evaluate the conversation history and the user's latest response. Ask relevant follow-up questions to fill in any missing details. Ask only 1 or 2 questions at a time to prevent user overload. Keep the tone friendly, encouraging, and supportive (max 3 sentences per response).

            If you have successfully gathered enough information to construct their initial profile, you MUST complete onboarding by returning a JSON response matching this exact structure:
            {
              "status": "complete",
              "reply": "Excellent! I have gathered enough information to create your starting profile and unlock your quest dashboard. Let's start growing!",
              "profile": {
                "focus": ["Web Development", "Piano Technique", "Ableton Workflow"],
                "skillLevels": {
                  "tech": "Beginner" | "Intermediate" | "Advanced",
                  "piano": "Beginner" | "Intermediate" | "Advanced",
                  "music": "Beginner" | "Intermediate" | "Advanced",
                  "techDetails": "Python: Intermediate, Django: Beginner...",
                  "pianoDetails": "Currently practicing scales...",
                  "musicDetails": "Ableton Live workflow..."
                },
                "activeProjects": [
                  { "name": "Archie", "category": "tech", "currentStage": "Database Design", "nextMilestone": "Create Notes Upload" }
                ],
                "preferredTaskLength": "20-45 Minutes",
                "learningStyle": "Prefers practical project-based tasks over theory."
              }
            }

            If onboarding is still in progress, return:
            {
              "status": "chatting",
              "reply": "Your next follow-up question(s)."
            }
            Do not output markdown block wraps. Only return pure JSON.
            `;
            
            promptText = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n') + `\nUSER: ${messageText}`;
        } else {
            // Normal logging mode
            const todayQuests = tasks.filter(t => t.date === todayStr);
            systemPrompt = `
            You are the AI Coach for Bubble Quest. The user wants to log progress.
            You must evaluate if the user's message matches any of today's active tasks.
            
            Today's Active Board Quests:
            ${todayQuests.map(q => `- ID: "${q.id}" | "${q.title}" (Status: ${q.status})`).join('\n')}

            Instruction:
            - If the user's input clearly indicates they worked on, finished, completed, or skipped one of today's tasks, you MUST invoke a status change action.
            - Status values can be:
              - "completed" (if they are done)
              - "in_progress" (if they practiced it, worked on it, or finished a part but the overall task is still active)
              - "skipped" (if they chose not to do it)
            - Notes should be a brief statement of what they completed or did.
            - Return a JSON object ONLY:
            {
              "action": "update_task_status",
              "taskId": "the-matching-task-id",
              "status": "completed" | "in_progress" | "skipped",
              "notes": "short description of achievement",
              "reply": "Encouraging RPG coach response acknowledging the accomplishment (max 2 sentences)."
            }
            - If the user's message is general discussion, a question, or does not match today's tasks, return:
            {
              "action": "chat",
              "reply": "Your conversational coach reply addressing their comment (max 2 sentences)."
            }
            Do not wrap the JSON output in markdown tags.
            `;
            
            promptText = messageText;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error('Coach fetch error');
        
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textResponse) {
            const result = cleanAndParseJson(textResponse);
            
            if (!questSettings.onboardingCompleted) {
                // Onboarding processing
                if (result.status === 'complete') {
                    // Update settings
                    questSettings.onboardingCompleted = true;
                    questSettings.techLevel = result.profile.skillLevels.tech || 'Beginner';
                    questSettings.pianoLevel = result.profile.skillLevels.piano || 'Beginner';
                    questSettings.musicLevel = result.profile.skillLevels.music || 'Beginner';
                    
                    questSettings.techFocus = result.profile.focus[0] || 'React Fundamentals';
                    questSettings.pianoFocus = result.profile.focus[1] || 'Sight Reading';
                    questSettings.musicFocus = result.profile.focus[2] || 'Ableton Workflow';
                    
                    questSettings.techGoals = result.profile.skillLevels.techDetails || 'Learn React';
                    questSettings.pianoGoals = result.profile.skillLevels.pianoDetails || 'Practice pieces';
                    questSettings.musicGoals = result.profile.skillLevels.musicDetails || 'Learn Ableton';
                    
                    await saveQuestSettings();

                    // Save projects
                    if (result.profile.activeProjects && result.profile.activeProjects.length > 0) {
                        result.profile.activeProjects.forEach(proj => {
                            projects.push({
                                id: (Date.now() + Math.random()).toString(),
                                name: proj.name,
                                category: proj.category || 'tech',
                                status: 'active',
                                currentStage: proj.currentStage || 'Initial',
                                nextMilestone: proj.nextMilestone || 'First Step'
                            });
                        });
                        await saveProjects();
                    }

                    // Create baseline profile
                    narrativeProfile.profileText = `Onboarding Profile established: Stated focuses include ${result.profile.focus.join(', ')}. Tech level: ${result.profile.skillLevels.tech} (${result.profile.skillLevels.techDetails}). Piano level: ${result.profile.skillLevels.piano} (${result.profile.skillLevels.pianoDetails}). Music Prod level: ${result.profile.skillLevels.music} (${result.profile.skillLevels.musicDetails}). Preferred task length: ${result.profile.preferredTaskLength}. Learning style: ${result.profile.learningStyle}.`;
                    narrativeProfile.lastUpdated = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                    await saveNarrativeProfile();

                    // Display replies
                    appendMessage('assistant', result.reply);
                    appendMessage('assistant', `Coach Profile established!\n🎯 Focuses: ${result.profile.focus.join(' | ')}\n📂 Active Projects: ${projects.map(p => p.name).join(', ') || 'None'}`);

                    // Generate today's quests
                    isProcessingChat = false;
                    $('#chatLoader').style.display = 'none';
                    await generateAllDailySuggestions();
                    render();
                } else {
                    appendMessage('assistant', result.reply);
                }
            } else {
                // Normal status update processing
                if (result.action === 'update_task_status') {
                    const quest = tasks.find(t => t.id === result.taskId);
                    if (quest) {
                        quest.status = result.status;
                        quest.notes = result.notes || '';
                        quest.completedAt = result.status === 'completed' ? new Date().toISOString() : null;
                        await saveQuests();
                        render();
                    }
                }
                appendMessage('assistant', result.reply || "Logged it!");
            }
        } else {
            throw new Error('No coach text returned');
        }

    } catch (error) {
        console.error('Chat parsing error:', error);
        appendMessage('assistant', "I had some trouble parsing that. I've logged it in chat but couldn't update the task board status automatically.");
    } finally {
        isProcessingChat = false;
        $('#chatLoader').style.display = 'none';
        await saveChatHistory();
    }
}

function renderChatHistory() {
    const messagesWrap = $('#chatMessages');
    if (!messagesWrap) return;
    messagesWrap.innerHTML = '';
    if (chatHistory.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'message assistant';
        if (!questSettings.onboardingCompleted) {
            msg.textContent = "Hello! I am your Bubble Quest AI Coach. Welcome! Before we start generating daily quests, let's establish your baseline profile. What are you currently working on in your life, and what skills are most important to you right now?";
        } else {
            msg.textContent = `Hey Remo! I am your Bubble Quest Coach. Tell me what you've done today (e.g. "Finished the React navbar" or "Practiced scales for 15 min") and I'll log your progress instantly!`;
        }
        messagesWrap.appendChild(msg);
    } else {
        chatHistory.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.role}`;
            div.textContent = msg.text;
            messagesWrap.appendChild(div);
        });
    }
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
}

function appendMessage(role, text) {
    chatHistory.push({ role, text, timestamp: new Date().toISOString() });
    renderChatHistory();
}

/* ===================== RPG PROGRESSION ENGINE ===================== */
function calculateProgression() {
    let totalXp = 0;
    let totalBubblesCompletedCount = 0;
    
    // XP rates:
    // +100 XP per completed task
    // +100 XP per in_progress continuation task
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    totalXp += completedTasks.length * 100;
    totalXp += inProgressTasks.length * 100;

    // Group tasks by date & category to reward 300 XP completion bonus (bubbles completed)
    const completionsByDay = {};
    
    tasks.forEach(t => {
        const key = `${t.date}_${t.category}`;
        if (!completionsByDay[key]) {
            completionsByDay[key] = { total: 0, completed: 0 };
        }
        completionsByDay[key].total++;
        if (t.status === 'completed') completionsByDay[key].completed++;
    });

    Object.values(completionsByDay).forEach(stat => {
        if (stat.total > 0 && stat.completed === stat.total) {
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

/* ===================== RENDER AND DRAWING INTERFACES ===================== */
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
        const completedQuests = todayQuests.filter(t => t.status === 'completed');
        
        totalTasksToday += todayQuests.length;
        completedTasksToday += completedQuests.length;

        // Render Focus under Bubbles
        let focusText = 'None';
        if (cat === 'tech') focusText = questSettings.techFocus;
        if (cat === 'piano') focusText = questSettings.pianoFocus;
        if (cat === 'music') focusText = questSettings.musicFocus;

        $(`#focus-${cat}`).textContent = focusText || 'Define Focus';
        $(`#stats-${cat}`).textContent = `${completedQuests.length}/${todayQuests.length || 3} Today`;

        // Calculate progress ring
        const ring = $(`#ring-${cat}`);
        const bubbleEl = $(`#bubble-${cat}`);
        
        if (ring) {
            const ratio = todayQuests.length > 0 ? (completedQuests.length / todayQuests.length) : 0;
            const circumference = 515.22; // 2 * PI * 82
            const strokeDashoffset = circumference - (ratio * circumference);
            ring.style.strokeDashoffset = strokeDashoffset;
        }

        // Completion badge
        if (todayQuests.length > 0 && completedQuests.length === todayQuests.length) {
            bubbleEl.classList.add('completed');
            completedBubblesToday++;
        } else {
            bubbleEl.classList.remove('completed');
        }

        // Locked state check for incomplete onboarding
        if (!questSettings.onboardingCompleted) {
            bubbleEl.classList.add('locked');
        } else {
            bubbleEl.classList.remove('locked');
        }
    });

    // Update Overall daily stats
    const progressPercent = totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0;
    $('#overallProgressText').textContent = `${progressPercent}%`;
    $('#overallProgressBar').style.width = `${progressPercent}%`;
    $('#dailyQuestsStatus').textContent = `${completedTasksToday} of ${totalTasksToday} Active Quests Completed`;
    $('#dailyBubblesStatus').textContent = `${completedBubblesToday} of 3 Bubbles Completed`;

    // Render Quest Board list on Dashboard
    renderQuestBoardOnDashboard();
    
    // Render Chat History on Dashboard
    renderChatHistory();
}

function renderQuestBoardOnDashboard() {
    const todayStr = getTodayDateStr();
    const board = $('#activeQuestsBoard');
    if (!board) return;
    board.innerHTML = '';

    if (!questSettings.onboardingCompleted) {
        board.innerHTML = `
            <div class="onboarding-welcome-card" style="background: rgba(161, 140, 209, 0.05); border: 1px dashed var(--primary); padding: 1.5rem; border-radius: var(--radius-md); text-align: center; margin-top: 1rem;">
                <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">👋</span>
                <h4 style="font-family: var(--font-rpg); font-size: 1.15rem; color: var(--primary); margin-bottom: 0.5rem;">Welcome to Bubble Quest!</h4>
                <p style="font-size: 0.85rem; color: var(--text-light); line-height: 1.5;">
                    I've locked your daily suggestions until we set up your starting profile. Introduce yourself to me in the <strong>AI Coach Console</strong> on the right to complete a short onboarding interview and unlock your dashboard!
                </p>
            </div>
        `;
        return;
    }

    const todayQuests = tasks.filter(t => t.date === todayStr);
    
    if (todayQuests.length === 0) {
        board.innerHTML = '<p class="empty-state">No active tasks on your Quest Board. Click on a bubble above to generate suggestions and add them!</p>';
        return;
    }

    todayQuests.forEach(quest => {
        const item = document.createElement('div');
        item.className = 'active-quest-item-card';
        
        item.innerHTML = `
            <div class="active-quest-header">
                <span class="active-quest-title">${quest.title}</span>
                <span class="quest-status-badge status-${quest.status.replace('_', '-')}">${quest.status}</span>
            </div>
            <div class="active-quest-controls">
                <select class="status-selector" data-id="${quest.id}">
                    <option value="pending" ${quest.status === 'pending' ? 'selected' : ''}>pending</option>
                    <option value="in_progress" ${quest.status === 'in_progress' ? 'selected' : ''}>in_progress</option>
                    <option value="completed" ${quest.status === 'completed' ? 'selected' : ''}>completed</option>
                    <option value="skipped" ${quest.status === 'skipped' ? 'selected' : ''}>skipped</option>
                    <option value="carried_forward" ${quest.status === 'carried_forward' ? 'selected' : ''}>carried_forward</option>
                </select>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${quest.category}</span>
            </div>
        `;
        board.appendChild(item);
    });
}

function renderAnalytics() {
    const prog = calculateProgression();
    const stats = calculateLayer1Stats();

    $('#rpgLevel').textContent = prog.level;
    $('#rpgXpText').textContent = `${prog.xpProgress} / 1000 XP`;
    $('#rpgXpPercent').textContent = `${prog.xpPercent}%`;
    $('#rpgXpBar').style.width = `${prog.xpPercent}%`;

    // Metrics
    $('#statTotalCompleted').textContent = prog.completedCount;
    $('#statTotalSkipped').textContent = tasks.filter(t => t.status === 'skipped').length;
    $('#statTotalBubbles').textContent = prog.bubblesCompleted;
    $('#statStreak').textContent = `${stats.streak} days`;

    // Layer 1 Structured Stats Details
    $('#statFavTopic').textContent = stats.favTopic;
    $('#statSkippedTopic').textContent = stats.skippedTopic;
    $('#statCompleted30').textContent = stats.completed30;
    $('#statSkipped30').textContent = stats.skipped30;

    // Layer 2 Narrative Profile Details
    $('#narrativeProfileText').textContent = `"${narrativeProfile.profileText}"`;
    $('#profileLastUpdated').textContent = `Last Updated: ${narrativeProfile.lastUpdated}`;

    // Rates
    $('#statWeeklyRate').textContent = `${calculateRateForPastDays(7)}%`;
    $('#statMonthlyRate').textContent = `${calculateRateForPastDays(30)}%`;

    // Render charts & history
    renderWeeklyChart();
    renderCategoryBalanceChart();
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
    const completedCount = relevantTasks.filter(t => t.status === 'completed').length;
    return Math.round((completedCount / relevantTasks.length) * 100);
}

function renderWeeklyChart() {
    const chartContainer = $('#weeklyChart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push({
            dateStr: d.toLocaleDateString('en-CA'),
            dayLabel: weekdays[d.getDay()]
        });
    }

    dates.forEach(dayInfo => {
        const dayTasks = tasks.filter(t => t.date === dayInfo.dateStr);
        const completed = dayTasks.filter(t => t.status === 'completed').length;
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
        const completed = catQuests.filter(t => t.status === 'completed').length;
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
        .filter(t => t.status === 'completed')
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
    renderProjectsList();
}

function renderProjectsList() {
    const container = $('#activeProjectsList');
    if (!container) return;
    container.innerHTML = '';

    const activeProjects = projects.filter(p => p.status === 'active');
    
    if (activeProjects.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding: 1rem 0;">No active projects defined. Define one above to guide your AI suggestions!</p>';
        return;
    }

    activeProjects.forEach(proj => {
        const card = document.createElement('div');
        card.className = `project-card-item ${proj.category}`;
        
        card.innerHTML = `
            <div class="project-card-header">
                <span class="project-card-name">${proj.name}</span>
                <button class="project-delete-btn" data-id="${proj.id}">&times;</button>
            </div>
            <p class="project-card-detail"><strong>Stage:</strong> ${proj.currentStage}</p>
            <p class="project-card-detail"><strong>Milestone:</strong> ${proj.nextMilestone}</p>
        `;
        container.appendChild(card);
    });
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

    const key = localStorage.getItem('lifesystem_gemini_api_key') || '';
    $('#settingsApiKey').value = key;
}

/* ===================== EXPANDED BUBBLE DETAIL VIEW ===================== */
function openQuestModal(category) {
    activeCategory = category;
    const todayStr = getTodayDateStr();
    
    // Set headers
    let title = 'Tech Panel';
    let icon = '💻';
    let focus = questSettings.techFocus;

    if (category === 'piano') {
        title = 'Piano Panel';
        icon = '🎹';
        focus = questSettings.pianoFocus;
    } else if (category === 'music') {
        title = 'Music Production Panel';
        icon = '🎛️';
        focus = questSettings.musicFocus;
    }

    $('#questModalTitle').textContent = title;
    $('#questModalIcon').textContent = icon;
    $('#questModalFocus').textContent = focus || 'None';
    $('#questModalDate').textContent = `TODAY: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    // Draw active board tab content
    renderModalActiveQuests();

    // Draw suggestions tab content
    renderModalSuggestions();

    // Show modal
    $('#questModal').classList.add('active');
}

function renderModalActiveQuests() {
    const todayStr = getTodayDateStr();
    const todayQuests = tasks.filter(t => t.category === activeCategory && t.date === todayStr);
    const listContainer = $('#questsList');
    listContainer.innerHTML = '';

    if (todayQuests.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Your Quest Board is empty for today. Head to the "AI Suggestions" tab to select and add tasks!</p>';
        $('#categoryCompleteBanner').style.display = 'none';
    } else {
        todayQuests.forEach(quest => {
            const item = document.createElement('div');
            item.className = `quest-item ${quest.status === 'completed' ? 'completed' : ''}`;
            
            item.innerHTML = `
                <div class="quest-main-row">
                    <span style="font-weight: 500; font-size: 0.95rem; color: var(--text);">${quest.title}</span>
                    <span class="quest-status-badge status-${quest.status.replace('_', '-')}">${quest.status}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.5rem;">
                    <button class="quest-notes-toggle" data-id="${quest.id}" style="font-size: 0.75rem; color: var(--text-light); background: transparent; border: none; cursor: pointer; text-decoration: underline;">✏️ Notes & Status</button>
                    ${quest.completedAt ? `<span class="quest-completed-timestamp" style="font-size: 0.7rem; color: var(--text-muted);">Done at ${new Date(quest.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                </div>
                <div class="quest-notes-area" id="notes-area-${quest.id}" style="display: none; margin-top: 0.5rem;">
                    <p style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.3rem;">Notes: ${quest.notes || 'None logged.'}</p>
                </div>
            `;
            listContainer.appendChild(item);
        });

        // Banner completion status
        const isDone = todayQuests.every(q => q.status === 'completed');
        const banner = $('#categoryCompleteBanner');
        if (isDone && todayQuests.length >= 3) {
            $('#categoryCompleteTitle').textContent = `✅ Daily ${activeCategory === 'music' ? 'Music Prod' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Quest Complete!`;
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }
}

function renderModalSuggestions() {
    const listContainer = $('#suggestionsList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const list = suggestions[activeCategory] || [];
    
    if (list.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No suggestions generated yet. Click "Regenerate" below to generate daily AI suggestions.</p>';
        return;
    }

    list.forEach((title, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-card';
        
        item.innerHTML = `
            <span class="suggestion-title">${title}</span>
            <button class="btn-add-suggestion" data-title="${title}" data-index="${index}">+</button>
        `;
        listContainer.appendChild(item);
    });
}

function closeQuestModal() {
    $('#questModal').classList.remove('active');
    activeCategory = null;
    render();
}

function toggleModalSubTab(tab) {
    modalSubTab = tab;
    $$('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
    $(`#modalTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');

    if (tab === 'quests') {
        $('#modalActiveBoardContent').style.display = 'block';
        $('#modalSuggestionsContent').style.display = 'none';
        $(`#modalTabQuests`).style.borderBottom = '2px solid var(--primary)';
        $(`#modalTabSuggestions`).style.borderBottom = 'none';
    } else {
        $('#modalActiveBoardContent').style.display = 'none';
        $('#modalSuggestionsContent').style.display = 'block';
        $(`#modalTabQuests`).style.borderBottom = 'none';
        $(`#modalTabSuggestions`).style.borderBottom = '2px solid var(--primary)';
    }
}

/* ===================== MOTIVATION POPUP SYSTEM ===================== */
function checkDailyQuotePopup() {
    const lastQuoteStr = localStorage.getItem('lifesystem_last_quote_date');
    const todayStr = getTodayDateStr();

    if (lastQuoteStr !== todayStr) {
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

            $$('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

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
            toggleModalSubTab('quests');
            openQuestModal(category);
        });
    });

    // 4. Modal Sub-Tabs toggle
    $('#modalTabQuests').addEventListener('click', () => toggleModalSubTab('quests'));
    $('#modalTabSuggestions').addEventListener('click', () => toggleModalSubTab('suggestions'));

    // 5. Modal Close events
    $('#closeQuestModalBtn').addEventListener('click', closeQuestModal);
    $('#questModal').addEventListener('click', (e) => {
        if (e.target === $('#questModal')) closeQuestModal();
    });

    // 6. Active Quest status dropdown changer from Dashboard
    $('#activeQuestsBoard').addEventListener('change', async (e) => {
        if (e.target.classList.contains('status-selector')) {
            const id = e.target.getAttribute('data-id');
            const status = e.target.value;
            
            const quest = tasks.find(t => t.id === id);
            if (quest) {
                quest.status = status;
                quest.completedAt = status === 'completed' ? new Date().toISOString() : null;
                await saveQuests();
                render();
            }
        }
    });

    // 7. Toggle Notes Textarea inside Quest Modal
    $('#questsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('quest-notes-toggle')) {
            const id = e.target.getAttribute('data-id');
            const quest = tasks.find(t => t.id === id);
            if (quest) {
                // Open manual edit form instead to allow full edit
                $('#manualQuestTitle').value = quest.title;
                $('#manualQuestStatus').value = quest.status;
                $('#manualQuestNotes').value = quest.notes || '';
                $('#manualQuestId').value = quest.id;
                
                $('#saveManualQuestBtn').textContent = 'Update Quest';
                $('#deleteManualQuestBtn').style.display = 'block';
                $('#manualEditForm').style.display = 'block';
            }
        }
    });

    // 8. Add a Suggestion to Today's Dashboard
    $('#suggestionsList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-add-suggestion')) {
            const title = e.target.getAttribute('data-title');
            const index = parseInt(e.target.getAttribute('data-index'));
            const todayStr = getTodayDateStr();

            // Perform Task continuation logic check:
            // If the suggestion was added, check if yesterday had an 'in_progress' task in this category.
            // If yes, mark it as 'carried_forward'.
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 3);
            const limitStr = limitDate.toLocaleDateString('en-CA');
            const yesterdayInProgress = tasks.find(t => t.category === activeCategory && t.status === 'in_progress' && t.date >= limitStr);

            if (yesterdayInProgress) {
                yesterdayInProgress.status = 'carried_forward';
            }

            // Create task
            tasks.push({
                id: (Date.now() + Math.random()).toString(),
                category: activeCategory,
                title: title,
                status: 'pending',
                date: todayStr,
                completedAt: null,
                notes: '',
                parentTaskId: yesterdayInProgress ? yesterdayInProgress.id : null
            });

            // Remove suggestion from list
            suggestions[activeCategory].splice(index, 1);

            await saveQuests();
            await saveSuggestions();

            renderModalSuggestions();
            renderModalActiveQuests();
            render();
        }
    });

    // 9. Manual Quest additions / updates
    $('#manualEditBtn').addEventListener('click', () => {
        $('#manualQuestTitle').value = '';
        $('#manualQuestStatus').value = 'pending';
        $('#manualQuestNotes').value = '';
        $('#manualQuestId').value = '';
        
        $('#saveManualQuestBtn').textContent = 'Add Quest';
        $('#deleteManualQuestBtn').style.display = 'none';
        $('#manualEditForm').style.display = 'block';
    });

    $('#cancelManualQuestBtn').addEventListener('click', () => {
        $('#manualEditForm').style.display = 'none';
    });

    $('#saveManualQuestBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const title = $('#manualQuestTitle').value.trim();
        const status = $('#manualQuestStatus').value;
        const notes = $('#manualQuestNotes').value.trim();
        const id = $('#manualQuestId').value;
        const todayStr = getTodayDateStr();

        if (!title) {
            alert('Please enter a task title.');
            return;
        }

        if (id) {
            // Update
            const quest = tasks.find(t => t.id === id);
            if (quest) {
                quest.title = title;
                quest.status = status;
                quest.notes = notes;
                quest.completedAt = status === 'completed' ? new Date().toISOString() : null;
            }
        } else {
            // Add new
            tasks.push({
                id: (Date.now() + Math.random()).toString(),
                category: activeCategory,
                title: title,
                status: status,
                date: todayStr,
                completedAt: status === 'completed' ? new Date().toISOString() : null,
                notes: notes
            });
        }

        await saveQuests();
        $('#manualEditForm').style.display = 'none';
        renderModalActiveQuests();
        render();
    });

    $('#deleteManualQuestBtn').addEventListener('click', async () => {
        const id = $('#manualQuestId').value;
        if (id) {
            tasks = tasks.filter(t => t.id !== id);
            await saveQuests();
            $('#manualEditForm').style.display = 'none';
            renderModalActiveQuests();
            render();
        }
    });

    // 10. Regenerate Suggestions via AI
    $('#aiRegenerateBtn').addEventListener('click', async () => {
        if (activeCategory) {
            await generateAllDailySuggestions(true);
        }
    });

    // 11. Run Coach Weekly Reflection Job
    $('#runReflectionBtn').addEventListener('click', async () => {
        await runWeeklyReflectionJob();
    });

    // 12. Active Projects Manager
    $('#projectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = $('#projName').value.trim();
        const cat = $('#projCat').value;
        const stage = $('#projStage').value.trim();
        const milestone = $('#projMilestone').value.trim();

        if (!name || !stage || !milestone) return;

        projects.push({
            id: (Date.now() + Math.random()).toString(),
            name,
            category: cat,
            status: 'active',
            currentStage: stage,
            nextMilestone: milestone
        });

        await saveProjects();
        $('#projectForm').reset();
        renderProjectsList();
        alert('Active project added successfully!');
    });

    $('#activeProjectsList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('project-delete-btn')) {
            const id = e.target.getAttribute('data-id');
            projects = projects.filter(p => p.id !== id);
            await saveProjects();
            renderProjectsList();
        }
    });

    // 13. Save Settings Configuration
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

        const wasOnboardingCompleted = questSettings.onboardingCompleted;
        questSettings.onboardingCompleted = true;

        await saveQuestSettings();
        alert('Configuration saved successfully!');
        
        if (!wasOnboardingCompleted) {
            // Generate suggestions now that onboarding/configuration is complete
            await generateAllDailySuggestions(true);
            
            // Switch back to dashboard tab
            $$('.nav-btn').forEach(b => b.classList.remove('active'));
            const dashBtn = $('[data-tab="dashboard"]');
            if (dashBtn) dashBtn.classList.add('active');
            $$('.tab-view').forEach(view => view.classList.remove('active'));
            const dashView = $('#dashboardView');
            if (dashView) dashView.classList.add('active');
            activeTab = 'dashboard';
        }
        
        render();
    });

    // 14. Save API Key
    $('#saveApiKeyBtn').addEventListener('click', () => {
        const key = $('#settingsApiKey').value.trim();
        localStorage.setItem('lifesystem_gemini_api_key', key);
        alert('API Key updated successfully!');
    });

    // 15. Chat Coach Submit Message
    $('#chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = $('#chatInput').value.trim();
        if (!text) return;

        $('#chatInput').value = '';
        appendMessage('user', text);
        
        await processChatCoach(text);
    });

    // 16. Trigger Login/Signup modal
    $('#triggerAuthModalBtn').addEventListener('click', showAuthModal);

    // 17. Close Motivational Quote modal
    $('#closeQuoteBtn').addEventListener('click', () => $('#quoteModal').classList.remove('active'));
    $('#quoteAcknowledgeBtn').addEventListener('click', () => $('#quoteModal').classList.remove('active'));

    // 18. Onboarding modal
    $('#onboardingSetupBtn').addEventListener('click', () => {
        const key = $('#onboardingApiKey').value.trim();
        if (key) {
            localStorage.setItem('lifesystem_gemini_api_key', key);
            $('#settingsApiKey').value = key;
        }
        $('#onboardingModal').classList.remove('active');
        
        $$('.nav-btn').forEach(b => b.classList.remove('active'));
        $('[data-tab="settings"]').classList.add('active');
        $$('.tab-view').forEach(view => view.classList.remove('active'));
        $('#settingsView').classList.add('active');
        activeTab = 'settings';
    });

    $('#onboardingGuestBtn').addEventListener('click', () => {
        $('#onboardingModal').classList.remove('active');
        render();
    });
});
