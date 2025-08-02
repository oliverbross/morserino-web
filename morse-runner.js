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
        
        // Contest flow state
        this.waitingForCQ = true; // User needs to call CQ first
        this.currentCallingStations = []; // Stations currently calling
        this.lastQSOCallsign = null; // For verification
        this.lastQSOExchange = null; // For verification
        
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
        
        // Contest settings (simplified to CQ WW CW only)
        this.settings = {
            contestType: 'cqww', // Only CQ WW CW supported for now
            contestMode: 'pileup', // pileup, single, wpx
            duration: 5, // minutes
            myCallsign: 'OM0RX',
            myZone: '15', // CQ Zone
            pitch: 600,
            volume: 0.7,
            speedRange: '25-35', // Speed range for stations
            exactSpeed: 'auto', // Or specific WPM
            activityLevel: 5, // Number of stations that can call
            bandConditions: {
                qrn: false,
                qrm: false,
                flutter: false,
                qsb: false,
                lids: false,
                pileup: false
            }
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
            userStatus: document.getElementById('userStatus'),
            
            // Settings modal elements
            contestSettingsModal: document.getElementById('contestSettingsModal'),
            closeSettingsModal: document.getElementById('closeSettingsModal'),
            saveSettings: document.getElementById('saveSettings'),
            resetSettings: document.getElementById('resetSettings'),
            
            // Settings form elements
            contestModeRadios: document.querySelectorAll('input[name="contestMode"]'),
            speedRange: document.getElementById('speedRange'),
            exactSpeed: document.getElementById('exactSpeed'),
            cwPitch: document.getElementById('cwPitch'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            modalMyCallsign: document.getElementById('modalMyCallsign'),
            myZone: document.getElementById('myZone'),
            activityLevel: document.getElementById('activityLevel'),
            activityValue: document.getElementById('activityValue'),
            modalContestDuration: document.getElementById('modalContestDuration'),
            
            // Band condition checkboxes in modal
            modalQrnToggle: document.getElementById('modalQrnToggle'),
            modalQrmToggle: document.getElementById('modalQrmToggle'),
            modalFlutterToggle: document.getElementById('modalFlutterToggle'),
            modalQsbToggle: document.getElementById('modalQsbToggle'),
            modalLidsToggle: document.getElementById('modalLidsToggle'),
            modalPileupToggle: document.getElementById('modalPileupToggle')
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

        // Settings button - make it functional
        this.elements.settingsButton.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Settings modal event listeners
        if (this.elements.closeSettingsModal) {
            this.elements.closeSettingsModal.addEventListener('click', () => {
                this.closeSettingsModal();
            });
        }

        if (this.elements.saveSettings) {
            this.elements.saveSettings.addEventListener('click', () => {
                this.saveSettingsFromModal();
            });
        }

        if (this.elements.resetSettings) {
            this.elements.resetSettings.addEventListener('click', () => {
                this.resetSettingsToDefaults();
            });
        }

        // Volume slider
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => {
                this.elements.volumeValue.textContent = e.target.value;
            });
        }

        // Activity level slider
        if (this.elements.activityLevel) {
            this.elements.activityLevel.addEventListener('input', (e) => {
                this.elements.activityValue.textContent = e.target.value;
            });
        }

        // Speed range change - populate exact speed options
        if (this.elements.speedRange) {
            this.elements.speedRange.addEventListener('change', () => {
                this.populateExactSpeedOptions();
            });
        }
        
        // Function keys - make them fully functional
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
            
            // Process all callsigns first
            const allCallsigns = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('#'))
                .map(callsign => ({
                    call: callsign.toUpperCase(),
                    continent: this.getContinent(callsign),
                    zone: this.getCQZone(callsign),
                    country: this.getCountry(callsign)
                }));
            
            // Load first 2500 callsigns for faster startup
            this.callsignDatabase = allCallsigns.slice(0, 2500);
            console.log(`Loaded ${this.callsignDatabase.length} callsigns (optimized for fast startup)`);
            
            // Initialize band activity with subset
            this.updateBandActivity();
            
            // Load remaining callsigns in background after 2 seconds
            if (allCallsigns.length > 2500) {
                setTimeout(() => {
                    this.callsignDatabase = allCallsigns;
                    console.log(`Full database loaded: ${this.callsignDatabase.length} callsigns`);
                    this.updateBandActivity();
                }, 2000);
            }
            
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
        this.contestPaused = false;
        this.contestStartTime = new Date();
        this.contestDuration = this.settings.duration;
        
        // Reset contest data and flow state
        this.contestLog = [];
        this.scoreData = {
            totalQSOs: 0,
            verifiedQSOs: 0,
            multipliers: new Set(),
            totalScore: 0,
            currentRate: 0
        };
        
        // Reset contest flow
        this.waitingForCQ = true;
        this.currentCallingStations = [];
        this.lastQSOCallsign = null;
        this.lastQSOExchange = null;
        
        // Update UI
        this.elements.startContestButton.classList.add('hidden');
        this.elements.pauseContestButton.classList.remove('hidden');
        this.elements.stopContestButton.classList.remove('hidden');
        this.elements.contestStatus.textContent = 'CONTEST ACTIVE - Call CQ to start!';
        this.elements.contestStatus.className = 'text-green-400 font-bold';
        
        this.updateScoreDisplay();
        
        // Start contest timer
        this.startContestTimer();
        
        // Setup audio with contest settings
        this.setupContestAudio();
        
        // Start background QRN (atmospheric noise) but no stations yet
        this.startBackgroundNoise();
        
        // Focus on callsign input
        this.elements.callsignInput.focus();
        
        this.showToast('Contest started! Press F1 or call CQ to begin!', 'bg-green-600');
        
        console.log(`Contest mode: ${this.settings.contestMode}, Activity level: ${this.settings.activityLevel}`);
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
        // Only CQ WW CW contest supported - exchange is always 599 + CQ Zone
        return `599 ${station.zone || this.getRandomZone()}`;
    }

    getRandomZone() {
        // Common CQ zones for realistic contest simulation
        const zones = ['1', '2', '3', '4', '5', '14', '15', '16', '20', '25', '30'];
        return zones[Math.floor(Math.random() * zones.length)];
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
            'F1': `CQ CQ TEST ${this.settings.myCallsign} ${this.settings.myCallsign}`,
            'F2': this.lastQSOCallsign ? `${this.lastQSOCallsign} TU 599 ${this.settings.myZone}` : `TU 599 ${this.settings.myZone}`,
            'F3': 'TU QRZ',
            'F4': 'QRZ?',
            'F5': 'AGN?',
            'F6': 'QSL',
            'F7': '73',
            'F8': 'QRT'
        };
        
        const message = messages[key];
        if (message) {
            this.sendCWMessage(message);
            this.showToast(`Sent: ${message}`, 'bg-blue-600');
            
            // Handle contest flow based on function key
            if (key === 'F1') {
                // CQ sent - expect stations to call
                this.handleCQSent();
            } else if (key === 'F2') {
                // Exchange sent - log the QSO if callsign is entered
                this.handleExchangeSent();
            }
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
        
        // Check for duplicate
        const isDuplicate = this.contestLog.some(qso => qso.callsign === callsign);
        
        if (isDuplicate) {
            this.showToast(`Duplicate: ${callsign} already worked!`, 'bg-red-600');
            return;
        }
        
        // Verify against the sent callsign (if we have one from contest flow)
        let isVerified = true;
        let verificationNote = '';
        
        if (this.lastQSOCallsign) {
            if (callsign === this.lastQSOCallsign) {
                isVerified = true;
                verificationNote = '✓ Correct';
            } else {
                isVerified = false;
                verificationNote = `✗ Sent: ${this.lastQSOCallsign}`;
            }
        } else {
            // No reference callsign - assume correct but mark as unverified
            verificationNote = '? No reference';
        }
        
        // Find station data for scoring
        const stationData = this.callsignDatabase.find(s => s.call === callsign);
        
        // Calculate points - only if verified
        let points = 0;
        if (isVerified && stationData) {
            // Points based on continent (CQ WW CW rules)
            points = stationData.continent === 'EU' ? 1 : 3; // Same continent = 1, different = 3
            
            // Add multiplier only if verified
            this.scoreData.multipliers.add(stationData.zone);
        }
        
        // Create QSO record
        const qso = {
            timestamp: new Date(),
            time: new Date().toLocaleTimeString(),
            callsign: callsign,
            exchange: exchange || (this.lastQSOExchange || `599 ${this.settings.myZone}`),
            rstSent: '599',
            rstReceived: '599',
            points: points,
            multiplier: stationData ? stationData.zone : '??',
            verified: isVerified,
            note: verificationNote,
            duplicate: false
        };
        
        // Add to log
        this.contestLog.push(qso);
        
        // Update score
        this.scoreData.totalQSOs++;
        if (isVerified) {
            this.scoreData.verifiedQSOs++;
            this.scoreData.totalScore += points;
        }
        
        // Update display
        this.updateScoreDisplay();
        this.updateContestLog();
        
        // Clear input and reset contest flow
        this.clearInput();
        this.lastQSOCallsign = null;
        this.lastQSOExchange = null;
        this.waitingForCQ = true; // Ready for next CQ
        
        // Show confirmation with verification status
        const statusColor = isVerified ? 'bg-green-600' : 'bg-orange-600';
        const statusText = isVerified ? 'VERIFIED' : 'UNVERIFIED';
        this.showToast(`Logged: ${callsign} (${points} pts) - ${statusText}`, statusColor);
        
        console.log('QSO logged:', qso);
        
        // In single mode, automatically generate next calling station
        if (this.settings.contestMode === 'single' && this.contestActive && !this.contestPaused) {
            setTimeout(() => {
                this.generateCallingStations();
                setTimeout(() => {
                    this.startCallingStations();
                }, 1000 + Math.random() * 2000);
            }, 500);
        }
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

    // Settings Modal Methods
    openSettingsModal() {
        if (this.elements.contestSettingsModal) {
            // Populate modal with current settings
            this.populateSettingsModal();
            this.elements.contestSettingsModal.classList.remove('hidden');
        }
    }

    closeSettingsModal() {
        if (this.elements.contestSettingsModal) {
            this.elements.contestSettingsModal.classList.add('hidden');
        }
    }

    populateSettingsModal() {
        // Contest mode
        const modeRadio = document.querySelector(`input[name="contestMode"][value="${this.settings.contestMode}"]`);
        if (modeRadio) modeRadio.checked = true;

        // Speed settings
        if (this.elements.speedRange) {
            this.elements.speedRange.value = this.settings.speedRange;
            this.populateExactSpeedOptions();
        }
        
        if (this.elements.exactSpeed) {
            this.elements.exactSpeed.value = this.settings.exactSpeed;
        }

        // Audio settings
        if (this.elements.cwPitch) {
            this.elements.cwPitch.value = this.settings.pitch;
        }
        
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = Math.round(this.settings.volume * 100);
            this.elements.volumeValue.textContent = Math.round(this.settings.volume * 100);
        }

        // Station settings
        if (this.elements.modalMyCallsign) {
            this.elements.modalMyCallsign.value = this.settings.myCallsign;
        }
        
        if (this.elements.myZone) {
            this.elements.myZone.value = this.settings.myZone;
        }

        // Activity settings
        if (this.elements.activityLevel) {
            this.elements.activityLevel.value = this.settings.activityLevel;
            this.elements.activityValue.textContent = this.settings.activityLevel;
        }
        
        if (this.elements.modalContestDuration) {
            this.elements.modalContestDuration.value = this.settings.duration;
        }

        // Band conditions
        ['qrn', 'qrm', 'flutter', 'qsb', 'lids', 'pileup'].forEach(condition => {
            const checkbox = this.elements[`modal${condition.charAt(0).toUpperCase() + condition.slice(1)}Toggle`];
            if (checkbox) {
                checkbox.checked = this.settings.bandConditions[condition];
            }
        });
    }

    populateExactSpeedOptions() {
        if (!this.elements.exactSpeed || !this.elements.speedRange) return;

        const speedRange = this.elements.speedRange.value;
        const [minSpeed, maxSpeed] = speedRange.split('-').map(Number);
        
        // Clear existing options
        this.elements.exactSpeed.innerHTML = '<option value="auto">Auto (varies in range)</option>';
        
        // Add speed options in 5 WPM increments
        for (let speed = 10; speed <= 80; speed += 5) {
            if (speed >= minSpeed && speed <= maxSpeed) {
                const option = document.createElement('option');
                option.value = speed;
                option.textContent = `${speed} WPM`;
                this.elements.exactSpeed.appendChild(option);
            }
        }
    }

    saveSettingsFromModal() {
        try {
            // Contest mode
            const selectedMode = document.querySelector('input[name="contestMode"]:checked');
            if (selectedMode) {
                this.settings.contestMode = selectedMode.value;
            }

            // Speed settings
            if (this.elements.speedRange) {
                this.settings.speedRange = this.elements.speedRange.value;
            }
            
            if (this.elements.exactSpeed) {
                this.settings.exactSpeed = this.elements.exactSpeed.value;
            }

            // Audio settings
            if (this.elements.cwPitch) {
                this.settings.pitch = parseInt(this.elements.cwPitch.value);
            }
            
            if (this.elements.volumeSlider) {
                this.settings.volume = parseInt(this.elements.volumeSlider.value) / 100;
            }

            // Station settings
            if (this.elements.modalMyCallsign) {
                this.settings.myCallsign = this.elements.modalMyCallsign.value.toUpperCase();
            }
            
            if (this.elements.myZone) {
                this.settings.myZone = this.elements.myZone.value;
            }

            // Activity settings
            if (this.elements.activityLevel) {
                this.settings.activityLevel = parseInt(this.elements.activityLevel.value);
            }
            
            if (this.elements.modalContestDuration) {
                this.settings.duration = parseInt(this.elements.modalContestDuration.value);
            }

            // Band conditions
            ['qrn', 'qrm', 'flutter', 'qsb', 'lids', 'pileup'].forEach(condition => {
                const checkbox = this.elements[`modal${condition.charAt(0).toUpperCase() + condition.slice(1)}Toggle`];
                if (checkbox) {
                    this.settings.bandConditions[condition] = checkbox.checked;
                }
            });
            
            // Update audio engine with new settings  
            this.updateAudioSettings();
            
            // Update UI elements with new settings
            this.updateUIFromSettings();
            
            this.closeSettingsModal();
            this.showToast('Settings saved successfully!', 'bg-green-600');
            
            console.log('Contest settings updated:', this.settings);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings', 'bg-red-600');
        }
    }

    resetSettingsToDefaults() {
        // Reset to default values
        this.settings = {
            contestType: 'cqww',
            contestMode: 'pileup',
            duration: 5,
            myCallsign: 'OM0RX',
            myZone: '15',
            pitch: 600,
            volume: 0.7,
            speedRange: '25-35',
            exactSpeed: 'auto',
            activityLevel: 5,
            bandConditions: {
                qrn: false,
                qrm: false,
                flutter: false,
                qsb: false,
                lids: false,
                pileup: false
            }
        };
        
        // Repopulate modal with defaults
        this.populateSettingsModal();
        
        this.showToast('Settings reset to defaults', 'bg-yellow-600');
    }

    updateUIFromSettings() {
        // Update main UI elements with settings from modal
        if (this.elements.myCallsignInput) {
            this.elements.myCallsignInput.value = this.settings.myCallsign;
        }
        
        if (this.elements.contestDurationSelect) {
            this.elements.contestDurationSelect.value = this.settings.duration;
        }
        
        // Update band condition toggles in main UI
        ['qrn', 'qrm', 'flutter', 'qsb', 'lids', 'pileup'].forEach(condition => {
            const toggle = this.elements[condition + 'Toggle'];
            if (toggle) {
                toggle.checked = this.settings.bandConditions[condition];
            }
        });
    }

    // Contest Flow Methods
    handleCQSent() {
        console.log('CQ sent - waiting for stations to call');
        this.waitingForCQ = false;
        
        // Generate calling stations based on activity level and contest mode
        this.generateCallingStations();
        
        // Start transmitting calling stations after brief delay
        setTimeout(() => {
            this.startCallingStations();
        }, 1000 + Math.random() * 2000); // 1-3 second delay
    }

    generateCallingStations() {
        this.currentCallingStations = [];
        
        let stationCount;
        switch (this.settings.contestMode) {
            case 'single':
                stationCount = 1;
                break;
            case 'pileup':
                stationCount = Math.min(this.settings.activityLevel, Math.floor(Math.random() * this.settings.activityLevel) + 1);
                break;
            case 'wpx':
                stationCount = Math.floor(Math.random() * 3) + 1; // 1-3 stations
                break;
            default:
                stationCount = 1;
        }
        
        for (let i = 0; i < stationCount; i++) {
            const station = this.createRandomStation();
            this.currentCallingStations.push(station);
        }
        
        console.log(`Generated ${stationCount} calling stations:`, this.currentCallingStations.map(s => s.callsign));
    }

    async startCallingStations() {
        if (this.currentCallingStations.length === 0) return;
        
        // In pile-up mode, stations might transmit simultaneously or in quick succession
        if (this.settings.contestMode === 'pileup' && this.currentCallingStations.length > 1) {
            // Stagger transmissions slightly
            this.currentCallingStations.forEach((station, index) => {
                setTimeout(() => {
                    this.transmitCallingStation(station);
                }, index * 500); // 500ms between stations
            });
        } else {
            // Single station or single mode
            const station = this.currentCallingStations[0];
            this.transmitCallingStation(station);
        }
    }

    async transmitCallingStation(station) {
        if (!this.audioEngine || !station) return;
        
        // Station calls with just their callsign
        const message = station.callsign;
        
        console.log(`Station calling: ${message}`);
        
        try {
            await this.audioEngine.playMorseString(message, {
                callsign: station.callsign,
                speed: station.speed,
                pitch: this.settings.pitch + (Math.random() - 0.5) * 100, // ±50Hz variation
                signalStrength: station.signal,
                chirp: station.chirp,
                straightKey: station.straightKey
            });
            
            // Store this as the station we're working
            this.lastQSOCallsign = station.callsign;
            this.lastQSOExchange = this.generateExchange(station);
            
        } catch (error) {
            console.error('Error transmitting calling station:', error);
        }
    }

    handleExchangeSent() {
        // After sending exchange, the station should reply with their exchange
        if (this.lastQSOCallsign && this.lastQSOExchange) {
            console.log(`Exchange sent to ${this.lastQSOCallsign}, expecting their exchange: ${this.lastQSOExchange}`);
            
            // Station replies with their exchange after delay
            setTimeout(() => {
                this.sendStationReply();
            }, 2000 + Math.random() * 1000); // 2-3 second delay
        }
    }

    async sendStationReply() {
        if (!this.lastQSOCallsign || !this.lastQSOExchange || !this.audioEngine) return;
        
        const replyMessage = this.lastQSOExchange;
        console.log(`${this.lastQSOCallsign} replying with: ${replyMessage}`);
        
        try {
            // Find the station data
            const station = this.currentCallingStations.find(s => s.callsign === this.lastQSOCallsign) || {
                callsign: this.lastQSOCallsign,
                speed: 25,
                signal: 'S7'
            };
            
            await this.audioEngine.playMorseString(replyMessage, {
                callsign: station.callsign,
                speed: station.speed,
                pitch: this.settings.pitch + (Math.random() - 0.5) * 100,
                signalStrength: station.signal,
                chirp: station.chirp,
                straightKey: station.straightKey
            });
            
            // Now user should log this QSO
            console.log('QSO ready to be logged');
            
        } catch (error) {
            console.error('Error sending station reply:', error);
        }
    }

    // Audio Methods
    setupContestAudio() {
        if (this.audioEngine) {
            // Apply current settings to audio engine
            this.audioEngine.updateSettings({
                pitch: this.settings.pitch,
                volume: this.settings.volume,
                bandConditions: this.settings.bandConditions
            });
            
            console.log('Contest audio setup complete');
        }
    }

    updateAudioSettings() {
        if (this.audioEngine) {
            this.audioEngine.updateSettings({
                pitch: this.settings.pitch,
                volume: this.settings.volume,
                bandConditions: this.settings.bandConditions
            });
            
            console.log('Audio settings updated:', {
                pitch: this.settings.pitch,
                volume: this.settings.volume,
                bandConditions: this.settings.bandConditions
            });
        }
    }

    startBackgroundNoise() {
        if (this.audioEngine && this.settings.bandConditions.qrn) {
            // Start atmospheric noise in background
            this.audioEngine.startBackgroundEffects();
            console.log('Background QRN started');
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