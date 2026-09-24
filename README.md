# ST Console — deployment guide

This is the hosted version of your BNI Insomniacs Secretary/Treasurer console.
It's a real website with its own database — no longer tied to Claude at all.

Total time: roughly 20–30 minutes, almost all of it account setup and copy-pasting.

---

## Step 1 — Create your Supabase project (the database)

1. Go to **supabase.com** and sign up (free — you can use your Google account).
2. Click **New project**. Give it any name (e.g. "st-console"), set a database password (save it somewhere), pick a region close to you (e.g. an EU or Asia region — there's no UAE region, pick whichever is closest), and click **Create new project**. Wait ~1 minute for it to spin up.
3. In the left sidebar, click the **SQL Editor** icon, then **New query**.
4. Open the file `supabase/schema.sql` from this project, copy its entire contents, paste it into the SQL editor, and click **Run**. This creates all the tables. You should see "Success. No rows returned."
5. In the left sidebar, click **Project Settings** → **API**. You'll see two things you need:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string)

   Keep this tab open — you'll paste both into Vercel in Step 3.

6. Create your login: in the left sidebar, click **Authentication** → **Users** → **Add user** → **Create new user**. Enter your email and a password. Leave "Auto Confirm User" checked. This is the email/password you'll sign in with on the console. (Later, when someone else takes over as ST, just add them here too — no code changes needed.)

---

## Step 2 — Put the code on GitHub

1. Go to **github.com** and sign up if you don't have an account.
2. Click the **+** icon (top right) → **New repository**. Name it `st-console`, keep it **Private**, and click **Create repository**.
3. On the next page, click **uploading an existing file**.
4. Drag in every file and folder from this project (everything except `node_modules` and `dist`, which shouldn't exist anyway since this is a fresh copy).
5. Scroll down and click **Commit changes**.

---

## Step 3 — Deploy on Vercel

1. Go to **vercel.com** and sign up using your GitHub account (this auto-connects them).
2. Click **Add New** → **Project**.
3. Find your `st-console` repo in the list and click **Import**.
4. Vercel will auto-detect it as a Vite project — leave the build settings as-is.
5. Before clicking Deploy, open **Environment Variables** and add two:
   - `VITE_SUPABASE_URL` → paste the Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` → paste the anon public key from Step 1
6. Click **Deploy**. Wait ~1 minute.
7. You'll get a live URL like `st-console-yourname.vercel.app`. That's your console — bookmark it.

---

## Step 4 — Sign in

Open your new URL, sign in with the email/password you created in Step 1.6, and you're in. All the pages — Dashboard, Venue Fee, Members, Events, Renewals, Miscellaneous, Settings — work exactly as they did in the Claude artifact, except now:

- It has a real login (not a stored password in your browser)
- It's reachable from any device, anyone with a login, independent of Claude
- Your data lives in a real Postgres database with proper backups

## Handing the role to someone else later

No export/import needed anymore — just add them a login in Supabase (Authentication → Users → Add user), and give them the URL. They'll see everything, live.

## If something breaks

The most common issue is a typo in the two environment variable values. Double-check them under Vercel → your project → Settings → Environment Variables, and redeploy after any change (Vercel → Deployments → ⋯ → Redeploy).
