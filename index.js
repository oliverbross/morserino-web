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

    // Verify DOM elements exist
    if (!debug || !loggedIn || !notLoggedIn || !currentUsername || !logoutButton || !accountButton ||
        !showLoginButton || !showRegisterButton || !loginForm || !registerForm ||
        !loginUsername || !loginPassword || !loginButton || !registerUsername || !registerPassword ||
        !registerEmail || !registerButton || !realWordsButton || !abbreviationsButton || !callsignsButton ||
        !qrCodesButton || !topWordsButton || !mixedButton || !numItems || !connectButton || !connectionStatus || 
        !startButton || !target || !userInput || !nextButton || !sessionStats || !statsList || !backToTraining) {
        console.error('Critical DOM elements missing');
        debug.textContent = 'Error: Page failed to load correctly. Please try again.';
        debug.classList.remove('hidden');
        return;
    }

    // User preferences for date/time formatting
    let userPreferences = {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
    };

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
                        li.textContent = `${mode}: ${stat.correct}/${stat.total} (${percentage}%), ${formatTimestamp(stat.timestamp)}`;
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
    let currentMode = 'realWords';
    let sessionActive = false;
    let currentTarget = '';
    let sessionData = { correct: 0, total: 0, completed: 0 };
    let maxItems = 5;
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
                                sessionData.completed++;
                                showToast('Correct!', 'bg-green-600');
                                inputBuffer = '';
                                userInput.value = '';
                                if (sessionData.completed >= maxItems) {
                                    // End session
                                    await endSession();
                                } else {
                                    await nextTarget();
                                }
                            }
                        } else {
                            // Incorrect character
                            sessionData.total++;
                            showToast('Incorrect character sent!', 'bg-red-600');
                            inputBuffer = '';
                            userInput.value = '';
                            // Keep currentTarget for retry
                            break;
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
        if (reader) {
            await reader.cancel();
            reader.releaseLock();
            reader = null;
        }
        const modeDisplay = {
            realWords: 'Real Words',
            abbreviations: 'Abbreviations',
            callsigns: 'Callsigns',
            qrCodes: 'QR-codes',
            topWords: 'Top Words in CW',
            mixed: 'Mixed'
        }[currentMode] || currentMode;
        sessionStats.textContent = sessionData.total > 0
            ? `Current ${modeDisplay} Session: Correct: ${sessionData.correct}/${sessionData.total} (${((sessionData.correct/sessionData.total)*100).toFixed(2)}%)`
            : '';
        startButton.classList.remove('hidden');
        nextButton.classList.add('hidden');
        userInput.classList.add('hidden');
        target.textContent = '';
        toggleSection('session-statistics');

        const username = sessionStorage.getItem('username');
        if (!username) {
            console.error('No username for saving stats');
            showToast('Failed to save session: No user logged in', 'bg-red-600');
            statsList.innerHTML = '<li>No historical stats available</li>';
            sessionStats.textContent = 'No stats available';
            return;
        }
        if (sessionData.total === 0) {
            console.warn('No stats to save (total=0)');
            showToast('No stats to save for this session', 'bg-yellow-600');
            fetchHistoricalStats(username); // Refresh historical stats even if no new stats
            return;
        }

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
        sessionData = { correct: 0, total: 0, completed: 0 };
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
        userInput.value = '';
        sessionData.total++;
        showToast('Skipped to next target', 'bg-yellow-600');
        sessionData.completed++;
        if (sessionData.completed >= maxItems) {
            await endSession();
        } else {
            await nextTarget();
        }
    });

    backToTraining.addEventListener('click', async () => {
        await endSession();
    });
});
