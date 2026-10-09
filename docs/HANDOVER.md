# Handover — as of 2026-10-09

State of the project after PR [#5](https://github.com/NakovD/battleknight-agent-extension/pull/5),
merged to `main` as `85638fc`. Everything below is on `main`.

Green at merge: 59 API tests, 275 extension tests, `tsc -b` clean, production
build clean.

---

## What shipped

### Refresh tokens, end to end

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

### Order names were silently broken

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

### A duplicated React can no longer ship

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

1. **The renewal has never been watched in a browser.** It fires 15 minutes into
   a live session, so it needs a real sit-and-wait. Everything else about it is
   unit tested and was smoke tested against a running API.
2. **The circuit breaker is only unit tested.** Never verified live.
3. **Intermittent build and test flakiness.** The duplicated-React build and a
   whole vitest run failing to collect with `Tests  no tests` have only ever
   appeared when several tools ran in one shell invocation. Run separately,
   `tsc -b`, `vitest run` and `npm run build` are reliable. The mechanism of the
   first is understood and guarded; the trigger of either is not pinned down.
4. **`extension/src/sidepanel/` is leftover CRXJS scaffold** — an empty App with
   the React logo. The manifest declares it, so it loads React for nothing.
   Safe to delete along with the `side_panel` entry.

   It is now formatted and null-checked like the rest of the project, which is
   wasted polish on dead code — a reason to decide about it rather than leave it.
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
- **Missions tab.**
- **Dashboard** — attack history and statistics.

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
  on the refresh backend, 6 on the client renewal, 8 on the order-name rules —
  every one caught. The build guard was verified by forcing it to fire.
- Tests are written in Bulgarian, comments and commit messages in English.
