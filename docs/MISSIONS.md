# Missions — how the game works and what we decided

Working notes for the Missions agent. The popup and location loading are on
`feature/missions-popup`. The agent itself is not built yet.

---

## How the game behaves

What the saved pages in `html/` show. They are untracked; trimmed copies, with
the character's name replaced, live in
`extension/src/content/features/missions/fixtures/`.

### The world page
- **`/world` shows one of two things.** When the knight is free, it shows the
  city map: `#mainContent.location`, city name in `#contentTitle h1`, one
  `#mapBase a.mission` per location. When the knight is away, it shows a
  countdown: `#mainContent.cooldownTravel`, `.cooldownFight` or
  `.cooldownDuel`, with the time left in `#progressbarEnds span` as `HH:MM:SS`.
- **One page for two kinds of mission.** Returning from a mission and returning
  from a group mission show the same page: `.cooldownFight` with the title
  "Рицарят се връща от мисия". For the agent they are the same wait.
- **Starting a mission** means POSTing `#formChooseMission`, which is what the
  game's own `chooseMission()` does: `chooseMission` is the location id,
  `missionArt` is `small | medium | large`, and `missionKarma` is
  `Good | Evil`.
- **Mission cost and points.** Missions cost 20 / 40 / 60 mission points for
  small / medium / large, the same on both servers seen so far. The free points
  are in `#zoneChangeCosts`. How fast points come back differs per server:
  5 per hour on s26 and 13 per hour on s27, doubled with premium.
- **One signal for two causes.** When the knight can't afford a mission, the
  game disables its button with `.disabledSpecialBtn`. That happens both for
  missing hit points and for missing mission points, with the same tooltip.

### The mission report
After a mission the game shows a report, not the countdown. The report is at
`/world/location`, and the countdown only appears once the knight opens
`/world` again.

The report is `#mainContent.fightResult`. Inside `.fightResultsInner`:

| What | Where | Language-independent? |
| --- | --- | --- |
| Won or lost | `.userShield` has class `winner` or `loser` | Yes |
| Opponent | `#challengerImage h2`, e.g. "Феникс" | No — but `#challengerImage`'s class (`GhostTownPhoenix`) is |
| Silver | the `<em>` in the first `<p>`: "Стандартна печалба от **1163** Сребро." | The number, yes |
| Payout type | the words before "печалба": Стандартна / Голяма / Феноменална | No |
| Experience | the `<em>` in the second `<p>` | The number, yes |
| Karma gained | the `<em>` in the third `<p>` | The number, yes |
| Damage taken | the `<em>` after "Нараняване - Защитник" | The number, yes |

The paragraphs are read by position, because their text is translated. For a
loss we expect the same page with the opponent named as the winner. *We have no
saved loss yet, and the payout labels other than "Стандартна" are unconfirmed.*

## Decisions

### No cooldown field — the agent reads the wait from the game
Return times differ per server and nobody should have to guess them. The loop
is:

1. Start the mission. The game shows the report.
2. Read the report and record the mission (below).
3. Go to `/world`. The game shows the countdown.
4. Wait for the time it shows, plus a random delay.
5. Open `/world` again. Once the map shows, start the next mission.

If the countdown can't be read, check again after a minute. This is a safety
net, not a setting. The cooldown step leaves the popup form, which keeps
location, karma and size.

### A random delay of 15–90 seconds between missions
Starting a mission at the exact second the knight returns, every time, looks
automated.

### Out of hit points → wait. Out of mission points → stop.
To tell them apart, compare the free points with the chosen size's cost. If
the points are short, they ran out. If the points are enough but the button is
still disabled, the cause is hit points.

- **Hit points:** wait. The game restores hit points on the full hour, or the
  player may drink a potion. We never buy one for them. Check again at the next
  full hour or in 15 minutes, whichever comes first.
- **Mission points:** the day's missions are done, so stop and say so.

Consequence for the popup: "Load locations" should still list the locations
when only hit points are missing, with a warning, because the agent would just
wait. It should block only when mission points are out.

### Never spend rubies
`#formChooseMission` has a `buyRubies` field. The agent always leaves it at 0
and never clicks a ruby offer. Rubies are real money. This needs a test.

### Record every mission
Each mission the agent finishes is saved, so later features don't need the
past replayed:

- when it finished;
- the location: its id and its name as the game showed it, e.g.
  "Драконово леговище";
- city, size and karma;
- won or lost, and the opponent's name and id (`#challengerImage`'s class);
- silver, the payout type as the game wrote it, experience, karma and damage
  taken.

At first this goes to `chrome.storage`, capped to the most recent missions. It
moves to the API when the Dashboard needs history across devices.

### What the popup shows while the agent runs
Like the duels status screen, plus:

- the **last mission**: location name, won or lost, silver;
- **this run so far**: missions done, wins and losses, silver earned;
- **what it is waiting for**, with a countdown: the knight returning, hit
  points, or the random delay.

## To do — pages we still need

Save each one into `html/` as before, then add a trimmed fixture and a test.

- [ ] **A lost mission's report.** Expected: the same page with `.userShield`
  marked `loser` and the opponent named as the winner. Until then the loss
  path is only reasoned, not tested against the real page.
- [ ] **Working.** Until then it shows the game's own title through the
  generic `busy` reason.
- [ ] **A map with mission points at 0.** The rule that tells missing points
  apart from missing hit points is tested on an edited fixture only.

## Later — ideas, not planned

- **A missions report on the Dashboard:** silver per location, size and karma,
  to find where missions pay best, and how often each payout type comes up.
  The forums say luck affects the payout; with the knight's luck recorded per
  mission (`#profileAttrib`, row "Късмет"), that can be checked rather than
  believed.
- **Missions paid with rubies**, as an explicit opt-in setting with a limit.
  Turned down for now, not forgotten.
- **Stop conditions:** after N missions, or at a set time.
- **A browser notification when the agent stops by itself**: out of mission
  points, an error, or a page it doesn't recognise. Otherwise a stopped agent
  looks the same as a running one until someone opens the popup.
- **Losses worth noticing:** several losses in a row at one location could
  pause the agent, rather than keep sending the knight into fights it doesn't
  win.
