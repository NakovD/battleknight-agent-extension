# Handover — as of 2026-11-13

State of the project after PR [#6](https://github.com/NakovD/battleknight-agent-extension/pull/6),
merged to `main` as `9106558`. Everything below is on `main`.

Green at merge: 59 API tests (the API was not touched), 404 extension tests,
`tsc -b` and `biome ci` clean, production build clean. Verified in the live
game.

---

## What shipped

### Missions, end to end

A Missions tab that runs missions by itself: choose a location, karma and size
once, press Start, and the agent keeps going until the day's mission points run
out. **[MISSIONS.md](MISSIONS.md) is the reference.** It covers how the game
behaves, what was decided and why, the pages still missing, and ideas for later.
What follows is what is easy to break.

**Popup** — `extension/src/popup/features/missions/`

- A three-step form built on a shared `Stepper` (`popup/components/common/stepper/`).
  Next asks each step's own field schema, so step rules and submit rules can't
  drift apart.
- "Load locations" doesn't scrape anything in the popup. The background takes
  the game tab to `/world` and asks its content script to read the page.

**Background** — `extension/src/background/features/missions/`

- `GameTabWorldMapReader` **listens for the tab's load before navigating it.**
  The other way round, a fast load finishes unseen and the read times out. It
  then asks the content script up to 10 times, because the script can start a
  moment after the tab reports it has loaded.
- **Only one agent runs at a time.** Duels and missions each refuse to start
  while the other runs, because both drive the same tab. Loading locations
  refuses too while duels run.

**Agent** — `extension/src/content/features/missions/`

- `decideMissionStep` reads the page and returns a decision; `runMissionStep`
  carries it out. Keep it that way: the decisions are tested against real
  pages because they touch nothing.
- **A mission is marked pending before the form is submitted.** That is how the
  report it leads to is recognised, and why it is recorded exactly once. A
  report the agent didn't cause, or one opened again, only leads back to
  `/world`.
- **A countdown on the page is a snapshot.** When the wait is over the agent
  opens `/world` afresh. Reading the old countdown again would only start
  another wait, forever.
- **One wait timer at a time.** A second step during a wait — a reload, the
  tab coming to the front — replaces the timer rather than adding one. With
  real, asynchronous storage two timers could both navigate.
- **Out of hit points vs out of mission points.** The game greys out the
  buttons for both. Free points below the mission's cost means points: stop
  for the day. Anything else means hit points: wait for the next full hour or
  15 minutes, whichever comes first. When the numbers can't be read the agent
  assumes hit points, because waiting by mistake is harmless while stopping by
  mistake ends the day.
- **`buyRubies` is always 0.** Rubies are real money. A test holds this.
- Text on the game's pages is translated, so figures are read by position and
  structure, and outcomes by class (`.userShield.winner`), never by wording.

**State** — one record in `chrome.storage` (`missionsExtensionState`), read
through its schema. A shape left by an older version starts over instead of
breaking the popup. Finished missions also go to `missionsHistory`, capped at
500, ready for the Dashboard.

**Fixtures** — the page readers are tested against trimmed copies of real
pages in `content/features/missions/fixtures/`, never against hand-written
HTML. To add one, save the page from the game into `html/` at the repository
root (untracked, because it carries account details), then run from
`extension/`:

```sh
node scripts/extractGameFixtures.mjs <name> --character "<the knight's name>"
```

The script keeps only what the readers need. It strips the csrf token and the
server's address, and replaces the knight's name with a placeholder.

---

## Shipped earlier

### Refresh tokens, end to end (PR #5)

The access token used to be long-lived because nothing could renew it. It is now
15 minutes, with a 30-day refresh token.

**Backend** — `api/.../Features/Auth/`

- `RefreshToken` entity, stored only as a SHA-256 hash. A plain SHA-256 on
  purpose, unlike passwords: the token is 32 random bytes, so there is nothing
  to guess and no need for a slow hash.
- `/auth/refresh` rotates the token on every call. **Reuse detection:** an
  already-rotated token presented again revokes the user's entire chain — it
  either leaked or a stale client retried, and neither is trustworthy.
- `/auth/logout` revokes server-side and always answers 204, so it never reveals
  which tokens exist.
- `FakeTimeProvider` is wired into `ApiFactory`, which is the only practical way
  to reach a 30-day expiry in a test.

**Extension** — `extension/src/background/features/auth/`

- The session stores the refresh pair too. A session saved before this change
  has no refresh token, fails validation, and is treated as signed out — one
  extra sign-in, which beats keeping a session that can never renew.
- **Only one renewal runs at a time** (`AuthService.renewal`). This is the
  subtle part: because the API treats a second use of a rotated token as a leak,
  two callers refreshing at once would revoke the session. They share one
  promise instead.
- Renewal happens 30 seconds before expiry, matching the server's `ClockSkew`,
  so a request sent at the last moment does not arrive after the token died.
- **A rejected token ends the session; an unreachable server does not.** A
  network failure says nothing about the token, so the session survives and the
  caller can retry. Easy place to accidentally sign people out when the backend
  is simply down.
- `getAccount` makes no network call. Being signed in is the refresh token's
  lifetime, not the access token's — opening the popup is not a reason to talk
  to the server.
- `RemoteDuelsSettingsService` takes an `IAccessTokenProvider` rather than the
  session store, so it does one renewal and one retry on a 401 without knowing
  how tokens are stored.

### Order names were silently broken (PR #5)

The engine compares orders against names trimmed off the page
(`domDuelsEngine.ts`), but the form sent them as typed. The API trims on save —
so `" Templars "` worked for a signed-in user and **quietly matched nothing for
everyone else**. Both the form mapping and the wire schema now trim.

The wire schema *normalises* (trims, drops blanks) rather than rejecting:
settings stored by an older version are read back through it, and rejecting
would break the popup. That trap already bit us once with `levelMin: 0`.

Order names also had no rules at all. The form now applies the API's own limits
(50 orders, 100 characters, non-empty) and shows the reason on the offending
row. The rules are **conditional** on both order toggles being on, because the
rows are hidden otherwise and an invisible error would disable Start with no
explanation.

### A duplicated React can no longer ship (PR #5)

Two React copies in one bundle meant react-dom installed its hook dispatcher on
one copy while components called hooks through the other. The only symptom was a
blank popup and `Cannot read properties of null (reading 'useState')`. It cost
two debugging sessions.

- `extension/build/assertSingleReact.ts` fails the build and names the files.
  Covers all three shapes: two different React files, one file pulled into two
  chunks, and the dev server's pre-bundle reaching production.
- The actual cause was a **drive-letter case difference on Windows** —
  `C:/…/react.production.js` and `c:/…/react.production.js` are one file but two
  module ids. `resolve.dedupe` now pins React, react-dom and scheduler to one
  copy.
- `.claude/skills/diagnose-blank-popup/` has the full procedure, including a
  jsdom harness that reproduces the blank popup from a built bundle without a
  browser.

---

## Still open

Roughly in the order worth caring about.

1. **Both agents run in every open game tab.** Seen live on 2026-11-12. The
   agent's state is one shared record in `chrome.storage`, and every game tab's
   content script acts on it. With two tabs open, say s26 and s27, duels
   configured for s27 also run on s26, where those filters match nobody, so the
   agent stops with "none of the knights matched". Missions would do the same,
   and worse: two tabs could start missions in parallel.

   The fix is to tie a run to one tab. On Start, the background records the
   game tab it was started for (its id, plus the server's origin as a sanity
   check). Each content script asks the background whether it is that tab,
   from `sender.tab.id`, before taking a step. Questions to settle first:
   which tab counts when the popup starts an agent (the active one?), what
   happens when that tab is closed (stop, with a reason), and whether one agent
   per server could ever be wanted. Duels' settings would then also need
   keeping per server.
2. **The renewal has never been watched in a browser.** It fires 15 minutes into
   a live session, so it needs a real sit-and-wait. Everything else about it is
   unit tested and was smoke tested against a running API.
3. **Neither circuit breaker has fired live.** Duels' and missions' are unit
   tested only. Each stops its agent after 8 page changes in a row without
   progress.
4. **Intermittent build and test flakiness.** The duplicated-React build and a
   whole vitest run failing to collect with `Tests  no tests` have only ever
   appeared when several tools ran in one shell invocation. Run separately,
   `tsc -b`, `vitest run` and `npm run build` are reliable. The mechanism of the
   first is understood and guarded; the trigger of either is not pinned down.
5. **`extension/src/sidepanel/` is leftover CRXJS scaffold** — an empty App with
   the React logo. The manifest declares it, so it loads React for nothing.
   Safe to delete along with the `side_panel` entry.

   It is now formatted and null-checked like the rest of the project, which is
   wasted polish on dead code — a reason to decide about it rather than leave it.
6. **Missions pages we have no sample of:** a lost mission's report, working,
   and a map with 0 mission points. Listed as To do in [MISSIONS.md](MISSIONS.md),
   along with what is assumed until then.

### Biome — done, 2026-10-09

`biome check` and `biome ci` both exit 0. The 121 complaints were mostly a
line-ending argument: `core.autocrlf` checked files out as CRLF while the
repository stored LF, and Biome formats to LF, so every file looked misformatted
and fixing it in the working tree was undone by the next checkout. A
`.gitattributes` with `* text=auto eol=lf` settles it on every platform.

Only the 13 `noChildrenProp` infos remain, and they are accepted in
`biome.json` — passing `children` as a prop is how TanStack Form is used here.

One habit worth keeping: run `biome check --write` on specific files, not on a
directory, unless the commit is meant to be formatting-only. On a directory it
reformats neighbours and buries the real diff.

### The validation item — closed, not forgotten

Earlier I flagged that the Zod schema does not mirror the API's stricter rules:
upper bounds on level, loot, cooldown and ranking offset, and
`levelMin <= levelMax`. **Checked, and deliberately left alone** — none of it is
reachable from the UI:

| Rule | API limit | What the UI can produce |
| --- | --- | --- |
| level | 10 000 | slider caps at 1 000 |
| loot | 1 000 000 000 000 | slider caps at 1 000 000 000 |
| cooldown | 24 h | slider is 1–15 minutes |
| ranking offset | 100 000 | fixed dropdown list |
| `levelMin <= levelMax` | enforced | the multi-slider thumbs cannot cross, and there are tests for it |

Order names were the one genuinely reachable gap, and that is fixed. Adding the
rest would be dead validation. Revisit only if a control is ever replaced by a
free-text input.

---

## Roadmap, not started

- **AI integration** — `AiDuelsEngine` behind the existing engine interface,
  using Claude Vision to read the page instead of DOM selectors.
- **Dashboard** — attack history and statistics. Mission history is already
  recorded in `chrome.storage`; the report ideas, such as silver per location
  and payout types against luck, are in [MISSIONS.md](MISSIONS.md).
- **Missions, next** — ideas for later in [MISSIONS.md](MISSIONS.md):
  missions paid with rubies as an opt-in, stop conditions, and a browser
  notification when an agent stops by itself.

---

## Worth knowing before touching this

- **Never rebuild or delete `extension/dist` while someone is testing in the
  browser.** Asset filenames carry a content hash, so every build renames them
  and an extension loaded unpacked points at files that no longer exist. After
  any rebuild: Remove, then Load unpacked — not Reload, which can keep the old
  popup document in cache.
- **Tests have agreed with bugs here more than once.** The ranking columns were
  read one off, and the test helper built its fixture rows with the same wrong
  layout. After a fix, reintroduce the bug on purpose and confirm the right test
  fails.
- Mutation testing is the habit that caught the real gaps: 4 deliberate defects
  on the refresh backend, 6 on the client renewal, 8 on the order-name rules,
  12 on missions — every one caught. The build guard was verified by forcing it
  to fire.
- **It also catches tests that cannot fail.** Missions turned up three:
  - an `expect` inside an async mock callback that nothing awaited;
  - a stepper test guarding against a skipped step that could never happen;
  - a double-timer test that passed only because `chromeStorageMock` is
    synchronous.

  The mock answers instantly, so races that need real async storage don't show
  in tests. Assert on the mechanism instead, e.g. `vi.getTimerCount()`.
- **Get real pages from the game** before writing a reader for one. The saved
  pages showed things nobody would have guessed:
  - one countdown page serves both a mission and a group mission;
  - the game gives the knight's remaining wait itself;
  - missions cost points that come back at a per-server rate.
- Tests are written in Bulgarian, comments and commit messages in English.
