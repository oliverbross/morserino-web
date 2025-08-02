Morse Runner Web Application Specification

1. Overview
The Morse Runner Web Application is a web-based, responsive tool designed to teach and enhance CW (Morse code) recognition skills for amateur radio operators. Inspired by the desktop software "Morse Runner," this application simulates a contest environment where users decode Morse code signals, log contacts, and improve their proficiency. The web version will retain core functionalities while adding modern features for accessibility and scalability.
Key Objectives

Simulate a realistic CW contest environment.
Provide real-time Morse code decoding practice.
Track user performance with a scoring system.
Ensure a responsive design for desktop and mobile use.

Key Features

Morse Code Playback: Generate and play Morse code audio based on simulated callsigns and signal reports.
Log Display: Show received callsigns, signal reports, and user actions in real-time.
User Input: Allow manual entry of callsigns and signal reports.
Settings: Customize CW speed, pitch, and band conditions.
Scoring System: Calculate and display raw and verified scores.
Run Timer: Manage practice sessions with a configurable timer.


2. Functional Requirements
2.1. User Interface
The application must be web-based and responsive, with a layout mirroring the Morse Runner interface:

Log Window: Display a table of received callsigns, received signal reports (e.g., 599), sent signal reports (e.g., 599), and frequency check (e.g., JA1).
Input Fields:
Call: Text input for the user to enter the decoded callsign (e.g., VE3NEA).
QSQ: Checkbox to mark QSO (contact) confirmation.


Settings Panel:
CW Speed: Dropdown or slider (e.g., 30 WPM).
CW Pitch: Dropdown (e.g., 600 Hz).
Rx Bandwidth: Dropdown (e.g., 500 Hz).
Band Conditions: Checkboxes for QRN, QRM, Flutter, Activity, LID’s, QSB.


Run Controls:
Run Button: Start/stop the session with a configurable duration (e.g., 5 minutes).
Timer Display: Show elapsed time (e.g., 00:05:00).


Score Display: Show raw, verified, mult (multipliers), and total score.
Function Keys: Assign actions to F1–F8 keys (e.g., F1 for CQ, F2 for exchange).

Detailed UI Requirements

Log Window: Auto-scroll to show the latest entries, with sortable columns.
Audio Playback: Use Web Audio API for real-time Morse code generation.
Responsive Design: Adjust layout for mobile (e.g., stacked log and controls).


2.2. Morse Code Simulation

Callsign Generation: Randomly generate callsigns (e.g., JA1PK, VE3NEA) based on realistic formats.
Signal Reports: Include standard 599 reports with occasional variations.
Audio Output: Generate Morse code audio with configurable speed (10–40 WPM) and pitch (300–1000 Hz).
Interference: Simulate band conditions (QRN, QRM, Flutter, etc.) with adjustable intensity.


2.3. User Interaction

Decoding Input: Users enter decoded callsigns and confirm with the QSQ checkbox.
Logging: Automatically log correct entries with timestamps.
Scoring:
Award points for each verified QSO (e.g., 1 point per contact).
Apply multipliers based on unique prefixes or callsign areas.


Function Keys: Map F1–F8 to common actions (e.g., F1 for CQ, F2 for sending reports).


2.4. Session Management

Timer: Start a practice session (e.g., 5 minutes) with a countdown timer.
Run Control: Pause/resume or stop the session manually.
Performance Tracking: Display raw score (all logged contacts), verified score (correct contacts), and multipliers.


3. Technical Requirements
3.1. Architecture

Frontend: Use HTML5, JavaScript (with React or Vue.js), and the Web Audio API for Morse code generation.
Backend: Use Node.js or PHP for session management and score storage (optional).
Database: Use MySQL or SQLite to store user progress and settings (optional for persistence).
Modularity: Separate audio generation, UI, and logic for flexibility.

3.2. Security

Data Protection: Encrypt user data if stored (e.g., scores, settings).
Session Management: Use secure cookies or tokens for user sessions.

3.3. Performance

Real-Time: Optimize audio generation for low latency.
Scalability: Support multiple simultaneous users with server-side session handling if implemented.


4. Additional Considerations

Documentation: Include developer and user guides.
Testing: Unit tests for audio generation, scoring, and UI responsiveness.
Extensibility: Allow addition of new band conditions, scoring rules, or multiplayer mode.


5. Deliverables

Fully functional web application.
Source code with comments and documentation.
User manual and developer guide.
Deployment instructions (e.g., hosting on a web server).


Development notes:

1. add new option to our main menu, new button called: "Morse Runner" just after KOCH trainer
2. Use same UI/UX as on other pages like index.html or help page
3. Utilise advanced audio effects implemented for Koch trainer (e.g., reverb, distortion, delay)
4. use the database of all callsigns located in data/callsigns.txt file, do not generate random callsigns
5. create comprehensive statistics, have them at first displayed on the morse runner page and then update them every time a user logs a contact or a signal report 6. add a feature to allow users to customize their own callsigns and signal reports, with a maximum length of 10 characters and with a maximum number of 100 contacts per run
7. implement a leaderboard that displays top performers based on their scores and number of contacts logged during each run
8. ensure compatibility across different browsers and devices, including mobile phones and tablets
9. optimize the application's performance to minimize loading times and reduce resource usage
10. provide clear instructions on how to use the Morse Runner Web Application, including tips for improving Morse code recognition skills and troubleshooting any issues that may arise. add this to the help page
11. create a user guide  that explains how to install and use the Morse Runner Web Application, as well as how to customize the application's settings and use the advanced features. add this to the help page
12. implement a feature that allows users to save their progress and load it later, with the ability to share their progress with other users or save their progresses anonymously. add this to the help page
13. include a feature that allows users to track their progress over time, such as displaying their average score and number of contacts logged per run. add this to the help page
14. add a feature that allows users to set reminders for practicing Morse code, such as notifications before or after a scheduled run. add this to the help page
15. implement a feature that allows users to compete against others in real-time, with leaderboards and challenges. add this to the help page
16. create a tutorial video that demonstrates how to use the Morse Runner Web Application effectively, including tips for improving Morse code recognition skills and troubleshooting any issues that may arise. add this to the help page
17. add a feature that allows users to export their progress and results in various formats, such as CSV or PDF. add this to the help page
