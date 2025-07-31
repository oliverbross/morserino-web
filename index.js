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
                letters: 0, numbers: 0, signs: 0, 
                // Character-level tracking (the important metrics)
                charactersAttempted: 0,    // Total characters user attempted to send
                charactersCorrect: 0,      // Characters sent correctly 
                characterErrors: 0,        // Wrong characters sent
                
                // Word-level tracking (for context)
                wordsCompleted: 0,         // Words successfully completed
                wordAttempts: 0,           // Failed word attempts
                currentWordFailed: false,  // Track if current word has had an error
                
                // Legacy compatibility
                errors: 0, correct: 0, total: 0,
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
            
            // Show character accuracy percentage
            const charAccuracy = sessionData.charactersAttempted > 0 
                ? ((sessionData.charactersCorrect / sessionData.charactersAttempted) * 100).toFixed(1)
                : '100.0';
            const characterAccuracyElement = document.getElementById('characterAccuracy');
            if (characterAccuracyElement) {
                characterAccuracyElement.textContent = `${charAccuracy}%`;
            }
            
            // Show character errors count
            errorsCount.textContent = sessionData.characterErrors || 0;
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
                // Hide entire login/register section when logged in
                const loginSection = document.querySelector('[data-id="login-register"]');
                if (loginSection) {
                    loginSection.style.display = 'none';
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

    // Global flag to prevent multiple dashboard loads
    let isDashboardLoading = false;
    let isDashboardLoaded = false;

    // Comprehensive Dashboard Functions
    async function loadTrainingDashboard(username, forceReload = false) {
        // Prevent multiple simultaneous loads
        if (isDashboardLoading) {
            console.log('Dashboard already loading, skipping...');
            return;
        }
        
        // Skip if already loaded unless forced
        if (isDashboardLoaded && !forceReload) {
            console.log('Dashboard already loaded, use forceReload=true to reload');
            return;
        }

        isDashboardLoading = true;
        
        try {
            // Always destroy existing charts before loading new data
            destroyExistingCharts();
            
            const response = await fetch(`${apiBaseUrl}/get_stats.php?username=${encodeURIComponent(username)}&limit=20`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok && Array.isArray(data)) {
                if (data.length === 0) {
                    showEmptyDashboard();
                } else {
                    populatePerformanceOverview(data);
                    populateRecentSessions(data.slice(0, 5));
                    populateProgressCharts(data);
                    populateTrainingInsights(data);
                    populateModePerformance(data);
                }
                isDashboardLoaded = true;
            } else {
                showEmptyDashboard();
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            showEmptyDashboard();
        } finally {
            isDashboardLoading = false;
        }
    }
    
    function destroyExistingCharts() {
        // Destroy accuracy chart
        if (window.accuracyChartInstance) {
            window.accuracyChartInstance.destroy();
            window.accuracyChartInstance = null;
        }
        // Destroy speed chart
        if (window.speedChartInstance) {
            window.speedChartInstance.destroy();
            window.speedChartInstance = null;
        }
        console.log('Existing charts destroyed');
    }

    function showEmptyDashboard() {
        document.getElementById('performanceOverview').innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-400">
                <p class="text-lg">📊 No training data yet</p>
                <p class="text-sm">Complete some training sessions to see your progress!</p>
            </div>
        `;
    }

    function populatePerformanceOverview(data) {
        const overview = document.getElementById('performanceOverview');
        const recent = data.slice(0, 10); // Last 10 sessions
        
        if (recent.length === 0) {
            showEmptyDashboard();
            return;
        }

        // Calculate key metrics
        const avgAccuracy = recent.reduce((sum, s) => {
            const accuracy = s.characters_attempted > 0 
                ? (s.characters_correct / s.characters_attempted) * 100 
                : (s.total > 0 ? (s.correct / s.total) * 100 : 0);
            return sum + accuracy;
        }, 0) / recent.length;

        const avgSpeed = recent.filter(s => s.wpm > 0)
            .reduce((sum, s, _, arr) => sum + s.wpm / arr.length, 0);

        const totalSessions = data.length;
        const totalCharacters = recent.reduce((sum, s) => sum + (s.characters_attempted || s.letters + s.numbers + s.signs), 0);

        overview.innerHTML = `
            <div class="bg-blue-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-300">${avgAccuracy.toFixed(1)}%</div>
                <div class="text-xs text-blue-200">Avg Accuracy</div>
            </div>
            <div class="bg-green-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-300">${avgSpeed.toFixed(1)}</div>
                <div class="text-xs text-green-200">Avg Speed (WPM)</div>
            </div>
            <div class="bg-purple-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-300">${totalSessions}</div>
                <div class="text-xs text-purple-200">Total Sessions</div>
            </div>
            <div class="bg-yellow-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-yellow-300">${totalCharacters}</div>
                <div class="text-xs text-yellow-200">Characters Sent</div>
            </div>
        `;
    }

    function populateRecentSessions(sessions) {
        const container = document.getElementById('recentSessions');
        const modeDisplay = {
            realWords: 'Real Words', abbreviations: 'Abbreviations', 
            callsigns: 'Callsigns', qrCodes: 'QR-codes',
            topWords: 'Top Words in CW', mixed: 'Mixed'
        };

        if (sessions.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">No recent sessions</p>';
            return;
        }

        container.innerHTML = sessions.map(stat => {
            const mode = modeDisplay[stat.mode] || stat.mode;
            const accuracy = stat.characters_attempted > 0 
                ? ((stat.characters_correct / stat.characters_attempted) * 100).toFixed(1)
                : (stat.total > 0 ? ((stat.correct / stat.total) * 100).toFixed(1) : '0.0');
            
            const accuracyColor = accuracy >= 95 ? 'text-green-400' : 
                                 accuracy >= 85 ? 'text-yellow-400' : 'text-red-400';
            
            const speedDisplay = stat.wpm > 0 ? `${stat.wpm} WPM` : 'N/A';
            const date = formatTimestamp(new Date(stat.timestamp));

            return `
                <div class="bg-gray-900 p-4 rounded-lg border-l-4 border-blue-500">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold text-white">${mode}</div>
                            <div class="text-sm text-gray-300">${stat.correct}/${stat.total} words completed</div>
                            <div class="text-xs text-gray-400">${date}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold ${accuracyColor}">${accuracy}%</div>
                            <div class="text-sm text-gray-300">${speedDisplay}</div>
                        </div>
                    </div>
                    ${stat.enhanced ? `
                        <div class="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                            📝 L:${stat.letters} N:${stat.numbers} S:${stat.signs} E:${stat.character_errors || stat.errors}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function populateProgressCharts(data) {
        // Always create fresh charts (old ones were destroyed)
        console.log('Creating fresh charts...');
        createAccuracyChart(data.slice(0, 10).reverse());
        createSpeedChart(data.slice(0, 10).reverse());
    }

    function createAccuracyChart(data) {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx) return;

        // Get the canvas context and clear it completely
        const canvas = ctx.getContext('2d');
        
        // Destroy existing chart instance if it exists
        if (window.accuracyChartInstance) {
            window.accuracyChartInstance.destroy();
            window.accuracyChartInstance = null;
        }

        // Clear the canvas completely
        canvas.clearRect(0, 0, ctx.width, ctx.height);

        const chartData = data.map(stat => {
            return stat.characters_attempted > 0 
                ? ((stat.characters_correct / stat.characters_attempted) * 100).toFixed(1)
                : (stat.total > 0 ? ((stat.correct / stat.total) * 100).toFixed(1) : 0);
        });

        // Create fresh chart (old one was destroyed)
        window.accuracyChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => `Session ${i + 1}`),
                    datasets: [{
                        label: 'Character Accuracy %',
                        data: chartData,
                        borderColor: '#60A5FA',
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            max: 100,
                            grid: { color: '#374151' },
                            ticks: { color: '#9CA3AF' }
                        },
                        x: { 
                            grid: { color: '#374151' },
                            ticks: { color: '#9CA3AF' }
                        }
                    }
                }
            });
    }

    function createSpeedChart(data) {
        const ctx = document.getElementById('speedChart');
        if (!ctx) return;

        // Get the canvas context and clear it completely
        const canvas = ctx.getContext('2d');
        
        // Destroy existing chart instance if it exists
        if (window.speedChartInstance) {
            window.speedChartInstance.destroy();
            window.speedChartInstance = null;
        }

        // Clear the canvas completely
        canvas.clearRect(0, 0, ctx.width, ctx.height);

        const speedData = data.map(stat => stat.wpm || 0);

        // Create fresh chart (old one was destroyed)
        window.speedChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => `Session ${i + 1}`),
                    datasets: [{
                        label: 'WPM',
                        data: speedData,
                        borderColor: '#34D399',
                        backgroundColor: 'rgba(52, 211, 153, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: '#374151' },
                            ticks: { color: '#374151' }
                        },
                        x: { 
                            grid: { color: '#374151' },
                            ticks: { color: '#9CA3AF' }
                        }
                    }
                }
            });
    }

    function populateTrainingInsights(data) {
        const container = document.getElementById('trainingInsights');
        const recent = data.slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="text-gray-400">Complete more sessions for personalized insights!</p>';
            return;
        }

        // Analyze performance trends
        const avgAccuracy = recent.reduce((sum, s) => {
            const acc = s.characters_attempted > 0 
                ? (s.characters_correct / s.characters_attempted) * 100 
                : (s.total > 0 ? (s.correct / s.total) * 100 : 0);
            return sum + acc;
        }, 0) / recent.length;

        const avgSpeed = recent.filter(s => s.wpm > 0)
            .reduce((sum, s, _, arr) => sum + s.wpm / arr.length, 0) || 0;

        let insights = [];
        
        if (avgAccuracy >= 95) {
            insights.push("🎉 Excellent accuracy! You're mastering character recognition.");
        } else if (avgAccuracy >= 85) {
            insights.push("👍 Good accuracy. Focus on consistency to reach 95%+.");
        } else {
            insights.push("💪 Work on accuracy first before increasing speed. Aim for 85%+.");
        }

        if (avgSpeed >= 20) {
            insights.push("⚡ Great speed! You're operating at advanced level.");
        } else if (avgSpeed >= 15) {
            insights.push("📈 Good speed progress. Push towards 20+ WPM.");
        } else if (avgSpeed >= 10) {
            insights.push("🚀 Building good speed foundation. Keep practicing!");
        } else if (avgSpeed > 0) {
            insights.push("🎯 Focus on smooth, consistent sending for better speed.");
        }

        // Mode recommendations
        const modeStats = {};
        recent.forEach(s => {
            if (!modeStats[s.mode]) modeStats[s.mode] = [];
            modeStats[s.mode].push(s);
        });

        const worstMode = Object.entries(modeStats).reduce((worst, [mode, sessions]) => {
            const avgAcc = sessions.reduce((sum, s) => {
                const acc = s.characters_attempted > 0 
                    ? (s.characters_correct / s.characters_attempted) * 100 
                    : (s.total > 0 ? (s.correct / s.total) * 100 : 0);
                return sum + acc;
            }, 0) / sessions.length;
            return avgAcc < worst.accuracy ? { mode, accuracy: avgAcc } : worst;
        }, { mode: null, accuracy: 100 });

        if (worstMode.mode && worstMode.accuracy < 90) {
            const modeNames = {
                realWords: 'Real Words', abbreviations: 'Abbreviations',
                callsigns: 'Callsigns', qrCodes: 'QR-codes',
                topWords: 'Top Words', mixed: 'Mixed'
            };
            insights.push(`🎯 Consider more practice with ${modeNames[worstMode.mode] || worstMode.mode} (${worstMode.accuracy.toFixed(1)}% accuracy).`);
        }

        container.innerHTML = `
            <div class="space-y-2">
                ${insights.map(insight => `<p class="text-sm text-gray-300">• ${insight}</p>`).join('')}
            </div>
        `;
    }

    function populateModePerformance(data) {
        const container = document.getElementById('modePerformance');
        const modeStats = {};
        const modeNames = {
            realWords: 'Real Words', abbreviations: 'Abbreviations',
            callsigns: 'Callsigns', qrCodes: 'QR-codes',
            topWords: 'Top Words', mixed: 'Mixed'
        };

        // Group by mode
        data.forEach(stat => {
            if (!modeStats[stat.mode]) {
                modeStats[stat.mode] = { sessions: 0, totalAccuracy: 0, totalSpeed: 0, speedCount: 0 };
            }
            modeStats[stat.mode].sessions++;
            const accuracy = stat.characters_attempted > 0 
                ? (stat.characters_correct / stat.characters_attempted) * 100 
                : (stat.total > 0 ? (stat.correct / stat.total) * 100 : 0);
            modeStats[stat.mode].totalAccuracy += accuracy;
            if (stat.wpm > 0) {
                modeStats[stat.mode].totalSpeed += stat.wpm;
                modeStats[stat.mode].speedCount++;
            }
        });

        if (Object.keys(modeStats).length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center">No mode data available</p>';
            return;
        }

        container.innerHTML = Object.entries(modeStats).map(([mode, stats]) => {
            const avgAccuracy = (stats.totalAccuracy / stats.sessions).toFixed(1);
            const avgSpeed = stats.speedCount > 0 ? (stats.totalSpeed / stats.speedCount).toFixed(1) : '0.0';
            const accuracyColor = avgAccuracy >= 95 ? 'bg-green-600' : 
                                 avgAccuracy >= 85 ? 'bg-yellow-600' : 'bg-red-600';

            return `
                <div class="bg-gray-900 p-3 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-white">${modeNames[mode] || mode}</span>
                        <span class="text-sm text-gray-400">${stats.sessions} sessions</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex-1">
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-gray-400">Accuracy</span>
                                <span class="text-white">${avgAccuracy}%</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-2">
                                <div class="${accuracyColor} h-2 rounded-full" style="width: ${avgAccuracy}%"></div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-semibold text-blue-400">${avgSpeed} WPM</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Legacy function for compatibility
    async function fetchHistoricalStats(username, forceReload = false) {
        await loadTrainingDashboard(username, forceReload);
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
                // Hide entire login/register section after successful login
                const loginSection = document.querySelector('[data-id="login-register"]');
                if (loginSection) {
                    loginSection.style.display = 'none';
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
                // Hide entire login/register section after successful registration
                const loginSection = document.querySelector('[data-id="login-register"]');
                if (loginSection) {
                    loginSection.style.display = 'none';
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
                // Clear dashboard on logout
                document.getElementById('performanceOverview').innerHTML = '';
                document.getElementById('recentSessions').innerHTML = '';
                document.getElementById('trainingInsights').innerHTML = '';
                document.getElementById('modePerformance').innerHTML = '';
                // Destroy charts and reset flags
                destroyExistingCharts();
                isDashboardLoaded = false;
                isDashboardLoading = false;
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
        // Reset word failure flag for new word
        if (sessionData) sessionData.currentWordFailed = false;
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
                    
                    console.log('Received char:', char, 'ASCII:', char.charCodeAt(0), 'Current target:', currentTarget, 'Buffer:', inputBuffer);
                    
                    // Skip spaces - Morserino sends space after each character
                    if (char === ' ') {
                        console.log('⚠️ Ignoring space character from Morserino');
                        continue;
                    }
                    
                    const upperChar = char.toUpperCase();
                    const expectedChar = currentTarget[inputBuffer.length];
                    
                    // Check if this character matches the expected character at this position
                    if (upperChar === expectedChar) {
                        // Correct character at this position
                        inputBuffer += upperChar;
                        userInput.value = inputBuffer;
                        
                        // Track character-level accuracy
                        if (hasEnhancedTracking) {
                            sessionData.charactersAttempted++;
                            sessionData.charactersCorrect++;
                            updateSessionDisplay();
                        }
                        
                        console.log('✅ Correct char:', upperChar, 'at position', inputBuffer.length - 1, 'Buffer now:', inputBuffer);
                        
                        // Evaluate when buffer length matches target length
                        if (inputBuffer.length === currentTarget.length) {
                            console.log('🎯 Word complete - Evaluating:', inputBuffer, 'vs', currentTarget);
                            
                            // Word is complete and correct
                            sessionData.correct++;        // Legacy
                            sessionData.total++;          // Legacy  
                            sessionData.wordsCompleted++; // New word tracking
                            // Reset word failure flag for next word
                            sessionData.currentWordFailed = false;
                            
                            if (hasEnhancedTracking) {
                                const charAnalysis = analyzeCharacters(currentTarget);
                                sessionData.letters += charAnalysis.letters;
                                sessionData.numbers += charAnalysis.numbers;
                                sessionData.signs += charAnalysis.signs;
                                sessionData.targets.push(currentTarget);
                                sessionData.responses.push(inputBuffer);
                                updateSessionDisplay();
                                console.log('✅ Word complete! Updated session data:', sessionData);
                            }
                            
                            showToast(`✅ Correct! "${inputBuffer}" (${sessionData.correct}/${sessionData.total})`, 'bg-green-600');
                            inputBuffer = '';
                            userInput.value = '';
                            
                            // Check if session should end
                            if (sessionData.total >= maxItems) {
                                console.log('🏁 Session complete, ending...');
                                await endSession();
                                return;
                            } else {
                                // Immediate next target for natural CW flow
                                nextTarget().catch(console.error);
                            }
                        }
                    } else {
                        // Wrong character at this position - reset and start over
                        console.log('❌ Wrong char:', upperChar, 'expected:', expectedChar, 'at position', inputBuffer.length, '- resetting word');
                        
                        if (hasEnhancedTracking) {
                            // Track character-level error
                            sessionData.charactersAttempted++;
                            sessionData.characterErrors++;
                            sessionData.errors++; // Keep for compatibility
                            updateSessionDisplay();
                        }
                        
                        // Mark this as a failed word attempt if we haven't already for this target
                        if (!sessionData.currentWordFailed) {
                            sessionData.wordAttempts++;
                            sessionData.currentWordFailed = true;
                            console.log('🔴 Word attempt failed, wordAttempts now:', sessionData.wordAttempts);
                        }
                        
                        // Start fresh with this character
                        if (upperChar === currentTarget[0]) {
                            // This character matches the first character, start building from here
                            inputBuffer = upperChar;
                            userInput.value = inputBuffer;
                            showToast(`❌ Wrong position! Starting over with "${upperChar}"`, 'bg-orange-600');
                            console.log('🔄 Starting fresh with correct first char:', upperChar);
                        } else {
                            // This character doesn't match the first character either, reset completely
                            inputBuffer = '';
                            userInput.value = '';
                            showToast(`❌ Wrong char "${upperChar}"! Expected "${expectedChar}". Try again.`, 'bg-red-600');
                            console.log('🔄 Complete reset - wrong first char');
                        }
                        
                        // Add visual feedback - shake the target
                        target.style.animation = 'shake 0.5s ease-in-out';
                        setTimeout(() => {
                            target.style.animation = '';
                        }, 500);
                    }
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
        
        // Display session summary with character-level accuracy
        const charAccuracy = sessionData.charactersAttempted > 0 
            ? ((sessionData.charactersCorrect / sessionData.charactersAttempted) * 100).toFixed(2)
            : '100.00';
        const sessionSummary = sessionData.total > 0
            ? `${modeDisplay} Session: ${sessionData.total} words completed. Character accuracy: ${charAccuracy}% (${sessionData.charactersCorrect}/${sessionData.charactersAttempted}). Character errors: ${sessionData.characterErrors || sessionData.errors}`
            : 'Session ended with no data';
            
        sessionStats.textContent = sessionSummary;
        
        // Show detailed session report
        if (hasEnhancedTracking && sessionData.total > 0) {
            const timeSeconds = sessionData.endTime && sessionData.startTime 
                ? (sessionData.endTime - sessionData.startTime) / 1000 
                : 0;
            const cpm = timeSeconds > 0 ? ((sessionData.letters + sessionData.numbers + sessionData.signs) / timeSeconds) * 60 : 0;
            const wpm = timeSeconds > 0 ? ((sessionData.letters + sessionData.numbers + sessionData.signs) / 5 / timeSeconds) * 60 : 0;
            
            // Update session report section
            const sessionReport = document.getElementById('sessionReport');
            if (sessionReport) {
                const reportText = `
📊 Session Complete: ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mode: ${modeDisplay}
Words Completed: ${sessionData.total}
Character Accuracy: ${charAccuracy}% (${sessionData.charactersCorrect}/${sessionData.charactersAttempted})
Character Errors: ${sessionData.characterErrors || sessionData.errors}
Total Characters: ${sessionData.letters + sessionData.numbers + sessionData.signs}
Time: ${timeSeconds.toFixed(1)}s
Speed: ${cpm.toFixed(1)} CPM / ${wpm.toFixed(1)} WPM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Character Breakdown:
• Letters: ${sessionData.letters}
• Numbers: ${sessionData.numbers}  
• Signs: ${sessionData.signs}
• Character Errors: ${sessionData.characterErrors || sessionData.errors}`;
                sessionReport.textContent = reportText;
                
                // Show session report section if it's hidden
                const sessionReportContent = document.getElementById('session-report-content');
                if (sessionReportContent && sessionReportContent.classList.contains('hidden')) {
                    toggleSection('session-report');
                }
            }
            
            // Create detailed session modal
            const reportDiv = document.createElement('div');
            reportDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            reportDiv.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 text-white">
                    <h3 class="text-xl font-bold mb-4 text-center">🎯 Session Complete!</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Mode:</span>
                            <span class="font-semibold">${modeDisplay}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Words Completed:</span>
                            <span class="font-semibold text-green-400">${sessionData.total}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Character Accuracy:</span>
                            <span class="font-semibold text-blue-400">${charAccuracy}% (${sessionData.charactersCorrect}/${sessionData.charactersAttempted})</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Character Errors:</span>
                            <span class="font-semibold text-red-400">${sessionData.characterErrors || sessionData.errors}</span>  
                        </div>
                        <div class="flex justify-between">
                            <span>Time:</span>
                            <span class="font-semibold">${timeSeconds.toFixed(1)}s</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Speed (CPM):</span>
                            <span class="font-semibold text-yellow-400">${cpm.toFixed(1)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Speed (WPM):</span>
                            <span class="font-semibold text-yellow-400">${wpm.toFixed(1)}</span>
                        </div>
                        <hr class="border-gray-600">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="text-center">
                                <div class="text-blue-400 font-semibold">${sessionData.letters}</div>
                                <div>Letters</div>
                            </div>
                            <div class="text-center">
                                <div class="text-green-400 font-semibold">${sessionData.numbers}</div>
                                <div>Numbers</div>
                            </div>
                            <div class="text-center">
                                <div class="text-purple-400 font-semibold">${sessionData.signs}</div>
                                <div>Signs</div>
                            </div>
                            <div class="text-center">
                                <div class="text-red-400 font-semibold">${sessionData.characterErrors || sessionData.errors}</div>
                                <div>Char Errors</div>
                            </div>
                        </div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                        Close
                    </button>
                </div>
            `;
            document.body.appendChild(reportDiv);
            
            showToast('Session saved successfully!', 'bg-green-600');
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
            // Calculate character-level accuracy for database
            const charAccuracy = sessionData.charactersAttempted > 0 
                ? (sessionData.charactersCorrect / sessionData.charactersAttempted) * 100 
                : 100;
            payload.accuracy = parseFloat(charAccuracy.toFixed(2));
            
            // Add new character-level metrics
            payload.charactersAttempted = sessionData.charactersAttempted || 0;
            payload.charactersCorrect = sessionData.charactersCorrect || 0;
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
                await fetchHistoricalStats(username, true); // Force reload after session save
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

        // Reset everything for new session
        maxItems = numItemsValue;
        sessionActive = true;
        inputBuffer = '';
        userInput.value = '';
        target.textContent = '';
        
        resetSessionCounters();
        startSessionTimer();
        
        // Initialize enhanced tracking display if available
        if (hasEnhancedTracking) {
            updateSessionDisplay();
        }
        
        startButton.classList.add('hidden');
        nextButton.classList.remove('hidden');
        userInput.classList.remove('hidden');
        
        console.log('🚀 Starting new session with', maxItems, 'items in mode:', currentMode);
        await nextTarget();
        readMorseInput();
        showToast('Session started! Send Morse code, system evaluates when word is complete.', 'bg-green-600');
    });

    nextButton.addEventListener('click', async () => {
        sessionData.total++;
        
        if (hasEnhancedTracking) {
            // Skipping counts as a failed word attempt
            sessionData.wordAttempts++;
            const charAnalysis = analyzeCharacters(currentTarget);
            sessionData.letters += charAnalysis.letters;
            sessionData.numbers += charAnalysis.numbers;
            sessionData.signs += charAnalysis.signs;
            sessionData.targets.push(currentTarget);
            sessionData.responses.push('SKIPPED');
            updateSessionDisplay();
            console.log('📝 Word skipped, wordAttempts now:', sessionData.wordAttempts);
        }
        
        // Reset input buffer and display
        inputBuffer = '';
        userInput.value = '';
        showToast('Skipped to next target', 'bg-yellow-600');
        
        if (sessionData.total >= maxItems) {
            console.log('🏁 Session complete via skip, ending...');
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
    
    // Expand all sections by default
    setTimeout(() => {
        const allSections = ['mode-selection', 'connection', 'training', 'live-tracking', 'session-report', 'session-statistics'];
        allSections.forEach(sectionId => {
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
            if (content && content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                if (icon) icon.classList.add('rotate-180');
                console.log(`Expanded section: ${sectionId}`);
            }
        });
    }, 200);

    // Double-check login section visibility after a brief delay
    setTimeout(() => {
        const isLoggedIn = sessionStorage.getItem('username');
        const loginSection = document.querySelector('[data-id="login-register"]');
        const loginContent = document.getElementById('login-register-content');
        const loggedInDiv = document.getElementById('loggedIn');
        const notLoggedInDiv = document.getElementById('notLoggedIn');
        
        console.log('Login check - isLoggedIn:', isLoggedIn, 'loginContent hidden:', loginContent?.classList.contains('hidden'), 'loggedInDiv hidden:', loggedInDiv?.classList.contains('hidden'));
        
        if (isLoggedIn && loggedInDiv && !loggedInDiv.classList.contains('hidden')) {
            // User is logged in, hide entire login section
            if (loginSection) {
                loginSection.style.display = 'none';
                console.log('Hiding entire login section for logged in user');
            }
        } else if (!isLoggedIn) {
            // User is not logged in, show login section
            if (loginSection) {
                loginSection.style.display = 'block';
                console.log('Showing login section for non-logged in user');
            }
            if (loginContent && loginContent.classList.contains('hidden')) {
                toggleSection('login-register');
            }
        }
    }, 1000);
    
    console.log('Morserino Web initialized successfully');
});