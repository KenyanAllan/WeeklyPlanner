# 📅 Weekly Routine Planner

A clean, modern, and interactive weekly time-blocking and schedule planner built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Lucide Icons**.

Designed to help you design, visualize, and optimize your ideal recurring 7-day routine across all 24 hours of every day.

---

## ✨ Features

- **24/7 Visual Grid**: View all 24 hours of every day (Monday through Sunday) with sticky day headers and sticky time gutter.
- **Interactive Drag-and-Draw**: Click and drag anywhere on the grid to create a new time block with real-time snap-to-15-minute preview.
- **Shift + Click Multi-Select & Group Move**:
  - Hold `Shift` (or `Cmd`/`Ctrl`) and click events to select multiple blocks across any days.
  - Drag any selected event to move the entire group together while preserving relative day and hour offsets.
  - Floating batch toolbar to recolor, duplicate, or delete selected blocks in bulk.
- **Drag-to-Move & Drag-to-Resize**:
  - Drag block body to reposition across hours or days.
  - Drag top edge or bottom edge to resize start and end times.
- **Side-by-Side Overlaps**: Overlapping events automatically split column space evenly (like Google Calendar).
- **Multi-Day Repeating Series**:
  - Assign events to multiple days (e.g. Mon–Fri, Weekends, custom days).
  - Linked series support: choose whether to edit/delete all linked days or only a single day, plus an option to unlink.
- **Color Coding**: 12 curated themes (optimized for both light and dark backgrounds) + custom hex color picker.
- **Dark Mode**: High-contrast, sleek dark mode with instant keyboard toggle (`D`).
- **Multiple Named Routines**: Save and switch between multiple schedules (e.g., "Ideal Routine", "Work Sprint", "Semester Plan").
- **Offline & Local Persistence**: Auto-saves to browser `localStorage` + JSON export/import backup.
- **Quick Jump Controls**: Instant smooth scroll to Morning (7 AM), Afternoon (1 PM), Evening (7 PM), and Night (12 AM).
- **Keyboard Shortcuts**:
  - `N`: Create new block
  - `D`: Toggle dark mode
  - `Esc`: Close modal

---

## 🐳 Running with Docker

The application includes a production-ready multi-stage `Dockerfile` and `docker-compose.yml` served via Nginx.

### Start Container
```bash
docker compose up --build -d
```
Open your browser to:
👉 **[http://localhost:8080](http://localhost:8080)**

### Stop Container
```bash
docker compose down
```

---

## 💻 Running Locally (Development Mode)

If you wish to run the Vite dev server directly on your host machine:

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Vite dev server runs at:
👉 **[http://localhost:5173](http://localhost:5173)**
