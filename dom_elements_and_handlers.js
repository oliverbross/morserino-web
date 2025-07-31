document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = '/morserino/api';
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const logoutButton = document.getElementById('logoutButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const connectButton = document.getElementById('connectButton');
    const portStatus = document.getElementById('portStatus');
    const modeSelect = document.getElementById('modeSelect');
    const numItemsInput = document.getElementById('numItems');
    const startButton = document.getElementById('startButton');
    const statsChartCanvas = document.getElementById('statsChart');
    const loginForm = document.getElementById('loginForm');
    const mainContent = document.getElementById('mainContent');
    const accountDetails = document.getElementById('accountDetails');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const trainingArea = document.getElementById('trainingArea');
    const targetText = document.getElementById('targetText');
    const inputText = document.getElementById('inputText');
    const feedback = document.getElementById('feedback');
    const nextButton = document.getElementById('nextButton');
    const statsArea = document.getElementById('statsArea');
    const statsSummary = document.getElementById('statsSummary');
    const backButton = document.getElementById('backButton');
    let port = null;
    let reader = null;
    let writer = null;
    let chartInstance = null;
    let sessionItems = [];
    let currentIndex = 0;
    let correctCount = 0;
    let itemsPresented = 0;
    let currentTarget = '';
    let userInput = '';
    let isProcessingInput = false;

    // Words are now fetched from target.php API which uses words.txt file

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function generateCallsigns() {
        const prefixes = ['K', 'W', 'N', 'A'];
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const suffixes = ['ABC', 'XYZ', 'QRS', 'DEF', 'MNO'];
        const callsigns = [];
        for (let i = 0; i < 50; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            callsigns.push(prefix + number + suffix);
        }
        return callsigns;
    }

    function generateQSO(callsign) {
        const qsoTemplates = [
            `${callsign} DE K1ABC CQ CQ CQ`,
            `CQ CQ CQ DE ${callsign}`,
            `${callsign} QSO W1XYZ`,
            `RST 599 DE ${callsign}`
        ];
        return shuffleArray(qsoTemplates);
    }

    function generateCodeGroups() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const groups = [];
        for (let i = 0; i < 50; i++) {
            let group = '';
            for (let j = 0; j < 5; j++) {
                group += chars[Math.floor(Math.random() * chars.length)];
            }
            groups.push(group);
        }
        return groups;
    }

    if (!window.isSecureContext) {
        alert('This application requires a secure context (HTTPS or localhost).');
        console.error('Non-secure context detected. Serial API may not be available.');
    }

    async function checkSession() {
        try {
            console.log('Checking session');
            const response = await fetch(`${apiBaseUrl}/session.php`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Session response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok && data.username) {
                console.log('User logged in:', data.username);
                sessionStorage.setItem('username', data.username);
                if (loginForm && mainContent && accountDetails) {
                    loginForm.style.display = 'none';
                    mainContent.style.display = 'block';
                    accountDetails.style.display = 'block';
                    usernameDisplay.textContent = `Logged in as: ${data.username}`;
                }
                fetchStats(data.username);
            } else {
                console.error('Session check failed:', data.message || 'Unknown error');
                sessionStorage.removeItem('username');
                if (loginForm && mainContent && accountDetails) {
                    loginForm.style.display = 'block';
                    mainContent.style.display = 'none';
                    accountDetails.style.display = 'none';
                    usernameDisplay.textContent = 'Not logged in';
                }
            }
        } catch (error) {
            console.error('Session check error:', error.message);
            sessionStorage.removeItem('username');
            if (loginForm && mainContent && accountDetails) {
                loginForm.style.display = 'block';
                mainContent.style.display = 'none';
                accountDetails.style.display = 'none';
                usernameDisplay.textContent = 'Not logged in';
            }
        }
    }
    checkSession();

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            alert('Please enter username and password.');
            return;
        }
        try {
            console.log('Attempting login for:', username);
            const response = await fetch(`${apiBaseUrl}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Login response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok) {
                alert('Login successful!');
                sessionStorage.setItem('username', username);
                if (loginForm && mainContent && accountDetails) {
                    loginForm.style.display = 'none';
                    mainContent.style.display = 'block';
                    accountDetails.style.display = 'block';
                    usernameDisplay.textContent = `Logged in as: ${username}`;
                }
                checkSession();
            } else {
                console.error('Login failed:', data.message || 'Unknown error');
                alert(`Login failed: ${data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error('Login error:', error.message);
            alert(`Login failed: Network error - ${error.message}`);
        }
    });

    registerButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            alert('Please enter username and password.');
            return;
        }
        try {
            console.log('Attempting registration for:', username);
            const response = await fetch(`${apiBaseUrl}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Register response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok) {
                alert('Registration successful! Please log in.');
            } else {
                console.error('Registration failed:', data.message || 'Unknown error');
                alert(`Registration failed: ${data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error('Registration error:', error.message);
            alert(`Registration failed: Network error - ${error.message}`);
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            console.log('Logging out');
            const response = await fetch(`${apiBaseUrl}/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Logout response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok) {
                sessionStorage.removeItem('username');
                if (port) {
                    await closePort(port);
                    port = null;
                    portStatus.textContent = 'No port connected';
                    portStatus.classList.remove('text-green-600', 'text-red-600');
                    startButton.disabled = true;
                }
                if (loginForm && mainContent && accountDetails) {
                    loginForm.style.display = 'block';
                    mainContent.style.display = 'none';
                    accountDetails.style.display = 'none';
                    usernameDisplay.textContent = 'Not logged in';
                }
                trainingArea.style.display = 'none';
                statsArea.style.display = 'none';
                alert('Logged out successfully!');
            } else {
                console.error('Logout failed:', data.message || 'Unknown error');
                alert(`Logout failed: ${data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error('Logout error:', error.message);
            alert('Logout failed: Network error.');
        }
    });

    async function closePort(portToClose) {
        try {
            if (portToClose && portToClose.readable) {
                console.log('Closing existing port');
                if (reader) {
                    await reader.cancel();
                    reader.releaseLock();
                    reader = null;
                }
                if (writer) {
                    writer.releaseLock();
                    writer = null;
                }
                await portToClose.close();
            }
        } catch (error) {
            console.error('Error closing port:', error);
        }
    }

    connectButton.addEventListener('click', async () => {
        try {
            console.log('Connecting to Morserino');
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
                    portStatus.textContent = 'Connected to Morserino';
                    portStatus.classList.remove('text-red-600');
                    portStatus.classList.add('text-green-600');
                    startButton.disabled = false;
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
        } catch (error) {
            console.error('Error connecting to port:', error);
            let errorMessage = 'Failed to connect to Morserino: ' + error.message;
            if (error.message.includes('Failed to open serial port')) {
                errorMessage += '\nEnsure the Morserino is connected, the CP2102 driver is installed (download from https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers), and no other application is using the port.';
            } else if (error.message.includes('Web Serial API not supported')) {
                errorMessage += '\nUse a browser like Chrome or Edge that supports the Web Serial API.';
            }
            portStatus.textContent = errorMessage;
            portStatus.classList.add('text-red-600');
            portStatus.classList.remove('text-green-600');
            startButton.disabled = true;
            alert(errorMessage);
        }
    });

    startButton.addEventListener('click', async () => {
        const mode = modeSelect.value;
        const numItems = parseInt(numItemsInput.value) || 5;
        if (numItems < 1 || numItems > 100) {
            alert('Please select 1-100 items.');
            return;
        }
        if (!port) {
            alert('Please connect to Morserino first.');
            return;
        }
        try {
            console.log('Starting session:', { mode, numItems });
            sessionItems = mode === 'qso' ? generateQSO('KK6M') :
                          mode === 'callsigns' ? generateCallsigns().slice(0, numItems) :
                          mode === 'code_groups' ? generateCodeGroups().slice(0, numItems) :
                          shuffleArray([...words, ...generateCallsigns(), ...generateCodeGroups()].slice(0, numItems));
            currentIndex = 0;
            correctCount = 0;
            itemsPresented = 0;
            mainContent.style.display = 'none';
            trainingArea.style.display = 'block';
            statsArea.style.display = 'none';
            await nextTarget();
        } catch (error) {
            console.error('Session error:', error);
            alert('Failed to start session: ' + error.message);
        }
    });

    async function nextTarget() {
        console.log('nextTarget called, currentIndex:', currentIndex, 'sessionItems.length:', sessionItems.length);
        if (currentIndex >= sessionItems.length) {
            trainingArea.style.display = 'none';
            statsArea.style.display = 'block';
            const sessionResult = { correct: correctCount, total: itemsPresented };
            await saveSession(sessionResult.correct, sessionResult.total, modeSelect.value);
            statsSummary.textContent = `Last Session: ${sessionResult.correct}/${sessionResult.total} correct (${modeSelect.value})`;
            fetchStats(sessionStorage.getItem('username'));
            return;
        }
        currentTarget = sessionItems[currentIndex].toUpperCase();
        targetText.textContent = currentTarget;
        userInput = '';
        inputText.textContent = '';
        feedback.textContent = '';
        itemsPresented++;
        console.log('Current target:', currentTarget, 'Index:', currentIndex, 'Items presented:', itemsPresented);

        try {
            const encoder = new TextEncoder();
            writer = port.writable.getWriter();
            await writer.write(encoder.encode(`${currentTarget}\n`));
            writer.releaseLock();
            writer = null;
            console.log('Sent target to Morserino:', currentTarget);
            await startReading();
        } catch (error) {
            console.error('Error sending target:', error);
            feedback.textContent = 'Error communicating with Morserino';
            feedback.classList.add('text-red-600');
            throw error;
        }
    }

    async function startReading() {
        if (!port.readable) {
            console.error('Port not readable, attempting to reopen');
            await closePort(port);
            await port.open({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });
        }
        try {
            const decoder = new TextDecoder();
            reader = port.readable.getReader();
            let inputBuffer = '';
            while (port.readable && !isProcessingInput) {
                try {
                    const { value, done } = await reader.read();
                    if (done) {
                        console.log('Reader canceled');
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
                    feedback.textContent = `Read error: ${error.message}`;
                    feedback.classList.add('text-red-600');
                    break;
                }
            }
        } catch (error) {
            console.error('Error starting reader:', error);
            feedback.textContent = `Error reading: ${error.message}`;
            feedback.classList.add('text-red-600');
        } finally {
            if (reader) {
                reader.releaseLock();
                reader = null;
            }
        }
    }

    function checkInput() {
        if (isProcessingInput) {
            console.log('checkInput skipped: already processing input');
            return;
        }
        isProcessingInput = true;
        console.log('checkInput called, userInput:', userInput, 'currentTarget:', currentTarget);
        try {
            if (userInput === currentTarget) {
                feedback.textContent = 'Correct!';
                feedback.classList.remove('text-red-600');
                feedback.classList.add('text-green-600');
                correctCount++;
                currentIndex++;
                setTimeout(() => {
                    isProcessingInput = false;
                    nextTarget();
                }, 1000);
            } else {
                feedback.textContent = 'Incorrect, try again!';
                feedback.classList.remove('text-green-600');
                feedback.classList.add('text-red-600');
                userInput = '';
                inputText.textContent = inputBuffer;
                isProcessingInput = false;
            }
        } catch (error) {
            console.error('Error in checkInput:', error);
            isProcessingInput = false;
        }
    }

    nextButton.addEventListener('click', async () => {
        console.log('Next button clicked, advancing to index:', currentIndex + 1);
        currentIndex++;
        isProcessingInput = false;
        await closePort(port);
        await nextTarget();
    });

    backButton.addEventListener('click', async () => {
        statsArea.style.display = 'none';
        mainContent.style.display = 'block';
        await closePort(port);
        console.log('Back to training clicked');
    });

    async function saveSession(correct, total, mode) {
        if (!sessionStorage.getItem('username')) {
            console.error('No user logged in for session saving');
            alert('Please log in to save session.');
            return;
        }
        try {
            console.log('Saving session for user:', sessionStorage.getItem('username'));
            const sessionData = {
                username: sessionStorage.getItem('username'),
                session: {
                    correct: correct,
                    total: total,
                    mode: mode,
                    date: new Date().toISOString().slice(0, 19).replace('T', ' ')
                }
            };
            const response = await fetch(`${apiBaseUrl}/stats.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData),
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Stats POST response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok) {
                console.log('Session saved:', data.message);
                fetchStats(sessionData.username);
            } else {
                console.error('Failed to save session:', data.message);
                alert(`Failed to save session: ${data.message}`);
            }
        } catch (error) {
            console.error('Session save error:', error.message);
            alert(`Failed to save session: Network error - ${error.message}`);
        }
    }

    async function fetchStats(username) {
        if (!username) {
            console.error('No username provided for fetching stats');
            return;
        }
        try {
            console.log('Fetching stats for:', username);
            const response = await fetch(`${apiBaseUrl}/stats.php?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            const text = await response.text();
            console.log('Stats GET response:', response.status, text);
            const data = JSON.parse(text);
            if (response.ok) {
                updateChart(data.sessions);
            } else {
                console.error('Failed to fetch stats:', data.message);
                alert(`Failed to fetch stats: ${data.message}`);
            }
        } catch (error) {
            console.error('Stats fetch error:', error.message);
            alert(`Failed to fetch stats: Network error - ${error.message}`);
        }
    }

    function updateChart(sessions) {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        const labels = sessions.map((_, index) => `Session ${index + 1}`);
        const correctData = sessions.map(s => s.correct);
        const incorrectData = sessions.map(s => s.total - s.correct);
        chartInstance = new Chart(statsChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Correct',
                        data: correctData,
                        backgroundColor: 'teal'
                    },
                    {
                        label: 'Incorrect',
                        data: incorrectData,
                        backgroundColor: 'red'
                    }
                ]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});
