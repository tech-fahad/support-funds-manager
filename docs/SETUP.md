# Setup Guide

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up / log in
2. Click **New project**
3. Choose a name (e.g. `fund-manager`), set a strong database password, pick a region closest to Pakistan (e.g. Singapore)
4. Wait ~2 minutes for it to provision

---

## 2. Fill in `.env.local`

### API keys
Go to **Settings → API** and copy:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon / public key
- `SUPABASE_SERVICE_ROLE_KEY` → service_role key (keep secret)

### Database connection strings
Go to **Settings → Database → Connection string**

Switch to **URI** tab:
- **Transaction** (port 6543) → paste as `DATABASE_URL`, append `?pgbouncer=true` at the end
- **Session** (port 5432) → paste as `DIRECT_URL`

Replace `[YOUR-PASSWORD]` in both with the database password you set when creating the project.

---

## 3. Configure Supabase Auth

### Enable Email magic link
In Supabase Dashboard → **Authentication → Providers → Email**:
- Enable **Email** provider ✅
- Disable "Confirm email" if you want passwordless magic links to work without confirmation

### Enable Google OAuth (optional)
In **Authentication → Providers → Google**:
1. Create a Google OAuth app at https://console.cloud.google.com
2. Add the Supabase callback URL as an authorized redirect URI
3. Paste Client ID and Secret into Supabase

### Add redirect URL
In **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/callback`

---

## 4. Create Supabase Storage bucket

In **Storage → New bucket**:
- Name: `fund-documents`
- Public bucket: ✅ (transfer documents need to be viewable by trustees)

---

## 5. Run database migrations

With `.env.local` filled in, run:

```bash
npx prisma migrate dev --name init
```

This creates all tables in your Supabase database.

---

## 6. Create the first trustee

After running migrations, you need to manually set the first trustee.
Once you sign up through the app:

1. Go to Supabase Dashboard → **Table Editor → members**
2. Find your row
3. Change `role` from `pending` to `trustee`

After that, you can use the app to approve all future members.

---

## 7. Run the app

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

---

## 8. Deploy to Vercel (when ready)

```bash
npx vercel
```

Add all `.env.local` variables as environment variables in the Vercel dashboard.
Update the Supabase redirect URL to your production domain.
