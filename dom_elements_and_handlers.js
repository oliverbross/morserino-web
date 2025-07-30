document.addEventListener('DOMContentLoaded', () => {
    // Check for secure context
    if (!window.isSecureContext) {
        alert('This application requires a secure context (HTTPS or localhost). Registration, login, and serial port access may not work correctly.');
        console.error('Non-secure context detected. Crypto and Serial APIs may not be available.');
    }

    // DOM elements
    const connectButton = document.getElementById('connectButton');
    const portStatus = document.getElementById('portStatus');
    const modeSelect = document.getElementById('modeSelect');
    const numItems = document.getElementById('numItems');
    const startButton = document.getElementById('startButton');
    const trainingArea = document.getElementById('trainingArea');
    const targetText = document.getElementById('targetText');
    const inputText = document.getElementById('inputText');
    const feedback = document.getElementById('feedback');
    const nextButton = document.getElementById('nextButton');
    const authSection = document.getElementById('authSection');
    const mainSection = document.getElementById('mainSection');
    const statsArea = document.getElementById('statsArea');
    const statsSummary = document.getElementById('statsSummary');
    const statsHistory = document.getElementById('statsHistory');
    const backButton = document.getElementById('backButton');
    const registerButton = document.getElementById('registerButton');
    const loginButton = document.getElementById('loginButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userCallsignInput = document.getElementById('userCallsign');
    const accountButton = document.getElementById('accountButton');
    const logoutButton = document.getElementById('logoutButton');
    const statsChartCanvas = document.getElementById('statsChart');

    let port = null;
    let reader = null;
    let currentTarget = '';
    let userInput = '';
    let sessionItems = [];
    let currentIndex = 0;
    let correctCount = 0;
    let itemsPresented = 0;
    let stats = null;
    let currentUsername = '';
    let isProcessingInput = false;
    let statsChart = null;

    // Base URL for PHP API calls
    const apiBaseUrl = '/morserino/api';

    // Debug: Verify DOM elements
    const requiredElements = [
        { id: 'registerButton', element: registerButton },
        { id: 'loginButton', element: loginButton },
        { id: 'connectButton', element: connectButton },
        { id: 'logoutButton', element: logoutButton },
        { id: 'accountButton', element: accountButton },
        { id: 'statsChart', element: statsChartCanvas }
    ];
    requiredElements.forEach(({ id, element }) => {
        if (!element) console.error(`${id} not found in DOM`);
    });

    // Check for existing session
    async function checkSession() {
        try {
            const response = await fetch(`${apiBaseUrl}/session.php`, { method: 'GET', credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.username) {
                    currentUsername = data.username;
                    stats = new Stats(currentUsername);
                    authSection.classList.add('hidden');
                    mainSection.classList.remove('hidden');
                    const statsData = await stats.getStats();
                    statsHistory.innerHTML = stats.formatStats(statsData) || 'No session history yet.';
                    updateStatsChart(statsData);
                    console.log('Restored session for user:', currentUsername);
                } else {
                    console.log('No valid session found, showing login screen');
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }
    checkSession();

    // Chart.js setup
    function updateStatsChart(sessions) {
        if (!statsChartCanvas) return;
        const labels = sessions.map((_, index) => `Session ${index + 1}`);
        const correctData = sessions.map(session => session.correct);
        const totalData = sessions.map(session => session.total - session.correct);

        if (statsChart) statsChart.destroy();
        statsChart = new Chart(statsChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Correct',
                        data: correctData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Incorrect',
                        data: totalData,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Items' } }
                },
                plugins: {
                    title: { display: true, text: 'Session Statistics' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const session = sessions[context.dataIndex];
                                return `${context.dataset.label}: ${context.raw} (${session.mode}, ${session.date})`;
                            }
                        }
                    }
                }
            }
        });
        console.log('Stats chart updated with', sessions.length, 'sessions');
    }

    // Register button handler
    registerButton.addEventListener('click', async () => {
        console.log('Register button clicked');
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        console.log('Username:', username, 'Password length:', password.length);
        if (username && password) {
            try {
                const response = await fetch(`${apiBaseUrl}/register.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });
                if (response.ok) {
                    alert('Registered successfully! Please login.');
                    console.log('Registration successful for user:', username);
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    const error = await response.json();
                    alert(error.message || 'Registration failed.');
                    console.log('Registration failed:', error.message);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again in a secure context (HTTPS or localhost).');
            }
        } else {
            alert('Please enter username and password.');
            console.log('Registration failed: Missing username or password');
        }
    });

    // Login button handler
    loginButton.addEventListener('click', async () => {
        console.log('Login button clicked');
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        try {
            const response = await fetch(`${apiBaseUrl}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            if (response.ok) {
                currentUsername = username;
                stats = new Stats(username);
                authSection.classList.add('hidden');
                mainSection.classList.remove('hidden');
                const statsData = await stats.getStats();
                statsHistory.innerHTML = stats.formatStats(statsData) || 'No session history yet.';
                updateStatsChart(statsData);
                console.log('Login successful, main section should be visible');
            } else {
                const error = await response.json();
                alert(error.message || 'Invalid username or password.');
                console.log('Login failed:', error.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again in a secure context (HTTPS or localhost).');
        }
    });

    // Logout handler
    async function logout() {
        console.log('Logout initiated');
        try {
            await fetch(`${apiBaseUrl}/logout.php`, { method: 'POST', credentials: 'include' });
            if (port) {
                await closePort(port);
                port = null;
            }
            currentUsername = '';
            stats = null;
            authSection.classList.remove('hidden');
            mainSection.classList.add('hidden');
            usernameInput.value = '';
            passwordInput.value = '';
            portStatus.textContent = 'No port connected';
            portStatus.classList.add('text-gray-600');
            portStatus.classList.remove('text-green-600', 'text-red-600');
            startButton.disabled = true;
            if (statsChart) statsChart.destroy();
            console.log('Logout complete');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
        }
    }

    logoutButton.addEventListener('click', logout);

    // Account management navigation
    accountButton.addEventListener('click', () => {
        console.log('Account button clicked, navigating to account.html');
        if (!currentUsername) {
            alert('Please log in to access account management.');
            console.log('Navigation to account.html blocked: No currentUsername');
            return;
        }
        window.location.href = 'account.html';
    });

    // Close port helper function
    async function closePort(portToClose) {
        try {
            if (portToClose && (portToClose.readable || portToClose.writable)) {
                console.log('Closing existing port');
                await portToClose.close();
            }
        } catch (error) {
            console.error('Error closing port:', error);
        }
    }

    // Connect button handler
    connectButton.addEventListener('click', async () => {
        console.log('Connect button clicked');
        try {
            if (!('serial' in navigator)) {
                throw new Error('Web Serial API not supported in this browser.');
            }

            port = await navigator.serial.requestPort();
            console.log('Selected port:', port);

            await closePort(port);

            let attempts = 0;
            const maxAttempts = 3;
            while (attempts < maxAttempts) {
                try {
                    await port.open({
                        baudRate: 115200,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        flowControl: 'none'
                    });
                    console.log('Port opened successfully');
                    break;
                } catch (error) {
                    attempts++;
                    console.error(`Attempt ${attempts} failed:`, error);
                    if (attempts === maxAttempts) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            portStatus.textContent = 'Connected to Morserino';
            portStatus.classList.remove('text-gray-600', 'text-red-600');
            portStatus.classList.add('text-green-600');
            startButton.disabled = false;
            startReading();
        } catch (error) {
            console.error('Error connecting to port:', error);
            let errorMessage = 'Error: ' + error.message;
            if (error.message.includes('Failed to open serial port')) {
                errorMessage += '\nEnsure the Morserino is connected, the CP2102 driver is installed (download from https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers), and no other application is using the port (e.g., another browser tab, Arduino IDE, or terminal emulator). Try a different USB cable or port.';
            } else if (error.message.includes('Web Serial API not supported')) {
                errorMessage += '\nUse a browser like Chrome or Edge that supports the Web Serial API.';
            }
            portStatus.textContent = errorMessage;
            portStatus.classList.add('text-red-600');
            startButton.disabled = true;
        }
    });

    async function startReading() {
        try {
            const decoder = new TextDecoder();
            reader = port.readable.getReader();
            let inputBuffer = '';
            while (port.readable) {
                try {
                    const { value, done } = await reader.read();
                    if (done) {
                        console.log('Reader canceled');
                        reader.releaseLock();
                        break;
                    }
                    if (value) {
                        inputBuffer += decoder.decode(value).trim().toUpperCase();
                        console.log('Raw input received:', inputBuffer);
                        inputText.textContent = inputBuffer;
                        if (inputBuffer.length >= currentTarget.length && !isProcessingInput) {
                            userInput = inputBuffer.slice(0, currentTarget.length);
                            inputBuffer = inputBuffer.slice(currentTarget.length);
                            console.log('Processed input:', userInput, 'Remaining buffer:', inputBuffer);
                            checkInput();
                        }
                    }
                } catch (error) {
                    console.error('Read error:', error);
                    portStatus.textContent = `Read error: ${error.message}`;
                    portStatus.classList.add('text-red-600');
                    break;
                }
            }
        } catch (error) {
            console.error('Error starting reader:', error);
            portStatus.textContent = `Error reading: ${error.message}`;
            portStatus.classList.add('text-red-600');
        } finally {
            if (reader) {
                reader.releaseLock();
                reader = null;
            }
        }
    }

    startButton.addEventListener('click', () => {
        const mode = modeSelect.value;
        const count = parseInt(numItems.value);
        if (count < 1 || count > 100) {
            alert('Please select 1-100 items.');
            return;
        }
        sessionItems = mode === 'qso' ? generateQSO(userCallsignInput.value.trim() || 'KK6M') :
                      mode === 'callsigns' ? generateCallsigns().slice(0, count) :
                      shuffleArray(words).slice(0, count);
        currentIndex = 0;
        correctCount = 0;
        itemsPresented = 0;
        trainingArea.classList.remove('hidden');
        statsArea.classList.add('hidden');
        console.log('Starting training session with', sessionItems.length, 'items in mode:', mode, 'Items:', sessionItems);
        nextTarget();
    });

    function nextTarget() {
        console.log('nextTarget called, currentIndex:', currentIndex, 'sessionItems.length:', sessionItems.length, 'correctCount:', correctCount, 'itemsPresented:', itemsPresented);
        if (currentIndex >= sessionItems.length) {
            trainingArea.classList.add('hidden');
            statsArea.classList.remove('hidden');
            stats.addSession(correctCount, itemsPresented, modeSelect.value);
            statsSummary.innerHTML = stats.formatLastSession();
            const statsData = stats.getStats();
            statsHistory.innerHTML = stats.formatStats(statsData) || 'No session history yet.';
            updateStatsChart(statsData);
            console.log('Session completed:', correctCount, 'correct out of', itemsPresented, 'presented out of', sessionItems.length, 'in mode:', modeSelect.value);
            return;
        }
        currentTarget = sessionItems[currentIndex].toUpperCase();
        targetText.textContent = currentTarget;
        userInput = '';
        inputText.textContent = '';
        feedback.textContent = '';
        itemsPresented++;
        console.log('Current target:', currentTarget, 'Index:', currentIndex, 'Total items:', sessionItems.length, 'Items presented:', itemsPresented);
    }

    function checkInput() {
        if (isProcessingInput) {
            console.log('checkInput skipped: already processing input');
            return;
        }
        isProcessingInput = true;
        console.log('checkInput called, userInput:', userInput, 'currentTarget:', currentTarget, 'currentIndex:', currentIndex, 'itemsPresented:', itemsPresented);
        try {
            if (userInput.length >= currentTarget.length) {
                if (userInput === currentTarget) {
                    feedback.textContent = 'Correct!';
                    feedback.classList.remove('text-red-600');
                    feedback.classList.add('text-green-600');
                    correctCount++;
                    console.log('Correct input, Correct count:', correctCount, 'Index before increment:', currentIndex, 'Items presented:', itemsPresented);
                    currentIndex++;
                    setTimeout(() => {
                        nextTarget();
                        isProcessingInput = false;
                    }, 1000);
                } else {
                    feedback.textContent = 'Incorrect, try again!';
                    feedback.classList.remove('text-green-600');
                    feedback.classList.add('text-red-600');
                    userInput = '';
                    inputText.textContent = inputBuffer;
                    console.log('Incorrect input, resetting user input, staying on index:', currentIndex);
                    isProcessingInput = false;
                }
            } else {
                console.log('Input too short, waiting for more characters');
                isProcessingInput = false;
            }
        } catch (error) {
            console.error('Error in checkInput:', error);
            isProcessingInput = false;
        }
    }

    nextButton.addEventListener('click', () => {
        console.log('Next button clicked, advancing to index:', currentIndex + 1, 'Items presented:', itemsPresented);
        currentIndex++;
        nextTarget();
    });

    backButton.addEventListener('click', () => {
        statsArea.classList.add('hidden');
        trainingArea.classList.remove('hidden');
        console.log('Back to training clicked');
        nextTarget();
    });
});