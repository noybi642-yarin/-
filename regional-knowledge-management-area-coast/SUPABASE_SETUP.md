# Supabase Setup

## 1. Create Project

Create a new Supabase project and wait until it is ready.

## 2. Run Schema

Open `SQL Editor` and run the full content of:

```text
supabase-schema.sql
```

This creates:

- Authorities
- Centers
- Contacts
- Tasks
- Risks
- Opportunities
- Notes
- Documents

If your database already existed before Auto Save / Activity Log were added, also run:

```text
supabase-feature-migration.sql
```

## 3. Configure the App

Copy `config.example.js` into `config.js`, or edit the existing `config.js`.

```js
window.KM_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

Refresh the app. The top bar should show `Supabase מחובר`.

## 4. Vercel Deployment

Deploy the folder as a static Vercel project.

Recommended Vercel settings:

- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: leave empty / project root

`vercel.json` rewrites `/` to `/app.html`.

## 5. Production Security

The included schema uses open RLS policies for quick internal setup. For production, replace them with authenticated policies, for example:

- Enable Supabase Auth.
- Require login for all write operations.
- Limit deletes to admin users.
- Add an `organization_id` column if multiple regions will use the same database.
