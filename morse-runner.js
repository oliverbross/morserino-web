// Morse Runner Contest Simulator
// OM0RX Professional CW Trainer
// Contest simulation with realistic band conditions

class MorseRunner {
    constructor() {
        console.log('OM0RX Morse Runner Contest Simulator initializing...');
        
        // Contest state
        this.contestActive = false;
        this.contestPaused = false;
        this.contestStartTime = null;
        this.contestDuration = 5; // minutes
        this.contestTimer = null;
        
        // Contest data
        this.contestLog = [];
        this.callsignDatabase = [];
        this.currentStations = [];
        this.scoreData = {
            totalQSOs: 0,
            verifiedQSOs: 0,
            multipliers: new Set(),
            totalScore: 0,
            currentRate: 0
        };
        
        // Audio engine
        this.audioEngine = null;
        
        // Contest settings
        this.settings = {
            contestType: 'cqww',
            myCallsign: 'OM0RX',
            speedRange: [20, 30],
            bandConditions: {
                qrn: false,
                qrm: false,
                flutter: false,
                qsb: false,
                lids: false,
                pileup: false
            },
            pitch: 600,
            volume: 0.7
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadCallsignDatabase();
        this.setupAudioEngine();
        this.checkUserSession();
        
        console.log('Morse Runner initialized successfully');
    }

    initializeElements() {
        // Get DOM elements
        this.elements = {
            // Contest Control
            contestTimer: document.getElementById('contestTimer'),
            currentRate: document.getElementById('currentRate'),
            bandActivity: document.getElementById('bandActivity'),
            startContestButton: document.getElementById('startContestButton'),
            pauseContestButton: document.getElementById('pauseContestButton'),
            stopContestButton: document.getElementById('stopContestButton'),
            
            // QSO Input
            callsignInput: document.getElementById('callsignInput'),
            exchangeInput: document.getElementById('exchangeInput'),
            logQSOButton: document.getElementById('logQSOButton'),
            clearInputButton: document.getElementById('clearInputButton'),
            qsoConfirmed: document.getElementById('qsoConfirmed'),
            currentStationInfo: document.getElementById('currentStationInfo'),
            currentStationCall: document.getElementById('currentStationCall'),
            currentStationSignal: document.getElementById('currentStationSignal'),
            currentStationMode: document.getElementById('currentStationMode'),
            currentStationSpeed: document.getElementById('currentStationSpeed'),
            
            // Contest Log
            totalQSOs: document.getElementById('totalQSOs'),
            verifiedQSOs: document.getElementById('verifiedQSOs'),
            multipliers: document.getElementById('multipliers'),
            totalScore: document.getElementById('totalScore'),
            contestLogTable: document.getElementById('contestLogTable'),
            
            // Settings
            contestTypeSelect: document.getElementById('contestTypeSelect'),
            contestDurationSelect: document.getElementById('contestDurationSelect'),
            speedRangeSelect: document.getElementById('speedRangeSelect'),
            myCallsignInput: document.getElementById('myCallsignInput'),
            qrnToggle: document.getElementById('qrnToggle'),
            qrmToggle: document.getElementById('qrmToggle'),
            flutterToggle: document.getElementById('flutterToggle'),
            qsbToggle: document.getElementById('qsbToggle'),
            lidsToggle: document.getElementById('lidsToggle'),
            pileupToggle: document.getElementById('pileupToggle'),
            
            // Navigation
            backToTrainingFromRunner: document.getElementById('backToTrainingFromRunner'),
            kochFromRunner: document.getElementById('kochFromRunner'),
            accountFromRunner: document.getElementById('accountFromRunner'),
            helpFromRunner: document.getElementById('helpFromRunner'),
            statisticsFromRunner: document.getElementById('statisticsFromRunner'),
            
            // User status
            currentUsername: document.getElementById('currentUsername'),
            userStatus: document.getElementById('userStatus')
        };
    }

    setupEventListeners() {
        // Section toggles (collapsible sections)
        this.setupSectionToggles();
        
        // Contest controls
        this.elements.startContestButton.addEventListener('click', () => this.startContest());
        this.elements.pauseContestButton.addEventListener('click', () => this.pauseContest());
        this.elements.stopContestButton.addEventListener('click', () => this.stopContest());
        
        // QSO input
        this.elements.logQSOButton.addEventListener('click', () => this.logQSO());
        this.elements.clearInputButton.addEventListener('click', () => this.clearInput());
        
        // Input field handling
        this.elements.callsignInput.addEventListener('input', (e) => this.handleCallsignInput(e));
        this.elements.callsignInput.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        this.elements.exchangeInput.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Settings
        this.elements.contestTypeSelect.addEventListener('change', () => this.updateContestType());
        this.elements.contestDurationSelect.addEventListener('change', () => this.updateContestDuration());
        this.elements.speedRangeSelect.addEventListener('change', () => this.updateSpeedRange());
        this.elements.myCallsignInput.addEventListener('input', () => this.updateMyCallsign());
        
        // Band condition toggles
        ['qrn', 'qrm', 'flutter', 'qsb', 'lids', 'pileup'].forEach(condition => {
            const toggle = this.elements[condition + 'Toggle'];
            if (toggle) {
                toggle.addEventListener('change', () => this.updateBandConditions());
            }
        });
        
        // Function keys
        document.querySelectorAll('.function-key').forEach(key => {
            key.addEventListener('click', (e) => this.handleFunctionKey(e.target.dataset.key));
        });
        
        // Navigation
        this.elements.backToTrainingFromRunner.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        if (this.elements.kochFromRunner) {
            this.elements.kochFromRunner.addEventListener('click', () => {
                window.location.href = 'koch-cw-trainer.html';
            });
        }
        
        if (this.elements.accountFromRunner) {
            this.elements.accountFromRunner.addEventListener('click', () => {
                window.location.href = 'account.html';
            });
        }
        
        if (this.elements.helpFromRunner) {
            this.elements.helpFromRunner.addEventListener('click', () => {
                window.location.href = 'help.html';
            });
        }
        
        if (this.elements.statisticsFromRunner) {
            this.elements.statisticsFromRunner.addEventListener('click', () => {
                window.location.href = 'statistics.html';
            });
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyboard(e));
        
        // Initialize sortable sections
        this.initializeSortableSections();
    }

    setupSectionToggles() {
        const sections = [
            'contest-control', 'qso-input', 'contest-log', 'function-keys', 'contest-settings'
        ];
        
        sections.forEach(sectionId => {
            const header = document.querySelector(`[data-id="${sectionId}"] .section-header`);
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
            
            if (header && content && icon) {
                // Start with most sections expanded, settings collapsed
                const startExpanded = sectionId !== 'contest-settings';
                content.style.display = startExpanded ? 'block' : 'none';
                icon.style.transform = startExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
                
                header.addEventListener('click', () => {
                    const isCollapsed = content.style.display === 'none';
                    
                    if (isCollapsed) {
                        content.style.display = 'block';
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        content.style.display = 'none';
                        icon.style.transform = 'rotate(-90deg)';
                    }
                });
            }
        });
    }

    initializeSortableSections() {
        const sortableContainer = document.getElementById('sortable-contest-sections');
        
        if (sortableContainer && typeof Sortable !== 'undefined') {
            Sortable.create(sortableContainer, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                handle: '.section-header',
                onEnd: function(evt) {
                    console.log('Contest section moved from', evt.oldIndex, 'to', evt.newIndex);
                    
                    // Save the new order to localStorage
                    const sectionOrder = Array.from(sortableContainer.children).map(section => section.dataset.id);
                    localStorage.setItem('morseRunnerSectionOrder', JSON.stringify(sectionOrder));
                }
            });
            
            // Restore saved section order
            const savedOrder = localStorage.getItem('morseRunnerSectionOrder');
            if (savedOrder) {
                try {
                    const order = JSON.parse(savedOrder);
                    const sections = Array.from(sortableContainer.children);
                    
                    order.forEach((sectionId, index) => {
                        const section = sections.find(s => s.dataset.id === sectionId);
                        if (section) {
                            sortableContainer.appendChild(section);
                        }
                    });
                } catch (error) {
                    console.log('Error restoring contest section order:', error);
                }
            }
        }
    }

    async loadCallsignDatabase() {
        try {
            console.log('Loading callsign database...');
            const response = await fetch('data/callsigns.txt');
            const text = await response.text();
            
            this.callsignDatabase = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('#'))
                .map(callsign => ({
                    call: callsign.toUpperCase(),
                    continent: this.getContinent(callsign),
                    zone: this.getCQZone(callsign),
                    country: this.getCountry(callsign)
                }));
                
            console.log(`Loaded ${this.callsignDatabase.length} callsigns`);
            
            // Initialize band activity based on callsign count
            this.updateBandActivity();
            
        } catch (error) {
            console.error('Error loading callsign database:', error);
            this.showToast('Error loading callsign database', 'bg-red-600');
        }
    }

    async setupAudioEngine() {
        try {
            // Initialize Contest Audio Engine
            this.audioEngine = new ContestAudioEngine();
            const success = await this.audioEngine.initialize();
            
            if (success) {
                console.log('Contest audio engine initialized successfully');
                
                // Apply initial contest settings
                this.updateAudioSettings();
            } else {
                throw new Error('Failed to initialize audio engine');
            }
        } catch (error) {
            console.error('Error initializing contest audio engine:', error);
            this.showToast('Audio not supported in this browser', 'bg-red-600');
        }
    }

    updateAudioSettings() {
        if (!this.audioEngine) return;
        
        // Sync contest settings with audio engine
        this.audioEngine.updateSettings({
            signalStrength: this.getRandomSignalStrength(),
            noiseLevel: this.settings.bandConditions.qrn ? 'S5' : 'off',
            qsb: this.settings.bandConditions.qsb,
            qrm: this.settings.bandConditions.qrm,
            qrn: this.settings.bandConditions.qrn,
            flutter: this.settings.bandConditions.flutter,
            pileup: this.settings.bandConditions.pileup,
            lids: this.settings.bandConditions.lids,
            pitch: this.settings.pitch,
            volume: this.settings.volume
        });
    }

    getRandomSignalStrength() {
        const signals = ['S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
        return signals[Math.floor(Math.random() * signals.length)];
    }

    // Contest Control Methods
    startContest() {
        if (this.contestActive) return;
        
        console.log('Starting contest...');
        this.contestActive = true;
        this.contestStartTime = new Date();
        this.contestDuration = parseInt(this.elements.contestDurationSelect.value);
        
        // Update UI
        this.elements.startContestButton.classList.add('hidden');
        this.elements.pauseContestButton.classList.remove('hidden');
        this.elements.stopContestButton.classList.remove('hidden');
        
        // Clear previous log
        this.contestLog = [];
        this.scoreData = {
            totalQSOs: 0,
            verifiedQSOs: 0,
            multipliers: new Set(),
            totalScore: 0,
            currentRate: 0
        };
        this.updateScoreDisplay();
        
        // Start contest timer
        this.startContestTimer();
        
        // Begin generating contest activity
        this.startContestActivity();
        
        // Focus on callsign input
        this.elements.callsignInput.focus();
        
        this.showToast('Contest started! Good luck!', 'bg-green-600');
    }

    pauseContest() {
        if (!this.contestActive || this.contestPaused) return;
        
        console.log('Pausing contest...');
        this.contestPaused = true;
        
        // Update UI
        this.elements.pauseContestButton.textContent = '▶️ Resume';
        
        // Pause timers and activity
        if (this.contestTimer) {
            clearInterval(this.contestTimer);
        }
        
        this.showToast('Contest paused', 'bg-yellow-600');
    }

    stopContest() {
        if (!this.contestActive) return;
        
        console.log('Stopping contest...');
        this.contestActive = false;
        this.contestPaused = false;
        
        // Update UI
        this.elements.startContestButton.classList.remove('hidden');
        this.elements.pauseContestButton.classList.add('hidden');
        this.elements.stopContestButton.classList.add('hidden');
        this.elements.pauseContestButton.textContent = '⏸️ Pause';
        
        // Hide current station info
        if (this.elements.currentStationInfo) {
            this.elements.currentStationInfo.classList.add('hidden');
        }
        
        // Clear all timers and intervals
        if (this.contestTimer) {
            clearInterval(this.contestTimer);
            this.contestTimer = null;
        }
        
        if (this.stationActivityInterval) {
            clearInterval(this.stationActivityInterval);
            this.stationActivityInterval = null;
        }
        
        // Stop all audio effects
        if (this.audioEngine) {
            this.audioEngine.stopContestEffects();
        }
        
        // Clear station data
        this.currentStations = [];
        
        // Generate final score report
        this.generateScoreReport();
        
        this.showToast('Contest finished!', 'bg-blue-600');
    }

    startContestTimer() {
        const endTime = new Date(this.contestStartTime.getTime() + (this.contestDuration * 60 * 1000));
        
        this.contestTimer = setInterval(() => {
            if (this.contestPaused) return;
            
            const now = new Date();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                this.stopContest();
                return;
            }
            
            // Update timer display
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            this.elements.contestTimer.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update rate calculation
            const elapsed = (now - this.contestStartTime) / (1000 * 60 * 60); // hours
            this.scoreData.currentRate = elapsed > 0 ? Math.round(this.scoreData.totalQSOs / elapsed) : 0;
            this.elements.currentRate.textContent = this.scoreData.currentRate;
            
        }, 1000);
    }

    startContestActivity() {
        console.log('Contest activity started');
        
        // Start background audio effects
        if (this.audioEngine) {
            this.audioEngine.startContestEffects();
        }
        
        // Generate initial contest stations
        this.generateContestStations();
        
        // Start realistic station activity
        this.startStationActivity();
        
        // Begin sending contest stations
        this.startContestTransmissions();
    }

    generateContestStations() {
        // Generate random calling stations based on contest type and band conditions
        const stationCount = this.getBandActivity();
        this.currentStations = [];
        
        for (let i = 0; i < stationCount; i++) {
            const station = this.createRandomStation();
            this.currentStations.push(station);
        }
        
        console.log(`Generated ${stationCount} contest stations`);
    }

    createRandomStation() {
        const callsign = this.getRandomCallsign();
        const speed = this.getRandomSpeed();
        const signal = this.getRandomSignal();
        
        return {
            callsign: callsign.call,
            continent: callsign.continent,
            zone: callsign.zone,
            country: callsign.country,
            speed: speed,
            signal: signal,
            mode: Math.random() < 0.7 ? 'CQ' : 'SP', // 70% CQ, 30% Search & Pounce
            frequency: this.getRandomFrequency(),
            lastActive: new Date()
        };
    }

    getRandomCallsign() {
        const index = Math.floor(Math.random() * this.callsignDatabase.length);
        return this.callsignDatabase[index];
    }

    getRandomSpeed() {
        const [min, max] = this.settings.speedRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomSignal() {
        // Weighted towards stronger signals
        const signals = ['S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S9+'];
        const weights = [0.05, 0.08, 0.12, 0.15, 0.20, 0.20, 0.15, 0.08, 0.02];
        
        let random = Math.random();
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) return signals[i];
        }
        return 'S5';
    }

    getRandomFrequency() {
        // 20m CW band frequencies
        return Math.floor(Math.random() * 200000) + 14000000; // 14.000 - 14.200 MHz
    }

    startStationActivity() {
        console.log('Station activity simulation started');
        
        // Schedule station transmissions at realistic intervals
        this.stationActivityInterval = setInterval(() => {
            if (!this.contestActive || this.contestPaused) return;
            
            // Randomly select active stations to transmit
            this.triggerStationActivity();
            
        }, 2000 + Math.random() * 3000); // Every 2-5 seconds
    }

    startContestTransmissions() {
        if (!this.audioEngine || this.currentStations.length === 0) return;
        
        // Start with first station calling
        this.nextStationTransmission();
    }

    nextStationTransmission() {
        if (!this.contestActive || this.contestPaused || !this.audioEngine) return;
        
        // Select a random station to transmit
        if (this.currentStations.length > 0) {
            const station = this.currentStations[Math.floor(Math.random() * this.currentStations.length)];
            this.transmitStation(station);
        }
        
        // Schedule next transmission
        const delay = this.getNextTransmissionDelay();
        setTimeout(() => this.nextStationTransmission(), delay);
    }

    async transmitStation(station) {
        if (!this.audioEngine || !station) return;

        try {
            // Generate contest exchange based on contest type
            const exchange = this.generateExchange(station);
            const message = station.mode === 'CQ' ? 
                `CQ CONTEST ${station.callsign} ${station.callsign}` :
                `${station.callsign} ${exchange}`;

            // Update current station display
            this.updateCurrentStationDisplay(station, message);

            // Play the transmission with realistic characteristics
            await this.audioEngine.playContestExchange(
                station.callsign, 
                exchange, 
                station.speed,
                {
                    signalStrength: station.signal,
                    pitch: this.settings.pitch + (Math.random() - 0.5) * 100, // ±50Hz variation
                    chirp: station.chirp,
                    straightKey: station.straightKey
                }
            );

            console.log(`Station transmitted: ${message}`);
        } catch (error) {
            console.error('Error transmitting station:', error);
        }
    }

    generateExchange(station) {
        switch (this.settings.contestType) {
            case 'cqww':
                return `599 ${station.zone}`;
            case 'arrldx':
                return `599 ${Math.floor(Math.random() * 1500) + 100}`;
            case 'cqwpx':
                return `599 ${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
            default:
                return '599';
        }
    }

    getNextTransmissionDelay() {
        // Realistic contest timing - more active during peak hours
        const baseDelay = 3000; // 3 seconds base
        const variation = Math.random() * 4000; // 0-4 seconds variation
        
        // Adjust for band conditions and pile-up settings
        let multiplier = 1.0;
        if (this.settings.bandConditions.pileup) multiplier *= 0.3; // More frequent in pile-ups
        if (this.getBandActivity() > 30) multiplier *= 0.5; // More active = more frequent
        
        return (baseDelay + variation) * multiplier;
    }

    triggerStationActivity() {
        // Simulate random contest activity
        if (Math.random() < 0.3) {
            // 30% chance to add a new station or update existing
            this.updateStationActivity();
        }
        
        if (Math.random() < 0.1) {
            // 10% chance for a station to go QRT (quit)
            this.removeRandomStation();
        }
    }

    updateStationActivity() {
        if (this.currentStations.length < this.getBandActivity()) {
            // Add new station
            const newStation = this.createRandomStation();
            this.currentStations.push(newStation);
            console.log(`New station joined: ${newStation.callsign}`);
        }
    }

    removeRandomStation() {
        if (this.currentStations.length > 5) { // Keep minimum activity
            const index = Math.floor(Math.random() * this.currentStations.length);
            const removedStation = this.currentStations.splice(index, 1)[0];
            console.log(`Station QRT: ${removedStation.callsign}`);
        }
    }

    updateCurrentStationDisplay(station, message) {
        if (this.elements.currentStationInfo) {
            this.elements.currentStationInfo.classList.remove('hidden');
            this.elements.currentStationCall.textContent = station.callsign;
            this.elements.currentStationSignal.textContent = station.signal;
            this.elements.currentStationMode.textContent = station.mode;
            this.elements.currentStationSpeed.textContent = `${station.speed} WPM`;
        }
    }

    // Utility Methods
    getBandActivity() {
        // Return number of active stations based on contest settings
        const baseActivity = Math.floor(this.callsignDatabase.length / 100); // 1% of database
        return Math.max(5, Math.min(50, baseActivity)); // Between 5-50 stations
    }

    updateBandActivity() {
        const activity = this.getBandActivity();
        let level = 'Low';
        if (activity > 15) level = 'Medium';
        if (activity > 30) level = 'High';
        if (activity > 45) level = 'Very High';
        
        this.elements.bandActivity.textContent = level;
    }

    getContinent(callsign) {
        // Simple continent detection based on prefix
        const prefix = callsign.substring(0, 2);
        
        if (['JA', 'JE', 'JF', 'JG', 'JH', 'JI', 'JJ', 'JK', 'JL', 'JM', 'JN', 'JO', 'JP', 'JQ', 'JR', 'JS'].includes(prefix)) return 'AS';
        if (['VK', 'VL', 'YB', 'YC', 'YD', 'YE', 'YF', 'YG', 'YH'].includes(prefix)) return 'OC';
        if (['W', 'K', 'N', 'A'].includes(prefix.charAt(0))) return 'NA';
        if (['LU', 'PY', 'PU', 'CE', 'CP', 'HK', 'YV'].includes(prefix)) return 'SA';
        if (['3A', '3V', '5A', '5N', '5R', '5T', '5U', '5V', '5X', '5Z', '6W', '7Q', '7X', '9G', '9J', '9L', '9Q', '9U', '9X', 'A2', 'C5', 'D2', 'D4', 'EA8', 'EL', 'ET', 'J2', 'J5', 'S0', 'ST', 'SU', 'T5', 'TL', 'TN', 'TR', 'TU', 'TY', 'TZ', 'V5', 'XT', 'Z2', 'ZD7', 'ZD8', 'ZS'].includes(prefix)) return 'AF';
        
        return 'EU'; // Default to Europe
    }

    getCQZone(callsign) {
        // Simplified CQ zone detection
        const continent = this.getContinent(callsign);
        const zones = {
            'NA': [3, 4, 5],
            'SA': [10, 11, 12, 13, 14, 15],
            'EU': [14, 15, 16, 20],
            'AF': [33, 34, 35, 36, 37, 38, 39],
            'AS': [19, 20, 21, 22, 23, 24, 25, 26, 27],
            'OC': [28, 29, 30]
        };
        
        const continentZones = zones[continent] || [14];
        return continentZones[Math.floor(Math.random() * continentZones.length)];
    }

    getCountry(callsign) {
        // Simplified country detection
        return callsign.substring(0, 2); // Use prefix as country identifier
    }

    // Input handling methods
    handleCallsignInput(event) {
        const input = event.target.value.toUpperCase();
        event.target.value = input;
        
        // Auto-complete logic could be added here
        this.checkForDuplicates(input);
    }

    handleKeyboardShortcuts(event) {
        switch(event.key) {
            case 'Enter':
                if (event.target.id === 'callsignInput' && this.elements.callsignInput.value.trim()) {
                    this.elements.exchangeInput.focus();
                } else if (event.target.id === 'exchangeInput') {
                    this.logQSO();
                }
                break;
            case 'Escape':
                this.clearInput();
                break;
            case 'Tab':
                // Allow default tab behavior
                break;
        }
    }

    handleGlobalKeyboard(event) {
        if (event.target.tagName === 'INPUT') return; // Don't interfere with input fields
        
        // Function keys
        if (event.key.startsWith('F') && event.key.length === 2) {
            event.preventDefault();
            this.handleFunctionKey(event.key);
        }
        
        // Contest shortcuts
        switch(event.key) {
            case ' ':
                event.preventDefault();
                if (this.contestActive && !this.contestPaused) {
                    this.pauseContest();
                } else if (this.contestActive && this.contestPaused) {
                    this.pauseContest(); // Resume
                } else {
                    this.startContest();
                }
                break;
        }
    }

    handleFunctionKey(key) {
        console.log(`Function key ${key} pressed`);
        
        const messages = {
            'F1': 'CQ OM0RX TEST',
            'F2': '599 14',
            'F3': 'TU QRZ',
            'F4': 'OM0RX',
            'F5': 'QRL?',
            'F6': 'QRZ?',
            'F7': 'AGN?',
            'F8': 'QRT 73'
        };
        
        const message = messages[key];
        if (message) {
            this.sendCWMessage(message);
            this.showToast(`Sent: ${message}`, 'bg-blue-600');
        }
    }

    async sendCWMessage(message) {
        if (!this.audioEngine) {
            console.log(`CW Message (no audio): ${message}`);
            return;
        }
        
        console.log(`Sending CW: ${message}`);
        
        // Use our own callsign and contest settings
        const station = {
            callsign: this.settings.myCallsign,
            speed: 25, // Fixed speed for our transmissions
            pitch: this.settings.pitch,
            signalStrength: 'S9' // Our signal is always strong
        };
        
        await this.audioEngine.playMorseString(message, station);
    }

    // QSO logging methods
    logQSO() {
        const callsign = this.elements.callsignInput.value.trim().toUpperCase();
        const exchange = this.elements.exchangeInput.value.trim();
        
        if (!callsign) {
            this.showToast('Please enter a callsign', 'bg-red-600');
            return;
        }
        
        // Create QSO record
        const qso = {
            timestamp: new Date(),
            callsign: callsign,
            exchange: exchange,
            frequency: '14025', // Default frequency
            rstSent: '599',
            rstReceived: '599',
            points: this.calculatePoints(callsign),
            multiplier: this.isMultiplier(callsign),
            verified: true, // For now, assume all QSOs are verified
            duplicate: this.isDuplicate(callsign)
        };
        
        // Check for duplicates
        if (qso.duplicate) {
            this.showToast('Duplicate QSO!', 'bg-red-600');
            return;
        }
        
        // Add to log
        this.contestLog.push(qso);
        
        // Update score
        this.updateScore(qso);
        
        // Add to display
        this.addQSOToDisplay(qso);
        
        // Clear input
        this.clearInput();
        
        // Show success
        const points = qso.points + (qso.multiplier ? ' + MULT' : '');
        this.showToast(`Logged ${callsign} for ${points} points`, 'bg-green-600');
        
        console.log('QSO logged:', qso);
    }

    clearInput() {
        this.elements.callsignInput.value = '';
        this.elements.exchangeInput.value = '';
        this.elements.qsoConfirmed.checked = false;
        this.elements.callsignInput.focus();
    }

    calculatePoints(callsign) {
        // Contest-specific point calculation
        const continent = this.getContinent(callsign);
        const myContinent = this.getContinent(this.settings.myCallsign);
        
        // Same continent = 1 point, different continent = 3 points
        return continent === myContinent ? 1 : 3;
    }

    isMultiplier(callsign) {
        const zone = this.getCQZone(callsign);
        return !this.scoreData.multipliers.has(zone);
    }

    isDuplicate(callsign) {
        return this.contestLog.some(qso => qso.callsign === callsign);
    }

    checkForDuplicates(callsign) {
        if (callsign.length > 2 && this.isDuplicate(callsign)) {
            this.elements.callsignInput.style.borderColor = '#ef4444'; // Red border
            this.showToast('Duplicate callsign!', 'bg-red-600');
        } else {
            this.elements.callsignInput.style.borderColor = '#9ca3af'; // Normal border
        }
    }

    updateScore(qso) {
        this.scoreData.totalQSOs++;
        if (qso.verified) this.scoreData.verifiedQSOs++;
        
        if (qso.multiplier) {
            const zone = this.getCQZone(qso.callsign);
            this.scoreData.multipliers.add(zone);
        }
        
        // Calculate total score: (verified QSOs × points) × multipliers
        const totalPoints = this.contestLog
            .filter(q => q.verified)
            .reduce((sum, q) => sum + q.points, 0);
        
        this.scoreData.totalScore = totalPoints * this.scoreData.multipliers.size;
        
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        this.elements.totalQSOs.textContent = this.scoreData.totalQSOs;
        this.elements.verifiedQSOs.textContent = this.scoreData.verifiedQSOs;
        this.elements.multipliers.textContent = this.scoreData.multipliers.size;
        this.elements.totalScore.textContent = this.scoreData.totalScore.toLocaleString();
    }

    addQSOToDisplay(qso) {
        const row = document.createElement('tr');
        row.className = 'new-qso';
        if (qso.multiplier) row.classList.add('multiplier');
        
        const time = qso.timestamp.toTimeString().substring(0, 8);
        
        row.innerHTML = `
            <td class="px-2 py-1">${time}</td>
            <td class="px-2 py-1 font-bold">${qso.callsign}</td>
            <td class="px-2 py-1">${qso.frequency}</td>
            <td class="px-2 py-1">${qso.rstSent}</td>
            <td class="px-2 py-1">${qso.rstReceived}</td>
            <td class="px-2 py-1">${qso.exchange}</td>
            <td class="px-2 py-1">${qso.multiplier ? '✓' : ''}</td>
            <td class="px-2 py-1">${qso.points}</td>
            <td class="px-2 py-1">${qso.verified ? '✅' : '⏳'}</td>
        `;
        
        // Add to top of table
        this.elements.contestLogTable.insertBefore(row, this.elements.contestLogTable.firstChild);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            row.classList.remove('new-qso');
        }, 2000);
    }

    // Settings methods
    updateContestType() {
        this.settings.contestType = this.elements.contestTypeSelect.value;
        console.log('Contest type updated to:', this.settings.contestType);
    }

    updateContestDuration() {
        this.contestDuration = parseInt(this.elements.contestDurationSelect.value);
        console.log('Contest duration updated to:', this.contestDuration, 'minutes');
    }

    updateSpeedRange() {
        const range = this.elements.speedRangeSelect.value.split('-');
        this.settings.speedRange = [parseInt(range[0]), parseInt(range[1])];
        console.log('Speed range updated to:', this.settings.speedRange);
    }

    updateMyCallsign() {
        this.settings.myCallsign = this.elements.myCallsignInput.value.toUpperCase();
        this.elements.myCallsignInput.value = this.settings.myCallsign;
        console.log('My callsign updated to:', this.settings.myCallsign);
    }

    updateBandConditions() {
        ['qrn', 'qrm', 'flutter', 'qsb', 'lids', 'pileup'].forEach(condition => {
            const toggle = this.elements[condition + 'Toggle'];
            if (toggle) {
                this.settings.bandConditions[condition] = toggle.checked;
            }
        });
        
        // Update audio engine with new settings
        this.updateAudioSettings();
        
        console.log('Band conditions updated:', this.settings.bandConditions);
    }

    generateScoreReport() {
        const duration = this.contestDuration;
        const qsoCount = this.scoreData.totalQSOs;
        const score = this.scoreData.totalScore;
        const rate = this.scoreData.currentRate;
        const accuracy = qsoCount > 0 ? Math.round((this.scoreData.verifiedQSOs / qsoCount) * 100) : 100;
        
        console.log('=== CONTEST SCORE REPORT ===');
        console.log(`Contest Type: ${this.settings.contestType.toUpperCase()}`);
        console.log(`Duration: ${duration} minutes`);
        console.log(`Total QSOs: ${qsoCount}`);
        console.log(`Verified QSOs: ${this.scoreData.verifiedQSOs}`);
        console.log(`Multipliers: ${this.scoreData.multipliers.size}`);
        console.log(`Final Score: ${score}`);
        console.log(`Rate: ${rate} QSOs/hour`);
        console.log(`Accuracy: ${accuracy}%`);
        console.log('===========================');
        
        // Save contest result to localStorage for now (until database integration)
        this.saveContestResult({
            contestType: this.settings.contestType,
            duration: duration,
            totalQSOs: qsoCount,
            verifiedQSOs: this.scoreData.verifiedQSOs,
            multipliers: this.scoreData.multipliers.size,
            finalScore: score,
            rate: rate,
            accuracy: accuracy,
            timestamp: new Date().toISOString(),
            contestLog: this.contestLog.slice() // Copy of the log
        });
        
        // Show final score toast with more details
        this.showToast(`Contest Complete! Score: ${score.toLocaleString()} (${qsoCount} QSOs, ${accuracy}% accuracy)`, 'bg-green-600');
    }

    saveContestResult(result) {
        try {
            const username = sessionStorage.getItem('username') || 'anonymous';
            const contestHistory = JSON.parse(localStorage.getItem(`contestHistory_${username}`)) || [];
            
            contestHistory.push(result);
            
            // Keep only last 50 results to prevent localStorage from getting too large
            if (contestHistory.length > 50) {
                contestHistory.splice(0, contestHistory.length - 50);
            }
            
            localStorage.setItem(`contestHistory_${username}`, JSON.stringify(contestHistory));
            console.log('Contest result saved to localStorage');
        } catch (error) {
            console.error('Failed to save contest result:', error);
        }
    }

    loadContestHistory() {
        try {
            const username = sessionStorage.getItem('username') || 'anonymous';
            const contestHistory = JSON.parse(localStorage.getItem(`contestHistory_${username}`)) || [];
            return contestHistory;
        } catch (error) {
            console.error('Failed to load contest history:', error);
            return [];
        }
    }

    // User session management
    async checkUserSession() {
        try {
            const username = sessionStorage.getItem('username');
            if (username) {
                this.elements.currentUsername.textContent = username;
                this.elements.userStatus.classList.remove('hidden');
                console.log('User session found:', username);
                
                // Show contest history summary
                this.displayContestHistorySummary();
            } else {
                console.log('No user session found');
                // Allow contest mode without login for demo purposes
                this.elements.currentUsername.textContent = 'Guest';
                this.elements.userStatus.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error checking user session:', error);
        }
    }

    displayContestHistorySummary() {
        try {
            const history = this.loadContestHistory();
            if (history.length === 0) return;

            // Calculate summary statistics
            const totalContests = history.length;
            const avgScore = Math.round(history.reduce((sum, contest) => sum + contest.finalScore, 0) / totalContests);
            const bestScore = Math.max(...history.map(contest => contest.finalScore));
            const avgAccuracy = Math.round(history.reduce((sum, contest) => sum + contest.accuracy, 0) / totalContests);

            // Create summary toast
            const summaryMessage = `Contest History: ${totalContests} contests, Best: ${bestScore.toLocaleString()}, Avg: ${avgScore.toLocaleString()} (${avgAccuracy}% accuracy)`;
            
            setTimeout(() => {
                this.showToast(summaryMessage, 'bg-blue-600');
            }, 1000);

            console.log('Contest History Summary:', {
                totalContests,
                avgScore,
                bestScore,
                avgAccuracy
            });
        } catch (error) {
            console.error('Error displaying contest history:', error);
        }
    }

    // Utility methods
    showToast(message, className = 'bg-blue-600') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${className} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(full)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize Morse Runner when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing OM0RX Morse Runner Contest Simulator...');
    window.morseRunner = new MorseRunner();
});