# Days Until

A live countdown timer showing exactly how many days, hours, minutes, and seconds remain until any year or custom event.

Pick a year (2027–2050) or create a custom event — birthday, wedding, anniversary, graduation, and more — and get a real-time countdown to that date.

## Features

- Countdown to any year from 2027 to 2050 (counts to New Year's Day)
- Custom events: birthday, anniversary, wedding, baby shower, graduation, vacation, and more
- Days view (default) or Weeks view toggle
- Add to Google Calendar in one click
- Add event directly to the desktop widget with one click
- 6 mood wallpapers: Dusk City, Night City, Golden Hour, Deep Ocean, Forest, Aurora
- Updates every second in your local timezone
- Mobile responsive
- Preferences (mood, display mode) saved locally

## Desktop Widget

The **Days Until Widget** is a lightweight always-on-top desktop app for Windows and macOS. It sits in the bottom-right corner of your screen and shows a live countdown to any custom event.

### Install the widget

Download the latest installer from the [Releases page](https://github.com/DWHolbar/Is-It-Still-2026-/releases/latest):

| Platform | File |
|----------|------|
| Windows  | `Days-Until-Widget-Setup.exe` (installer) or `Days-Until-Widget-portable.exe` |
| macOS    | `Days-Until-Widget.dmg` |

> **macOS note:** If Gatekeeper blocks the app, right-click → Open → Open to allow it.

### Send an event from the website to the widget

1. Open the website and go to **Custom Event**
2. Fill in your event details and click **Start Countdown**
3. Click **Add to Desktop Widget**
4. Your browser will ask permission to open the Days Until app — allow it
5. The widget updates instantly with your event

No file downloads or manual imports needed — the `daysuntil://` protocol connects the website directly to the app.

### Build the widget yourself

```bash
cd widget
npm install

npm start          # Run in dev mode
npm run build:win  # Build Windows installer (.exe)
npm run build:mac  # Build macOS disk image (.dmg)
```

Built installers appear in `widget/dist/`.

Releases are also built automatically by GitHub Actions on every version tag (`v*`).

## Run the website locally

No install required:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).
