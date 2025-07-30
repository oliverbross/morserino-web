class Stats {
    constructor(username) {
        this.username = username;
        this.apiBaseUrl = '/morserino/api';
    }

    async getStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stats.php?username=${encodeURIComponent(this.username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                return data.sessions || [];
            } else {
                console.error('Error fetching stats:', await response.text());
                return [];
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            return [];
        }
    }

    async addSession(correct, total, mode) {
        try {
            const session = {
                correct,
                total,
                mode,
                date: new Date().toISOString()
            };
            const response = await fetch(`${this.apiBaseUrl}/stats.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.username, session }),
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Error saving session:', await response.text());
            }
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    async getPreferences() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/preferences.php?username=${encodeURIComponent(this.username)}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Error fetching preferences:', await response.text());
                return { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };
        }
    }

    async setPreferences(dateFormat, timeFormat) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/preferences.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.username, dateFormat, timeFormat }),
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Error saving preferences:', await response.text());
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    formatStats(sessions) {
        if (!sessions || sessions.length === 0) return '';
        return sessions.map((session, index) => {
            return `Session ${index + 1}: ${session.correct}/${session.total} correct (${session.mode}, ${session.date})`;
        }).join('<br>');
    }

    formatLastSession() {
        // Assuming the last session is the most recent
        return ''; // Modify if needed for specific formatting
    }
}