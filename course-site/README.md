# Applied AI for Beginners: course website

The website for the free 5-day course that teaches applied AI with GraphRAG Chats as the practice project. It is a React site with no backend of its own:

- **Chapters** are Markdown files in [`content/chapters/`](content/chapters). Every page is prerendered to its own HTML file at build time, so search engines and link previews see real titles and text.
- **Login** is a magic link handled by [Supabase](https://supabase.com): learners type their email and click the link we send. It is optional.
- **Progress** is saved in the browser straight away, and synced to Supabase once the learner logs in.
- **Visitor stats** come from [Umami Cloud](https://umami.is), which uses no cookies, so the site needs no cookie banner.

## Run it locally

```bash
cd course-site
cp .env.example .env   # all values are optional for local work
npm install
npm run dev            # http://localhost:5173
```

Without Supabase values the "Log in" button is hidden and progress stays on the device.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check, build, prerender every page into `dist/`, write `sitemap.xml` and `robots.txt` |
| `npm test` | Unit tests (content parsing, progress merging, SEO tags) |
| `npm run og` | Redraw the share images in `public/og/` (run after renaming a chapter) |

## Editing the course

Each chapter is one file such as `content/chapters/09-rag.md`:

```markdown
---
number: 9
slug: rag                      # the URL: /chapters/rag
title: RAG, retrieve then answer
navTitle: RAG                  # shorter name for the chapter list
day: 4
minutes: 60
description: One sentence for Google and link previews (160 characters max).
---

Chapter text in Markdown...

<!-- diagram:rag -->           (optional: an animated diagram, see src/components/FlowDiagram.tsx)

## Check yourself

1. A question?

<!-- answers -->

1. The answer, hidden behind a "Show answers" button.
```

## One-time setup

### 1. Supabase (login and progress)

1. Create a free project at [supabase.com](https://supabase.com). Pick an EU region such as Frankfurt (the privacy page says data is stored in the EU).
2. **SQL Editor → New query**: paste [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the `course_progress` table and its row level security rules.
3. **Authentication → URL Configuration**: set the Site URL to `https://rehbarai.com` and add `https://rehbarai.com/login` and `http://localhost:5173/login` to the Redirect URLs.
4. **Project Settings → API**: copy the Project URL and the `anon` public key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Sending real emails.** Supabase's built-in sender only allows a few emails an hour and is meant for testing. Before sharing the site, create a free [Resend](https://resend.com) account, verify `rehbarai.com` there (it shows a few DNS records to add at your registrar), then enter Resend's SMTP details in **Authentication → SMTP Settings** with a sender such as `hello@rehbarai.com`.

**Seeing who signed up.** [`supabase/stats.sql`](supabase/stats.sql) has ready-made queries for sign-ups, last logins and chapter completions. Paste them into the SQL Editor.

### 2. Umami (visitor stats)

Create a free account at [cloud.umami.is](https://cloud.umami.is), add the website `rehbarai.com`, and copy its Website ID into `VITE_UMAMI_WEBSITE_ID`. Besides page views, the site sends two custom events: `login` and `chapter-complete` (with the chapter's slug).

### 3. Railway (hosting)

1. In Railway, create a service from this GitHub repo.
2. **Settings → Source**: set Root Directory to `/course-site`. Railway then builds the [`Dockerfile`](Dockerfile) here (see [`railway.json`](railway.json)).
3. **Variables**: add `VITE_SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_UMAMI_WEBSITE_ID` and `VITE_CONTACT_EMAIL`. They are read at build time, so redeploy after changing one.
4. **Settings → Networking → Custom Domain**: enter `rehbarai.com` with port `8080` (also add the variable `PORT=8080`), then add the record Railway shows in Cloudflare's DNS with the proxy set to **DNS only**. HTTPS is set up automatically.

### 4. Google

Once the site is live, add it in [Google Search Console](https://search.google.com/search-console) and submit `https://rehbarai.com/sitemap.xml`.
