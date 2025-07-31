document.addEventListener('DOMContentLoaded', () => {
    console.log('Morserino Web loading...');

    // Basic DOM elements
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

    // Enhanced tracking elements (optional)
    const lettersCount = document.getElementById('lettersCount');
    const numbersCount = document.getElementById('numbersCount');
    const signsCount = document.getElementById('signsCount');
    const errorsCount = document.getElementById('errorsCount');
    const sessionTimer = document.getElementById('sessionTimer');
    const sessionReport = document.getElementById('sessionReport');
    const startNewSession = document.getElementById('startNewSession');

    // Check if enhanced tracking is available
    const hasEnhancedTracking = lettersCount && numbersCount && signsCount && errorsCount && sessionTimer && sessionReport && startNewSession;
    console.log('Enhanced tracking available:', hasEnhancedTracking);

    if (!debug) {
        alert('Critical error: Page structure invalid');
        return;
    }

    // API configuration
    const apiBaseUrl = 'https://om0rx.com/morserino/api';

    // Session variables
    let currentMode = 'realWords';
    let sessionActive = false;
    let port = null;
    let reader = null;
    let maxItems = 10;
    let sessionData = { correct: 0, total: 0 };
    let inputBuffer = '';
    let currentTarget = '';
    let sessionTimer_interval = null;

    // Enhanced session tracking variables
    if (hasEnhancedTracking) {
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
    }

    // Toast notification function
    function showToast(message, bgClass = 'bg-blue-600') {
        const toast = document.createElement('div');
        toast.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${bgClass} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity text-center`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // Section toggle function
    function toggleSection(id) {
        const content = document.getElementById(`${id}-content`);
        const icon = document.querySelector(`[data-id="${id}-icon"]`);
        
        if (content && icon) {
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                icon.classList.remove('rotate-180');
            }
        }
    }

    // Add section header listeners and expand all sections by default
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = header.closest('.section');
            if (section && section.dataset.id) {
                toggleSection(section.dataset.id);
            }
        });
    });

    // Expand all sections by default
    setTimeout(() => {
        const allSections = ['mode-selection', 'connection', 'training', 'live-session-tracking', 'session-report', 'session-statistics'];
        allSections.forEach(sectionId => {
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
            if (content && content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                if (icon) icon.classList.add('rotate-180');
                console.log(`Expanded section: ${sectionId}`);
            }
        });
    }, 100);

    // Initialize Sortable
    if (typeof Sortable !== 'undefined') {
        const sortableSections = document.getElementById('sortable-sections');
        if (sortableSections) {
            new Sortable(sortableSections, {
                animation: 150,
                handle: '.section'
            });
        }
    }

    // User preferences
    let userPreferences = { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };

    // Format timestamp
    function formatTimestamp(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // Enhanced tracking functions
    function resetSessionCounters() {
        if (hasEnhancedTracking) {
            sessionData = {
                letters: 0, numbers: 0, signs: 0, errors: 0, correct: 0, total: 0,
                startTime: null, endTime: null, targets: [], responses: []
            };
            updateSessionDisplay();
        } else {
            sessionData = { correct: 0, total: 0 };
        }
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
            if (/[A-Z]/.test(char)) analysis.letters++;
            else if (/[0-9]/.test(char)) analysis.numbers++;
            else if (/[^A-Z0-9\s]/.test(char)) analysis.signs++;
        }
        return analysis;
    }

    function startSessionTimer() {
        if (hasEnhancedTracking) {
            sessionData.startTime = new Date();
            sessionTimer_interval = setInterval(updateTimerDisplay, 100);
        }
    }

    function stopSessionTimer() {
        if (sessionTimer_interval) {
            clearInterval(sessionTimer_interval);
            sessionTimer_interval = null;
        }
        if (hasEnhancedTracking) {
            sessionData.endTime = new Date();
        }
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

    // Check session on load
    async function checkSession() {
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok && data.username) {
                currentUsername.textContent = data.username;
                sessionStorage.setItem('username', data.username);
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                // Hide login/register section when logged in
                const loginContent = document.getElementById('login-register-content');
                if (loginContent && !loginContent.classList.contains('hidden')) {
                    toggleSection('login-register');
                }
                await fetchHistoricalStats(data.username);
            } else {
                notLoggedIn.classList.remove('hidden');
                loggedIn.classList.add('hidden');
                // Show login/register section when not logged in
                const loginContent = document.getElementById('login-register-content');
                if (loginContent && loginContent.classList.contains('hidden')) {
                    toggleSection('login-register');
                }
            }
        } catch (error) {
            console.error('Session check failed:', error);
            notLoggedIn.classList.remove('hidden');
            loggedIn.classList.add('hidden');
        }
    }

    // Fetch historical stats
    async function fetchHistoricalStats(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/get_stats.php?username=${encodeURIComponent(username)}&limit=5`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok && Array.isArray(data)) {
                statsList.innerHTML = '';
                if (data.length === 0) {
                    statsList.innerHTML = '<li>No historical stats available</li>';
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
                            const timeDisplay = stat.time_seconds > 0 ? ` | Time: ${stat.time_seconds}s` : '';
                            const speedDisplay = stat.wpm > 0 ? ` | ${stat.wpm} WPM` : '';
                            const characterBreakdown = `L:${stat.letters} N:${stat.numbers} S:${stat.signs} E:${stat.errors}`;
                            li.innerHTML = `
                                <div class="text-sm mb-1">
                                    <strong>${mode}</strong>: ${stat.correct}/${stat.total} (${percentage}%)${speedDisplay}${timeDisplay}
                                    <br><span class="text-gray-400">${characterBreakdown} - ${formatTimestamp(new Date(stat.timestamp))}</span>
                                </div>
                            `;
                        } else {
                            li.textContent = `${mode}: ${stat.correct}/${stat.total} (${percentage}%), ${formatTimestamp(new Date(stat.timestamp))}`;
                        }
                        
                        statsList.appendChild(li);
                    });
                }
            } else {
                statsList.innerHTML = '<li>Failed to load stats</li>';
            }
        } catch (error) {
            console.error('Stats fetch error:', error);
            statsList.innerHTML = '<li>Error loading stats</li>';
        }
    }

    // Login/Register functionality
    showLoginButton.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginButton.classList.add('bg-blue-600');
        showRegisterButton.classList.remove('bg-blue-600');
    });

    showRegisterButton.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterButton.classList.add('bg-blue-600');
        showLoginButton.classList.remove('bg-blue-600');
    });

    loginButton.addEventListener('click', async () => {
        const username = loginUsername.value.trim();
        const password = loginPassword.value;

        if (!username || !password) {
            showToast('Please fill in all fields', 'bg-red-600');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok && data.message === 'Login successful') {
                currentUsername.textContent = username;
                sessionStorage.setItem('username', username);
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                // Hide login/register section after successful login
                const loginContent = document.getElementById('login-register-content');
                if (loginContent && !loginContent.classList.contains('hidden')) {
                    toggleSection('login-register');
                }
                showToast('Login successful!', 'bg-green-600');
                await fetchHistoricalStats(username);
            } else {
                showToast(`Login failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            showToast(`Login failed: ${error.message}`, 'bg-red-600');
        }
    });

    registerButton.addEventListener('click', async () => {
        const username = registerUsername.value.trim();
        const password = registerPassword.value;
        const email = registerEmail.value.trim();

        if (!username || !password || !email) {
            showToast('Please fill in all fields', 'bg-red-600');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }),
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok && data.message === 'Registration successful') {
                currentUsername.textContent = username;
                sessionStorage.setItem('username', username);
                loggedIn.classList.remove('hidden');
                notLoggedIn.classList.add('hidden');
                // Hide login/register section after successful registration
                const loginContent = document.getElementById('login-register-content');
                if (loginContent && !loginContent.classList.contains('hidden')) {
                    toggleSection('login-register');
                }
                showToast('Registration successful!', 'bg-green-600');
                await fetchHistoricalStats(username);
            } else {
                showToast(`Registration failed: ${data.message || 'Unknown error'}`, 'bg-red-600');
            }
        } catch (error) {
            showToast(`Registration failed: ${error.message}`, 'bg-red-600');
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                sessionStorage.removeItem('username');
                loggedIn.classList.add('hidden');
                notLoggedIn.classList.remove('hidden');
                // Show login/register section after logout
                const loginContent = document.getElementById('login-register-content');
                if (loginContent && loginContent.classList.contains('hidden')) {
                    toggleSection('login-register');
                }
                statsList.innerHTML = '';
                sessionStats.textContent = 'No stats available';
                showToast('Logged out successfully!', 'bg-green-600');
            }
        } catch (error) {
            showToast(`Logout failed: ${error.message}`, 'bg-red-600');
        }
    });

    accountButton.addEventListener('click', () => {
        window.location.href = '/morserino/account.html';
    });

    // Mode selection with better colors and feedback
    [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            [realWordsButton, abbreviationsButton, callsignsButton, qrCodesButton, topWordsButton, mixedButton].forEach(btn => {
                btn.classList.remove('bg-green-600', 'bg-green-700');
                btn.classList.add('bg-blue-500');
                btn.classList.remove('bg-blue-600');
            });
            
            // Add active class to clicked button
            button.classList.remove('bg-blue-500', 'bg-blue-600');
            button.classList.add('bg-green-600');
            button.classList.add('hover:bg-green-700');
            
            const oldMode = currentMode;
            currentMode = button.id.replace('Button', '');
            
            // Show feedback toast
            const modeNames = {
                realWords: 'Real Words',
                abbreviations: 'Abbreviations',
                callsigns: 'Callsigns',
                qrCodes: 'QR-codes',
                topWords: 'Top Words in CW',
                mixed: 'Mixed'
            };
            
            showToast(`Mode changed to: ${modeNames[currentMode]}`, 'bg-blue-600');
            console.log('Mode selected:', currentMode);
        });
    });

    // Set default mode selection visual
    setTimeout(() => {
        if (realWordsButton) {
            realWordsButton.classList.remove('bg-blue-500');
            realWordsButton.classList.add('bg-green-600');
        }
    }, 200);

    // Connection to Morserino
    connectButton.addEventListener('click', async () => {
        if (!('serial' in navigator)) {
            showToast('Web Serial API not supported. Use Chrome or Edge.', 'bg-red-600');
            return;
        }

        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            connectionStatus.textContent = 'Connected to Morserino';
            connectButton.textContent = 'Connected';
            connectButton.disabled = true;
            showToast('Connected to Morserino!', 'bg-green-600');
        } catch (error) {
            showToast(`Connection failed: ${error.message}`, 'bg-red-600');
            connectionStatus.textContent = 'Connection failed';
        }
    });

    // Training functionality - fixed API endpoint
    async function nextTarget() {
        try {
            // Try the correct data endpoint first  
            const response = await fetch(`https://om0rx.com/morserino/data/words.php?mode=${currentMode}`);
            if (response.ok) {
                const data = await response.text();
                currentTarget = data.trim().toUpperCase();
                console.log('Fetched target from API:', currentTarget);
            } else {
                throw new Error('API failed, using fallback');
            }
        } catch (error) {
            console.log('Using fallback target for mode:', currentMode);
            const fallbackTargets = {
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
            const options = fallbackTargets[currentMode] || fallbackTargets.realWords;
            currentTarget = options[Math.floor(Math.random() * options.length)];
        }
        target.textContent = currentTarget;
        userInput.value = '';
        inputBuffer = '';
        console.log('Next target set:', currentTarget);
    }

    async function readMorseInput() {
        if (!port || !sessionActive) return;
        
        try {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            reader = textDecoder.readable.getReader();
            
            console.log('Starting Morse input reader...');

            while (sessionActive && reader) {
                const { value, done } = await reader.read();
                if (done) break;

                for (const char of value) {
                    if (!sessionActive) break;
                    if (char === '\n' || char === '\r') continue;
                    
                    console.log('Received char:', char, 'Current target:', currentTarget, 'Buffer:', inputBuffer);
                    inputBuffer += char;
                    userInput.value = inputBuffer;

                    // Only evaluate when user sends SPACE (word separator)
                    if (char === ' ') {
                        const cleanInput = inputBuffer.trim().toUpperCase();
                        console.log('SPACE received - Evaluating input:', cleanInput, 'vs target:', currentTarget);
                        
                        if (cleanInput === currentTarget) {
                            // Correct answer
                            sessionData.correct++;
                            sessionData.total++;
                            
                            if (hasEnhancedTracking) {
                                const charAnalysis = analyzeCharacters(currentTarget);
                                sessionData.letters += charAnalysis.letters;
                                sessionData.numbers += charAnalysis.numbers;
                                sessionData.signs += charAnalysis.signs;
                                sessionData.targets.push(currentTarget);
                                sessionData.responses.push(cleanInput);
                                updateSessionDisplay();
                                console.log('Correct! Updated session data:', sessionData);
                            }
                            
                            showToast(`Correct! "${cleanInput}" (${sessionData.correct}/${sessionData.total})`, 'bg-green-600');
                            inputBuffer = '';
                            userInput.value = '';
                            
                            // Check if session should end
                            if (sessionData.total >= maxItems) {
                                console.log('Session complete, ending...');
                                await endSession();
                                return;
                            } else {
                                await nextTarget();
                            }
                        } else {
                            // Incorrect answer
                            sessionData.total++;
                            
                            if (hasEnhancedTracking) {
                                sessionData.errors++;
                                const charAnalysis = analyzeCharacters(currentTarget);
                                sessionData.letters += charAnalysis.letters;
                                sessionData.numbers += charAnalysis.numbers;
                                sessionData.signs += charAnalysis.signs;
                                sessionData.targets.push(currentTarget);
                                sessionData.responses.push(cleanInput);
                                updateSessionDisplay();
                                console.log('Incorrect! Updated session data:', sessionData);
                            }
                            
                            showToast(`Incorrect: "${cleanInput}" ≠ "${currentTarget}" (${sessionData.correct}/${sessionData.total})`, 'bg-red-600');
                            inputBuffer = '';
                            userInput.value = '';
                            
                            // Check if session should end
                            if (sessionData.total >= maxItems) {
                                console.log('Session complete, ending...');
                                await endSession();
                                return;
                            } else {
                                await nextTarget();
                            }
                        }
                    }
                    // Continue accumulating characters until space is received
                }
            }
        } catch (error) {
            console.error('Morse read error:', error);
            showToast(`Failed to read input: ${error.message}`, 'bg-red-600');
        }
    }

    async function endSession() {
        console.log('Ending session with data:', sessionData);
        sessionActive = false;
        stopSessionTimer();
        
        if (reader) {
            try {
                await reader.cancel();
                reader.releaseLock();
                reader = null;
            } catch (e) {
                console.log('Reader cleanup error:', e);
            }
        }

        // Display session results
        const modeDisplay = {
            realWords: 'Real Words',
            abbreviations: 'Abbreviations',
            callsigns: 'Callsigns',
            qrCodes: 'QR-codes',
            topWords: 'Top Words in CW',
            mixed: 'Mixed'
        }[currentMode] || currentMode;
        
        const accuracy = sessionData.total > 0 ? ((sessionData.correct/sessionData.total)*100).toFixed(2) : '0.00';
        const sessionSummary = sessionData.total > 0
            ? `${modeDisplay} Session Complete: ${sessionData.correct}/${sessionData.total} (${accuracy}%)`
            : 'Session ended with no data';
            
        sessionStats.textContent = sessionSummary;

        // Show detailed results if enhanced tracking is available
        if (hasEnhancedTracking && sessionData.total > 0) {
            const timeSeconds = sessionData.endTime && sessionData.startTime 
                ? (sessionData.endTime - sessionData.startTime) / 1000 
                : 0;
            const detailedResults = `
Session Complete!
Correct: ${sessionData.correct}/${sessionData.total} (${accuracy}%)
Letters: ${sessionData.letters}, Numbers: ${sessionData.numbers}
Signs: ${sessionData.signs}, Errors: ${sessionData.errors}
Time: ${timeSeconds.toFixed(1)}s`;
            
            showToast(detailedResults, 'bg-green-600');
        } else {
            showToast(sessionSummary, 'bg-green-600');
        }

        startButton.classList.remove('hidden');
        nextButton.classList.add('hidden');
        userInput.classList.add('hidden');
        target.textContent = '';
        
        // Show session statistics section
        toggleSection('session-statistics');

        // Save stats - this is critical
        if (sessionData.total > 0) {
            console.log('Attempting to save stats...');
            await trySaveStats();
        } else {
            console.log('No stats to save - session had no attempts');
        }
    }

    async function trySaveStats() {
        const username = sessionStorage.getItem('username');
        if (!username || sessionData.total === 0) {
            console.log('No stats to save');
            return;
        }

        const payload = {
            username,
            mode: currentMode,
            correct: sessionData.correct,
            total: sessionData.total
        };

        // Add enhanced data if available
        if (hasEnhancedTracking) {
            const timeSeconds = sessionData.endTime && sessionData.startTime 
                ? (sessionData.endTime - sessionData.startTime) / 1000 
                : 0;
            const totalCharacters = sessionData.letters + sessionData.numbers + sessionData.signs;
            const cpm = timeSeconds > 0 ? (totalCharacters / timeSeconds) * 60 : 0;
            const wpm = timeSeconds > 0 ? (totalCharacters / 5 / timeSeconds) * 60 : 0; // Standard: 5 chars = 1 word
            
            payload.letters = sessionData.letters;
            payload.numbers = sessionData.numbers;
            payload.signs = sessionData.signs;
            payload.errors = sessionData.errors;
            payload.timeSeconds = parseFloat(timeSeconds.toFixed(3));
            payload.accuracy = parseFloat((sessionData.total > 0 ? ((sessionData.correct / sessionData.total) * 100) : 0).toFixed(2));
            payload.cpm = parseFloat(cpm.toFixed(2));
            payload.wpm = parseFloat(wpm.toFixed(2));
        }

        try {
            console.log('Sending stats payload:', payload);
            const response = await fetch(`${apiBaseUrl}/stats.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Stats save response:', data);

            if (response.ok) {
                showToast('Session stats saved successfully!', 'bg-green-600');
                await fetchHistoricalStats(username);
            } else {
                console.error('Stats save failed:', data);
                showToast(`Failed to save stats: ${data.message}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Stats save error:', error);
            showToast(`Failed to save stats: ${error.message}`, 'bg-red-600');
        }
    }

    startButton.addEventListener('click', async () => {
        if (!port) {
            showToast('Connect to Morserino first.', 'bg-red-600');
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
        
        // Initialize enhanced tracking display if available
        if (hasEnhancedTracking) {
            updateSessionDisplay();
        }
        
        startButton.classList.add('hidden');
        nextButton.classList.remove('hidden');
        userInput.classList.remove('hidden');
        
        await nextTarget();
        readMorseInput();
        showToast('Session started!', 'bg-green-600');
    });

    nextButton.addEventListener('click', async () => {
        sessionData.total++;
        
        if (hasEnhancedTracking) {
            const charAnalysis = analyzeCharacters(currentTarget);
            sessionData.letters += charAnalysis.letters;
            sessionData.numbers += charAnalysis.numbers;
            sessionData.signs += charAnalysis.signs;
            sessionData.targets.push(currentTarget);
            sessionData.responses.push('SKIPPED');
            updateSessionDisplay();
        }
        
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

    // Enhanced tracking button
    if (hasEnhancedTracking && startNewSession) {
        startNewSession.addEventListener('click', () => {
            startNewSession.classList.add('hidden');
            sessionReport.textContent = 'No session completed yet';
            resetSessionCounters();
            sessionTimer.textContent = '00:00.0';
            showToast('Ready for new session!', 'bg-green-600');
        });
    }

    // Initialize
    checkSession();
    
    // Initialize enhanced tracking display if available
    if (hasEnhancedTracking) {
        resetSessionCounters();
        updateSessionDisplay();
        sessionTimer.textContent = '00:00.0';
    }
    
    // Double-check login section visibility after a brief delay
    setTimeout(() => {
        const isLoggedIn = sessionStorage.getItem('username');
        const loginContent = document.getElementById('login-register-content');
        const loggedInDiv = document.getElementById('loggedIn');
        
        console.log('Login check - isLoggedIn:', isLoggedIn, 'loginContent hidden:', loginContent?.classList.contains('hidden'), 'loggedInDiv hidden:', loggedInDiv?.classList.contains('hidden'));
        
        if (isLoggedIn && loggedInDiv && !loggedInDiv.classList.contains('hidden')) {
            // User is logged in, hide login section
            if (loginContent && !loginContent.classList.contains('hidden')) {
                console.log('Hiding login section for logged in user');
                toggleSection('login-register');
            }
        } else if (!isLoggedIn) {
            // User is not logged in, show login section
            if (loginContent && loginContent.classList.contains('hidden')) {
                console.log('Showing login section for non-logged in user');
                toggleSection('login-register');
            }
        }
    }, 1000);
    
    console.log('Morserino Web initialized successfully');
});