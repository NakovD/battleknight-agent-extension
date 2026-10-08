---
name: diagnose-blank-popup
description: Diagnose the extension popup rendering blank/white in the browser, or any React hook error from a built bundle — "Cannot read properties of null (reading 'useState')", "Invalid hook call", a null dispatcher, or the extension appearing not to load after a rebuild. Use when the popup is empty in Brave/Chrome but the test suite passes.
---

# Blank popup / null React dispatcher

The symptom is a popup that opens as a small white square, with an error from
inside the `vendor-react` chunk:

```
Cannot read properties of null (reading 'useState')
```

Almost always this is **two copies of React in one bundle**. `react-dom`
installs its hook dispatcher (`ReactSharedInternals.H`) on one copy; the
components call hooks through the other, whose `H` was never set. The source is
fine, which is why `npx vitest run` passes while the browser fails — the tests
import modules directly and never see the bundle.

## Before anything else: rule out stale files

Asset filenames carry a content hash, so **every rebuild renames them**. An
extension already loaded unpacked then points at files that no longer exist.

Do this first, and do not skip it — it explains most reports:

1. `cd extension && npm run build`
2. In `brave://extensions`, **Remove** the extension, then **Load unpacked** on
   `extension/dist`. Remove, not Reload — Reload can keep the old popup
   document in cache, and a mixed old/new load produces the same symptom.

If the popup works, stop. Never delete or rebuild `dist` while the user is
mid-test without telling them: it pulls the folder out from under the browser.

## Confirm it is duplicated React

`build/assertSingleReact.ts` runs inside the build and fails it when React
would be bundled twice, naming the offending files:

```
RolldownError: React would be bundled more than once:
  - React is bundled from 2 different files: ...
```

So a `npm run build` that exits 0 already rules this out, and the first thing
to do is simply build. If the guard is missing or was bypassed, count the
markers by hand:

```bash
cd extension
f=$(ls dist/assets/vendor-react-*.js)
for p in '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE' 'useState=function' 'Minified React error'; do
  printf '%-64s %s\n' "$p" "$(grep -o "$p" "$f" | wc -l)"
done
grep -o '[A-Za-z_$]\{1,4\}\.H\.use' "$f" | sort | uniq -c   # dispatcher reads
grep -o '[A-Za-z_$]\{1,4\}\.H=' "$f" | sort | uniq -c       # dispatcher writes
```

Healthy: `internals` 3, `useState=function` 1, and the reads all go through a
single object. Broken: `internals` 4, `useState=function` 2, and **two**
different objects appear among the reads while the writes target only one.

Do not reason about this file line by line. It is minified with newlines inside
template literals, so `awk NR==n` lands mid-string and invents modules that
aren't there.

## Find which modules the bundler actually included

Authoritative, and worth reaching for early — it names the duplicate instead of
leaving you to infer it. Write a throwaway config, run it, delete it:

```ts
// extension/vite.diag.config.ts
import base from "./vite.config";

export default {
	...base,
	plugins: [
		...(base as { plugins: unknown[] }).plugins,
		{
			name: "diag",
			generateBundle(_o: unknown, bundle: Record<string, { type: string; modules?: Record<string, unknown> }>) {
				for (const [file, c] of Object.entries(bundle)) {
					if (c.type !== "chunk" || !c.modules) continue;
					const hits = Object.keys(c.modules).filter((m) =>
						/node_modules[\\/](react|react-dom|scheduler|\.vite)[\\/]/.test(m),
					);
					if (hits.length) console.log(`\n[${file}]\n  ` + hits.join("\n  "));
				}
			},
		},
	],
};
```

```bash
npx vite build --config vite.diag.config.ts; rm -f vite.diag.config.ts
```

Expect exactly one `node_modules/react/cjs/react.production.js`, in one chunk.
`react-jsx-runtime.production.js` beside it is normal — it has no dispatcher.

## The fix, in the order to try it

1. **Read the two paths the guard printed and compare them character by
   character.** The cause found in this project was a *drive-letter case*
   mismatch — the same file counted twice:

   ```
   React is bundled from 2 different files:
     C:/Users/.../node_modules/react/cjs/react.production.js,
     c:/Users/.../node_modules/react/cjs/react.production.js
   ```

   Windows reports this path with either case, and rolldown keys modules by id
   string, so one file becomes two instances. `resolve.dedupe` in
   `vite.config.ts` pins react, react-dom and scheduler to one copy resolved
   from the project root; if the guard still fires with two case-differing
   paths, that setting has been lost.

   Trust the printed paths over any theory. An earlier version of this skill
   blamed the dev-server pre-bundle cache; when the failure was finally caught
   in the act, `node_modules/.vite/deps/` was empty and the real difference was
   the drive letter.

2. **Clear the caches and rebuild** — cheap, and rules out a stale pre-bundle
   that carries its own `react.js`:

   ```bash
   cd extension && rm -rf node_modules/.vite node_modules/.vite-temp dist && npm run build
   ```

   The failure is intermittent: it has only ever appeared in a shell call that
   ran the test suite immediately before the build, and repeating that sequence
   deliberately does not bring it back. A whole vitest suite failing to collect
   with `Tests  no tests` has shown up in the same window. The build guard is
   what makes the intermittency tolerable — it cannot reach the browser
   unnoticed.

3. **Check for a second React install:** `node versions` mismatch between
   `react` and `react-dom`, or a nested copy.

   ```bash
   node -e "for(const p of ['react','react-dom','scheduler'])console.log(p,require(p+'/package.json').version)"
   find node_modules -maxdepth 4 -type d \( -name react -o -name react-dom \) -path "*/node_modules/*"
   ```

4. **Check React is still landing in one shared chunk.** Both the popup and the
   sidepanel mount their own root, so each HTML entry must import the *same*
   React chunk:

   ```bash
   grep -o 'assets/[a-z-]*react[A-Za-z0-9_-]*\.js' dist/src/popup/index.html dist/src/sidepanel/index.html
   ```

## Verify the fix without a browser

Run the built popup bundle in jsdom. This reproduces the real error with a real
stack, and proves the fix — far better than asking the user to reload again.
`scripts/runPopupBundle.mjs` in this skill does it:

```bash
cd extension
node ../.claude/skills/diagnose-blank-popup/scripts/runPopupBundle.mjs \
  "$(pwd)/dist/$(grep -o 'assets/index\.html-[A-Za-z0-9_-]*\.js' dist/src/popup/index.html | head -1)"
```

Broken prints `TypeError: Cannot read properties of null (reading 'useState')`
and `EMPTY ROOT (white square)`. Healthy prints `RENDERED bytes: 24498` or
thereabouts, followed by the popup's markup.

## Report honestly

If the bad build no longer reproduces after clearing the cache, say that the
mechanism is confirmed but the trigger is inferred. Do not present a cleared
cache as a proven root cause.
