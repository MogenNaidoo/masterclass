# Antigravity – Masterclass Scoreboard App: High-Level Design

## Purpose
The Antigravity app will be a lightweight, browser‑based scoreboard for your Masterclass. It allows participants (Fellows) to be evaluated during several time‑boxed sprints and finishes with a knowledge‑check poll. 

Attendees log in with their full name and email address and can only allocate points in Sprint 1, Sprint 2, and the closing poll. Sprint 3 scores are provided exclusively by the Entrepreneur‑in‑Residence (EIR). When a sprint ends, the next one becomes available, ensuring a structured flow. Modern event‑apps use leaderboards and gamification to drive engagement—awarding points for actions and displaying a live leaderboard builds community and encourages participation. Your app leverages this principle by letting attendees score each other in specific criteria and see rankings update in real time.

---

## User Flow

* **Landing page:** Participants enter their full name and email. A record is created in the Attendee table.
* **Home/Dashboard:** Shows the current sprint, time remaining, and a link to the scoring form. Sprints are unlocked sequentially; completed sprints become read‑only.
* **Sprint pages:**
    * **Sprint 1 – Prospecting Lab (Hot Seat):** Displays the rubric and a countdown timer for each Fellow’s 15‑second opener. A randomizer picks 4–6 Fellows. After each pitch, attendees score the Fellow using five criteria (checkboxes or sliders). Each criterion is worth 1 point for a maximum of 5. When all selected Fellows have been scored, Sprint 1 is marked complete and the app aggregates scores for the leaderboard.
    * **Sprint 2 – Prospecting Lab:**
        * *Part A:* Participants see prompts for Promise, Picture, Proof, and Push and fill out their own copywriting. No scoring is needed from attendees.
        * *Part B:* In breakout rotations, each Fellow has 90 seconds to pitch (Problem → Why Now → Solution → Value → Proof → Pricing → Next Step). Attendees score each Fellow on three criteria: protecting value (no discounting), leading with benefits, and clarity of the next step. Each criterion is worth 1 point (total 3). When all Fellows are scored, Sprint 2 is locked.
    * **Sprint 3 – Pricing Lab:**
        * *Part A – The Price Is Wrong:* Fellows receive one of four pricing dysfunction scenarios and prepare a corrected pricing layout. Only the EIR scores this section on five criteria: clear problem diagnosis, value‑based pricing logic, margin protection, linkage to cost of inaction, and a confident next step. Each criterion is worth 1 point.
        * *Part B – Objection Ping‑Pong:* The EIR fires common objections. Fellows respond in under 20 seconds using pause → explore → translate to value → escalation. Again, only the EIR awards points. Scores recorded here contribute to the final leaderboard, but attendees cannot change them.
* **Closing Poll:** Participants answer eight multiple‑choice questions covering concepts from the sprints. Each correct answer earns 1 point. Poll responses are automatically graded using the key and added to the leaderboard.
* **Leaderboard:** A page that lists all Fellows and their cumulative points. It shows subtotals by sprint and highlights the top performers. Live updates encourage friendly competition, which helps engagement.
* **Admin/EIR panel:** For the host to set time limits, trigger random selection, record EIR scores for Sprint 3, and export results.

---

## Data Model

| Table | Key fields | Purpose |
| :--- | :--- | :--- |
| **Attendee** | `attendee_id (PK)`, `full_name`, `email`, `is_admin` | Stores participants and distinguishes the EIR/admin. |
| **Fellow** | `fellow_id (PK)`, `full_name`, `company` | Represents the entrepreneurs being scored. May be linked to an Attendee record if Fellows also vote. |
| **Sprint** | `sprint_id (PK)`, `name`, `description`, `order`, `is_locked` | Defines the three sprints and whether they’re available. |
| **ScoreCriterion** | `criterion_id (PK)`, `sprint_id`, `name`, `max_points` | Lists each scoring metric. Example: clear customer type, core problem, etc. |
| **Score** | `score_id (PK)`, `attendee_id`, `fellow_id`, `criterion_id`, `points` | Stores individual points assigned by attendees or the EIR. |
| **PollQuestion** | `question_id (PK)`, `text`, `option_a/b/c/d`, `correct_option` | Holds the closing poll questions and answers. |
| **PollResponse** | `response_id (PK)`, `attendee_id`, `question_id`, `chosen_option`, `is_correct` | Tracks attendee answers and correctness. |

---

## Poll Questions and Correct Answers

| # | Question (abridged) | Key learning | Correct answer | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Goal of the first sales message? | First contact should not sell; it aims to set up the next meeting. | Earn the next conversation | The first meeting “culminates in setting the next appointment” rather than closing a sale. |
| **2** | What should a 15‑second opener include? | Effective openers must focus on the prospect’s needs, addressing their problems and desired outcomes instead of talking about yourself. | Customer type, problem, outcome and ask | Talking about your company disengages prospects; instead, tailor the opener to their challenges. |
| **3** | When prospects jump straight to price, what’s the real issue? | Objections about price often occur when the value case is unclear. Value must be established before discussing cost. | The value case is not yet clear | If buyers don’t see the consequences of their problem, the conversation often stalls. |
| **4** | What makes an Ideal Customer Profile (ICP) strong? | A strong ICP focuses on customers who have the problem, experience urgency and have a budget to pay for a solution. | The customer has the problem, budget and urgency | Ideal customers are in pain, are urgent to solve it and have resources to pay. |
| **5** | What should come before pricing in a proposal? | Proposals must first articulate the value and problem context before mentioning cost. | Clear value and problem framing | Value‑selling frameworks recommend establishing context, outcome and proof before the next step. |
| **6** | Best first response to a pricing objection? | Instead of discounting, salespeople should clarify the concern to understand the objection and then translate it back to value. | Clarify the concern before defending the price | Pause and explore objections before defending pricing, because knee‑jerk discounts undermine value. |
| **7** | What does “Proof” do in a proposal? | Proof validates credibility by using evidence or case results and builds trust. | Validates credibility with evidence or results | Proof points and customer testimonials build trust and earn the next conversation. |
| **8** | What is the cost of inaction? | It represents the ongoing losses incurred by not solving a problem. Quantifying the cost of inaction shifts the conversation from “Should we evaluate solutions?” to recognizing they can’t keep operating the same way. | What the customer keeps losing by not solving the problem | When the implications and cost of inaction are visible, buyers realize they need to change. |

---

## Feature Breakdown

### Sprint 1 – Prospecting Lab (Hot Seat)
| Component | Functionality |
| :--- | :--- |
| Random Fellow selector | Picks 4–6 Fellows randomly to participate. |
| Countdown timer | Displays 15‑second opener timer and 30–45‑second feedback timer. |
| Scoring form | 5 checkboxes/sliders for: clear customer type, specific core problem, desired outcome, outside‑in framing, and clear next step. Each attendee assigns 0–1 point per criterion (max 5). |
| Voting summary | Shows aggregated scores per Fellow and updates leaderboard in real time. |
| Gating logic | Sprint 1 must be completed (all selected Fellows scored) before Sprint 2 is unlocked. |

### Sprint 2 – Prospecting Lab
| Component | Functionality |
| :--- | :--- |
| Copywriting fields | Promise, Picture, Proof, Push input fields with prompts. Entries stored for participants’ reference. |
| Pitch timer | 90‑second countdown for each Fellow’s shark‑tank pitch. |
| Scoring form (Part B) | Three yes/no checkboxes or sliders: protected value (no discount), led with benefits, obvious next step. Each worth 1 point. |
| Leaderboard update | Aggregates points for Sprint 2 and updates totals. |

### Sprint 3 – Pricing Lab
| Component | Functionality |
| :--- | :--- |
| Scenario assignment | Assigns each Fellow one of four pricing dysfunction scenarios. |
| Preparation timer | 4‑minute timer for Fellows to analyse and adjust pricing; 60‑second timer for pitch to EIR. |
| EIR scoring panel | Five checkboxes corresponding to criteria (problem diagnosis, value‑based logic, margin protection, cost of inaction linkage, clear next step). |
| Objection Ping‑Pong | Interface for the EIR to fire rapid objections and mark Fellows’ responses as acceptable or not. |

### Closing Poll
| Component | Functionality |
| :--- | :--- |
| Poll form | Presents eight multiple‑choice questions (randomised order) with four options each. |
| Auto‑grading | The `correct_option` field in `PollQuestion` is used to mark responses as correct. Each correct answer yields 1 point. |
| Review screen | After submission, shows correct answers and individual score. Adds points to leaderboard. |

---

## Technical Recommendations

* **Front-end:** A responsive single-page application built with React or Vue.js. Components include forms, timers, progress bars, and a live leaderboard. Use a state management library (Redux/Pinia) to handle score updates.
* **Back-end:** A REST or GraphQL API built with Node.js (Express) or Python (Django/FastAPI) that exposes endpoints for authentication, score submission, sprint status, and poll responses. Use WebSockets (Socket.IO) or server-sent events to push live leaderboard updates to clients, providing the real-time engagement recommended in gamified event apps.
* **Database:** A relational database (PostgreSQL or MySQL) to store the data model described above. Use an ORM (Sequelize, SQLAlchemy) for convenience.
* **Authentication:** Basic email/name login with a unique token or code. Optionally pre-register Fellows to control scoring rights. Use cookies or JSON Web Tokens for session management.
* **Admin controls:** Provide a protected dashboard for the EIR to start/end sprints, randomize participants, input EIR scores, fix poll keys, and export CSV reports.
* **Accessibility & UX:** Support desktops and mobile devices, use large buttons and clear labels, ensure timers are visible, and include colour-blind friendly indicators (e.g., icons plus colours for votes). Provide confirmation modals before final score submissions.
* **Privacy & Compliance:** Store minimal personal data (name/email). Only authorized admins can view individual scores. Provide a privacy notice explaining data use.
* **Deployment:** Host on a cloud platform (e.g., Vercel, Netlify, or Heroku) with SSL. Use environment variables for secrets. Implement automated backups for the database.

---

## Sequence Control
To enforce sequential unlocking of sprints:
1.  Each Sprint record includes an `is_locked` flag.
2.  When Sprint 1 scoring finishes (all Score records submitted for the selected Fellows), the server sets Sprint 2 `is_locked=false` and notifies clients via WebSocket.
3.  Sprint 1 becomes read-only.
4.  Similarly, Sprint 2 must be completed before Sprint 3 is unlocked. The closing poll is unlocked only after the EIR completes Sprint 3 scoring.

---

## Conclusion
This design provides a structured, gamified experience for the Masterclass. By incorporating timers, clear scoring rubrics, and a live leaderboard, the app encourages participation and reinforces key sales principles. Evidence shows that focusing on prospects’ needs in the opener, crafting strong ideal customer profiles, and quantifying the cost of inaction are critical sales skills. The closing poll tests these concepts, rewarding attendees who internalize them. The modular architecture also allows you to add new sprints or modify scoring rules for future cohorts.
