// Help page functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Help page loaded');

    // Initialize collapsible sections
    initializeCollapsibleSections();
    
    // Initialize audio demos
    initializeAudioDemos();
    
    // Initialize feedback form
    initializeFeedbackForm();
    
    // Initialize sortable sections
    initializeSortableHelp();
    
    // Smooth scrolling for navigation links
    initializeSmoothScrolling();
});

// Collapsible sections functionality
function initializeCollapsibleSections() {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const header = section.querySelector('.section-header');
        const content = section.querySelector('.section-content');
        const icon = header.querySelector('svg');
        
        if (header && content && icon) {
            // Start with all sections expanded for help content
            content.style.display = 'block';
            
            header.addEventListener('click', () => {
                const isCollapsed = content.style.display === 'none';
                
                if (isCollapsed) {
                    // Expand
                    content.style.display = 'block';
                    icon.style.transform = 'rotate(0deg)';
                    section.classList.remove('collapsed');
                } else {
                    // Collapse
                    content.style.display = 'none';
                    icon.style.transform = 'rotate(-90deg)';
                    section.classList.add('collapsed');
                }
            });
        }
    });
}

// Audio demo functionality
function initializeAudioDemos() {
    window.playSignalDemo = function(demoType) {
        console.log('Playing audio demo:', demoType);
        
        // Create audio context if not exists
        if (!window.helpAudioContext) {
            try {
                window.helpAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                alert('Web Audio API not supported in your browser. Please use Chrome, Firefox, or Edge.');
                return;
            }
        }
        
        // Resume audio context if suspended
        if (window.helpAudioContext.state === 'suspended') {
            window.helpAudioContext.resume();
        }
        
        const audioCtx = window.helpAudioContext;
        const currentTime = audioCtx.currentTime;
        
        switch (demoType) {
            case 'strength':
                playSignalStrengthDemo(audioCtx, currentTime);
                break;
            case 'qsb':
                playQSBDemo(audioCtx, currentTime);
                break;
            case 'chirp':
                playChirpDemo(audioCtx, currentTime);
                break;
            case 'straight':
                playStraightKeyDemo(audioCtx, currentTime);
                break;
            case 'qrm':
                playQRMDemo(audioCtx, currentTime);
                break;
            case 'noise':
                playNoiseDemo(audioCtx, currentTime);
                break;
            default:
                console.log('Unknown demo type:', demoType);
        }
    };
}

// Signal strength demo
function playSignalStrengthDemo(audioCtx, startTime) {
    const frequencies = [600, 600, 600]; // Same frequency
    const gains = [0.1, 0.5, 0.9]; // S1, S5, S9
    const labels = ['S1 (Weak)', 'S5 (Moderate)', 'S9 (Strong)'];
    
    let currentTime = startTime + 0.1;
    
    labels.forEach((label, index) => {
        // Announce the signal strength
        console.log(`Playing ${label}`);
        
        // Play morse "S" for signal strength demo
        const dotDuration = 0.08;
        const pauseDuration = 0.08;
        
        // Three dots for "S"
        for (let i = 0; i < 3; i++) {
            playToneDemo(audioCtx, currentTime, dotDuration, frequencies[index], gains[index]);
            currentTime += dotDuration + pauseDuration;
        }
        
        currentTime += 0.8; // Pause between demonstrations
    });
}

// QSB (fading) demo
function playQSBDemo(audioCtx, startTime) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(600, startTime);
    osc.type = 'sine';
    
    // Create fading effect
    const duration = 3.0;
    gainNode.gain.setValueAtTime(0.7, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + duration / 2);
    gainNode.gain.exponentialRampToValueAtTime(0.7, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Chirp effect demo
function playChirpDemo(audioCtx, startTime) {
    // Play two tones - one clean, one with chirp
    let currentTime = startTime + 0.1;
    
    // Clean tone first
    playToneDemo(audioCtx, currentTime, 0.5, 600, 0.6);
    currentTime += 0.8;
    
    // Chirped tone
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    
    // Chirp effect - frequency slides up
    const startFreq = 550;
    const endFreq = 600;
    const chirpDuration = 0.05;
    const totalDuration = 0.5;
    
    osc.frequency.setValueAtTime(startFreq, currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, currentTime + chirpDuration);
    
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.6, currentTime + 0.01);
    gainNode.gain.setValueAtTime(0.6, currentTime + totalDuration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + totalDuration);
    
    osc.start(currentTime);
    osc.stop(currentTime + totalDuration);
}

// Straight key demo
function playStraightKeyDemo(audioCtx, startTime) {
    // Play "CQ" with irregular timing
    let currentTime = startTime + 0.1;
    const baseFreq = 600;
    const baseGain = 0.6;
    
    // C: -.-. (dah dit dah dit)
    const cPattern = [
        { duration: 0.24, type: 'dah' },
        { duration: 0.08, type: 'pause' },
        { duration: 0.08, type: 'dit' },
        { duration: 0.08, type: 'pause' },
        { duration: 0.24, type: 'dah' },
        { duration: 0.08, type: 'pause' },
        { duration: 0.08, type: 'dit' }
    ];
    
    // Add timing irregularities for straight key
    cPattern.forEach(element => {
        if (element.type !== 'pause') {
            const variance = (Math.random() - 0.5) * 0.4; // ±20% timing variation
            const irregularDuration = element.duration * (1 + variance);
            const irregularRise = 0.003 + (Math.random() * 0.007);
            const irregularFall = 0.005 + (Math.random() * 0.010);
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.frequency.setValueAtTime(baseFreq, currentTime);
            osc.type = 'sine';
            
            // Irregular envelope
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(baseGain, currentTime + irregularRise);
            gainNode.gain.setValueAtTime(baseGain, currentTime + irregularDuration - irregularFall);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + irregularDuration);
            
            osc.start(currentTime);
            osc.stop(currentTime + irregularDuration);
        }
        
        currentTime += element.duration;
    });
}

// QRM interference demo
function playQRMDemo(audioCtx, startTime) {
    // Main signal playing "CQ"
    let currentTime = startTime + 0.1;
    playToneDemo(audioCtx, currentTime, 0.5, 600, 0.6); // Main signal
    
    // Interfering signal at offset frequency
    setTimeout(() => {
        const qrmOsc = audioCtx.createOscillator();
        const qrmGain = audioCtx.createGain();
        
        qrmOsc.connect(qrmGain);
        qrmGain.connect(audioCtx.destination);
        
        qrmOsc.frequency.value = 675; // 75 Hz offset
        qrmOsc.type = 'sine';
        
        // Send interfering pattern
        const qrmStartTime = audioCtx.currentTime;
        const dotTime = 0.08;
        let qrmTime = qrmStartTime;
        
        // Send "DE" pattern as interference
        const dePattern = [0.08, 0.08, 0.24, 0.08, 0.08]; // D E
        
        dePattern.forEach((duration, index) => {
            if (index % 2 === 0) {
                qrmGain.gain.setValueAtTime(0.3, qrmTime);
                qrmGain.gain.setValueAtTime(0, qrmTime + duration);
            } else {
                qrmGain.gain.setValueAtTime(0, qrmTime);
            }
            qrmTime += duration + 0.05;
        });
        
        qrmOsc.start(qrmStartTime);
        qrmOsc.stop(qrmStartTime + 2.0);
    }, 200);
}

// Background noise demo
function playNoiseDemo(audioCtx, startTime) {
    // Generate pink noise buffer
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOutput = 0;
    for (let i = 0; i < bufferSize; i++) {
        const rand = Math.random() * 2 - 1;
        lastOutput = (lastOutput * 0.98) + (rand * 0.02);
        data[i] = lastOutput * 10; // Scale up pink noise
    }
    
    const noiseSource = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();
    
    noiseSource.buffer = buffer;
    noiseSource.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noiseGain.gain.value = 0.15; // Moderate noise level
    
    noiseSource.start(startTime);
    
    // Also play a signal through the noise
    setTimeout(() => {
        playToneDemo(audioCtx, audioCtx.currentTime, 0.5, 600, 0.5);
    }, 500);
}

// Helper function to play a tone
function playToneDemo(audioCtx, startTime, duration, frequency, gain) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005);
    gainNode.gain.setValueAtTime(gain, startTime + duration - 0.005);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Feedback form functionality
function initializeFeedbackForm() {
    const form = document.getElementById('feedbackForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                type: document.getElementById('feedbackType').value,
                subject: document.getElementById('feedbackSubject').value,
                message: document.getElementById('feedbackMessage').value,
                email: document.getElementById('feedbackEmail').value,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Validate required fields
            if (!formData.subject.trim() || !formData.message.trim()) {
                alert('Please fill in both subject and message fields.');
                return;
            }
            
            // For now, log the feedback (in production, this would be sent to a server)
            console.log('Feedback submitted:', formData);
            
            // Create a mailto link as fallback
            const emailBody = `
Type: ${formData.type}
Subject: ${formData.subject}

Message:
${formData.message}

Technical Info:
- Timestamp: ${formData.timestamp}
- Browser: ${formData.userAgent}
- Page: ${formData.url}
${formData.email ? `- Reply to: ${formData.email}` : ''}
            `.trim();
            
            const mailtoLink = `mailto:oliver@om0rx.com?subject=CW Trainer Feedback: ${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;
            
            // Show success message
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = '✅ Opening email client...';
            submitButton.disabled = true;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Reset form
            setTimeout(() => {
                form.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                
                // Show success message
                alert('Thank you for your feedback! Your email client should have opened with a pre-filled message. If not, please email oliver@om0rx.com directly.');
            }, 2000);
        });
    }
}

// Sortable help sections
function initializeSortableHelp() {
    const sortableContainer = document.getElementById('sortable-help-sections');
    
    if (sortableContainer && typeof Sortable !== 'undefined') {
        Sortable.create(sortableContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.section-header',
            onEnd: function(evt) {
                console.log('Help section moved from', evt.oldIndex, 'to', evt.newIndex);
                
                // Save the new order to localStorage
                const sectionOrder = Array.from(sortableContainer.children).map(section => section.dataset.id);
                localStorage.setItem('helpSectionOrder', JSON.stringify(sectionOrder));
            }
        });
        
        // Restore saved section order
        const savedOrder = localStorage.getItem('helpSectionOrder');
        if (savedOrder) {
            try {
                const order = JSON.parse(savedOrder);
                const sections = Array.from(sortableContainer.children);
                
                // Sort sections according to saved order
                order.forEach((sectionId, index) => {
                    const section = sections.find(s => s.dataset.id === sectionId);
                    if (section) {
                        sortableContainer.appendChild(section);
                    }
                });
            } catch (error) {
                console.log('Error restoring help section order:', error);
            }
        }
    }
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Expand the target section if it's collapsed
                const targetContent = targetElement.querySelector('.section-content');
                const targetIcon = targetElement.querySelector('.section-header svg');
                
                if (targetContent && targetContent.style.display === 'none') {
                    targetContent.style.display = 'block';
                    targetIcon.style.transform = 'rotate(0deg)';
                    targetElement.classList.remove('collapsed');
                }
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Add highlight effect
                targetElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                setTimeout(() => {
                    targetElement.style.boxShadow = '';
                }, 2000);
            }
        });
    });
}

// Utility function to show toast messages
function showToast(message, className = 'bg-blue-600') {
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
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize demo availability check
document.addEventListener('DOMContentLoaded', () => {
    // Check Web Audio API support
    if (!window.AudioContext && !window.webkitAudioContext) {
        const demoButtons = document.querySelectorAll('.demo-button');
        demoButtons.forEach(button => {
            button.disabled = true;
            button.textContent = '❌ Audio not supported';
            button.classList.add('opacity-50', 'cursor-not-allowed');
        });
    }
    
    console.log('OM0RX CW Trainer Help System initialized');
});