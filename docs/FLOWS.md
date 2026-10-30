# Flows and where they live in the code

| Wireframe slide | What the user does | Route | File |
|---|---|---|---|
| Slide -1 | Login page: shared teacher login, or "Join as student" | `/` | `client/src/pages/LoginPage.jsx` |
| Slide 2A | Teacher: branch, year, semester, subject, notes/paper, mid/end, year (or unspecified), file, confirmation pop-up | `/admin` | `components/UploadForm.jsx` |
| (extra) | Teacher: add a subject missing from the syllabus data, unit-wise | `/admin` (tab) | `components/AddSubjectForm.jsx` |
| Slide 2B | Student: Gmail login or guest | `/student` | `pages/StudentLoginPage.jsx` |
| Slide 3B | Pick branch/year/semester, or search by old name, or paste syllabus (top 5) | `/browse` | `pages/BrowsePage.jsx` |
| Slide 4B | Subjects of the chosen semester | `/subjects?branch=&year=&semester=` | `pages/SubjectListPage.jsx` |
| Slide 4 (B-2) | Top 5 matches from a pasted syllabus | shown inside `/browse` | `pages/BrowsePage.jsx` + `server/src/services/matchService.js` |
| Slide 5B | Subject page: syllabus, PYQs (sort, like, download, Ask with AI), notes | `/subjects/:id` | `pages/SubjectPage.jsx`, `components/ResourceList.jsx` |

## Who can do what

| Action | Teacher | Student (Gmail) | Guest |
|---|---|---|---|
| Browse subjects, read syllabus | yes | yes | yes |
| Download papers / notes, Ask with AI | - | yes | yes |
| Like a paper | - | yes | no |
| History saved ("My history") | - | yes | no |
| Upload / delete papers and notes, add subjects | yes | no | no |

## Ask with AI
The button opens the bot at `VITE_BOT_URL/?paperId=<id>&pdfUrl=<public pdf link>&subject=<name>&year=<paper year>&branch=<branch>&semester=<n>` in a new tab (built in `client/src/utils/constants.js`). `pdfUrl` must be publicly reachable because the bot's server downloads it; `paperId` is the cache key. The bot is a separate Streamlit app and is not part of this repo.

## Authentication in one paragraph
- **Teachers:** `POST /api/auth/teacher/login` checks the shared username/password (default `faculty` / `faculty123`, change in `server/.env`) and returns a signed token (12 h).
- **Students:** `POST /api/auth/student/login` takes a Gmail address and returns a signed token. In this local version the address is **not verified** by Google; it only identifies the student so likes and history are saved per person.
- **Guests:** no token; the server treats them as anonymous (read-only).
- The client keeps the token in `localStorage` (`client/src/api/http.js`) and sends it as `Authorization: Bearer ...`.
