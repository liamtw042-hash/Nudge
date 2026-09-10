# DECISION.md

Written 10 September 2026 after re-reading KNOWLEDGE.md. Research was web search plus reading teacher blogs, review sites, competitor pricing pages and Reddit threads (via search snippets; Reddit itself is blocked from this environment, so quotes come from indexed snippets and are linked in VALIDATION.md).

## Constraints applied to every candidate

1. No 18+ account for anything core (no telco, no owned payment processing, no licensed activity).
2. First 10 customers reachable with no money and no brand.
3. One specific customer, one specific problem.
4. Recurring revenue because the job recurs.

## The ten candidates

| # | Customer | Pays for now | Complains about | Competitors | Reach for first 10 | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Private piano/instrument teacher with a home studio (15–40 students)** | My Music Staff $16.95/mo (admin); practice apps $9–16/mo (Practice Space, Vivid, Practis, Better Practice, Muzie) | Students don't practise; parents don't know what to practise or don't help at home; paper assignment sheets get lost; apps built for kids that kids don't open | 5–6 practice apps, all student-app-first; the 2023 Tonara shutdown proved thousands pay for this | r/pianoteachers, r/piano teachers, Piano Teacher Central and Australian piano-teacher Facebook groups, MTA NSW Newcastle branch (a physical local list), musicteacher.com.au directory | **Chosen.** Proven spend, dense specific complaints, a local list of nameable teachers, and an angle competitors don't take (parent-first, no student app). |
| 2 | HSC / high-school solo tutor (NSW, often a uni student) | TutorBird $16.95/mo; most use spreadsheets or a Discord server | "What do you use to keep track of students?"; parents want updates; TutorBird has no progress reports | TutorBird strong on billing, weak on progress; Teachworks/TutorCruncher are agency tools | Liam's own world: HSC Discords, ATAR Notes, tutor Facebook groups | Runner-up. Pain is milder ("after a session? practically nothing"). Same product shape could serve them later. |
| 3 | Chess coach (online) | Chessdesk $14.90–34.90, Chessido, Chess.Run, ChessBooker, Chess Nexus, plus free Lichess Classes | Homework tracking, student engagement | 7+ tools, several good, one free | r/chess, Lichess forums | Fail: saturated. |
| 4 | Esports coach (Valorant/LoL) | Metafy/Fiverr fees; Kochi.gg, Planubo | Scheduling, student tracking | Kochi.gg is exactly this | Discord | Fail: incumbent does the same thing; customers young and low-paying. |
| 5 | Dog trainer (private lessons) | BusyPaws, PupManager, Clicks, DogDesk $30–80/mo | Homework between sessions, client comms | 6+ dedicated tools with homework + report cards | Trainer Facebook groups | Fail: saturated, and SMS is table stakes there. |
| 6 | Online personal trainer | Trainerize, Everfit, PT Distinction, My PT Hub $20–100/mo | Check-ins, spreadsheets falling apart | Large, funded, good | r/personaltraining | Fail: saturated. |
| 7 | Community choir director/admin | Chorus Connection, Choir Genius (aging Drupal 7) $20–60/mo | Clunky, confusing billing, library import | 3–4, one weak | ACDA forums, choir director groups | Fail: dues collection is core and needs payments; Liam has no credibility there. |
| 8 | Pub trivia host | Weekly question packs $15–79/week | Content quality, time to write | Many pack sellers | Facebook host groups | Fail: content business dependent on an LLM API account (18+) and factual-accuracy risk. |
| 9 | Roblox developer (mid-size game) | Robux for ads/assets; free Roblox analytics | No easy custom event analytics; build logging pipelines by hand | Roblox's own analytics closing the gap; GameAnalytics free | DevForum, dev Discords (Liam is native here) | Fail: needs a real ingestion backend and billing account; pays in Robux. |
| 10 | Driving instructor (AU sole trader) | Yloodrive, bookitLive, BookingTimes | Reminders, rescheduling | 4+ AU tools | AU instructor Facebook groups | Fail: SMS reminders are the core feature, which is telco. |
| 11 | Dog breeder | Breeder Cloud Pro, BreederBuddy, Breed Ledger | Tutorials, photo upload | 5+ | Breeder groups | Fail: crowded, and Liam can't credibly sell to breeders. |
| 12 | Language tutor on Preply/italki | Platform fees; Preply has built-in homework | Homework tools | Platform provides it | Platform forums | Fail: platform owns the tooling. |

## Scoring the top two against KNOWLEDGE.md

| Rule | Music teachers | HSC tutors |
|---|---|---|
| Customer nameable and findable today | Yes: MTA NSW Newcastle branch list, musicteacher.com.au directory, Facebook groups by name | Partly: Discord handles and marketplace profiles |
| Already spends money or time on this | Yes: paid apps at $9–16/mo are normal; paper practice charts universal | Some: TutorBird for billing; progress tracking is ad hoc |
| Value in first session | Yes: one assignment written, one link sent to a parent | Yes |
| Shareable artefact built in | Yes: the weekly practice card goes to the parent | Yes: the parent report |
| Recurs weekly by nature | Yes: every lesson ends with "practise this" | Yes |
| Competitors beatable on a clear axis | Yes: every competitor requires the child to open an app; none is parent-first with no login | TutorBird is cheap and adding features fast |
| Liam's edge | Local (Newcastle) and a student himself; no music-teaching credibility | Strong: he is the student these tutors teach |

Music teachers win on spend, density of complaint and a concrete first-10 list. Tutors win on Liam's personal reach. Spend and density matter more (KNOWLEDGE §2: no pull, no business).

## The pick

**Customer:** the private piano (and other instrument) teacher running their own studio, teaching children whose parents drive practice at home.

**Problem:** the week between lessons is a black box. The assignment lives on a paper sheet or in a kid's app the kid never opens; the parent doesn't know what "practise" means this week; the teacher finds out on Saturday that nothing happened.

**Product:** a practice card, not a practice app. The teacher writes this week's practice in under a minute at the end of the lesson (pieces, what to do, how many days). It becomes a link. The teacher sends the link to the parent from their own phone (WhatsApp, iMessage, email, whatever they already use). The parent opens it with no login, sees the card, taps a day when practice happened. Before the next lesson the teacher sees who practised. Nothing for the child to install, no points, no streaks, no leaderboards.

**Why competitors don't do this:** they all started from the student device and gamification (Tonara's model). Teachers of young children keep saying the parent is the lever ("the parents that do not turn in the info page … are the parents not helping their child at home"). A parent-first, login-free card is a different competitive alternative: we are competing with the paper practice notebook, not with Practice Space.

**Positioning (Obviously Awesome):** "The practice notebook, but the parent actually sees it." Category in their words: practice assignments / practice sheets.

**Price:** flat per teacher, unlimited students. $9 AUD/month or $79 AUD/year, positioned under every competitor because there is no student app to maintain. Hard paywall after a 30-day trial.

## Weaknesses, stated plainly

- **It's a crowded category.** Six funded or established apps sell to the same teacher. The bet is on a different user (the parent) and lower friction, not on a technology moat. If Practice Space ships a "parent link" feature this gets harder overnight.
- **Willingness to pay for "less."** Some teachers will see no student app as a missing feature, not a benefit. The trial has to prove practice actually goes up.
- **Liam has no standing in this community.** He is 15, not a music teacher. Outreach must be honest about that and lean on local teachers and a genuine ask for feedback, not authority.
- **Payments.** First customers pay by invoice and bank transfer (fine for Australian teachers, awkward for everyone else). Card payments wait on a parent-held merchant-of-record account. This caps early growth to Australia unless that happens.
- **No email infrastructure at launch.** The parent link is delivered by the teacher's own messaging. Weekly reminder emails to parents are a v2 that needs a provider account.
- **Market size ceiling.** Realistically a few thousand paying teachers worldwide across all competitors. At $9/month, 300 teachers is $2.7K/month. This is a small, honest business, not a rocket.

## Kill criteria for Phase 3

Fewer than 10 real public complaints matching "students don't practise / parents not in the loop / paper sheet fails", or no way to list 10 named Newcastle-area teachers to contact. Both were checked in VALIDATION.md before building.
