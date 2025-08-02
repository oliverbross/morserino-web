/**
 * Koch Method CW Trainer
 * Progressive Morse code character learning system
 * Version 1.0 - January 2025
 */

class KochTrainer {
    constructor() {
        // Koch character order (progressive learning sequence)
        this.kochOrder = [
            // Stage 1-10: Letters (most distinctive patterns first)
            'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
            'W', 'I', 'N', 'J', 'E', 'F', '0', 'Y', 'V', 'G',
            '5', 'Q', '9', 'Z', 'H', '8', 'B', '?', '4', 'X',
            'C', 'D', '6', '7', '1', '2', '3',
            
            // Prosigns
            '<AR>', '<SK>', '<KN>', '<BT>'
        ];

        // Morse code patterns
        this.morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '?': '..--..', '<AR>': '.-.-.',
            '<SK>': '...-.-', '<KN>': '-.--.', '<BT>': '-...-'
        };

        // Training state
        this.isTraining = false;
        this.isPaused = false;
        this.currentCharacter = null;
        this.sessionStartTime = null;
        this.sessionStats = {
            correct: 0,
            total: 0,
            streak: 0,
            maxStreak: 0,
            characterStats: {}
        };

        // Audio context and settings
        this.audioContext = null;
        this.noiseNode = null;
        this.qsbInterval = null;
        this.qsbGainNode = null;
        this.qrmOscillator = null;
        this.qrmGainNode = null;
        this.settings = {
            characterCount: 2,
            charSpeed: 20,
            effectiveSpeed: 17,
            displayDelay: 2.0,
            pitch: 600,
            volume: 0.7,
            sessionLength: 10,
            signalStrength: 'S9',
            noiseLevel: 'off',
            qsb: false,
            chirp: false,
            straightKey: false,
            qrm: false
        };

        // User progress (will be loaded from server)
        this.userProgress = {
            charactersLearned: 1,
            characterMastery: { 'K': 0 }, // character: accuracy_percentage
            totalSessions: 0,
            totalTime: 0
        };

        this.initializeElements();
        this.setupEventListeners();
        this.checkUserAuthentication();
    }

    initializeElements() {
        // UI Elements
        this.elements = {
            // Display
            currentCharacter: document.getElementById('currentCharacter'),
            sessionTimer: document.getElementById('sessionTimer'),
            charactersLearned: document.getElementById('charactersLearned'),
            sessionAccuracy: document.getElementById('sessionAccuracy'),
            currentStreak: document.getElementById('currentStreak'),
            characterGrid: document.getElementById('characterGrid'),
            
            // Controls
            startTrainingButton: document.getElementById('startTrainingButton'),
            pauseTrainingButton: document.getElementById('pauseTrainingButton'),
            stopTrainingButton: document.getElementById('stopTrainingButton'),
            
            // Settings
            characterCountSlider: document.getElementById('characterCountSlider'),
            characterCountValue: document.getElementById('characterCountValue'),
            charSpeedSlider: document.getElementById('charSpeedSlider'),
            charSpeedValue: document.getElementById('charSpeedValue'),
            effectiveSpeedSelect: document.getElementById('effectiveSpeedSelect'),
            displayDelaySlider: document.getElementById('displayDelaySlider'),
            displayDelayValue: document.getElementById('displayDelayValue'),
            pitchSlider: document.getElementById('pitchSlider'),
            pitchValue: document.getElementById('pitchValue'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            sessionLengthSlider: document.getElementById('sessionLengthSlider'),
            sessionLengthValue: document.getElementById('sessionLengthValue'),
            
            // Advanced
            signalStrengthSelect: document.getElementById('signalStrengthSelect'),
            noiseLevelSelect: document.getElementById('noiseLevelSelect'),
            qsbToggle: document.getElementById('qsbToggle'),
            chirpToggle: document.getElementById('chirpToggle'),
            straightKeyToggle: document.getElementById('straightKeyToggle'),
            qrmToggle: document.getElementById('qrmToggle'),
            
            // Navigation
            backToTrainingFromKoch: document.getElementById('backToTrainingFromKoch'),
            viewStatisticsFromKoch: document.getElementById('viewStatisticsFromKoch'),
            resetProgressButton: document.getElementById('resetProgressButton'),
            
            // User status
            currentUsername: document.getElementById('currentUsername'),
            userStatus: document.getElementById('userStatus')
        };
    }

    setupEventListeners() {
        // Section toggles (collapsible sections)
        this.setupSectionToggles();
        
        // Training controls
        this.elements.startTrainingButton.addEventListener('click', () => this.startTraining());
        this.elements.pauseTrainingButton.addEventListener('click', () => this.pauseTraining());
        this.elements.stopTrainingButton.addEventListener('click', () => this.stopTraining());
        
        // Settings sliders and inputs
        this.setupSettingsListeners();
        
        // Navigation
        this.elements.backToTrainingFromKoch.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        this.elements.viewStatisticsFromKoch.addEventListener('click', () => {
            window.location.href = 'statistics.html';
        });
        this.elements.resetProgressButton.addEventListener('click', () => this.resetProgress());
        
        // Keyboard input for training
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
        
        // Initialize character grid
        this.updateCharacterGrid();
    }

    setupSectionToggles() {
        const sections = [
            'training-display', 'session-control', 'character-selection', 
            'speed-settings', 'audio-settings', 'advanced-settings'
        ];
        
        sections.forEach(sectionId => {
            const header = document.querySelector(`[data-id="${sectionId}"] .section-header`);
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.querySelector(`[data-id="${sectionId}-icon"]`);
            
            if (header && content && icon) {
                header.addEventListener('click', () => {
                    const isHidden = content.classList.contains('hidden');
                    content.classList.toggle('hidden');
                    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                });
                
                // Show training display by default
                if (sectionId === 'training-display') {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        });
        
        // Initialize Sortable for drag-and-drop sections
        if (typeof Sortable !== 'undefined') {
            Sortable.create(document.getElementById('sortable-sections'), {
                animation: 150,
                ghostClass: 'sortable-ghost'
            });
        }
    }

    setupSettingsListeners() {
        // Character count slider
        this.elements.characterCountSlider.addEventListener('input', (e) => {
            this.settings.characterCount = parseInt(e.target.value);
            this.elements.characterCountValue.textContent = this.settings.characterCount;
            this.updateCharacterGrid();
        });
        
        // Character speed slider
        this.elements.charSpeedSlider.addEventListener('input', (e) => {
            this.settings.charSpeed = parseInt(e.target.value);
            this.elements.charSpeedValue.textContent = this.settings.charSpeed;
        });
        
        // Effective speed select
        this.elements.effectiveSpeedSelect.addEventListener('change', (e) => {
            this.settings.effectiveSpeed = parseInt(e.target.value);
        });
        
        // Display delay slider
        this.elements.displayDelaySlider.addEventListener('input', (e) => {
            this.settings.displayDelay = parseFloat(e.target.value);
            this.elements.displayDelayValue.textContent = this.settings.displayDelay.toFixed(1);
        });
        
        // Pitch slider
        this.elements.pitchSlider.addEventListener('input', (e) => {
            this.settings.pitch = parseInt(e.target.value);
            this.elements.pitchValue.textContent = this.settings.pitch;
        });
        
        // Volume slider
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value) / 100;
            this.elements.volumeValue.textContent = `${e.target.value}%`;
        });
        
        // Session length slider
        this.elements.sessionLengthSlider.addEventListener('input', (e) => {
            this.settings.sessionLength = parseInt(e.target.value);
            this.elements.sessionLengthValue.textContent = this.settings.sessionLength;
        });
        
        // Advanced settings
        this.elements.signalStrengthSelect.addEventListener('change', (e) => {
            this.settings.signalStrength = e.target.value;
            console.log('Signal strength changed to:', e.target.value);
        });
        
        this.elements.noiseLevelSelect.addEventListener('change', (e) => {
            this.settings.noiseLevel = e.target.value;
            console.log('Noise level changed to:', e.target.value);
            // Restart noise if training is active
            if (this.isTraining && !this.isPaused) {
                this.startNoise();
            }
        });
        
        // Effect toggles
        ['qsb', 'chirp', 'straightKey', 'qrm'].forEach(effect => {
            const toggle = this.elements[`${effect}Toggle`];
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.settings[effect] = e.target.checked;
                    console.log(`${effect} effect changed to:`, e.target.checked);
                    
                    // Restart effects if training is active
                    if (this.isTraining && !this.isPaused) {
                        if (effect === 'qsb') {
                            this.startQSB();
                        } else if (effect === 'qrm') {
                            this.startQRM();
                        }
                        // chirp and straightKey effects are applied per-tone, no restart needed
                    }
                });
            }
        });
    }

    async checkUserAuthentication() {
        try {
            const response = await fetch('/morserino/api/session.php', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.username) {
                    this.elements.currentUsername.textContent = data.username;
                    this.elements.userStatus.classList.remove('hidden');
                    await this.loadUserProgress();
                } else {
                    this.redirectToLogin();
                }
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        alert('Please log in to use the Koch CW Trainer.');
        window.location.href = 'login.html';
    }

    async loadUserProgress() {
        try {
            // Load user's Koch training progress from server
            const response = await fetch('/morserino/api/koch-progress.php', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.userProgress = { ...this.userProgress, ...data.progress };
                    this.updateProgressDisplay();
                }
            }
        } catch (error) {
            console.error('Failed to load user progress:', error);
            // Continue with default progress
        }
    }

    updateCharacterGrid() {
        const grid = this.elements.characterGrid;
        grid.innerHTML = '';
        
        const activeCount = Math.min(this.settings.characterCount, this.kochOrder.length);
        
        this.kochOrder.forEach((char, index) => {
            const item = document.createElement('div');
            item.className = 'character-item';
            item.textContent = char;
            
            if (index < activeCount) {
                item.classList.add('active');
            }
            
            // Check if character is mastered
            const accuracy = this.userProgress.characterMastery[char] || 0;
            if (accuracy >= 90) {
                item.classList.add('mastered');
            }
            
            item.addEventListener('click', () => {
                if (index < activeCount) {
                    this.playCharacter(char);
                }
            });
            
            grid.appendChild(item);
        });
    }

    updateProgressDisplay() {
        this.elements.charactersLearned.textContent = this.userProgress.charactersLearned;
        this.updateCharacterGrid();
    }

    async startTraining() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                alert('Web Audio API is not supported in your browser. Please use Chrome, Firefox, or Edge.');
                return;
            }
        }

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isTraining = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();
        
        // Reset session stats
        this.sessionStats = {
            correct: 0,
            total: 0,
            streak: 0,
            maxStreak: 0,
            characterStats: {}
        };

        // Update UI
        this.elements.startTrainingButton.classList.add('hidden');
        this.elements.pauseTrainingButton.classList.remove('hidden');
        this.elements.stopTrainingButton.classList.remove('hidden');
        
        document.body.classList.add('training-active');
        
        // Start audio effects based on settings
        this.startAudioEffects();
        
        // Start the training loop
        this.nextCharacter();
        this.startSessionTimer();
        
        console.log('Koch training session started with effects:', {
            signalStrength: this.settings.signalStrength,
            noiseLevel: this.settings.noiseLevel,
            qsb: this.settings.qsb,
            chirp: this.settings.chirp,
            straightKey: this.settings.straightKey,
            qrm: this.settings.qrm
        });
    }

    startAudioEffects() {
        // Start background noise
        this.startNoise();
        
        // Start QSB fading if enabled
        if (this.settings.qsb) {
            this.startQSB();
        }
        
        // Start QRM interference if enabled
        if (this.settings.qrm) {
            this.startQRM();
        }
    }

    pauseTraining() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.elements.pauseTrainingButton.textContent = '▶️ Resume';
            this.elements.pauseTrainingButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            this.elements.pauseTrainingButton.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            this.elements.pauseTrainingButton.textContent = '⏸️ Pause';
            this.elements.pauseTrainingButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            this.elements.pauseTrainingButton.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            
            // Resume with next character
            if (this.isTraining) {
                setTimeout(() => this.nextCharacter(), 1000);
            }
        }
    }

    stopTraining() {
        this.isTraining = false;
        this.isPaused = false;
        
        // Stop all audio effects
        this.stopAllEffects();
        
        // Update UI
        this.elements.startTrainingButton.classList.remove('hidden');
        this.elements.pauseTrainingButton.classList.add('hidden');
        this.elements.stopTrainingButton.classList.add('hidden');
        this.elements.pauseTrainingButton.textContent = '⏸️ Pause';
        
        document.body.classList.remove('training-active');
        this.elements.currentCharacter.textContent = 'Session Ended';
        
        // Save session results
        this.saveSessionResults();
        
        console.log('Koch training session stopped');
    }

    nextCharacter() {
        if (!this.isTraining || this.isPaused) return;
        
        // Select random character from active set
        const activeChars = this.kochOrder.slice(0, this.settings.characterCount);
        this.currentCharacter = activeChars[Math.floor(Math.random() * activeChars.length)];
        
        // Clear display first
        this.elements.currentCharacter.textContent = '';
        
        // Play the character
        this.playCharacter(this.currentCharacter);
        
        // Show character after delay
        setTimeout(() => {
            if (this.isTraining && this.currentCharacter) {
                this.elements.currentCharacter.textContent = this.currentCharacter;
            }
        }, this.settings.displayDelay * 1000);
    }

    playCharacter(character) {
        if (!this.audioContext || !this.morseCode[character]) return;
        
        const pattern = this.morseCode[character];
        const dotDuration = 1200 / this.settings.charSpeed; // milliseconds per dot at given WPM
        const dashDuration = dotDuration * 3;
        const elementGap = dotDuration;
        const charGap = dotDuration * 7; // Farnsworth timing adjustment
        
        let currentTime = this.audioContext.currentTime;
        
        for (let i = 0; i < pattern.length; i++) {
            const element = pattern[i];
            const duration = element === '.' ? dotDuration : dashDuration;
            
            this.playTone(currentTime, duration / 1000);
            currentTime += (duration + elementGap) / 1000;
        }
        
        // Schedule next character if training continues
        if (this.isTraining && !this.isPaused) {
            const totalCharTime = (currentTime - this.audioContext.currentTime) * 1000;
            const nextCharDelay = Math.max(totalCharTime + charGap, 2000); // Minimum 2 seconds between characters
            
            setTimeout(() => {
                if (this.isTraining && !this.isPaused) {
                    this.nextCharacter();
                }
            }, nextCharDelay);
        }
    }

    playTone(startTime, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Create audio chain: Oscillator -> Gain -> Effects -> Destination
        oscillator.connect(gainNode);
        
        // Apply signal strength (S-meter simulation)
        const signalStrength = this.getSignalStrengthValue();
        const baseVolume = this.settings.volume * (signalStrength / 10.0);
        
        // Configure oscillator
        let frequency = this.settings.pitch;
        oscillator.type = 'sine';
        
        // CHIRP EFFECT - Frequency shift at start of each element
        if (this.settings.chirp) {
            const chirpAmount = 50; // Hz shift
            const chirpDuration = 0.05; // 50ms chirp
            const startFreq = frequency - chirpAmount;
            const endFreq = frequency;
            
            oscillator.frequency.setValueAtTime(startFreq, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + chirpDuration);
        } else {
            oscillator.frequency.setValueAtTime(frequency, startTime);
        }
        
        // STRAIGHT KEY EFFECT - Add timing irregularities
        if (this.settings.straightKey) {
            // Add slight timing variations (±10%)
            const variance = (Math.random() - 0.5) * 0.2;
            duration = duration * (1 + variance);
            
            // Irregular key-up/key-down timing
            const riseTime = 0.003 + (Math.random() * 0.007); // 3-10ms rise
            const fallTime = 0.005 + (Math.random() * 0.010); // 5-15ms fall
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(baseVolume, startTime + riseTime);
            gainNode.gain.setValueAtTime(baseVolume, startTime + duration - fallTime);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        } else {
            // Clean electronic keying
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(baseVolume, startTime + 0.005);
            gainNode.gain.setValueAtTime(baseVolume, startTime + duration - 0.005);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        }
        
        // Connect through QSB gain node if fading is enabled
        if (this.settings.qsb && this.qsbGainNode) {
            gainNode.connect(this.qsbGainNode);
            this.qsbGainNode.connect(this.audioContext.destination);
        } else {
            gainNode.connect(this.audioContext.destination);
        }
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    getSignalStrengthValue() {
        const strengthMap = {
            'S1': 1, 'S2': 2, 'S3': 3, 'S4': 4, 'S5': 5,
            'S6': 6, 'S7': 7, 'S8': 8, 'S9': 9
        };
        return strengthMap[this.settings.signalStrength] || 9;
    }

    // Generate noise for background effects
    generateNoise(type = 'pink') {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        let lastOutput = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            if (type === 'white') {
                data[i] = Math.random() * 2 - 1;
            } else if (type === 'pink') {
                // Pink noise (1/f power spectrum)
                const rand = Math.random() * 2 - 1;
                lastOutput = (lastOutput * 0.98) + (rand * 0.02);
                data[i] = lastOutput * 15; // Scale up pink noise
            } else if (type === 'impulse') {
                // Impulse noise (crackles)
                data[i] = Math.random() < 0.001 ? (Math.random() * 4 - 2) : 0;
            }
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    // Start noise based on noise level setting
    startNoise() {
        if (this.noiseNode) {
            this.noiseNode.stop();
            this.noiseNode = null;
        }
        
        if (this.settings.noiseLevel === 'off') return;
        
        const noiseLevelMap = {
            'S3': 0.15,
            'S5': 0.30,
            'S7': 0.50,
            'S9': 0.80
        };
        
        const noiseLevel = noiseLevelMap[this.settings.noiseLevel] || 0;
        if (noiseLevel === 0) return;
        
        this.noiseNode = this.generateNoise('pink');
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = noiseLevel * 0.1; // Scale to prevent clipping
        
        this.noiseNode.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        this.noiseNode.start();
    }

    // QSB (Fading) effect - modulate gain over time
    startQSB() {
        if (this.qsbInterval) {
            clearInterval(this.qsbInterval);
            this.qsbInterval = null;
        }
        
        if (!this.settings.qsb || !this.audioContext) {
            // Clean up QSB gain node if disabling
            if (this.qsbGainNode) {
                this.qsbGainNode.disconnect();
                this.qsbGainNode = null;
            }
            return;
        }
        
        // Create a dedicated gain node for QSB if it doesn't exist
        if (!this.qsbGainNode) {
            this.qsbGainNode = this.audioContext.createGain();
            this.qsbGainNode.gain.value = 1.0;
        }
        
        // Slow fading cycle (5-10 seconds)
        const fadeTime = 7; // seconds
        let fadingDown = true;
        
        this.qsbInterval = setInterval(() => {
            if (!this.qsbGainNode) return;
            
            const currentTime = this.audioContext.currentTime;
            const targetGain = fadingDown ? 0.2 : 1.0; // Fade between 20% and 100%
            
            this.qsbGainNode.gain.cancelScheduledValues(currentTime);
            this.qsbGainNode.gain.setValueAtTime(this.qsbGainNode.gain.value, currentTime);
            this.qsbGainNode.gain.exponentialRampToValueAtTime(targetGain, currentTime + fadeTime);
            
            fadingDown = !fadingDown;
        }, fadeTime * 1000);
    }

    // QRM (Interference) - Add competing CW signal
    startQRM() {
        if (this.qrmOscillator) {
            this.qrmOscillator.stop();
            this.qrmOscillator = null;
        }
        
        if (!this.settings.qrm || !this.audioContext) return;
        
        // Create competing CW station slightly off frequency
        this.qrmOscillator = this.audioContext.createOscillator();
        this.qrmGainNode = this.audioContext.createGain();
        
        this.qrmOscillator.frequency.value = this.settings.pitch + 75; // 75 Hz offset
        this.qrmOscillator.type = 'sine';
        this.qrmGainNode.gain.value = 0; // Start silent, modulate for morse code
        
        this.qrmOscillator.connect(this.qrmGainNode);
        this.qrmGainNode.connect(this.audioContext.destination);
        
        // Send random morse code pattern
        this.qrmOscillator.start();
        this.sendRandomQRM();
    }

    sendRandomQRM() {
        if (!this.qrmOscillator || !this.qrmGainNode) return;
        
        const patterns = ['.- -...', '... ---', '.--', '-.-.', '-..']; // A B, S O, W, C, D
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const dotTime = 1200 / 25; // 25 WPM interference
        
        let currentTime = this.audioContext.currentTime;
        
        // Send the pattern by modulating the gain
        for (let char of pattern) {
            if (char === '.') {
                // Dit - turn on
                this.qrmGainNode.gain.setValueAtTime(0.3, currentTime);
                currentTime += dotTime / 1000;
                this.qrmGainNode.gain.setValueAtTime(0, currentTime);
                currentTime += dotTime / 1000; // Element gap
            } else if (char === '-') {
                // Dah - turn on for longer
                this.qrmGainNode.gain.setValueAtTime(0.3, currentTime);
                currentTime += (dotTime * 3) / 1000;
                this.qrmGainNode.gain.setValueAtTime(0, currentTime);
                currentTime += dotTime / 1000; // Element gap
            } else if (char === ' ') {
                // Space between characters
                currentTime += (dotTime * 3) / 1000;
            }
        }
        
        // Schedule next random QRM after delay
        setTimeout(() => {
            if (this.qrmOscillator && this.settings.qrm) {
                this.sendRandomQRM();
            }
        }, (Math.random() * 5000) + 3000); // 3-8 seconds between QRM
    }

    // Stop all effects
    stopAllEffects() {
        if (this.noiseNode) {
            this.noiseNode.stop();
            this.noiseNode = null;
        }
        
        if (this.qsbInterval) {
            clearInterval(this.qsbInterval);
            this.qsbInterval = null;
        }
        
        if (this.qsbGainNode) {
            this.qsbGainNode.disconnect();
            this.qsbGainNode = null;
        }
        
        if (this.qrmOscillator) {
            this.qrmOscillator.stop();
            this.qrmOscillator = null;
        }
        
        if (this.qrmGainNode) {
            this.qrmGainNode.disconnect();
            this.qrmGainNode = null;
        }
    }

    handleKeyboardInput(event) {
        if (!this.isTraining || this.isPaused || !this.currentCharacter) return;
        
        const key = event.key.toUpperCase();
        
        // Handle special keys for prosigns
        let inputChar = key;
        if (key === 'ENTER' || key === 'RETURN') {
            inputChar = '<AR>'; // End of message
        }
        
        this.processAnswer(inputChar);
    }

    processAnswer(inputChar) {
        this.sessionStats.total++;
        
        const isCorrect = inputChar === this.currentCharacter;
        
        if (isCorrect) {
            this.sessionStats.correct++;
            this.sessionStats.streak++;
            this.sessionStats.maxStreak = Math.max(this.sessionStats.maxStreak, this.sessionStats.streak);
        } else {
            this.sessionStats.streak = 0;
        }
        
        // Update character-specific stats
        if (!this.sessionStats.characterStats[this.currentCharacter]) {
            this.sessionStats.characterStats[this.currentCharacter] = { correct: 0, total: 0 };
        }
        this.sessionStats.characterStats[this.currentCharacter].total++;
        if (isCorrect) {
            this.sessionStats.characterStats[this.currentCharacter].correct++;
        }
        
        // Update UI
        this.updateSessionDisplay();
        
        // Brief visual feedback
        this.elements.currentCharacter.style.color = isCorrect ? '#10b981' : '#ef4444';
        setTimeout(() => {
            this.elements.currentCharacter.style.color = '';
        }, 500);
        
        // Continue to next character after brief pause
        setTimeout(() => {
            if (this.isTraining && !this.isPaused) {
                this.nextCharacter();
            }
        }, 1000);
    }

    updateSessionDisplay() {
        const accuracy = this.sessionStats.total > 0 
            ? Math.round((this.sessionStats.correct / this.sessionStats.total) * 100) 
            : 0;
        
        this.elements.sessionAccuracy.textContent = `${accuracy}%`;
        this.elements.currentStreak.textContent = this.sessionStats.streak;
    }

    startSessionTimer() {
        const updateTimer = () => {
            if (!this.isTraining) return;
            
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            this.elements.sessionTimer.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Check if session should end
            const sessionLengthSeconds = this.settings.sessionLength * 60;
            if (elapsed >= sessionLengthSeconds) {
                this.stopTraining();
                return;
            }
            
            setTimeout(updateTimer, 1000);
        };
        
        updateTimer();
    }

    async saveSessionResults() {
        try {
            const sessionData = {
                duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
                correct: this.sessionStats.correct,
                total: this.sessionStats.total,
                accuracy: this.sessionStats.total > 0 ? (this.sessionStats.correct / this.sessionStats.total) * 100 : 0,
                characterStats: this.sessionStats.characterStats,
                settings: { ...this.settings }
            };
            
            const response = await fetch('/morserino/api/koch-session.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sessionData)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('Session saved successfully');
                    // Update local progress
                    await this.loadUserProgress();
                }
            }
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    async resetProgress() {
        if (confirm('Are you sure you want to reset all Koch training progress? This cannot be undone.')) {
            try {
                const response = await fetch('/morserino/api/koch-reset.php', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Reset local progress
                        this.userProgress = {
                            charactersLearned: 1,
                            characterMastery: { 'K': 0 },
                            totalSessions: 0,
                            totalTime: 0
                        };
                        
                        // Reset settings to defaults
                        this.settings.characterCount = 2;
                        this.elements.characterCountSlider.value = 2;
                        this.elements.characterCountValue.textContent = '2';
                        
                        this.updateProgressDisplay();
                        alert('Progress reset successfully!');
                    }
                }
            } catch (error) {
                console.error('Failed to reset progress:', error);
                alert('Failed to reset progress. Please try again.');
            }
        }
    }
}

// Initialize the Koch Trainer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Koch CW Trainer loading...');
    
    // Check for Web Audio API support
    if (!window.AudioContext && !window.webkitAudioContext) {
        const warning = document.createElement('div');
        warning.className = 'bg-yellow-600 text-white p-4 rounded-lg mb-4';
        warning.innerHTML = `
            <h3 class="font-bold">⚠️ Audio Not Supported</h3>
            <p>Your browser doesn't support Web Audio API. Please use Chrome, Firefox, or Edge for full functionality.</p>
        `;
        document.querySelector('.container').insertBefore(warning, document.getElementById('sortable-sections'));
    }
    
    // Initialize the trainer
    window.kochTrainer = new KochTrainer();
    
    console.log('Koch CW Trainer initialized successfully');
});