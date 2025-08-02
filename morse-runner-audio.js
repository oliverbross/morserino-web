/**
 * Morse Runner Audio Engine
 * Advanced CW audio generation with contest-specific effects
 * Integrates with existing Koch trainer audio system
 */

class ContestAudioEngine {
    constructor() {
        this.audioContext = null;
        this.activeStations = new Map(); // Map of active contest stations
        this.noiseNode = null;
        this.qsbGainNode = null;
        this.pileupStations = [];
        
        // Contest-specific audio settings
        this.contestSettings = {
            signalStrength: 'S7',
            noiseLevel: 'S3',
            qsb: false,
            qrm: false,
            qrn: false,
            flutter: false,
            pileup: false,
            lids: false,
            pitch: 600,
            volume: 0.7
        };
        
        // Morse code patterns (same as Koch trainer)
        this.morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '?': '..--..', '/': '-..-.'
        };
        
        // Contest messages and patterns
        this.contestMessages = {
            cq: 'CQ CONTEST',
            exchange: '599',
            tu: 'TU',
            qrz: 'QRZ',
            agn: 'AGN',
            qrl: 'QRL?'
        };
        
        console.log('Contest Audio Engine initialized');
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log('Contest audio context initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize contest audio:', error);
            return false;
        }
    }

    // Play a complete contest exchange
    async playContestExchange(callsign, exchange, speed = 25, options = {}) {
        if (!this.audioContext) {
            console.error('Audio context not initialized');
            return;
        }

        const station = {
            callsign: callsign,
            exchange: exchange,
            speed: speed,
            pitch: options.pitch || this.contestSettings.pitch,
            signalStrength: options.signalStrength || 'S7',
            frequency: options.frequency || 14025000,
            ...options
        };

        // Apply realistic signal characteristics
        this.applyStationCharacteristics(station);
        
        // Send the complete exchange
        const message = `${callsign} ${exchange}`;
        await this.playMorseString(message, station);
    }

    // Play a morse code string with contest effects
    async playMorseString(text, station) {
        if (!this.audioContext || !text) return;

        const cleanText = text.toUpperCase().replace(/[^A-Z0-9 /?]/g, '');
        const dotTime = 1200 / station.speed; // milliseconds per dot
        
        let currentTime = this.audioContext.currentTime;
        const stationId = `${station.callsign}_${Date.now()}`;
        
        // Track this station for pile-up management
        this.activeStations.set(stationId, station);

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            
            if (char === ' ') {
                // Word space (7 dot times total, we already have 3 from character space)
                currentTime += (dotTime * 4) / 1000;
            } else if (this.morseCode[char]) {
                currentTime = await this.playMorseCharacter(char, currentTime, station, stationId);
                // Character space (3 dot times)
                currentTime += (dotTime * 3) / 1000;
            }
        }

        // Clean up station tracking after transmission completes
        setTimeout(() => {
            this.activeStations.delete(stationId);
        }, (currentTime - this.audioContext.currentTime + 1) * 1000);
    }

    // Play a single morse character with effects
    async playMorseCharacter(character, startTime, station, stationId) {
        if (!this.morseCode[character]) return startTime;

        const pattern = this.morseCode[character];
        const dotTime = 1200 / station.speed; // milliseconds per dot
        
        let currentTime = startTime;

        for (let i = 0; i < pattern.length; i++) {
            const element = pattern[i];
            
            if (element === '.') {
                // Dit
                currentTime = this.playTone(currentTime, dotTime / 1000, station, stationId);
                currentTime += dotTime / 1000; // Element gap
            } else if (element === '-') {
                // Dah (3 times dit length)
                currentTime = this.playTone(currentTime, (dotTime * 3) / 1000, station, stationId);
                currentTime += dotTime / 1000; // Element gap
            }
        }

        return currentTime;
    }

    // Play a single tone with all contest effects
    playTone(startTime, duration, station, stationId) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Base frequency with optional chirp
        let frequency = station.pitch;
        if (this.contestSettings.flutter) {
            // Add flutter effect (rapid frequency variation)
            frequency += Math.sin(startTime * 20) * 5; // ±5 Hz flutter
        }
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Signal strength adjustment
        const signalLevel = this.getSignalLevel(station.signalStrength);
        let baseGain = signalLevel * this.contestSettings.volume;
        
        // Apply station-specific characteristics
        if (station.chirp) {
            // Chirp effect - frequency slide during tone
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.frequency.linearRampToValueAtTime(frequency + 50, startTime + duration);
        }
        
        if (station.straightKey) {
            // Human straight key variations
            const humanVariation = (Math.random() - 0.5) * 0.1; // ±10% timing variation
            duration = duration * (1 + humanVariation);
            
            // Slight gain variations for hand key "fist"
            baseGain *= (0.9 + Math.random() * 0.2); // 90%-110% gain variation
        }

        // Envelope shaping
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(baseGain, startTime + 0.003); // 3ms attack
        gainNode.gain.setValueAtTime(baseGain, startTime + duration - 0.003);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // 3ms decay

        // Connect through effect chain
        oscillator.connect(gainNode);
        
        // Apply QSB if enabled
        if (this.contestSettings.qsb && this.qsbGainNode) {
            gainNode.connect(this.qsbGainNode);
        } else {
            gainNode.connect(this.audioContext.destination);
        }

        // Schedule playback
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        return startTime + duration;
    }

    // Convert signal strength to gain value
    getSignalLevel(signalStrength) {
        const levels = {
            'S1': 0.1, 'S2': 0.15, 'S3': 0.25, 'S4': 0.35, 'S5': 0.5,
            'S6': 0.65, 'S7': 0.8, 'S8': 0.9, 'S9': 1.0, 'S9+': 1.2
        };
        return levels[signalStrength] || 0.8;
    }

    // Apply realistic station characteristics
    applyStationCharacteristics(station) {
        // Add random characteristics based on contest conditions
        if (this.contestSettings.lids && Math.random() < 0.2) {
            // 20% chance of poor operator characteristics
            station.straightKey = true;
            station.speed *= 0.8; // Slower speed
            station.timing = 'poor';
        }

        if (Math.random() < 0.1) {
            // 10% chance of chirpy transmitter
            station.chirp = true;
        }

        // Signal strength variations
        const strengthOptions = ['S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
        if (!station.signalStrength) {
            station.signalStrength = strengthOptions[Math.floor(Math.random() * strengthOptions.length)];
        }
    }

    // Start contest-specific background effects
    startContestEffects() {
        this.startContestNoise();
        this.startContestQSB();
        this.startContestQRM();
    }

    // Stop all contest effects
    stopContestEffects() {
        this.stopNoise();
        this.stopQSB();
        this.stopQRM();
        this.activeStations.clear();
    }

    // Contest-specific noise (atmospheric and band noise)
    startContestNoise() {
        if (this.noiseNode) {
            this.noiseNode.stop();
            this.noiseNode = null;
        }

        if (!this.contestSettings.qrn) return;

        const noiseLevels = {
            'S1': 0.05, 'S3': 0.15, 'S5': 0.25, 'S7': 0.35, 'S9': 0.5
        };

        const noiseLevel = noiseLevels[this.contestSettings.noiseLevel] || 0.15;
        
        this.noiseNode = this.generateContestNoise('pink');
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = noiseLevel * 0.1;

        this.noiseNode.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        this.noiseNode.start();
    }

    // Generate contest-appropriate noise
    generateContestNoise(type = 'pink') {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        let lastOutput = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            if (type === 'pink') {
                // Pink noise for atmospheric conditions
                const rand = Math.random() * 2 - 1;
                lastOutput = (lastOutput * 0.98) + (rand * 0.02);
                data[i] = lastOutput * 10;
            } else if (type === 'impulse') {
                // Impulse noise for line noise/powerline QRN
                data[i] = Math.random() < 0.001 ? (Math.random() * 6 - 3) : 0;
            }
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    }

    // Contest QSB (signal fading)
    startContestQSB() {
        if (!this.contestSettings.qsb) return;

        if (this.qsbInterval) {
            clearInterval(this.qsbInterval);
        }

        if (!this.qsbGainNode) {
            this.qsbGainNode = this.audioContext.createGain();
            this.qsbGainNode.gain.value = 1.0;
            this.qsbGainNode.connect(this.audioContext.destination);
        }

        // Contest QSB - faster and more dramatic than training QSB
        const fadeTime = 3; // 3 second fades for contest realism
        let fadingDown = true;

        this.qsbInterval = setInterval(() => {
            if (!this.qsbGainNode) return;

            const currentTime = this.audioContext.currentTime;
            const targetGain = fadingDown ? 0.1 : 1.0; // Fade between 10% and 100%

            this.qsbGainNode.gain.cancelScheduledValues(currentTime);
            this.qsbGainNode.gain.setValueAtTime(this.qsbGainNode.gain.value, currentTime);
            this.qsbGainNode.gain.exponentialRampToValueAtTime(targetGain, currentTime + fadeTime);

            fadingDown = !fadingDown;
        }, fadeTime * 1000);
    }

    // Contest QRM - multiple competing stations
    startContestQRM() {
        if (!this.contestSettings.qrm) return;

        // Create multiple competing stations
        this.createQRMStation(75);  // +75 Hz
        this.createQRMStation(-50); // -50 Hz
        
        if (this.contestSettings.pileup) {
            // Add pile-up stations
            this.createQRMStation(125);  // +125 Hz
            this.createQRMStation(-100); // -100 Hz
            this.createQRMStation(200);  // +200 Hz
        }
    }

    createQRMStation(frequencyOffset) {
        const qrmOscillator = this.audioContext.createOscillator();
        const qrmGain = this.audioContext.createGain();
        
        qrmOscillator.frequency.value = this.contestSettings.pitch + frequencyOffset;
        qrmOscillator.type = 'sine';
        qrmGain.gain.value = 0;
        
        qrmOscillator.connect(qrmGain);
        qrmGain.connect(this.audioContext.destination);
        qrmOscillator.start();
        
        // Send random contest messages
        this.sendRandomContestQRM(qrmGain, 20 + Math.random() * 15); // 20-35 WPM
    }

    sendRandomContestQRM(gainNode, speed) {
        if (!gainNode) return;

        const messages = [
            'CQ CONTEST', 'QRZ', 'TU', '599', 'AGN', 'QRL?'
        ];
        
        // Send messages at random intervals
        const sendMessage = () => {
            if (!gainNode) return;
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            const dotTime = 1200 / speed;
            
            // Convert message to morse and modulate gain
            let currentTime = this.audioContext.currentTime;
            
            for (let char of message) {
                if (char === ' ') {
                    currentTime += (dotTime * 7) / 1000;
                } else if (this.morseCode[char]) {
                    const pattern = this.morseCode[char];
                    
                    for (let element of pattern) {
                        if (element === '.') {
                            gainNode.gain.setValueAtTime(0.2, currentTime);
                            currentTime += dotTime / 1000;
                            gainNode.gain.setValueAtTime(0, currentTime);
                            currentTime += dotTime / 1000;
                        } else if (element === '-') {
                            gainNode.gain.setValueAtTime(0.2, currentTime);
                            currentTime += (dotTime * 3) / 1000;
                            gainNode.gain.setValueAtTime(0, currentTime);
                            currentTime += dotTime / 1000;
                        }
                    }
                    currentTime += (dotTime * 3) / 1000; // Character space
                }
            }
            
            // Schedule next message
            setTimeout(sendMessage, 5000 + Math.random() * 10000); // 5-15 seconds
        };
        
        // Start after random delay
        setTimeout(sendMessage, Math.random() * 3000);
    }

    // Stop individual effects
    stopNoise() {
        if (this.noiseNode) {
            this.noiseNode.stop();
            this.noiseNode = null;
        }
    }

    stopQSB() {
        if (this.qsbInterval) {
            clearInterval(this.qsbInterval);
            this.qsbInterval = null;
        }
        if (this.qsbGainNode) {
            this.qsbGainNode.disconnect();
            this.qsbGainNode = null;
        }
    }

    stopQRM() {
        // QRM stations will be cleaned up when contest stops
        // Individual cleanup would require tracking each oscillator
    }

    // Update contest settings
    updateSettings(newSettings) {
        Object.assign(this.contestSettings, newSettings);
        
        // Restart effects with new settings
        if (this.audioContext) {
            this.stopContestEffects();
            this.startContestEffects();
        }
    }

    // Simulate realistic contest station behavior
    generateContestStation(callsign, contestType = 'cqww') {
        const exchanges = {
            'cqww': () => `599 ${Math.floor(Math.random() * 40) + 1}`, // Zone
            'arrldx': () => `599 ${Math.floor(Math.random() * 1500) + 100}`, // Power
            'cqwpx': () => `599 ${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}` // Serial
        };

        const exchange = exchanges[contestType] ? exchanges[contestType]() : '599';
        const speed = 15 + Math.random() * 25; // 15-40 WPM range

        return {
            callsign: callsign,
            exchange: exchange,
            speed: speed,
            contestType: contestType,
            mode: Math.random() < 0.7 ? 'CQ' : 'SP' // 70% CQ, 30% Search & Pounce
        };
    }
}

// Export for use in main Morse Runner
window.ContestAudioEngine = ContestAudioEngine;