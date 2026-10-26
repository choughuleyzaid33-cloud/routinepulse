# RoutinePulse ⚡
### 24/7 Autonomous Daily Routine, WhatsApp Message Scheduler & Life Automation Engine

**RoutinePulse** is a complete, full-fledged life automation platform that runs **24/7 in the background** — sending scheduled WhatsApp messages and alarms automatically at set times, **even when the app or your browser is completely closed**.

---

## 🚀 How 24/7 Autonomous Background Sending Works

### 1. 📲 Autonomous WhatsApp Sending (No Browser Needed)
Unlike basic browser extensions or web links that force you to manually click "Send", RoutinePulse connects directly to the **WhatsApp Web Multi-Device Protocol** (via secure WebSocket socket):
1. In the app, click **"Link WhatsApp (Scan QR)"**.
2. Open WhatsApp on your mobile phone &gt; **Settings / Linked Devices** &gt; **Link a Device**.
3. Scan the QR code shown on screen.
4. **Done!** Your device is linked.
5. Whenever a scheduled reminder time arrives, the background server **autonomously transmits the text directly over the WhatsApp protocol**.
   - No browser windows pop up.
   - No manual buttons need to be pressed.
   - Works silently in the background!

### 2. 🛡️ 24/7 Windows Background Service (Runs when App is "Off")
To make sure the scheduler keeps ticking continuously even if you close the browser window or restart your computer:

- **Installed in Windows Startup**:
  RoutinePulse is registered in your Windows Startup folder (`RoutinePulseAutoStart.vbs`) and Task Scheduler (`RoutinePulseBackgroundDaemon`).
- **Silent Background Execution (`start-silent.vbs`)**:
  Launches the background scheduler invisibly with zero command prompt windows.
- **Controls**:
  - `start-silent.vbs`: Launches the daemon silently in background.
  - `stop-background.bat`: Stops the background daemon.
  - `check-status.bat`: Verifies whether the daemon is currently running.
  - `install-auto-start.bat`: Installs auto-start on boot.
  - `uninstall-auto-start.bat`: Removes auto-start.

---

## 🌟 App Modules & Pages

1. **📊 Dashboard**:
   - Live digital clock and time-of-day greeting.
   - 24/7 Background Daemon status and WhatsApp Linked Device indicator.
   - "Next Up" scheduled automation radar with countdowns.
   - Daily routine progress tracker & habit streaks.
2. **⏰ Reminders Hub**:
   - **Remind Someone (WhatsApp)** vs. **Remind Myself**.
   - Scheduling modes: **Daily**, **Weekdays (Mon-Fri)**, **Custom Days**, **Interval** (e.g. every 1 hr), and **One-Time**.
   - Direct manual triggers, active/pause toggles, and edit/delete.
3. **⚡ Daily Routines & Habit Tracker**:
   - Structured Morning, Midday, Evening, and Night routines.
   - Step-by-step checklist with estimated durations.
   - Streak counter 🔥 and celebratory confetti celebration upon completion.
4. **📅 Day Planner & Eisenhower Matrix**:
   - Categorized into *Do First (Urgent & Important)*, *Schedule (Important)*, *Delegate (Urgent)*, and *Low Priority*.
   - Subtask checklists and category filters (Work, Personal, Health, Errands).
5. **👥 People Directory**:
   - Contact book with phone numbers, relationships (Family, Friends, Work, VIP), notes, and birthdays.
   - Instant WhatsApp message composer and one-click schedule creator.
6. **💬 Smart Message Templates & AI Assistant**:
   - Dynamic templates with `{name}` placeholders for Medication, Morning greetings, Work standup, Hydration, Gym check-ins, and Birthdays.
   - Instant message generator with customizable tone (*Friendly, Caring, Professional, Energetic*).
7. **📜 Execution Audit Logs**:
   - Full history of all dispatched messages, channels, delivery statuses, and timestamps.
8. **⚙️ Settings & Integrations**:
   - WhatsApp multi-device connection manager.
   - Web Audio synthesizer tone preview (*Crystal, Radar, Harp, Chime, Cosmic*).
   - Desktop notification permissions.
   - Full database JSON backup and restore.

---

## 💻 Quick Commands

* **Open App UI**: Open your web browser to **http://localhost:5000**
* **Start in Background (Silent)**: Double-click `start-silent.vbs`
* **Stop Background Service**: Double-click `stop-background.bat`
* **Check Status**: Double-click `check-status.bat`
