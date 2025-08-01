document.addEventListener('DOMContentLoaded', () => {
    console.log('Morserino Web loading...');

    // Basic DOM elements
    const debug = document.getElementById('debug');
    const loggedIn = document.getElementById('loggedIn');
    const notLoggedIn = document.getElementById('notLoggedIn');
    const currentUsername = document.getElementById('currentUsername');
    const logoutButton = document.getElementById('logoutButton');
    const accountButton = document.getElementById('accountButton');
    const statisticsButton = document.getElementById('statisticsButton');
    // Login elements moved to separate login.html page
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
    const inputDisplay = document.getElementById('inputDisplay');
    const sessionStats = document.getElementById('sessionStats');
    const statsList = document.getElementById('statsList');

    // Enhanced tracking elements (optional)
    const lettersCount = document.getElementById('lettersCount');
    const numbersCount = document.getElementById('numbersCount');
    const signsCount = document.getElementById('signsCount');
    const errorsCount = document.getElementById('errorsCount');
    const accuracyPercent = document.getElementById('accuracyPercent');
    const sessionTimer = document.getElementById('sessionTimer');
    const characterSpeed = document.getElementById('characterSpeed');
    const wordSpeed = document.getElementById('wordSpeed');
    const startNewSession = document.getElementById('startNewSession');

    // Check if enhanced tracking elements exist
    const hasEnhancedTracking = !!(lettersCount && sessionTimer && startNewSession);
    console.log('Enhanced tracking available:', hasEnhancedTracking);

    // Global variables
    const apiBaseUrl = 'https://om0rx.com/morserino/api';
    let currentItems = [];
    let currentIndex = 0;
    let currentMode = 'realWords';
    let maxItems = 10;
    let port = null;
    let isConnected = false;
    let inputBuffer = '';
    let isDashboardLoaded = false;
    let isDashboardLoading = false;
    let isReading = false;
    let currentReader = null;
    
    // Character-by-character tracking
    let currentWord = '';
    let currentCharIndex = 0;
    let receivedChars = '';

    // Session tracking for enhanced mode
    const sessionData = {
        correct: 0,
        total: 0,
        letters: 0,
        numbers: 0,
        signs: 0,
        errors: 0,
        startTime: null,
        endTime: null,
        wordAttempts: []
    };

    // Character-by-character display functions
    function displayWordWithProgress() {
        if (!currentWord) return;
        
        let displayHtml = '';
        for (let i = 0; i < currentWord.length; i++) {
            const char = currentWord[i];
            let colorClass = '';
            
            if (i < currentCharIndex) {
                // Characters already completed correctly
                colorClass = 'text-green-400';
            } else if (i === currentCharIndex) {
                // Current character to input
                colorClass = 'text-blue-400 bg-blue-800 bg-opacity-50 px-1 rounded';
            } else {
                // Future characters
                colorClass = 'text-gray-400';
            }
            
            displayHtml += `<span class="${colorClass}">${char}</span>`;
        }
        
        target.innerHTML = displayHtml;
    }
    
    function displayUserInput() {
        if (!inputDisplay) return;
        
        let displayHtml = '';
        for (let i = 0; i < receivedChars.length; i++) {
            const char = receivedChars[i];
            const isCorrect = i < currentWord.length && char === currentWord[i];
            const colorClass = isCorrect ? 'text-green-400' : 'text-red-400';
            displayHtml += `<span class="${colorClass}">${char}</span>`;
        }
        
        inputDisplay.innerHTML = displayHtml || '<span class="text-gray-500">---</span>';
    }
    
    function resetCharacterTracking() {
        currentCharIndex = 0;
        receivedChars = '';
        displayWordWithProgress();
        displayUserInput();
    }

    // Collapsible sections functionality
    function toggleSection(sectionId) {
        const content = document.getElementById(`${sectionId}-content`);
        const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
        
        if (content && icon) {
            const isHidden = content.classList.contains('hidden');
            
            if (isHidden) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
            }
        }
    }

    // Add click handlers to all section headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const section = header.closest('.section');
            if (section) {
                const sectionId = section.getAttribute('data-id');
                if (sectionId) {
                    toggleSection(sectionId);
                }
            }
        });
    });

    // Expand all sections by default
    setTimeout(() => {
        const allSections = ['login-register', 'mode-selection', 'connection', 'training', 'live-tracking', 'session-report'];
        allSections.forEach(sectionId => {
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
            if (content && content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        });
    }, 100);

    // Enhanced session display functions
    function resetSessionCounters() {
        sessionData.correct = 0;
        sessionData.total = 0;
        sessionData.letters = 0;
        sessionData.numbers = 0;
        sessionData.signs = 0;
        sessionData.errors = 0;
        sessionData.startTime = null;
        sessionData.endTime = null;
        sessionData.wordAttempts = [];
    }

    function updateSessionDisplay() {
        if (!hasEnhancedTracking) return;
        
        // Safely update elements only if they exist
        if (lettersCount) lettersCount.textContent = sessionData.letters;
        if (numbersCount) numbersCount.textContent = sessionData.numbers;
        if (signsCount) signsCount.textContent = sessionData.signs;
        if (errorsCount) errorsCount.textContent = sessionData.errors;
        
        const accuracy = sessionData.total > 0 ? 
            ((sessionData.correct / sessionData.total) * 100).toFixed(1) : '0.0';
        if (accuracyPercent) accuracyPercent.textContent = `${accuracy}%`;
        
        // Calculate speeds
        if (sessionData.startTime) {
            const elapsed = (new Date() - sessionData.startTime) / 1000 / 60; // minutes
            if (elapsed > 0) {
                const cpm = (sessionData.letters + sessionData.numbers + sessionData.signs) / elapsed;
                const wpm = cpm / 5; // Standard WPM calculation
                if (characterSpeed) characterSpeed.textContent = `${cpm.toFixed(1)} CPM`;
                if (wordSpeed) wordSpeed.textContent = `${wpm.toFixed(1)} WPM`;
            }
        }
    }

    let timerInterval;
    function startSessionTimer() {
        if (!sessionData.startTime) {
            sessionData.startTime = new Date();
        }
        
        timerInterval = setInterval(updateTimerDisplay, 100);
    }

    function stopSessionTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        sessionData.endTime = new Date();
    }

    function updateTimerDisplay() {
        if (!sessionData.startTime || !hasEnhancedTracking || !sessionTimer) return;
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
                await fetchHistoricalStats(data.username);
            } else {
                notLoggedIn.classList.remove('hidden');
                loggedIn.classList.add('hidden');
            }
        } catch (error) {
            console.log('Session check failed:', error.message);
            notLoggedIn.classList.remove('hidden');
            loggedIn.classList.add('hidden');
        }
    }

    // Placeholder functions for compatibility (detailed statistics moved to statistics.js)
    function destroyExistingCharts() {
        console.log('Charts cleared (placeholder)');
    }

    function showEmptyDashboard() {
        console.log('Empty dashboard (placeholder)');
    }
    
    async function loadTrainingDashboard(username, forceReload = false) {
        if (isDashboardLoading) return;
        
        if (isDashboardLoaded && !forceReload) {
            console.log('Dashboard already loaded, skipping reload');
            return;
        }
        
        isDashboardLoading = true;
        
        try {
            console.log('Loading training dashboard for:', username);
            // Dashboard functionality moved to statistics page
            isDashboardLoaded = true;
        } catch (error) {
            console.log('Dashboard load error:', error.message);
            showEmptyDashboard();
        } finally {
            isDashboardLoading = false;
        }
    }

    // Legacy function for compatibility
    async function fetchHistoricalStats(username, forceReload = false) {
        console.log('Historical stats loading handled by statistics page');
    }

    // Login/Register functionality moved to separate login.html page

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
                // Reset dashboard flags on logout  
                isDashboardLoaded = false;
                isDashboardLoading = false;
                showToast('Logged out successfully! Redirecting to login...', 'bg-green-600');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            showToast(`Logout failed: ${error.message}`, 'bg-red-600');
        }
    });

    accountButton.addEventListener('click', () => {
        window.location.href = '/morserino/account.html';
    });

    if (statisticsButton) {
        statisticsButton.addEventListener('click', () => {
            window.location.href = 'statistics.html';
        });
    }

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
                qrCodes: 'QR Codes',
                topWords: 'Top Words in CW',
                mixed: 'Mixed Mode'
            };
            
            if (oldMode !== currentMode) {
                showToast(`Mode changed to: ${modeNames[currentMode]}`, 'bg-blue-600');
            }
        });
    });

    // Initialize by selecting Real Words
    if (realWordsButton) {
        realWordsButton.click();
    }

    // Serial connection functionality
    connectButton.addEventListener('click', async () => {
        if (isConnected) {
            // Disconnect
            isConnected = false;
            isReading = false;
            
            if (currentReader) {
                try {
                    await currentReader.cancel();
                    currentReader.releaseLock();
                } catch (e) {
                    console.log('Reader cleanup error:', e);
                }
                currentReader = null;
            }
            
            if (port) {
                await port.close();
            }
            port = null;
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.className = 'text-red-400 text-sm';
            connectButton.textContent = '🔌 Connect to Morserino';
            connectButton.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition';
            showToast('Disconnected from Morserino', 'bg-yellow-600');
        } else {
            // Connect
            try {
                if (!('serial' in navigator)) {
                    throw new Error('Web Serial API not supported. Please use Chrome or Edge.');
                }

                port = await navigator.serial.requestPort();
                await port.open({ baudRate: 115200 });

                isConnected = true;
                connectionStatus.textContent = 'Connected ✓';
                connectionStatus.className = 'text-green-400 text-sm';
                connectButton.textContent = '🔌 Disconnect';
                connectButton.className = 'w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition';
                showToast('Connected to Morserino successfully!', 'bg-green-600');
            } catch (error) {
                showToast(`Connection failed: ${error.message}`, 'bg-red-600');
                console.error('Connection error:', error);
            }
        }
    });

    // Toast notification function
    function showToast(message, bgColor) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Slide in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Slide out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Data loading functions
    async function loadWords() {
        currentItems = [];
        try {
            let filename;
            switch (currentMode) {
                case 'realWords': filename = 'words.txt'; break;
                case 'abbreviations': filename = 'abbreviations.txt'; break;
                case 'callsigns': filename = 'callsigns.txt'; break;
                case 'qrCodes': filename = 'qr-codes.txt'; break;
                case 'topWords': filename = 'top-words-in-cw.txt'; break;
                case 'mixed': 
                    // For mixed mode, load all files and combine
                    const files = ['words.txt', 'abbreviations.txt', 'callsigns.txt', 'qr-codes.txt', 'top-words-in-cw.txt'];
                    const allWords = [];
                    for (const file of files) {
                        const response = await fetch(`/morserino/data/${file}`);
                        if (response.ok) {
                            const text = await response.text();
                            const words = text.split('\n').filter(word => word.trim());
                            allWords.push(...words);
                        }
                    }
                    currentItems = allWords;
                    break;
                default: filename = 'words.txt';
            }

            if (currentMode !== 'mixed') {
                console.log(`Loading ${filename} for ${currentMode} mode...`);
                const response = await fetch(`/morserino/data/${filename}`);
                if (!response.ok) throw new Error(`Failed to load ${filename}`);
                
                const text = await response.text();
                console.log(`Raw text length: ${text.length}, first 100 chars:`, text.substring(0, 100));
                
                currentItems = text.split('\n').filter(word => word.trim());
                console.log(`After splitting by newlines: ${currentItems.length} items`);
                console.log('First 5 items:', currentItems.slice(0, 5));
            }

            if (currentItems.length === 0) {
                throw new Error('No words loaded');
            }

            console.log(`Successfully loaded ${currentItems.length} items for ${currentMode} mode`);
        } catch (error) {
            showToast(`Failed to load words: ${error.message}`, 'bg-red-600');
            console.error('Load words error:', error);
            // Fallback to basic words
            currentItems = ['TEST', 'HELLO', 'WORLD', 'MORSE', 'CODE'];
        }
    }

    // Session management
    async function startSession() {
        if (!isConnected) {
            showToast('Please connect to Morserino first', 'bg-red-600');
            return;
        }

        try {
            await loadWords();
            maxItems = parseInt(numItems.value) || 10;
            currentIndex = 0;
            isSessionActive = true;
            
            // Update session UI
            startButton.style.display = 'none';
            startButton.textContent = 'Session Active';
            startButton.className = 'w-full bg-orange-500 text-white p-2 rounded-lg';
            
            // Show session progress
            const sessionProgress = document.getElementById('sessionProgress');
            const nextButton = document.getElementById('nextButton');
            const endSessionButton = document.getElementById('endSessionButton');
            
            if (sessionProgress) {
                sessionProgress.classList.remove('hidden');
                document.getElementById('currentProgress').textContent = '1';
                document.getElementById('totalProgress').textContent = maxItems.toString();
            }
            if (nextButton) nextButton.classList.remove('hidden');
            if (endSessionButton) endSessionButton.classList.remove('hidden');
            
            // Clear character tracking displays
            currentWord = '';
            currentCharIndex = 0;
            receivedChars = '';
            target.textContent = '';
            if (inputDisplay) {
                inputDisplay.innerHTML = '<span class="text-gray-500">Ready...</span>';
            }
            
            // Reset session data
            if (hasEnhancedTracking) {
                resetSessionCounters();
                updateSessionDisplay();
                startSessionTimer();
            }

            showToast(`Starting ${maxItems} item session`, 'bg-green-600');
            
            // Start reading serial data
            console.log('🔍 Connection check: port=', !!port, 'isConnected=', isConnected, 'isReading=', isReading);
            if (port && isConnected && !isReading) {
                console.log('🔄 Starting serial reading for character-by-character input...');
                console.log('🔗 Port state:', port);
                readMorseInput();
            } else {
                console.log('⚠️ Cannot start reading: port=', !!port, 'connected=', isConnected, 'alreadyReading=', isReading);
                if (!port) console.log('❌ No port available');
                if (!isConnected) console.log('❌ Not connected'); 
                if (isReading) console.log('❌ Already reading');
            }
            
            await nextTarget();
        } catch (error) {
            showToast(`Failed to start session: ${error.message}`, 'bg-red-600');
        }
    }

    async function nextTarget() {
        if (currentIndex >= maxItems || currentItems.length === 0) {
            await endSession();
            return;
        }

        // Select random word
        const randomIndex = Math.floor(Math.random() * currentItems.length);
        const word = currentItems[randomIndex];
        
        console.log(`Selected word: "${word}" from ${currentItems.length} items`);
        
        if (!word) {
            console.error('No word selected - items:', currentItems);
            showToast('Error: No training word available', 'bg-red-600');
            return;
        }
        
        // Set up character-by-character tracking
        currentWord = word;
        currentCharIndex = 0;
        receivedChars = '';
        
        // Display the word with character-by-character highlighting
        displayWordWithProgress();
        displayUserInput();
        
        // Clear old displays
        userInput.value = '';
        inputBuffer = '';
        
        // Update progress
        const currentProgressElement = document.getElementById('currentProgress');
        if (currentProgressElement) {
            currentProgressElement.textContent = (currentIndex + 1).toString();
        }

        try {
            if (port && isConnected) {
                const writer = port.writable.getWriter();
                const command = `m ${word}\n`;
                await writer.write(new TextEncoder().encode(command));
                writer.releaseLock();
                console.log(`Sent to Morserino: ${command.trim()}`);
            }
        } catch (error) {
            console.error('Send error:', error);
            showToast('Failed to send to Morserino', 'bg-red-600');
        }

        currentIndex++;
    }

    async function readMorseInput() {
        if (!port || !isConnected || isReading) {
            console.log('❌ Cannot start reading:', {port: !!port, connected: isConnected, alreadyReading: isReading});
            return;
        }
        
        console.log('🚀 Starting Morse input reading...');
        isReading = true;
        
        try {
            if (currentReader) {
                console.log('🔄 Cancelling existing reader...');
                await currentReader.cancel();
                currentReader = null;
            }
            
            console.log('📖 Getting new reader...');
            currentReader = port.readable.getReader();
            let buffer = '';

            console.log('🔄 Starting read loop...');
            let readCount = 0;
            
            while (isConnected && isReading && readCount < 10000) { // Prevent infinite loop
                try {
                    const { value, done } = await currentReader.read();
                    readCount++;
                    
                    if (done) {
                        console.log('📡 Read done, breaking...');
                        break;
                    }

                    const chunk = new TextDecoder().decode(value);
                    buffer += chunk;
                    
                    console.log('📡 Raw chunk received:', JSON.stringify(chunk), 'Buffer now:', JSON.stringify(buffer));

                    // Process characters as they come in (Morserino sends individual chars with spaces)
                    // Look for individual letters (not spaces) in the buffer
                    const chars = buffer.split('');
                    let processedUpTo = 0;
                    
                    for (let i = 0; i < chars.length; i++) {
                        const char = chars[i];
                        
                        // Process actual letters/numbers, skip spaces
                        if (char && char.trim() && char !== ' ') {
                            console.log('🔤 Found character to process:', JSON.stringify(char));
                            console.log('📊 Current state: word=', currentWord, 'charIndex=', currentCharIndex);
                            
                            await processMorseInput(char);
                            processedUpTo = i + 1;
                        }
                    }
                    
                    // Keep only unprocessed part of buffer
                    buffer = buffer.substring(processedUpTo);
                } catch (readError) {
                    console.error('Read loop error:', readError);
                    break;
                }
            }

            if (currentReader) {
                currentReader.releaseLock();
                currentReader = null;
            }
        } catch (error) {
            console.error('Read error:', error);
            if (error.name !== 'NetworkError' && error.name !== 'AbortError') {
                showToast('Connection lost', 'bg-red-600');
            }
        } finally {
            isReading = false;
            if (currentReader) {
                try {
                    currentReader.releaseLock();
                } catch (e) {
                    console.log('Reader already released');
                }
                currentReader = null;
            }
        }
    }

    async function processMorseInput(input) {
        console.log('🎯 processMorseInput called with:', JSON.stringify(input));
        
        if (!currentWord) {
            console.log('❌ No current word set, ignoring input:', JSON.stringify(input));
            return;
        }
        
        const receivedChar = input.toUpperCase().trim();
        console.log(`🔤 Processing character: "${receivedChar}" (expected: "${currentWord[currentCharIndex] || 'END'}")`);
        console.log(`📊 State: currentWord="${currentWord}", charIndex=${currentCharIndex}, receivedSoFar="${receivedChars}"`);
        
        // Handle character input
        receivedChars += receivedChar;
        console.log(`📝 Updated receivedChars to: "${receivedChars}"`);
        
        if (hasEnhancedTracking) {
            // Count character types
            if (/[A-Z]/.test(receivedChar)) sessionData.letters++;
            else if (/[0-9]/.test(receivedChar)) sessionData.numbers++;
            else sessionData.signs++;
        }
        
        // Update the input display immediately
        displayUserInput();
        console.log('🎨 Updated input display');
        
        // Check if character is correct
        if (currentCharIndex < currentWord.length && receivedChar === currentWord[currentCharIndex]) {
            // Correct character
            currentCharIndex++;
            console.log(`✓ Correct character! Progress: ${currentCharIndex}/${currentWord.length}`);
            
            // Update displays
            displayWordWithProgress();
            displayUserInput();
            
            // Check if word is complete
            if (currentCharIndex >= currentWord.length) {
                // Word completed successfully
                sessionData.correct++;
                sessionData.total++;
                showToast('✓ Word Complete!', 'bg-green-600');
                
                if (hasEnhancedTracking) {
                    sessionData.wordAttempts.push({
                        expected: currentWord,
                        received: receivedChars,
                        correct: true,
                        timestamp: new Date()
                    });
                    updateSessionDisplay();
                }
                
                // Wait briefly then continue to next word
                setTimeout(async () => {
                    if (currentIndex >= maxItems) {
                        await endSession();
                    } else {
                        await nextTarget();
                    }
                }, 1500);
            }
            
        } else {
            // Incorrect character - reset and try again
            sessionData.errors++;
            console.log(`✗ Wrong character: got "${receivedChar}", expected "${currentWord[currentCharIndex] || 'END'}"`);
            showToast(`✗ Wrong! Expected "${currentWord[currentCharIndex]}", got "${receivedChar}". Try again.`, 'bg-red-600');
            
            if (hasEnhancedTracking) {
                sessionData.wordAttempts.push({
                    expected: currentWord,
                    received: receivedChars,
                    correct: false,
                    timestamp: new Date()
                });
                updateSessionDisplay();
            }
            
            // Reset character tracking for this word
            resetCharacterTracking();
            
            // Resend the word to Morserino
            setTimeout(async () => {
                try {
                    if (port && isConnected) {
                        const writer = port.writable.getWriter();
                        const command = `m ${currentWord}\n`;
                        await writer.write(new TextEncoder().encode(command));
                        writer.releaseLock();
                        console.log(`Resent to Morserino: ${command.trim()}`);
                    }
                } catch (error) {
                    console.error('Resend error:', error);
                }
            }, 1000);
        }
    }

    async function endSession() {
        // Stop reading input
        isReading = false;
        if (currentReader) {
            try {
                await currentReader.cancel();
                currentReader.releaseLock();
            } catch (e) {
                console.log('Reader cleanup during session end:', e);
            }
            currentReader = null;
        }
        
        if (hasEnhancedTracking) {
            stopSessionTimer();
        }
        
        // Reset session UI
        isSessionActive = false;
        startButton.style.display = 'block';
        startButton.textContent = 'Start Session';
        startButton.className = 'w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition';
        
        // Hide session elements
        const sessionProgress = document.getElementById('sessionProgress');
        const nextButton = document.getElementById('nextButton');
        const endSessionButton = document.getElementById('endSessionButton');
        
        if (sessionProgress) sessionProgress.classList.add('hidden');
        if (nextButton) nextButton.classList.add('hidden');
        if (endSessionButton) endSessionButton.classList.add('hidden');
        
        // Clear character tracking and displays
        currentWord = '';
        currentCharIndex = 0;
        receivedChars = '';
        target.textContent = '';
        if (inputDisplay) {
            inputDisplay.innerHTML = '<span class="text-gray-500">---</span>';
        }

        const accuracy = sessionData.total > 0 ? ((sessionData.correct / sessionData.total) * 100).toFixed(1) : '0';
        const report = `Session Complete!\\n\\nResults: ${sessionData.correct}/${sessionData.total} (${accuracy}% accuracy)`;
        
        if (hasEnhancedTracking) {
            const sessionReport = document.getElementById('sessionReport');
            if (sessionReport) {
                const duration = sessionData.endTime && sessionData.startTime ? 
                    ((sessionData.endTime - sessionData.startTime) / 1000).toFixed(1) : '0';
                
                const cpm = sessionData.startTime && sessionData.endTime ? 
                    ((sessionData.letters + sessionData.numbers + sessionData.signs) / ((sessionData.endTime - sessionData.startTime) / 60000)).toFixed(1) : '0';
                
                const wpm = (parseFloat(cpm) / 5).toFixed(1);

                sessionReport.textContent = `📊 Session Complete!

✅ Accuracy: ${accuracy}% (${sessionData.correct}/${sessionData.total})
⏱️ Duration: ${duration}s
🔤 Characters: ${sessionData.letters + sessionData.numbers + sessionData.signs}
❌ Errors: ${sessionData.errors}
📈 Speed: ${cpm} CPM (${wpm} WPM)

Mode: ${currentMode}
Items: ${maxItems}`;

                if (startNewSession) {
                    startNewSession.classList.remove('hidden');
                }
            }
        }

        showToast(report.replace('\\n\\n', ' - '), 'bg-blue-600');

        // Save stats
        await trySaveStats();
    }

    async function trySaveStats() {
        const username = sessionStorage.getItem('username');
        if (!username) {
            console.log('No username, skipping stats save');
            return;
        }

        // Calculate final speeds
        let cpm = 0, wpm = 0;
        if (sessionData.startTime && sessionData.endTime) {
            const durationMinutes = (sessionData.endTime - sessionData.startTime) / 60000;
            cpm = (sessionData.letters + sessionData.numbers + sessionData.signs) / durationMinutes;
            wpm = cpm / 5;
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
            timeSeconds: sessionData.startTime && sessionData.endTime ? 
                (sessionData.endTime - sessionData.startTime) / 1000 : 0,
            accuracy: sessionData.total > 0 ? (sessionData.correct / sessionData.total) * 100 : 0,
            cpm: parseFloat(cpm.toFixed(1)),
            wpm: parseFloat(wpm.toFixed(1))
        };

        console.log('Sending stats payload:', payload);

        try {
            const response = await fetch(`${apiBaseUrl}/stats.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await response.json();
            console.log('Stats save response:', data);

            if (response.ok) {
                showToast('Session stats saved!', 'bg-green-600');
                // Reload stats after save
                setTimeout(() => fetchHistoricalStats(username), 500);
            } else {
                console.error('Stats save failed:', data);
                showToast(`Failed to save stats: ${data.message}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Stats save error:', error);
            showToast(`Failed to save stats: ${error.message}`, 'bg-red-600');
        }
    }

    // Event handlers
    startButton.addEventListener('click', async () => {
        await startSession();
    });

    nextButton.addEventListener('click', async () => {
        if (hasEnhancedTracking) {
            // Track as incorrect attempt
            sessionData.total++;
            sessionData.errors++;
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

    // End session button handler
    const endSessionButton = document.getElementById('endSessionButton');
    if (endSessionButton) {
        endSessionButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to end the current session?')) {
                await endSession();
            }
        });
    }

    // Enhanced tracking button
    if (hasEnhancedTracking && startNewSession) {
        startNewSession.addEventListener('click', () => {
            startNewSession.classList.add('hidden');
            const sessionReport = document.getElementById('sessionReport');
            if (sessionReport) {
                sessionReport.textContent = 'No session completed yet';
            }
            resetSessionCounters();
            if (sessionTimer) sessionTimer.textContent = '00:00.0';
            showToast('Ready for new session!', 'bg-green-600');
        });
    }

    // Initialize
    checkSession();
    
    // Initialize enhanced tracking display if available
    if (hasEnhancedTracking) {
        resetSessionCounters();
        updateSessionDisplay();
        if (sessionTimer) sessionTimer.textContent = '00:00.0';
    }

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