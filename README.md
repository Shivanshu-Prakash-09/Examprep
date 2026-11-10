# ExamPrep

A web app where students find **previous-year papers (PYQs), notes and the unit-wise syllabus** for their subjects (CSE, IT, ECE, EEE; semesters 1-7), and can open any paper in an external **AI study bot**.

- **Teachers/faculty** share one login and use the admin side to upload papers/notes and add missing subjects.
- **Students** log in with Gmail (history saved, can like papers) or continue as a **guest** (nothing saved, can't like).
- Subjects can be found 3 ways: pick branch/year/semester, search by an old subject name, or paste a syllabus to get the top 5 matching subjects.

**Stack:** React (Vite) + Node/Express + SQLite (built into Node). **No outside accounts or database installs are needed.**

---

## Quick start (Windows / Mac / Linux)

Requirements: **Node.js 22.5 or newer** (check with `node -v`).

```bash
npm run install:all     # installs everything (once)
npm run dev             # starts server (port 4000) and website (port 5173)
```

Open **http://localhost:5173**

- **Teacher login:** username `faculty`, password `faculty123` (change in `server/.env`, see below)
- **Student:** click "Join as student", then type any `name@gmail.com` address, or continue as guest.

On the first start the database file is created, **165 subjects with their syllabus are loaded**, and **all previous-year papers from `database/pyq/` are imported automatically** (about 290 papers, each with its exam type and year). Nothing else to set up.

### Try it in 2 minutes
1. Log in as teacher -> **Upload paper / notes** -> pick CSE, Year 1, Semester 1, subject "Programming in 'C'" -> upload any PDF.
2. Log out -> "Join as student" -> log in with a Gmail address -> CSE, Year 1, Semester 1 -> Programming in 'C' -> **Previous year papers**: like, sort, download.
3. Try the other two ways to find a subject on the Browse page (search by name, paste syllabus).

---

## Folder structure

```
campus-brain/
├── client/                    React frontend (Vite)
│   └── src/
│       ├── main.jsx           app entry
│       ├── App.jsx            ALL routes in one place
│       ├── api/               http.js (fetch + token), index.js (one function per endpoint)
│       ├── context/           AuthContext.jsx: current role (teacher / student / guest)
│       ├── components/        Layout (header), RequireRole (route guard), UploadForm, AddSubjectForm,
│       │                      ResourceList (papers/notes), SubjectCard, Modal
│       ├── pages/             one file per screen (see docs/FLOWS.md)
│       ├── utils/constants.js branches, years, semesters, AI bot link builder
│       └── styles/app.css     all styling
├── server/                    Node + Express API
│   ├── .env.example           optional settings (defaults work without a .env)
│   ├── data/                  CREATED AUTOMATICALLY: campusbrain.db (database) + uploads/ (files)
│   └── src/
│       ├── server.js / app.js start-up and middleware
│       ├── config/            env.js (settings), db.js (tables + first-run syllabus load)
│       ├── middleware/        auth.js (teacher / student / guest), errorHandler.js
│       ├── routes/            URL -> controller mapping (index.js lists everything)
│       ├── controllers/       the logic, one file per area (auth, subject, resource, history)
│       ├── services/          matchService.js: old-name search and syllabus matching (TF-IDF)
│       └── utils/             constants, asyncHandler, HttpError
├── database/seed/subjects.json    165 subjects with unit-wise syllabus (generated from the PDF)
├── scripts/parse_syllabus_pdf.py  rebuilds subjects.json from the syllabus PDF text
└── docs/FLOWS.md              wireframe slide -> route -> file, and who-can-do-what table
```

**Where do I change X?**

| I want to... | Edit |
|---|---|
| change a screen | `client/src/pages/<Screen>.jsx` |
| add a URL / route | `client/src/App.jsx` |
| add an API endpoint | route in `server/src/routes/`, logic in `server/src/controllers/` |
| change DB tables | `server/src/config/db.js` |
| change how subjects are matched | `server/src/services/matchService.js` |
| change the AI bot link | `client/.env` (`VITE_BOT_URL`, `VITE_BOT_PARAM`) |

## Previous-year papers (bulk import)
- `database/pyq/files/` holds one PDF per paper (split from the merged subject PDFs), and `database/pyq/manifest.json` lists each one with its branch, semester, subject name, mid/end term and year (read from the scanned papers with OCR).
- Imported automatically on the first start. To re-run it later (already-imported papers are skipped): `npm --prefix server run import:pyq` (add `-- --dry-run` to only preview). It writes `server/import-report.csv`.
- Papers whose subject was missing from the syllabus data were added as new subjects with an empty syllabus (IT: Database Modelling and Design; ECE: C++ Programming, Data Structures and Algorithms, Mobile Computing; EEE: C++ Programming, Data Structures and Algorithms). Teachers can fill their syllabus later.
- `docs/PYQ_IMPORT_REPORT.csv` shows where every paper went. Exam type/year come from OCR, so a few may need a glance (delete and re-upload from the admin page if wrong).

## Settings (optional)
Copy `server/.env.example` to `server/.env` to change the teacher username/password, the secret used for login tokens, or the ports. Without a `.env`, the defaults in `server/src/config/env.js` are used.

## Resetting the data
Stop the server and delete the folder `server/data/`. On the next start the database is recreated with the original syllabus and the previous-year papers are imported again; teacher uploads and likes are gone.

---

## Important limits of this local version

1. **"Ask with AI" only works when the file link is public.** The bot runs on the internet (Streamlit), so it cannot open `http://localhost:4000/...` links from your PC. On your PC the button opens the bot with the link, but the bot can't fetch the file. It works once the server is deployed on a public address and `PUBLIC_BASE_URL` in `server/.env` is set to it. (For a quick test you can expose your PC with a tunnel such as ngrok and use that address as `PUBLIC_BASE_URL`.)
2. **Gmail login is not verified.** Students type their Gmail address; nothing proves they own it. It's enough for testing and for saving likes/history per person. For real verification, replace `studentLogin` in `server/src/controllers/authController.js` with Google Sign-In (Google OAuth) and keep the same token format; no other file needs to change.
3. **SQLite is a single file** and fine for a college-scale project. Hosts with temporary disks (e.g. free Render) erase `server/data/` on restart; use a host with a persistent disk/volume, or move to PostgreSQL later.
4. One shared teacher password means uploads aren't traceable to a person.

## Syllabus data notes
- `database/seed/subjects.json` was generated from `Syllabus_Year_Sem_Subject_Wise.pdf` with `scripts/parse_syllabus_pdf.py`. Labs are not included.
- 42 subjects had no syllabus text (not available, or training/project/activity) and were skipped. Teachers add them later: **Admin -> Add subject**.
- The original text was OCR'd from screenshots, so proofread it for typos.

## Deployment (when ready)
- **Server:** host `server/` on a service with a persistent disk (Railway, Render with a disk, a VPS). Set `JWT_SECRET`, `TEACHER_PASSWORD`, `CLIENT_ORIGIN` (the website's address) and `PUBLIC_BASE_URL` (the server's own public address).
- **Client:** `npm run build:client`, host `client/dist` on Vercel/Netlify (add a rewrite of all paths to `index.html`). Set `VITE_API_BASE` to the server's address before building.
