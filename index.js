document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = '/morserino/api';
    const debug = document.getElementById('debug');
    const loggedIn = document.getElementById('loggedIn');
    const notLoggedIn = document.getElementById('notLoggedIn');
    const currentUsername = document.getElementById('currentUsername');
    const logoutButton = document.getElementById('logoutButton');
    const accountButton = document.getElementById('accountButton');
    const showLoginButton = document.getElementById('showLoginButton');
    const showRegisterButton = document.getElementById('showRegisterButton');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const registerUsername = document.getElementById('registerUsername');
    const registerPassword = document.getElementById('registerPassword');
    const registerEmail = document.getElementById('registerEmail');
    const registerButton = document.getElementById('registerButton');
    const realWordsButton = document.getElementById('realWordsButton');
    const abbreviationsButton = document.getElementById('abbreviationsButton');
    const callsignsButton = document.getElementById('callsignsButton');
    const qrCodesButton = document.getElementById('qrCodesButton');
    const topWordsButton = document.getElementById('topWordsButton');
    const mixedButton = document.getElementById('mixedButton');
    const numItems = document.getElementById('numItems');
    const connectButton = document.getElementById('connectButton');
    const connectionStatus = document.getElementById('connectionStatus');
    const startButton = document.getElementById('startButton');
    const target = document.getElementById('target');
    const userInput = document.getElementById('userInput');
    const nextButton = document.getElementById('nextButton');
    const sessionStats = document.getElementById('sessionStats');
    const statsList = document.getElementById('statsList');
    const backToTraining = document.getElementById('backToTraining');
    
    // Live session tracking elements (optional - enhanced features)
    const lettersCount = document.getElementById('lettersCount');
    const numbersCount = document.getElementById('numbersCount');
    const signsCount = document.getElementById('signsCount');
    const errorsCount = document.getElementById('errorsCount');
    const sessionTimer = document.getElementById('sessionTimer');
    const sessionReport = document.getElementById('sessionReport');
    const startNewSession = document.getElementById('startNewSession');

    // Check if enhanced tracking is available
    const hasEnhancedTracking = lettersCount && numbersCount && signsCount && errorsCount && sessionTimer && sessionReport && startNewSession;
    if (hasEnhancedTracking) {
        console.log('Enhanced session tracking available');
    } else {
        console.log('Enhanced session tracking not available - using basic mode');
    }

    // Verify critical DOM elements exist (only essential ones)
    const criticalElements = {
        debug, loggedIn, notLoggedIn, currentUsername, logoutButton, accountButton,
        showLoginButton, showRegisterButton, loginForm, registerForm,
        loginUsername, loginPassword, loginButton, registerUsername, registerPassword,
        registerEmail, registerButton, realWordsButton, abbreviationsButton, callsignsButton,
        qrCodesButton, topWordsButton, mixedButton, numItems, connectButton, connectionStatus,
        startButton, target, userInput, nextButton, sessionStats, statsList, backToTraining
    };
    
    const missingCritical = [];
    for (const [name, element] of Object.entries(criticalElements)) {
        if (!element) {
            missingCritical.push(name);
        }
    }
    
    if (missingCritical.length > 0) {
        console.error('Missing critical DOM elements:', missingCritical);
        debug.textContent = `Error: Missing critical elements: ${missingCritical.join(', ')}. Please check the HTML.`;
        debug.classList.remove('hidden');
        return;
    }

    // User preferences for date/time formatting
    let userPreferences = {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
    };

    // Enhanced session tracking variables
    let sessionData = {
        letters: 0,
        numbers: 0,
        signs: 0,
        errors: 0,
        correct: 0,
        total: 0,
        startTime: null,
        endTime: null,
        targets: [],
        responses: []
    };
    
    let sessionTimer_interval = null;
    let currentMode = 'realWords';
    let currentTarget = '';
    let maxItems = 10;
    let port = null;

    // Load user preferences
    async function loadUserPreferences(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/settings.php?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                userPreferences.dateFormat = data.dateFormat || 'DD/MM/YYYY';
                userPreferences.timeFormat = data.timeFormat || '24h';
                console.log('User preferences loaded:', userPreferences);
            }
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    }

    // Format timestamp according to user preferences
    function formatTimestamp(timestamp) {
        if (!timestamp) return 'No timestamp';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp; // Return original if invalid
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            
            let dateStr;
            if (userPreferences.dateFormat === 'MM/DD/YYYY') {
                dateStr = `${month}/${day}/${year}`;
            } else {
                dateStr = `${day}/${month}/${year}`;
            }
            
            let timeStr;
            if (userPreferences.timeFormat === '12h') {
                timeStr = date.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
            } else {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                timeStr = `${hours}:${minutes}:${seconds}`;
            }
            
            return `${dateStr} ${timeStr}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return timestamp; // Return original if formatting fails
        }
    }

    // Show toast notification (centered, larger)
    function showToast(message, bgClass) {
        const toast = document.createElement('div');
        toast.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-lg text-white text-lg font-semibold ${bgClass} opacity-0 transition-opacity duration-300 shadow-lg max-w-md text-center`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('opacity-90'), 100);
        setTimeout(() => {
            toast.classList.remove('opacity-90');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Session tracking utility functions
    function resetSessionCounters() {
        sessionData = {
            letters: 0,
            numbers: 0,
            signs: 0,
            errors: 0,
            correct: 0,
            total: 0,
            startTime: null,
            endTime: null,
            targets: [],
            responses: []
        };
        updateSessionDisplay();
    }

    function updateSessionDisplay() {
        if (hasEnhancedTracking) {
            lettersCount.textContent = sessionData.letters;
            numbersCount.textContent = sessionData.numbers;
            signsCount.textContent = sessionData.signs;
            errorsCount.textContent = sessionData.errors;
        }
    }

    function analyzeCharacters(text) {
        const analysis = { letters: 0, numbers: 0, signs: 0 };
        for (const char of text.toUpperCase()) {
            if (char >= 'A' && char <= 'Z') {
                analysis.letters++;
            } else if (char >= '0' && char <= '9') {
                analysis.numbers++;
            } else if (/[^A-Z0-9\s]/.test(char)) {
                analysis.signs++;
            }
        }
        return analysis;
    }

    function startSessionTimer() {
        sessionData.startTime = new Date();
        if (hasEnhancedTracking) {
            sessionTimer_interval = setInterval(updateTimerDisplay, 100); // Update every 100ms
        }
    }

    function stopSessionTimer() {
        if (sessionTimer_interval) {
            clearInterval(sessionTimer_interval);
            sessionTimer_interval = null;
        }
        sessionData.endTime = new Date();
    }

    function updateTimerDisplay() {
        if (!sessionData.startTime || !hasEnhancedTracking) return;
        
        const now = new Date();
        const elapsed = now - sessionData.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const milliseconds = Math.floor((elapsed % 1000) / 100);
        
        sessionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    }

    function calculateSessionStats() {
        const totalTime = sessionData.endTime - sessionData.startTime;
        const timeSeconds = totalTime / 1000;
        const timeMinutes = timeSeconds / 60;
        
        const totalChars = sessionData.letters + sessionData.numbers + sessionData.signs;
        const accuracy = sessionData.total > 0 ? ((sessionData.correct / sessionData.total) * 100) : 0;
        const cpm = timeMinutes > 0 ? (totalChars / timeMinutes) : 0;
        const wpm = cpm / 5; // Standard: 5 characters = 1 word
        
        return {
            accuracy: accuracy.toFixed(2),
            timeSeconds: timeSeconds.toFixed(3),
            timeMinutes: timeMinutes.toFixed(2),
            cpm: cpm.toFixed(2),
            wpm: wpm.toFixed(2)
        };
    }

    function generateSessionReport() {
        const stats = calculateSessionStats();
        const reportTime = formatTimestamp(new Date());
        const username = sessionStorage.getItem('username') || 'Unknown';
        
        const report = `Report date: ${reportTime}
User: ${username}
==========================================
Letters: ${sessionData.letters}
Numbers: ${sessionData.numbers}
Signs: ${sessionData.signs}
Errors: ${sessionData.errors}
Total: ${sessionData.total}
Accuracy: ${stats.accuracy}%
Time (secs): ${stats.timeSeconds}
Time (mins): ${stats.timeMinutes}
Speed (cpm): ${stats.cpm}
Speed (wpm): ${stats.wpm}
==========================================`;
        
        if (hasEnhancedTracking) {
            sessionReport.textContent = report;
            startNewSession.classList.remove('hidden');
        }
        
        return { ...sessionData, ...stats };
    }

    // Save enhanced session stats to database
    async function trySaveEnhancedStats(reportData) {
        const username = sessionStorage.getItem('username');
        if (!username) {
            console.error('No username for saving stats');
            showToast('Failed to save session: No user logged in', 'bg-red-600');
            return;
        }
        
        if (sessionData.total === 0) {
            console.warn('No stats to save (total=0)');
            showToast('No stats to save for this session', 'bg-yellow-600');
            return;
        }

        const payload = {
            username,
            mode: currentMode,
            correct: sessionData.correct,
            total: sessionData.total,
            letters: sessionData.letters,
            numbers: sessionData.numbers,
            signs: sessionData.signs,
            errors: sessionData.errors,
            timeSeconds: parseFloat(reportData.timeSeconds),
            accuracy: parseFloat(reportData.accuracy),
            cpm: parseFloat(reportData.cpm),
            wpm: parseFloat(reportData.wpm)
        };

        console.log('Saving enhanced session stats:', payload);

        try {
            const response = await fetch(`${apiBaseUrl}/stats.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const text = await response.text();
            console.log('Enhanced stats save response:', response.status, 'Body:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse stats response:', e.message, 'Response:', text);
                showToast('Stats saved, but response format invalid', 'bg-yellow-600');
                return;
            }

            if (response.ok) {
                showToast('Session stats saved successfully!', 'bg-green-600');
                fetchHistoricalStats(username);
            } else {
                console.error('Enhanced stats save failed:', data.message || 'Unknown error');
                showToast(`Failed to save stats: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Enhanced stats save error:', error.message);
            showToast(`Failed to save stats: ${error.message}`, 'bg-red-600');
        }
    }

    // Toggle section visibility without triggering Sortable
    function toggleSection(id) {
        const section = document.querySelector(`.section[data-id="${id}"]`);
        const content = document.getElementById(`${id}-content`);
        const icon = document.querySelector(`[data-id="${id}-icon"]`);
        if (section && content && icon) {
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                icon.classList.remove('rotate-180');
            }
            console.log(`Toggled ${id}: content hidden=${content.classList.contains('hidden')}`);
        } else {
            console.error(`Toggle failed: ${id}`);
        }
    }

    // Add click listeners to section headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = header.closest('.section');
            toggleSection(section.dataset.id);
        });
    });

    // Initialize Sortable.js
    let sortableInstance = null;
    function initSortable() {
        const sortableSections = document.getElementById('sortable-sections');
        sortableInstance = new Sortable(sortableSections, {
            animation: 150,
            handle: '.section',
            onStart: () => {
                console.log('Sorting started');
            },
            onEnd: async (evt) => {
                const sectionOrder = Array.from(sortableSections.children)
                    .filter(section => !section.classList.contains('hidden'))
                    .map(section => section.dataset.id);
                console.log('Section order updated:', sectionOrder);
                const username = sessionStorage.getItem('username');
                if (!username) {
                    console.error('No username for saving section order');
                    return;
                }
                try {
                    const response = await fetch(`${apiBaseUrl}/settings.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, sectionOrder }),
                        credentials: 'include'
                    });
                    const text = await response.text();
                    console.log('Settings response:', response.status, text);
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('Parse settings error:', e.message, 'Response text:', text);
                        showToast('Failed to save order: Invalid response', 'bg-red-600');
                        return;
                    }
                    if (response.ok && data.message === 'Settings updated successfully') {
                        showToast('Section order saved!', 'bg-green-600');
                    } else {
                        showToast(`Failed to save order: ${data.message || 'Unknown error'}`, 'bg-red-600');
                    }
                } catch (error) {
                    console.error('Order save error:', error.message);
                    showToast(`Failed to save order: ${error.message}`, 'bg-red-600');
                }
            }
        });
    }

    // Show all sections except login-register
    function showAllSections() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const id = section.dataset.id;
            if (id !== 'login-register') {
                section.classList.remove('hidden');
                const content = document.getElementById(`${id}-content`);
                const icon = document.querySelector(`[data-id="${id}-icon"]`);
                if (content && icon) {
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                } else {
                    console.error(`Failed to show ${id}: content or icon missing`);
                }
            } else {
                section.classList.add('hidden');
            }
        });
        console.log('Sections after showAllSections:', Array.from(sections).map(s => `${s.dataset.id}: ${s.classList.contains('hidden') ? 'hidden' : 'visible'}`));
        setTimeout(initSortable, 100);
    }

    // Show only login-register section
    function showLoginRegisterSection() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            if (section.dataset.id === 'login-register') {
                section.classList.remove('hidden');
                const content = document.getElementById('login-register-content');
                const icon = document.querySelector('[data-id="login-register-icon"]');
                if (content && icon) {
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-180');
                }
            } else {
                section.classList.add('hidden');
            }
        });
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginButton.classList.add('bg-blue-600');
        showRegisterButton.classList.remove('bg-blue-600');
        console.log('Sections after showLoginRegisterSection:', Array.from(sections).map(s => `${s.dataset.id}: ${s.classList.contains('hidden') ? 'hidden' : 'visible'}`));
    }

    // Fetch historical stats
    async function fetchHistoricalStats(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/get_stats.php?username=${encodeURIComponent(username)}&limit=5`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Historical stats response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse historical stats error:', e.message, 'Response text:', text);
                showToast('Failed to load historical stats: Invalid response', 'bg-red-600');
                statsList.innerHTML = '<li>Error loading historical stats</li>';
                sessionStats.textContent = 'No stats available';
                return;
            }
            if (response.ok && Array.isArray(data)) {
                statsList.innerHTML = '';
                sessionStats.textContent = ''; // Clear sessionStats when stats are loaded
                if (data.length === 0) {
                    statsList.innerHTML = '<li>No historical stats available</li>';
                    sessionStats.textContent = 'No stats available';
                } else {
                    const modeDisplay = {
                        realWords: 'Real Words',
                        abbreviations: 'Abbreviations',
                        callsigns: 'Callsigns',
                        qrCodes: 'QR-codes',
                        topWords: 'Top Words in CW',
                        mixed: 'Mixed'
                    };
                    data.forEach(stat => {
                        const mode = modeDisplay[stat.mode] || stat.mode;
                        const percentage = stat.total > 0 ? ((stat.correct / stat.total) * 100).toFixed(2) : '0.00';
                        const li = document.createElement('li');
                        
                        if (stat.enhanced) {
                            // Enhanced display with detailed info
                            const timeDisplay = stat.time_seconds > 0 ? ` | Time: ${stat.time_seconds}s` : '';
                            const speedDisplay = stat.wpm > 0 ? ` | ${stat.wpm} WPM` : '';
                            const characterBreakdown = `L:${stat.letters} N:${stat.numbers} S:${stat.signs} E:${stat.errors}`;
                            li.innerHTML = `
                                <div class="text-sm mb-1">
                                    <strong>${mode}</strong>: ${stat.correct}/${stat.total} (${percentage}%)${speedDisplay}${timeDisplay}
                                    <br><span class="text-gray-400">${characterBreakdown} - ${formatTimestamp(stat.timestamp)}</span>
                                </div>
                            `;
                        } else {
                            // Basic display for backwards compatibility
                            li.textContent = `${mode}: ${stat.correct}/${stat.total} (${percentage}%), ${formatTimestamp(stat.timestamp)}`;
                        }
                        
                        statsList.appendChild(li);
                    });
                }
            } else {
                console.error('Historical stats fetch failed:', data.message || 'No stats returned', 'Response text:', text);
                showToast(`Failed to load historical stats: ${data.message || 'Unknown error'}`, 'bg-red-600');
                statsList.innerHTML = '<li>Error loading historical stats</li>';
                sessionStats.textContent = 'No stats available';
            }
        } catch (error) {
            console.error('Historical stats fetch error:', error.message);
            showToast(`Failed to load historical stats: ${error.message}`, 'bg-red-600');
            statsList.innerHTML = '<li>Error loading historical stats</li>';
            sessionStats.textContent = 'No stats available';
        }
    }

    // Session and WebSerial state
    let port = null;
    let sessionActive = false;
    let reader = null;

    async function checkSession() {
        console.log('Checking session at', new Date().toISOString());
        debug.classList.add('hidden');
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Session response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse session error:', e.message, 'Response text:', text);
                showToast('Session load failed: Invalid response', 'bg-red-600');
                debug.textContent = 'Error: Session load failed. Try again.';
                debug.classList.remove('hidden');
                showLoginRegisterSection();
                return;
            }
            if (response.ok && data.username) {
                console.log('Logged in:', data.username);
                sessionStorage.setItem('username', data.username);
                currentUsername.textContent = data.username;
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                showAllSections();
                await loadUserPreferences(data.username); // Load user preferences
                fetchHistoricalStats(data.username); // Load historical stats on login
            } else {
                console.log('No session');
                sessionStorage.removeItem('username');
                loggedIn.classList.add('hidden');
                notLoggedIn.classList.remove('hidden');
                showLoginRegisterSection();
            }
        } catch (error) {
            console.error('Session check error:', error.message);
            showToast(`Session load failed: ${error.message}`, 'bg-red-600');
            debug.textContent = `Error: Session load failed: ${error.message}`;
            debug.classList.remove('hidden');
            showLoginRegisterSection();
        }
    }
    checkSession();

    showLoginButton.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginButton.classList.add('bg-blue-600');
        showRegisterButton.classList.remove('bg-blue-600');
        showRegisterButton.classList.add('bg-blue-500');
        console.log('Switched to login form');
    });

    showRegisterButton.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterButton.classList.add('bg-blue-600');
        showLoginButton.classList.remove('bg-blue-600');
        showLoginButton.classList.add('bg-blue-500');
        console.log('Switched to register form');
    });

    loginButton.addEventListener('click', async () => {
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();
        if (!username || !password) {
            showToast('Enter username and password.', 'bg-red-600');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Login response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse login error:', e.message, 'Response text:', text);
                showToast('Login failed: Invalid response', 'bg-red-600');
                return;
            }
            if (response.ok && data.message === 'Login successful') {
                sessionStorage.setItem('username', username);
                currentUsername.textContent = username;
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                loginUsername.value = '';
                loginPassword.value = '';
                showToast('Login successful!', 'bg-green-600');
                showAllSections();
                await loadUserPreferences(username); // Load user preferences
                fetchHistoricalStats(username); // Load historical stats after login
            } else {
                showToast(`Login failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Login error:', error.message);
            showToast(`Login failed: ${error.message}`, 'bg-red-600');
        }
    });

    registerButton.addEventListener('click', async () => {
        const username = registerUsername.value.trim();
        const password = registerPassword.value.trim();
        const email = registerEmail.value.trim();
        if (!username || !password || !email) {
            showToast('Enter username, password, and email.', 'bg-red-600');
            return;
        }
        try {
            const response = await fetch(`${apiBaseUrl}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Register response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse register error:', e.message, 'Response text:', text);
                showToast('Registration failed: Invalid response', 'bg-red-600');
                return;
            }
            if (response.ok && data.message === 'Registration successful') {
                sessionStorage.setItem('username', username);
                currentUsername.textContent = username;
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                registerUsername.value = '';
                registerPassword.value = '';
                registerEmail.value = '';
                showToast('Registration successful!', 'bg-green-600');
                showAllSections();
                await loadUserPreferences(username); // Load user preferences
                fetchHistoricalStats(username); // Load historical stats after registration
            } else {
                showToast(`Registration failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Registration error:', error.message);
            showToast(`Registration failed: ${error.message}`, 'bg-red-600');
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Logout response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse logout error:', e.message, 'Response text:', text);
                showToast('Logout failed: Invalid response', 'bg-red-600');
                return;
            }
            if (response.ok && data.message === 'Logged out successfully') {
                sessionStorage.removeItem('username');
                loggedIn.classList.add('hidden');
                notLoggedIn.classList.remove('hidden');
                showLoginRegisterSection();
                statsList.innerHTML = ''; // Clear historical stats on logout
                sessionStats.textContent = 'No stats available';
                showToast('Logged out successfully!', 'bg-green-600');
            } else {
                showToast(`Logout failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Logout error:', error.message);
            showToast(`Logout failed: ${error.message}`, 'bg-red-600');
        }
    });

    accountButton.addEventListener('click', () => {
        window.location.href = '/morserino/account.html';
    });

    [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(button => {
        button.addEventListener('click', () => {
            currentMode = button.id.replace('Button', '');
            [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(btn => {
                btn.classList.remove('bg-blue-600');
                btn.classList.add('bg-blue-500');
            });
            button.classList.remove('bg-blue-500');
            button.classList.add('bg-blue-600');
            showToast(`Mode set to ${button.textContent}`, 'bg-green-600');
        });
    });

    connectButton.addEventListener('click', async () => {
        if (!('serial' in navigator)) {
            showToast('WebSerial not supported.', 'bg-red-600');
            return;
        }
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            connectionStatus.textContent = 'Connected to Morserino';
            connectButton.classList.add('hidden');
            showToast('Connected to Morserino!', 'bg-green-600');
        } catch (error) {
            console.error('Serial error:', error.message);
            showToast(`Failed to connect: ${error.message}`, 'bg-red-600');
        }
    });

    // Read and validate input from Morserino
    async function readMorseInput() {
        if (!port || !sessionActive) return;
        try {
            reader = port.readable.getReader();
            let inputBuffer = '';
            while (sessionActive) {
                const { value, done } = await reader.read();
                if (done) {
                    console.log('Serial port closed');
                    reader.releaseLock();
                    break;
                }
                const text = new TextDecoder().decode(value).trim();
                if (text) {
                    console.log('Received input:', text);
                    for (let char of text.toUpperCase()) {
                        inputBuffer += char;
                        if (inputBuffer.length <= currentTarget.length && inputBuffer === currentTarget.slice(0, inputBuffer.length)) {
                            // Correct so far
                            userInput.value = inputBuffer;
                            if (inputBuffer === currentTarget) {
                                // Full target matched
                                sessionData.correct++;
                                sessionData.total++;
                                
                                // Analyze characters in the correct target
                                const charAnalysis = analyzeCharacters(currentTarget);
                                sessionData.letters += charAnalysis.letters;
                                sessionData.numbers += charAnalysis.numbers;
                                sessionData.signs += charAnalysis.signs;
                                
                                // Store target and response for analysis
                                sessionData.targets.push(currentTarget);
                                sessionData.responses.push(inputBuffer);
                                
                                updateSessionDisplay();
                                showToast('Correct!', 'bg-green-600');
                                inputBuffer = '';
                                userInput.value = '';
                                
                                if (sessionData.total >= maxItems) {
                                    // End session
                                    await endSession();
                                } else {
                                    await nextTarget();
                                }
                            }
                        } else {
                            // Incorrect character
                            sessionData.errors++;
                            sessionData.total++;
                            
                            // Analyze characters in the target (even if incorrect)
                            const charAnalysis = analyzeCharacters(currentTarget);
                            sessionData.letters += charAnalysis.letters;
                            sessionData.numbers += charAnalysis.numbers;
                            sessionData.signs += charAnalysis.signs;
                            
                            // Store target and response for analysis
                            sessionData.targets.push(currentTarget);
                            sessionData.responses.push(inputBuffer);
                            
                            updateSessionDisplay();
                            showToast('Incorrect character sent!', 'bg-red-600');
                            inputBuffer = '';
                            userInput.value = '';
                            
                            if (sessionData.total >= maxItems) {
                                // End session
                                await endSession();
                            } else {
                                // Keep currentTarget for retry
                                break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Morse read error:', error.message);
            showToast(`Failed to read input: ${error.message}`, 'bg-red-600');
            reader = null;
        }
    }

    // End session and save stats
    async function endSession() {
        sessionActive = false;
        stopSessionTimer();
        
        if (reader) {
            await reader.cancel();
            reader.releaseLock();
            reader = null;
        }

        // Generate and display session report
        const reportData = generateSessionReport();
        
        // Save enhanced stats to database
        await trySaveEnhancedStats(reportData);
        
        // Reset UI
        startButton.classList.remove('hidden');
        nextButton.classList.add('hidden');
        userInput.classList.add('hidden');
        target.textContent = '';
        userInput.value = '';
        
        // Show session report section if enhanced tracking is available
        if (hasEnhancedTracking) {
            toggleSection('session-report');
        }
    }

    // Legacy function for backwards compatibility
    async function trySaveStats() {
        const payload = {
            username: username,
            mode: currentMode,
            correct: parseInt(sessionData.correct),
            total: parseInt(sessionData.total)
        };
        console.log('Sending stats payload:', payload);

        async function trySaveStats(attempt = 1) {
            try {
                const response = await fetch(`${apiBaseUrl}/stats.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });
                const text = await response.text();
                console.log(`Stats response (attempt ${attempt}):`, response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Parse stats error:', e.message, 'Response text:', text);
                    if (attempt < 2) {
                        console.log('Retrying stats save...');
                        return trySaveStats(attempt + 1);
                    }
                    showToast('Failed to save session: Invalid server response', 'bg-red-600');
                    fetchHistoricalStats(username); // Refresh historical stats on failure
                    return;
                }
                if (response.ok && data.message === 'Stats saved successfully') {
                    showToast('Session stats saved!', 'bg-green-600');
                    fetchHistoricalStats(username); // Refresh historical stats after saving
                } else {
                    console.error('Stats save failed:', data.message || 'Unknown error', 'Response text:', text);
                    if (attempt < 2) {
                        console.log('Retrying stats save...');
                        return trySaveStats(attempt + 1);
                    }
                    // Suppress toast if stats were saved (non-critical error)
                    if (response.ok) {
                        console.warn('Stats saved but unexpected response:', data.message);
                        showToast('Session stats saved!', 'bg-green-600');
                    } else {
                        showToast(`Failed to save session: ${data.message || 'Unknown error'}`, 'bg-red-600');
                    }
                    fetchHistoricalStats(username); // Refresh historical stats on failure
                }
            } catch (error) {
                console.error('Stats save error:', error.message);
                if (attempt < 2) {
                    console.log('Retrying stats save...');
                    return trySaveStats(attempt + 1);
                }
                showToast(`Failed to save session: ${error.message}`, 'bg-red-600');
                fetchHistoricalStats(username); // Refresh historical stats on failure
            }
        }

        await trySaveStats();
    }

    startButton.addEventListener('click', async () => {
        if (!port) {
            showToast('Connect to Morserino first.', 'bg-red-600');
            return;
        }
        if (!['realWords', 'abbreviations', 'callsigns', 'qrCodes', 'topWords', 'mixed'].includes(currentMode)) {
            showToast('Invalid mode selected. Please choose a mode.', 'bg-red-600');
            return;
        }
        const numItemsValue = parseInt(numItems.value);
        if (isNaN(numItemsValue) || numItemsValue < 1) {
            showToast('Enter a valid number of items (1 or more).', 'bg-red-600');
            return;
        }
        maxItems = numItemsValue;
        sessionActive = true;
        resetSessionCounters();
        startSessionTimer();
        startButton.classList.add('hidden');
        nextButton.classList.remove('hidden');
        userInput.classList.remove('hidden');
        await nextTarget();
        readMorseInput();
        showToast('Session started!', 'bg-green-600');
    });

    // Fallback target generation
    function getFallbackTarget(mode) {
        console.log('Using fallback target for mode:', mode);
        const targets = {
            realWords: [
                'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 
                'HAVE', 'WHAT', 'WERE', 'SAID', 'EACH', 'WHICH', 'THEIR', 'TIME', 'WILL', 'ABOUT', 'WOULD', 
                'THERE', 'COULD', 'OTHER', 'AFTER', 'FIRST', 'WELL', 'WATER', 'BEEN', 'CALL', 'WHO', 'OIL', 
                'NOW', 'FIND', 'LONG', 'DOWN', 'DAY', 'DID', 'GET', 'HAS', 'HIM', 'HOW', 'MAN', 'NEW', 'OLD', 
                'SEE', 'TWO', 'WAY', 'BOY', 'ITS', 'WORD', 'WORK', 'LIFE', 'YEAR', 'BACK', 'GOOD', 'GIVE',
                'HELLO', 'WORLD', 'MORSE', 'CODE', 'RADIO', 'SIGNAL', 'STATION', 'ANTENNA', 'CIRCUIT', 'DEVICE'
            ],
            abbreviations: ['CQ', 'DE', 'TNX', 'FB', 'QSL', 'QRT', 'CUL', '73', 'ARRL', 'DX', 'QTH', 'WX', 'HR', 'RIG', 'ANT'],
            callsigns: ['OM0RX', 'W1AW', 'K9LA', 'VE3ABC', 'G0XYZ', 'DL1QRS', 'JA1TNX', 'VK2DEF', 'S51MNO', '2E0ABC'],
            qrCodes: ['QRA', 'QRB', 'QRG', 'QRH', 'QRI', 'QRK', 'QRL', 'QRM', 'QRN', 'QRO', 'QRP', 'QRQ', 'QRS', 'QRT', 'QRU'],
            topWords: ['I', 'AND', 'THE', 'YOU', 'THAT', 'A', 'TO', 'KNOW', 'OF', 'IT', 'YEAH', 'IN', 'THEY', 'DO', 'SO', 'BUT'],
            mixed: ['HELLO', 'CQ', 'OM0RX', 'QRA', 'THE', 'W1AW', 'TNX', 'AND', 'QRB', 'DX']
        };
        const options = targets[mode] || targets.realWords;
        return options[Math.floor(Math.random() * options.length)];
    }

    async function nextTarget() {
        console.log('Fetching target for mode:', currentMode);
        try {
            const response = await fetch(`${apiBaseUrl}/target.php?mode=${encodeURIComponent(currentMode)}`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Target response:', response.status, 'Headers:', Object.fromEntries(response.headers), 'Body:', text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Parse target error:', e.message, 'Response text:', text);
                currentTarget = getFallbackTarget(currentMode);
                target.textContent = currentTarget;
                userInput.value = '';
                if (port) {
                    const writer = port.writable.getWriter();
                    await writer.write(new TextEncoder().encode(currentTarget + '\n'));
                    writer.releaseLock();
                }
                return;
            }
            if (response.ok && data.target) {
                currentTarget = data.target;
                target.textContent = currentTarget;
                userInput.value = '';
                if (port) {
                    const writer = port.writable.getWriter();
                    await writer.write(new TextEncoder().encode(currentTarget + '\n'));
                    writer.releaseLock();
                }
            } else {
                console.error('Target fetch failed:', data.message || 'No target returned', 'Response text:', text);
                currentTarget = getFallbackTarget(currentMode);
                target.textContent = currentTarget;
                userInput.value = '';
                if (port) {
                    const writer = port.writable.getWriter();
                    await writer.write(new TextEncoder().encode(currentTarget + '\n'));
                    writer.releaseLock();
                }
            }
        } catch (error) {
            console.error('Target fetch error:', error.message);
            currentTarget = getFallbackTarget(currentMode);
            target.textContent = currentTarget;
            userInput.value = '';
            if (port) {
                const writer = port.writable.getWriter();
                await writer.write(new TextEncoder().encode(currentTarget + '\n'));
                writer.releaseLock();
            }
        }
    }

    nextButton.addEventListener('click', async () => {
        // Skip to next target without evaluating input
        sessionData.total++;
        
        // Analyze characters in the skipped target
        const charAnalysis = analyzeCharacters(currentTarget);
        sessionData.letters += charAnalysis.letters;
        sessionData.numbers += charAnalysis.numbers;
        sessionData.signs += charAnalysis.signs;
        
        // Store target and empty response for skipped items
        sessionData.targets.push(currentTarget);
        sessionData.responses.push('SKIPPED');
        
        updateSessionDisplay();
        userInput.value = '';
        showToast('Skipped to next target', 'bg-yellow-600');
        
        if (sessionData.total >= maxItems) {
            await endSession();
        } else {
            await nextTarget();
        }
    });

    backToTraining.addEventListener('click', async () => {
        await endSession();
    });

    // Start new session button functionality (only if enhanced tracking available)
    if (hasEnhancedTracking) {
        startNewSession.addEventListener('click', () => {
            startNewSession.classList.add('hidden');
            sessionReport.textContent = 'No session completed yet';
            resetSessionCounters();
            sessionTimer.textContent = '00:00.0';
            showToast('Ready for new session!', 'bg-green-600');
        });
    }
});
