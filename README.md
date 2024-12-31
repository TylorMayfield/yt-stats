# YouTube Stats Tracker

A Chrome extension that tracks your YouTube viewing habits and provides insightful statistics about your watch time, favorite channels, and viewing history.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/tylormayfield)

## Features

- Track total watch time over the last 7 days
- View your most-watched channels
- See detailed video history with watch duration
- Persistent data storage using SQLite
- Clean and modern UI built with React

## Technical Details

### Architecture

- **Frontend**: React with Tailwind CSS for styling
- **Storage**: SQLite (using sql.js-httpvfs) for efficient data persistence
- **Build System**: Vite with CRXJS for extension bundling

### Data Structure

The extension uses SQLite tables to store viewing data:

```sql
-- Videos table stores information about each unique video
CREATE TABLE videos (
    video_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    first_watched INTEGER NOT NULL
);

-- Sessions table tracks individual viewing sessions
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id)
);
```

### Statistics Tracking

- Watch time is calculated from actual video play duration
- Sessions under 5 seconds are ignored to prevent inflation from brief views
- Channel rankings are based on total watch time
- All times are stored in seconds for precision

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/tylormayfield/yt-stats.git
cd yt-stats
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
