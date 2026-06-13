# Days Until

A live countdown timer showing exactly how many days, hours, minutes, and seconds remain until any year or custom event.

Pick a year (2027–2050) or create a custom event — birthday, wedding, anniversary, graduation, and more — and get a real-time countdown to that date.

## Features

- Countdown to any year from 2027 to 2050 (counts to New Year's Day)
- Custom events: birthday, anniversary, wedding, baby shower, graduation, vacation, and more
- Days view (default) or Weeks view toggle
- Add to Google Calendar in one click
- 6 mood wallpapers: Dusk City, Night City, Golden Hour, Deep Ocean, Forest, Aurora
- Updates every second in your local timezone
- Mobile responsive
- Preferences (mood, display mode) saved locally

## Desktop Widget

The **Days Until Widget** is a lightweight desktop app (Windows + macOS) that shows your custom event countdown right on your desktop.

### How to use the widget

1. Go to **Custom Event** on the website
2. Enter your event details and click **Start Countdown**
3. Click **Download Widget Config** — this saves a `dayuntil-event.json` file
4. Download and install the widget app (see `widget/` folder)
5. Open the widget and click the import button to load your config file

The widget sits in the bottom-right corner of your screen, always on top, showing a live days/hours/minutes/seconds countdown to your event.

### Building the widget

```bash
cd widget
npm install

# Run locally
npm start

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac
```

Built installers appear in `widget/dist/`.

## Run the website locally

No install required. Just serve the files:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Or simply open `index.html` directly in your browser.
