# BibleArena — Church Bible Quiz & Christian Learning Platform

> **Tagline:** Know the Word. Test Your Knowledge. Grow Together.

A modern Bible quiz and Christian learning platform designed for church communities. Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Key Features

### 1. Homepage
- **Welcome Hero Section**: Warm, dignified church invitation with direct 6-digit Game PIN join input.
- **Daily Scripture**: Verse of the day card (`2 Timothy 3:16-17`) with devotional thought and links to study quizzes.
- **Quick Statistics**: Real-time personal and community progress metrics (total points, completed quizzes, rank, word study streak).
- **Active & Upcoming Live Arenas**: Live competition cards with host names, scheduled times, and PINs.
- **Featured Quizzes**: Curated quiz cards across Biblical books and themes.

### 2. Live Arena Hub
- **Join Game**: 6-digit game PIN validation, nickname input, and fellowship symbol selection (`🕊️`, `👑`, `🛡️`, `📜`, `🏮`, etc.).
- **Waiting Room Lobby**: Display of game title, host name, connected players counter, 1-click **Copy PIN** button, sound toggle, and host simulation start trigger.
- **Live Quiz Competition**: 20-second countdown timer with dynamic color shifting, 4 multiple-choice options, speed bonus points calculation, post-answer feedback with detailed Scripture citations.
- **Live Leaderboard & Podium**: Top 3 champion podium (Gold crown for 1st place), position changes, and full standings.

### 3. Bible Quizzes Library
- **6 Biblical Categories**:
  - *Old Testament*
  - *New Testament*
  - *People of the Bible*
  - *Bible History*
  - *Scripture Challenge*
  - *Christian Living*
- **Instant Filters & Search**: Search by keywords or books, category pills, difficulty dropdown (*Easy*, *Medium*, *Hard*), and sort order.
- **Quiz Details Modal**: Scope, question count, duration, and instructions.

### 4. Self-Paced Quiz Taking & Review
- One question at a time with clean navigation.
- Direct question jump palette (1 to N) and flag-for-review toggle.
- Live stopwatch timer.
- Detailed results screen with percentage, correct/incorrect count, and points earned.
- **Answer Review**: Interactive breakdown of each question showing user selection, correct answer, and complete Scripture references.

### 5. Church Leaderboard
- Time tabs: **This Week**, **This Month**, and **All-Time Legacy**.
- Top 3 player podium with medals and points.
- Fellowship ministry filtering (*Youth Ministry*, *Young Adults*, *Men of Valor*, *Women of Grace*, *Sunday School Teachers*, *Worship Team*).
- Member search and sticky highlight of the current user's ranking.

### 6. My Progress Dashboard
- Summary cards: Total points, completed quizzes, overall accuracy %, and fellowship standing.
- Weekly progress SVG bar chart showing daily points accumulated.
- Biblical category mastery progress bars.
- **Achievement Badges Grid**: *First Quiz Completed*, *Scripture Explorer*, *Bible Scholar*, *Perfect Score*, *Competition Champion*, *7-Day Word Streak*, *Gospel Master*, *Old Testament Sage*.
- Recent quiz attempt history log.

### 7. Quiz Creation Interface (Quiz Builder)
- Dynamic quiz authoring tool for Sunday school teachers and members.
- Dynamic question addition, editing, and deletion.
- Multiple-choice options with radio button to set the correct answer.
- Scripture reference citation and devotional explanations.
- Local draft auto-saving with restore capability.
- **Publish Quiz**: Adds immediately to the active library for instant gameplay.

### 8. Role Switcher Demo & Authentication
- Header profile dropdown includes a 1-click **Role Switcher** (*Registered Member*, *Church Administrator*, *Guest Player*) to test all prospective permissions.
- Modal supporting **Sign In**, **Create Account**, and **Forgot Password** with full client-side validation.

---

## 🎨 Design Palette

- **Deep Navy (`#14213D`)**: Headers, footers, live arena cards, and high-contrast badges.
- **Royal Blue (`#234E91`)**: Primary buttons, active tabs, and category highlights.
- **Warm Gold (`#E9B44C`)**: Achievements, champion podium, highlights, and primary actions.
- **Soft White (`#F8FAFC`)**: Clean background and card bodies.
- **Light Blue (`#EAF1FA`)**: Pill tags, secondary states, and badges.
- **Dark Text (`#1E293B`)**: Inter typography with accessible contrast.
- **Muted Text (`#64748B`)**: Secondary details and metadata.

---

## 🚀 Running the Project

### Development Server
```bash
cd "C:\Users\larbi\.gemini\antigravity\scratch\bible-arena"
npm run dev
```

### Production Build
```bash
cd "C:\Users\larbi\.gemini\antigravity\scratch\bible-arena"
npm run build
```

### Preview Production Build
```bash
npm run preview
```
