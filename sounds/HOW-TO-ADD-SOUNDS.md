# How to add sounds to the website

1. Open the `sounds` folder on GitHub, click **Add file → Upload files**, and drop in your MP3 or WAV files.
   - Use simple file names with no spaces, e.g. `morning-qi-practice.mp3`
   - MP3 is best (smaller, loads faster on phones). Keep each file under 25 MB.
2. Open `sounds.json` (in the main folder), click the pencil ✏️ to edit, and add one entry per file:

```json
[
  {
    "title": "Morning Qi Practice",
    "file": "sounds/morning-qi-practice.mp3",
    "description": "A 15-minute guided Lift Qi Up, Pour Qi Down practice.",
    "category": "Guided · 15 min",
    "group": "Guided practices"
  },
  {
    "title": "Hun Yuan Qi Healing",
    "file": "sounds/hun-yuan-healing.wav",
    "description": "Lie down, relax and receive.",
    "category": "Healing · 20 min",
    "group": "Healing sessions"
  }
]
```

- `group` creates a heading on the site (e.g. "Guided practices", "Healing sessions", "Chanting"). Tracks with the same group appear together.
- Separate entries with a comma. The last entry has no comma after it.
3. Click **Commit changes**. The website updates automatically in about a minute.
