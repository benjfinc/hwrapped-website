# Hinge Wrapped — Deployment Guide

## Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub if your code is there).

2. Click **"Add New"** → **"Project"**.

3. Import your GitHub repository: `https://github.com/benjfinc/hwrapped-website`

4. Vercel will auto-detect Next.js. Click **Deploy**.

5. Wait 1–2 minutes. Your site will be live at `hinge-wrapped-xxx.vercel.app` (or similar).

---

## Cloudflare deployment (OpenNext)

This repository is configured for Cloudflare Workers via OpenNext:

- `open-next.config.ts`
- `wrangler.jsonc`

Build and deploy with:

```bash
npm install
npm run build
npm run deploy:cf
```

If deploying from Cloudflare Pages with a custom command, use:

```bash
npm run build
```

If you want a plain Next.js local production build (without OpenNext), use:

```bash
npm run build:next
```

---

## Step 2: Add Custom Domain (hingewrapped.com)

**After you buy the domain:**

1. In Vercel: Project → **Settings** → **Domains**.

2. Click **Add** and enter `hingewrapped.com`.

3. Vercel will show DNS instructions. At your domain registrar:

   - **Option A (recommended):** Add the CNAME record Vercel gives you:
     - Name: `@` or `www` (depending on what you want)
     - Value: `cname.vercel-dns.com`
   
   - **Option B:** Add the A records Vercel provides (IP addresses).

4. DNS can take 5 minutes to 48 hours to propagate. Vercel will show a checkmark when it’s working.

5. Vercel will auto-provision SSL (HTTPS) for your domain.

---

## Step 3: Optional — Add Analytics

To track traffic before adding ads:

- **Vercel Analytics** (built-in): Project → Settings → Analytics → Enable.
- **Google Analytics**: Add the GA4 script to your app.
- **Plausible** or **Fathom**: Privacy-focused alternatives.

---

## Step 4: Optional — AdSense (when ready for ads)

1. Sign up at [google.com/adsense](https://www.google.com/adsense).

2. Add the AdSense script to your site (e.g. in `layout.tsx` or via a component).

3. Create ad units and place them (e.g. banner on landing, between slides).

4. Approval can take a few days to a few weeks.

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Site loads at vercel.app URL
- [ ] Domain purchased (hingewrapped.com)
- [ ] Domain added in Vercel
- [ ] DNS configured at registrar
- [ ] Site loads at hingewrapped.com
- [ ] Analytics enabled (optional)
- [ ] Share on socials / Reddit / dating communities
