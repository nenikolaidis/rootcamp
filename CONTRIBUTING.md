# Contributing to RootCamp

Thanks for helping. RootCamp teaches people how real systems behave, so accuracy matters as much as code quality. This guide covers how to set up, what we expect in a change and the rules for game content.

## Setup

- Node.js 24+ (`.nvmrc` pins 26)
- For rules tests and local accounts: Java 21+ and the Firebase CLI

```bash
npm ci
npm run dev
npm run check   # run before every pull request
```

`npm run check` runs the typecheck, lint (ESLint, Prettier and licence headers), unit tests and Firestore rules tests. If you changed the UI, also run `npm run test:e2e`.

## Branches and commits

- Branch from `main`: `feat/…`, `fix/…`, or `wNN-…` for island work (for example `w05-raid-m3`).
- Use [Conventional Commits](https://www.conventionalcommits.org/), and keep commits small: `feat(engine): add mdadm --detail`, `fix(ui): keep terminal focus after a quiz`, `test(w05): golden test for mission 4`.
- Open a pull request against `main`. CI must pass.

## Architecture rules (lint enforces these)

| Layer   | Folder        | May import                      |
| ------- | ------------- | ------------------------------- |
| Engine  | `src/engine`  | only itself                     |
| Content | `src/content` | only itself                     |
| Worlds  | `src/worlds`  | engine, content                 |
| Game    | `src/game`    | engine, worlds, content         |
| Cloud   | `src/cloud`   | game, engine, content, Firebase |
| UI      | `src/ui`      | everything except Firebase      |

- **Determinism.** `src/engine` and `src/worlds` never use `Date.now()`, `new Date()`, `Math.random()` or browser APIs. Time comes from the virtual clock; randomness comes from the seeded RNG.
- **Never fake success.** If a command, flag or feature isn't simulated yet, print a clear "not simulated in this world yet" message and return a non-zero exit code. Never print success for something the engine didn't do.
- **Check state, not keystrokes.** Mission objectives check the resulting system state, not the exact commands typed. Only "investigate" objectives may look at which commands ran.
- **Output fidelity.** Command output, errors and exit codes follow Ubuntu 26.04 LTS. Packet fields use Wireshark naming. Base output on captures from a real system, not on memory.
- **Budgets.** The first visit must stay under 400 KB (brotli) and each island chunk under 200 KB. CI checks this.
- **Cloud is optional.** The game must keep working when Firebase is unavailable. Firestore writes happen only on mission completion or every 5 minutes, never per command.

## Adding a mission

Every mission ships with:

1. A ticket, objectives that check state, and three progressive hints
2. Field notes, and 1–3 free sources from `src/content/sources.ts`
3. A short quiz
4. A **golden test**: the starting state fails, the reference solution passes, and at least one alternative solution passes

New concepts start with a plain-language idea, an analogy and a small interactive model before the terminal task. Facts go in `src/content/facts.ts` with their source and the date they were checked.

## Security content

RootCamp teaches **defence**.

- Attacks happen only as scripted events performed by the in-game antagonist, inside the simulation. Players investigate, explain and defend.
- Never add real attack-tool syntax, working exploits or instructions that would work against real systems.
- Capture-the-flag challenges use planted misconfigurations only. To score, players capture the flag **and** patch the weakness.

Pull requests that don't follow these rules will be closed.

## Licences and headers

- Code is licensed **AGPL-3.0-or-later**. Every source file starts with:
  ```ts
  // SPDX-License-Identifier: AGPL-3.0-or-later
  ```
  (`/* … */` in CSS). Components copied from shadcn/ui keep their MIT header.
- Lessons, missions, concept cards and art are licensed **CC BY-NC-SA 4.0**.
- By contributing, you agree that your contribution is released under these licences.
- **Don't paste third-party text** (OWASP, MITRE, vendor documentation, man pages) into content. Paraphrase in your own words, and cite the source in `src/content/sources.ts`.

## Text and translations

All user-facing text goes through the i18n catalogs (`src/ui/i18n/`), never hard-coded in components. English comes first; Greek is next. Command output stays in English, as it is on real servers. Write UI copy like a calm senior engineer: brief, clear, sentence case, no hype.

## Reporting problems

- **Bugs and inaccurate output:** open an issue. If you can, include the command and what a real Ubuntu 26.04 system prints.
- **Security issues in RootCamp itself** (not in-game content): please report them privately through GitHub's "Report a vulnerability" button instead of a public issue.
