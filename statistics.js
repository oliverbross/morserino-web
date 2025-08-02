document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Statistics page loading - Version 4.0 - FIXED: Timestamp & Character Accuracy');
    console.log('🔄 CRITICAL FIXES: Timestamp parsing + Character-based accuracy calculation');
    console.log('🚨 If you still see 100% accuracy or "N/A" time, please hard refresh (Ctrl+F5)');
    
    // Show a temporary visual indicator that new version loaded
    const tempIndicator = document.createElement('div');
    tempIndicator.innerHTML = '✅ V4.0 Loaded - Timestamp & Accuracy Fixed';
    tempIndicator.style.cssText = 'position:fixed;top:10px;left:10px;background:#10b981;color:white;padding:8px;border-radius:4px;z-index:9999;font-size:12px;';
    document.body.appendChild(tempIndicator);
    setTimeout(() => document.body.removeChild(tempIndicator), 3000);

    // Check if user is logged in
    const username = sessionStorage.getItem('username');
    if (!username) {
        window.location.href = 'index.html';
        return;
    }

    // Update username display
    document.getElementById('currentUsername').textContent = username;

    // API configuration
    const apiBaseUrl = 'https://om0rx.com/morserino/api';

    // Initialize page
    fetchHistoricalStats(username);

    // Event listeners
    document.getElementById('backToMainButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('startTrainingButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('accountButton').addEventListener('click', () => {
        window.location.href = 'account.html';
    });

    // Help button navigation
    const helpFromStats = document.getElementById('helpFromStats');
    if (helpFromStats) {
        helpFromStats.addEventListener('click', () => {
            window.location.href = 'help.html';
        });
    }

    document.getElementById('logoutButton').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    // Clear statistics functionality
    document.getElementById('clearStatsButton').addEventListener('click', () => {
        document.getElementById('clearConfirmModal').classList.remove('hidden');
    });

    document.getElementById('cancelClearButton').addEventListener('click', () => {
        document.getElementById('clearConfirmModal').classList.add('hidden');
    });

    document.getElementById('confirmClearButton').addEventListener('click', async () => {
        await clearAllStatistics(username);
        document.getElementById('clearConfirmModal').classList.add('hidden');
    });

    // Toast notification function
    function showToast(message, bgColor = 'bg-blue-600') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 ${bgColor}`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // Clear all statistics
    async function clearAllStatistics(username) {
        try {
            const response = await fetch(`${apiBaseUrl}/stats.php`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await response.json();
            
            if (response.ok) {
                showToast('All statistics cleared successfully!', 'bg-green-600');
                showEmptyState();
            } else {
                showToast(`Failed to clear statistics: ${data.message}`, 'bg-red-600');
            }
        } catch (error) {
            console.error('Error clearing statistics:', error);
            showToast('Error clearing statistics', 'bg-red-600');
        }
    }

    // Fetch historical statistics
    async function fetchHistoricalStats(username, force = false) {
        try {
            console.log('Fetching stats for username:', username);
            const response = await fetch(`${apiBaseUrl}/get_stats.php?username=${encodeURIComponent(username)}&limit=100`, {
                method: 'GET',
                credentials: 'include'
            });

            console.log('API response status:', response.status);
            const data = await response.json();
            console.log('API response data:', data);
            
            if (response.ok && data.length > 0) {
                console.log('Loaded historical stats:', data.length, 'sessions');
                populateDashboard(data);
            } else {
                console.log('No historical stats found or API error:', response.status, data);
                showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching historical stats:', error);
            showEmptyState();
        }
    }

    // Show empty state
    function showEmptyState() {
        document.getElementById('statisticsDashboard').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
    }

    // Helper function to calculate CHARACTER-based accuracy (more important for CW than word accuracy)
    function calculateCharacterAccuracy(session) {
        const totalCharsAttempted = (session.letters || 0) + (session.numbers || 0) + (session.signs || 0);
        const charErrors = session.errors || session.character_errors || 0;
        const correctChars = totalCharsAttempted - charErrors;
        
        // Debug logging for first session
        if (session.mode && (session.letters > 0 || session.numbers > 0 || session.signs > 0)) {
            console.log(`🔢 ACCURACY CALC DEBUG:`, {
                totalCharsAttempted,
                charErrors,
                correctChars,
                'session.errors': session.errors,
                'session.character_errors': session.character_errors,
                accuracy: totalCharsAttempted > 0 ? ((correctChars / totalCharsAttempted) * 100).toFixed(1) + '%' : 'N/A'
            });
        }
        
        if (totalCharsAttempted > 0) {
            // Use character-based accuracy calculation (NEW METHOD)
            return (correctChars / totalCharsAttempted) * 100;
        } else if (session.characters_attempted > 0) {
            // Fallback to old character system if available
            return (session.characters_correct / session.characters_attempted) * 100;
        } else if (session.total > 0) {
            // Last resort: word-based accuracy (less accurate for CW)
            return (session.correct / session.total) * 100;
        } else {
            return 0;
        }
    }

    // Populate dashboard with data
    function populateDashboard(data) {
        document.getElementById('statisticsDashboard').classList.remove('hidden');
        document.getElementById('emptyState').classList.add('hidden');

        populatePerformanceOverview(data);
        populateProgressCharts(data);
        populateRecentSessions(data);
        populateTrainingInsights(data);
        populateModePerformance(data);
    }

    // Performance overview cards
    function populatePerformanceOverview(data) {
        const overview = document.getElementById('performanceOverview');
        const recent = data.slice(0, 10); // Last 10 sessions
        
        if (recent.length === 0) {
            overview.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-400">
                    <p class="text-lg">📊 No training data yet</p>
                    <p class="text-sm">Complete some training sessions to see your progress!</p>
                </div>
            `;
            return;
        }

        // Calculate key metrics using CHARACTER-based accuracy
        const avgAccuracy = recent.reduce((sum, s) => {
            return sum + calculateCharacterAccuracy(s);
        }, 0) / recent.length;

        const avgSpeed = recent.filter(s => s.wpm > 0)
            .reduce((sum, s, _, arr) => sum + s.wpm / arr.length, 0);

        const totalSessions = data.length;
        const totalCharacters = recent.reduce((sum, s) => sum + (s.characters_attempted || s.letters + s.numbers + s.signs), 0);

        overview.innerHTML = `
            <div class="bg-blue-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold">${avgAccuracy.toFixed(1)}%</div>
                <div class="text-sm text-blue-200">Avg Accuracy</div>
            </div>
            <div class="bg-green-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold">${avgSpeed.toFixed(1)}</div>
                <div class="text-sm text-green-200">Avg Speed (WPM)</div>
            </div>
            <div class="bg-purple-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold">${totalSessions}</div>
                <div class="text-sm text-purple-200">Total Sessions</div>
            </div>
            <div class="bg-yellow-900 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold">${totalCharacters.toLocaleString()}</div>
                <div class="text-sm text-yellow-200">Characters Trained</div>
            </div>
        `;
    }

    // Progress charts
    function populateProgressCharts(data) {
        console.log('Creating progress charts...');
        createAccuracyChart(data.slice(0, 15).reverse());
        createSpeedChart(data.slice(0, 15).reverse());
    }

    function createAccuracyChart(data) {
        const container = document.getElementById('accuracyChart');
        if (!container || data.length === 0) return;

        const chartData = data.map(stat => {
            return calculateCharacterAccuracy(stat);
        });

        // Clear container and create simple bar chart
        container.innerHTML = '';
        container.className = 'h-48 relative flex items-end justify-center space-x-1 p-2';

        // Add scale lines
        const scaleContainer = document.createElement('div');
        scaleContainer.className = 'absolute inset-0 flex flex-col justify-between text-xs text-gray-500 pointer-events-none';
        [100, 75, 50, 25, 0].forEach(value => {
            const line = document.createElement('div');
            line.className = 'border-b border-gray-600 border-dashed opacity-30';
            line.innerHTML = `<span class="absolute -left-8 -top-2">${value}%</span>`;
            scaleContainer.appendChild(line);
        });
        container.appendChild(scaleContainer);

        // Create bars
        const barsContainer = document.createElement('div');
        barsContainer.className = 'flex items-end justify-center space-x-1 h-full relative z-10';
        
        chartData.forEach((accuracy, index) => {
            const bar = document.createElement('div');
            const height = Math.max(4, (accuracy / 100) * 160); // Min 4px height, max 160px
            
            // Color based on accuracy
            let colorClass = '';
            if (accuracy >= 90) colorClass = 'bg-green-500';
            else if (accuracy >= 75) colorClass = 'bg-yellow-500';
            else colorClass = 'bg-red-500';
            
            bar.className = `${colorClass} w-4 rounded-t transition-all duration-300 relative group cursor-pointer`;
            bar.style.height = `${height}px`;
            
            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1 z-20';
            tooltip.textContent = `Session ${index + 1}: ${accuracy.toFixed(1)}%`;
            bar.appendChild(tooltip);
            
            barsContainer.appendChild(bar);
        });
        
        container.appendChild(barsContainer);
    }

    function createSpeedChart(data) {
        const container = document.getElementById('speedChart');
        if (!container || data.length === 0) return;

        const speedData = data.map(stat => stat.wpm || 0);
        const maxSpeed = Math.max(...speedData, 20); // Min scale of 20 WPM

        // Clear container and create simple bar chart
        container.innerHTML = '';
        container.className = 'h-48 relative flex items-end justify-center space-x-1 p-2';

        // Add scale lines
        const scaleContainer = document.createElement('div');
        scaleContainer.className = 'absolute inset-0 flex flex-col justify-between text-xs text-gray-500 pointer-events-none';
        const scaleValues = [maxSpeed, maxSpeed * 0.75, maxSpeed * 0.5, maxSpeed * 0.25, 0];
        scaleValues.forEach(value => {
            const line = document.createElement('div');
            line.className = 'border-b border-gray-600 border-dashed opacity-30';
            line.innerHTML = `<span class="absolute -left-10 -top-2">${Math.round(value)}</span>`;
            scaleContainer.appendChild(line);
        });
        container.appendChild(scaleContainer);

        // Create bars
        const barsContainer = document.createElement('div');
        barsContainer.className = 'flex items-end justify-center space-x-1 h-full relative z-10';
        
        speedData.forEach((wpm, index) => {
            const bar = document.createElement('div');
            const height = Math.max(4, (wpm / maxSpeed) * 160); // Min 4px height, max 160px
            
            // Color based on speed
            let colorClass = '';
            if (wpm >= 15) colorClass = 'bg-green-500';
            else if (wpm >= 10) colorClass = 'bg-yellow-500';
            else if (wpm >= 5) colorClass = 'bg-orange-500';
            else colorClass = 'bg-red-500';
            
            bar.className = `${colorClass} w-4 rounded-t transition-all duration-300 relative group cursor-pointer`;
            bar.style.height = `${height}px`;
            
            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1 z-20';
            tooltip.textContent = `Session ${index + 1}: ${wpm.toFixed(1)} WPM`;
            bar.appendChild(tooltip);
            
            barsContainer.appendChild(bar);
        });
        
        container.appendChild(barsContainer);
    }

    // Recent sessions
    function populateRecentSessions(data) {
        console.log('🔄 PopulateRecentSessions called with:', data);
        const container = document.getElementById('recentSessions');
        const recent = data.slice(0, 8);
        
        console.log('📋 Recent sessions to display:', recent);
        
        if (recent.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400">No recent sessions</div>';
            return;
        }

        container.innerHTML = recent.map((session, index) => {
            // Only log first session for debugging
            if (index === 0) {
                console.log(`📊 Processing first session:`, session);
            }
            
            // Calculate CHARACTER-based accuracy (more important for CW training than word accuracy)
            const accuracy = calculateCharacterAccuracy(session).toFixed(1);
            if (index === 0) {
                console.log(`🎯 RECENT SESSIONS accuracy result: ${accuracy}%`);
                console.log(`📊 Full session data for debugging:`, session);
            }
            
            // Fix date parsing - handle different date formats (check both 'date' and 'timestamp' fields)
            let date = new Date().toLocaleDateString();
            let time = '';
            try {
                if (index === 0) {
                    console.log(`🔍 Session date fields:`, {
                        'session.date': session.date,
                        'session.timestamp': session.timestamp
                    });
                }
                
                const dateSource = session.timestamp || session.date; // Check timestamp first
                if (dateSource && dateSource !== null && dateSource !== '') {
                    if (index === 0) console.log(`🗓️ Using dateSource:`, dateSource, typeof dateSource);
                    
                    // Handle various date formats
                    let dateObj;
                    
                    if (typeof dateSource === 'string') {
                        // Try parsing as string first
                        dateObj = new Date(dateSource);
                        
                        // If that fails, try parsing as MySQL datetime format
                        if (isNaN(dateObj.getTime()) && dateSource.includes('-')) {
                            // Format: YYYY-MM-DD HH:mm:ss or YYYY-MM-DD
                            dateObj = new Date(dateSource.replace(' ', 'T'));
                        }
                        
                        // If still fails, try as timestamp string
                        if (isNaN(dateObj.getTime())) {
                            const timestamp = parseInt(dateSource);
                            if (!isNaN(timestamp)) {
                                dateObj = new Date(timestamp);
                            }
                        }
                    } else if (typeof dateSource === 'number') {
                        // Handle as timestamp
                        dateObj = new Date(dateSource);
                    } else {
                        // Try direct conversion
                        dateObj = new Date(dateSource);
                    }
                    
                    if (dateObj && !isNaN(dateObj.getTime())) {
                        date = dateObj.toLocaleDateString();
                        time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        if (index === 0) console.log(`✅ Successfully parsed date & time:`, date, time);
                    } else {
                        if (index === 0) console.log(`❌ Could not parse date/timestamp:`, dateSource);
                        date = 'Recent';
                        time = '';
                    }
                } else {
                    if (index === 0) console.log(`⚠️ No date or timestamp provided in session data`);
                    date = 'Recent';
                    time = '';
                }
            } catch (e) {
                if (index === 0) console.log('❌ Date parsing error:', e, 'for date/timestamp:', dateSource);
                date = 'Recent';
                time = '';
            }
            
            if (index === 0) {
                console.log(`📅 Final date/time result: date="${date}", time="${time}"`);
            }
            
            // Mode name mapping to friendly names
            const modeNames = {
                realWords: 'Real Words',
                abbreviations: 'Abbreviations',
                callsigns: 'Callsigns', 
                qrCodes: 'QR Codes',
                topWords: 'Top Words in CW',
                mixed: 'Mixed Mode'
            };
            const mode = modeNames[session.mode] || session.mode || 'Unknown';
            if (index === 0) console.log(`🎯 Mode transformation: "${session.mode}" → "${mode}"`);
            
            const wpm = session.wpm ? `${session.wpm.toFixed(1)} WPM` : 'N/A';
            
            // Calculate additional info
            const totalChars = (session.letters || 0) + (session.numbers || 0) + (session.signs || 0);
            const errors = session.errors || session.character_errors || 0;
            
            // Duration/time display logic
            let duration;
            if (session.duration && session.duration > 0) {
                duration = `${session.duration}s`;
            } else if (time) {
                duration = time;
            } else {
                duration = 'Recent';
            }
            
            if (index === 0) {
                console.log(`⏱️ Duration logic: session.duration="${session.duration}", time="${time}", final="${duration}"`);
            }
            
            let accuracyColor = 'text-red-400';
            if (parseFloat(accuracy) >= 90) accuracyColor = 'text-green-400';
            else if (parseFloat(accuracy) >= 75) accuracyColor = 'text-yellow-400';
            
            if (index === 0) {
                console.log(`📋 FINAL DISPLAY VALUES:`, {
                    mode,
                    date,
                    duration,
                    accuracy: accuracy + '%',
                    wpm,
                    totalChars,
                    errors,
                    accuracyColor
                });
            }
            
            return `
                <div class="bg-gray-900 p-4 rounded-lg">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-semibold text-blue-400">${mode}</div>
                            <div class="text-sm text-gray-400">${date} • ${duration}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold ${accuracyColor}">${accuracy}%</div>
                            <div class="text-sm text-gray-400">${wpm}</div>
                        </div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>📝 ${totalChars} chars</span>
                        <span>❌ ${errors} errors</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Recent sessions HTML updated');
        console.log('🎯 Final container HTML length:', container.innerHTML.length);
        
        // Verification checks
        if (container.innerHTML.includes('QR Codes')) {
            console.log('✅ SUCCESS: Found "QR Codes" in HTML - mode names working!');
        }
        
        if (container.innerHTML.includes('Invalid Date')) {
            console.log('❌ PROBLEM: Still showing "Invalid Date"');
        } else {
            console.log('✅ SUCCESS: No "Invalid Date" found');
        }
        
        if (container.innerHTML.includes('N/A')) {
            console.log('⚠️ WARNING: Found "N/A" in output - check time/duration parsing');
        } else {
            console.log('✅ SUCCESS: No "N/A" found - time parsing working');
        }
        
        if (container.innerHTML.includes('100.0%')) {
            console.log('⚠️ WARNING: Found "100.0%" accuracy - check character accuracy calculation');
        } else {
            console.log('✅ SUCCESS: Character accuracy calculation appears to be working');
        }
    }

    // Training insights
    function populateTrainingInsights(data) {
        const container = document.getElementById('trainingInsights');
        const recent = data.slice(0, 10);
        
        if (recent.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400">Complete more sessions for insights</div>';
            return;
        }

        // Calculate insights using CHARACTER-based accuracy
        const avgAccuracy = recent.reduce((sum, s) => {
            return sum + calculateCharacterAccuracy(s);
        }, 0) / recent.length;

        const accuracyTrend = recent.length >= 3 ? 
            (recent.slice(0, 3).reduce((sum, s) => sum + calculateCharacterAccuracy(s), 0) / 3) -
            (recent.slice(-3).reduce((sum, s) => sum + calculateCharacterAccuracy(s), 0) / 3) : 0;

        let insights = [];
        
        if (avgAccuracy >= 95) {
            insights.push("🎉 Excellent accuracy! You're mastering Morse code.");
        } else if (avgAccuracy >= 85) {
            insights.push("👍 Good accuracy! Keep practicing for consistency.");
        } else if (avgAccuracy >= 70) {
            insights.push("📈 Decent progress! Focus on accuracy over speed.");
        } else {
            insights.push("💪 Keep practicing! Accuracy will improve with time.");
        }

        if (accuracyTrend > 5) {
            insights.push("📈 Your accuracy is improving! Great progress.");
        } else if (accuracyTrend < -5) {
            insights.push("📉 Try slowing down to maintain accuracy.");
        }

        const mostCommonMode = data.reduce((acc, session) => {
            acc[session.mode] = (acc[session.mode] || 0) + 1;
            return acc;
        }, {});
        
        const preferredModeKey = Object.keys(mostCommonMode).reduce((a, b) => 
            mostCommonMode[a] > mostCommonMode[b] ? a : b
        );
        
        // Mode name mapping to friendly names
        const modeNames = {
            realWords: 'Real Words',
            abbreviations: 'Abbreviations',
            callsigns: 'Callsigns', 
            qrCodes: 'QR Codes',
            topWords: 'Top Words in CW',
            mixed: 'Mixed Mode'
        };
        const preferredMode = modeNames[preferredModeKey] || preferredModeKey || 'Unknown';
        
        insights.push(`🎯 You practice ${preferredMode} mode most often.`);

        container.innerHTML = insights.map(insight => 
            `<div class="mb-2 p-2 bg-gray-800 rounded">${insight}</div>`
        ).join('');
    }

    // Mode performance breakdown
    function populateModePerformance(data) {
        const container = document.getElementById('modePerformance');
        
        // Group by mode
        const modeStats = data.reduce((acc, session) => {
            const mode = session.mode || 'Unknown';
            if (!acc[mode]) {
                acc[mode] = { sessions: 0, totalAccuracy: 0, totalSpeed: 0 };
            }
            acc[mode].sessions++;
            
            const accuracy = calculateCharacterAccuracy(session);
            acc[mode].totalAccuracy += accuracy;
            acc[mode].totalSpeed += (session.wpm || 0);
            
            return acc;
        }, {});

        if (Object.keys(modeStats).length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400">No mode data available</div>';
            return;
        }

        container.innerHTML = Object.entries(modeStats).map(([mode, stats]) => {
            const avgAccuracy = (stats.totalAccuracy / stats.sessions).toFixed(1);
            const avgSpeed = (stats.totalSpeed / stats.sessions).toFixed(1);
            
            // Mode name mapping to friendly names
            const modeNames = {
                realWords: 'Real Words',
                abbreviations: 'Abbreviations',
                callsigns: 'Callsigns', 
                qrCodes: 'QR Codes',
                topWords: 'Top Words in CW',
                mixed: 'Mixed Mode'
            };
            const friendlyMode = modeNames[mode] || mode || 'Unknown';
            
            let accuracyColor = 'bg-red-500';
            if (avgAccuracy >= 90) accuracyColor = 'bg-green-500';
            else if (avgAccuracy >= 75) accuracyColor = 'bg-yellow-500';
            
            return `
                <div class="bg-gray-900 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-blue-400">${friendlyMode}</span>
                        <span class="text-sm text-gray-400">${stats.sessions} sessions</span>
                    </div>
                    <div class="mb-2">
                        <div class="flex justify-between text-sm">
                            <span>Accuracy: ${avgAccuracy}%</span>
                            <span>Speed: ${avgSpeed} WPM</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                            <div class="${accuracyColor} h-2 rounded-full transition-all duration-300" 
                                 style="width: ${Math.min(avgAccuracy, 100)}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    console.log('Statistics page initialized');
});