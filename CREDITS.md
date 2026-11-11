# Credits

RootCamp builds on the work of others. This page lists third-party material we reference, the open-source software we ship, and the required notices.

RootCamp's lessons **paraphrase and link to** the frameworks below; they don't copy them. Their names are used only to identify them. RootCamp is not affiliated with, sponsored by or endorsed by any of these organisations.

## Security frameworks

### MITRE ATT&CK®

Missions and concept cards map defensive lessons to ATT&CK tactics and techniques.

> © 2026 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.

MITRE ATT&CK and ATT&CK are registered trademarks of The MITRE Corporation. Use is under MITRE's non-exclusive, royalty-free licence for research, development and commercial purposes: [ATT&CK Terms of Use](https://attack.mitre.org/resources/legal-and-branding/terms-of-use/).

### MITRE D3FEND™

Defensive techniques are mapped to D3FEND.

> © 2025 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.

MITRE D3FEND and the MITRE D3FEND logo are trademarks of The MITRE Corporation. Use is under MITRE's non-exclusive, royalty-free licence for research, development and commercial purposes: [D3FEND Terms of Use](https://d3fend.mitre.org/tou).

### OWASP Top 10

Web security missions refer to the OWASP Top 10. The OWASP Top 10 is published by the OWASP Foundation under [CC BY-SA 4.0](https://github.com/OWASP/Top10/blob/master/LICENSE). RootCamp links to it and describes risks in its own words; it doesn't reproduce OWASP text. OWASP and the OWASP logo are registered trademarks of the OWASP Foundation, Inc.

## Software we ship

These libraries are bundled into the game. Each keeps its own licence.

| Library                                                                                                      | Licence            |
| ------------------------------------------------------------------------------------------------------------ | ------------------ |
| [React](https://react.dev/) and React DOM                                                                    | MIT                |
| [Firebase JavaScript SDK](https://github.com/firebase/firebase-js-sdk)                                       | Apache-2.0         |
| [Radix UI](https://www.radix-ui.com/)                                                                        | MIT                |
| [shadcn/ui](https://ui.shadcn.com/) components (copied into `src/ui/components/ui/`)                         | MIT, © 2023 shadcn |
| [class-variance-authority](https://github.com/joe-bell/cva)                                                  | Apache-2.0         |
| [clsx](https://github.com/lukeed/clsx)                                                                       | MIT                |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge)                                                  | MIT                |
| [Tailwind CSS](https://tailwindcss.com/) and [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | MIT                |
| [Zod](https://zod.dev/)                                                                                      | MIT                |
| [Zustand](https://github.com/pmndrs/zustand)                                                                 | MIT                |
| [Workbox](https://developer.chrome.com/docs/workbox) (via vite-plugin-pwa)                                   | MIT                |

Build and test tools (Vite, TypeScript, Vitest, Playwright, axe-core, ESLint, Prettier and others) are listed in `package.json` with their own licences.

## Learning sources

Each mission and concept card cites its own free sources (RFCs, man pages, official documentation, free books). They're listed in `src/content/sources.ts`, and the links are checked automatically.
