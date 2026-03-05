# Hinge Wrapped

Your year in dating. Upload your Hinge data export and see insights about your dating life — similar to Spotify Wrapped but for Hinge.

## Features

- **Privacy-first**: All processing happens client-side. Your data never leaves your device.
- **Wrapped-style slides**: Scroll through beautiful, animated insights about your dating activity.
- **Shareable**: Export individual slides or the full experience as PNG images.
- **Flexible parsing**: Supports both JSON and ZIP exports from Hinge.

## How to Get Your Hinge Data

1. Open the Hinge app and go to **Settings**
2. Tap **Download My Data**
3. Submit the request (typically takes 24–48 hours)
4. Download the ZIP file when ready
5. Upload it here!

## Tech Stack

- **Frontend**: Next.js (App Router), React, TailwindCSS, Framer Motion, Recharts
- **Backend**: Next.js API routes (client-side processing only)
- **Deploy**: Vercel-ready

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub and go to [vercel.com](https://vercel.com)
2. Import your repo — Vercel auto-detects Next.js
3. Deploy. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide including custom domain setup.

## Hinge Data Format

Hinge exports come as a ZIP file containing JSON files. The parser looks for:

- `matches.json` — Your match history with messages
- `user.json` — Your profile info (optional)

If you have a raw JSON file (e.g. from a third-party export), the parser accepts:

- An array of match objects
- An object with a `matches` property

Each match can have:
- `match_id`, `name`, `timestamp`, `created_at`
- `messages` — Array of `{ timestamp, body, from }` (use `from: 'you'` for your messages)

## License

MIT
