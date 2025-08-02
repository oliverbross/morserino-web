# Feedback for Contest Simulator


Thank you for the great progress on the contest simulator! I've tested the current version and identified several areas that need attention to improve the user experience and functionality. Below is a detailed list of issues and suggestions:

1. **Settings Button**  
   - **Issue**: The "Settings" button in the contest control area is currently non-functional.  
   - **Suggestion**: Implement this button to open a settings panel or modal where users can configure contest parameters, including:  
     - CW Speed (ranges and exact speeds from 10 to 80 WPM in 5 WPM increments)  
     - CW Pitch  
     - Band Conditions (checkboxes for QRN, QRM, Flutter, Activity, LID’s, QSB)  
     - Activity Level (number of stations that might call after CQ or a QSO)  
     - Zone (for CQ WW CW contest)  
     - My Callsign  

2. **Function Keys**  
   - **Issue**: The function keys (F1-F8) are inactive and do not perform any actions.  
   - **Suggestion**: Pre-program these keys to send specific messages, such as:  
     - F1 (CQ): "CQ CQ TEST [My Callsign] [My Callsign]" (e.g., "CQ CQ TEST OM0RX OM0RX")  
     - F2 (Exchange): "[Callsign] TU 599 [Zone]"  
     - Provide an option for users to modify these messages via a configuration interface.  

3. **Start Contest Delay**  
   - **Issue**: There’s a significant delay after pressing "Start Contest" before any sound begins, possibly due to loading the entire QRZ database.  
   - **Suggestion**: Load only a subset of callsigns (e.g., 2500) at a time. Consider implementing pagination or lazy loading for additional callsigns if necessary.  

4. **CW Speed Range**  
   - **Issue**: The current CW speed settings are insufficient.  
   - **Suggestion**: Allow users to select both speed ranges and exact speeds, starting from 10 WPM with 5 WPM increments up to 80 WPM.  

5. **Contest Modes**  
   - **Issue**: The contest can be started in one of four modes, but only three are specified: Pile-Up, Single Calls, and WPX Competition.  
   - **Details**:  
     - **Pile-Up Mode**: A random number of stations call after the user sends CQ (good for copying skills).  
     - **Single Calls Mode**: One station calls as soon as the user finishes the previous QSO (good for typing skills).  
     - **WPX Competition Mode**: Fixed band conditions and contest duration, with user control over keying speed and band activity.  

6. **QSO Flow**  
   - **Description**:  
     - Upon starting the contest, the user hears realistic QRN (background noise) but no stations until they call CQ.  
     - After calling CQ, a station calls back; the user must copy and enter the callsign.  
     - Pressing F2 or Exchange sends "TU 599 [Zone]" (e.g., "W1KWZ TU 599 [Zone]").  
     - The station replies with their exchange (e.g., "599 [Their Zone]"), which the user enters and logs.  
     - After logging, another station might call based on the Activity setting, or the user calls CQ again. 
      we need to add one more options - Activity, this will contain number I can set from 1 up to whatever I put in there. What this is used for is - the amount of stations which can call me after my CQ or after I have finished my previous contact
   - **Note**: For the CQ WW CW contest, the exchange is the zone. Remove other contest types from the settings for now.  

7 _

**.Scoring**  
   - **Description**: When logging a call, verify it against the sent callsign.  
     - Correct entries are marked as verified and awarded points.  
     - Incorrect entries are logged as raw with no points.  

8. **UI/UX Consistency**  
   - **Suggestion**: Ensure the new contest simulator page follows the original UI/UX design of the existing CW trainer website for a seamless user experience.  

Please address these points to enhance the simulator's functionality and usability. If you need further clarification on any of these issues or have questions about the suggestions, feel free to reach out.

Thank you for your hard work and dedication to this project!