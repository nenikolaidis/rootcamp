# RootCamp

**Learn infrastructure by breaking it.**

RootCamp is a free browser game that teaches DevOps, IT networking, network security, storage, containers, Kubernetes, infrastructure as code, data analytics and SRE. You sail between islands, take tickets from colleagues, and fix simulated systems by typing real commands, while live visuals show what's happening inside: disks rebuilding, packets crossing the network, pods restarting.

Everything runs **in your browser**. No real servers, containers or virtual machines are involved, so nothing you do can break anything outside the game.

> **Status:** early development. The first playable island isn't ready yet. Watch this repository or check the [changelog](CHANGELOG.md).

## What you'll be able to do

- **Islands as topics.** Base Camp (how computers and networks work), Shell Shore (Linux), RAID Rock (storage), Packet Harbor (networking) and more. Each island opens routes to the next.
- **Real commands, simulated systems.** Output, errors and exit codes follow Ubuntu 26.04 LTS tools closely, so what you learn carries over to real machines.
- **See it, then do it.** Every new idea starts with a plain explanation, an analogy and a small interactive model before the terminal task.
- **Learn from mistakes.** Rewind to any command, replay what went wrong and see why. Failing never costs XP.
- **Defend, don't attack.** Security lessons are defensive. An in-game character stages attacks inside the simulation; you investigate, explain and patch.
- **Sources you can trust.** Every mission and concept card links to free, authoritative reading: RFCs, man pages and official docs.

You can play a demo as a guest, with progress saved on your device. A free account (age 15+) unlocks every island and syncs your progress.

## Run it locally

You need **Node.js 24 or newer** (the repo pins 26 in `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173
```

For accounts, cloud saves and the Firestore rules tests you also need **Java 21+** and the **Firebase CLI**:

```bash
npm run emulators  # local Auth + Firestore + Hosting, UI at http://localhost:4000
npm run test:rules # Firestore rules tests against the local emulator
```

Local emulators always run under the `demo-rootcamp` project ID and never touch a real Firebase project.

| Command            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Start the game with hot reload                     |
| `npm run check`    | Typecheck, lint, unit tests and rules tests        |
| `npm test`         | Unit tests (Vitest)                                |
| `npm run test:e2e` | Browser and accessibility tests (Playwright + axe) |
| `npm run build`    | Production build into `dist/`                      |
| `npm run size`     | Check the download budget after a build            |

## How it's built

TypeScript, React and Vite, styled with Tailwind CSS. The simulation engine is pure and deterministic: it uses a virtual clock and a seeded random number generator, and never touches the page, the network or real time. The game is a static site on Firebase Hosting, with optional sign-in and cloud saves through Firebase Authentication and Cloud Firestore. It works offline after the first visit.

```
src/engine    the simulation: shell, file system, disks, network, processes
src/worlds    islands, missions and their starting states
src/game      progress, objectives, XP, hints, saves
src/cloud     optional sign-in and cloud sync
src/content   facts, sources and concept cards
src/ui        screens and live visuals
```

## Contributing

Bug reports, accuracy fixes and new missions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Supporting the project

RootCamp is free and has no ads. If it helps you, you can support it through the Sponsor button on this repository. Supporters get cosmetic extras only, never a gameplay advantage.

## Licences

- **Code:** [GNU AGPL v3.0 or later](LICENSE)
- **Lessons, missions, concept cards and art:** [CC BY-NC-SA 4.0](LICENSE-CONTENT)

Third-party material and trademarks are listed in [CREDITS.md](CREDITS.md).
