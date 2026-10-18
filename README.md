# bubududu

A romantic Next.js App Router home for two. Four public chapters, a Supabase-backed private dashboard, and Google Drive photo memories.

## Your shared dashboard

Signing in opens **Overview**, a shared home for both partners. Notes, calendar plans, photos, mood check-ins, goals, playlist tracks, and surprise-box announcements appear together, newest first, with author labels. Saving a new item returns you to this overview. Search and category filters cover the latest 80 shared moments; each sidebar category retains its full collection.

The overview subscribes to all seven Supabase tables for live changes, refreshes when the browser tab becomes visible, and includes a manual refresh button. Summary cards show database totals, and the upcoming panel shows the next three future calendar events. Surprise contents are never requested for the overview. This redesign uses the existing migrations without additional database changes.

Run `npm test` to verify feed ordering, author preservation, distinct record keys, and search/filter behavior.

## Run locally

1. `npm install`
2. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (an anon key is also supported).
3. Run the eight files in `supabase/migrations/` in numbered order in the Supabase SQL editor. Replace and uncomment the two whitelist emails in migration 01. The whitelist is limited to exactly two slots and is inaccessible to browser clients.
4. Create those two accounts in Supabase Authentication and confirm their emails. Use email/password sign-in. Disable public signup in Supabase if you do not need it.
5. `npm run dev`, then open http://localhost:3000.

## Make it yours

Edit `src/config/couple.js` to set the anniversary, Google Drive photos, special places, and a playable audio URL. Set `anniversaryIsSample` to false after personalizing. Public story copy is in `src/components/love-app.js`. No personal photographs or real relationship details are assumed.

For public-page galleries, share each file as Anyone with the link, then add individual `{ url, caption }` entries to `photos`. Images use Google Drive thumbnail URLs, never Supabase Storage. Public photos are visible to anyone with their links.

## Google Drive folder albums in Photo Diary

1. Enable **Google Drive API** in a Google Cloud project and create an API key. Restrict the key to Google Drive API. Because requests originate on the server, use server-compatible application restrictions rather than browser referrer restrictions.
2. Add `GOOGLE_DRIVE_API_KEY=your-key` to `.env.local` and your deployment environment. Restart the development server after adding it. This key stays on the server; do not prefix it with `NEXT_PUBLIC_`.
3. In Drive, set the folder's **General access → Anyone with the link → Viewer**. Place photos directly inside the folder, with inherited public access.
4. In **Photo Diary**, enter a title and paste the **entire folder sharing link**, such as `https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing`. Save it once; both partners can open the album.

The album displays photos one by one, with previous/next arrows, a thumbnail strip, photo counts, and an expanded view (arrow keys navigate, Escape closes). Photos are ordered by filename using natural sorting. The viewer loads 100 at a time, with **Load more photos** for additional pages. Use **Refresh album photos** after changing files in Drive. Folder contents do not emit Supabase realtime events; adding an album entry does.

Subfolders, shortcuts, and videos are excluded. Existing individual-photo entries remain supported. The dashboard overview links folder entries to Photo Diary rather than attempting to render a folder as an image. No new SQL migrations are needed; the existing `drive_url` column already accepts folder URLs.

The `/api/drive-folder` endpoint verifies the signed-in Supabase user and the two-person whitelist before calling Google. It returns only photo metadata, uses no public cache, and never returns the API key. Missing configuration, private folders, empty folders, pagination errors, and quota limits are reported in the viewer. See Google's [public-folder listing guide](https://developers.google.com/workspace/drive/api/guides/search-files) and [files.list reference](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list).

Private diary images load through the authenticated `/api/drive-photo` endpoint. It obtains a fresh Google-generated preview (including previews for formats such as HEIC), serves the image from the app's own origin, and falls back to original bytes for browser-supported image formats. If image delivery still fails, the viewer offers an embedded Google Drive preview and a retry button. Both image sizes and album listings remain private and are not publicly cached. Public-page galleries continue to use their existing direct image links.

## What persists

The global soundtrack attempts autoplay once per configured song per browser. A versioned localStorage flag caches the attempt before playback, and confirmed playback updates it to `played`. Subsequent visits and client navigation do not restart the song; the root-layout player persists across routes. A Web Lock serializes simultaneous first visits in browsers that support it. If browser storage is disabled, duplicate attempts are prevented for the current document only. Playback remains subject to Spotify and browser autoplay rules; the floating player always offers explicit play/pause controls. Spotify serves and caches its own media; the app does not download or cache Spotify audio.

Dashboard notes, calendar dates, photo metadata, moods, goals, tracks, and surprise boxes persist in Supabase and subscribe to Realtime changes. Shared goals are editable by either partner; entries can be removed by their creator. Each table has RLS that verifies a confirmed account against the whitelist. Never put a service-role key in browser environment variables.

Public checklists, future-self reflections, and coupon previews are browser-local. Quiz answers, hugs, and mini-games are session-local, intended for playing together on one device. Public content is visible to visitors. Private records are fetched only after whitelist authorization; RLS enforces the same boundary independently of the interface.

Mystery box titles and opening dates are shared, while bodies are moved by a database trigger to an unexposed private schema. Only the date-gated RPC releases their contents. Database owners can always inspect their own database.

## Verification

`npm run lint` and `npm run build`. SQL must be applied to your Supabase project before the private features can be exercised. The app never automatically applies remote migrations.
