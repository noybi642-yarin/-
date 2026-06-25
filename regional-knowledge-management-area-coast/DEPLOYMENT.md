# Vercel Deployment Steps

## 1. Verify Supabase

The app expects `config.js` to include:

```js
window.KM_SUPABASE_CONFIG = {
  url: "https://ajbbyfrebeflwznnydym.supabase.co/rest/v1/",
  anonKey: "YOUR_ANON_KEY"
};
```

`supabaseClient.js` automatically normalizes the `/rest/v1/` suffix for the Supabase JS client.

Before deploying, run `supabase-feature-migration.sql` in Supabase SQL Editor if it has not been run yet.

## 2. Push Project To GitHub

From this project folder, commit and push:

```bash
git add .
git commit -m "Prepare knowledge management app for Vercel"
git push
```

## 3. Create Vercel Project

1. Open Vercel.
2. Click `Add New...` > `Project`.
3. Import the GitHub repository.
4. Use these settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: leave empty
   - Install Command: leave default

## 4. Deploy

Click `Deploy`.

After deployment, open the generated Vercel URL. The top bar should show:

```text
Supabase מחובר
```

## 5. Production Notes

The current Supabase RLS policies are open for internal testing. Before wider production use:

- Add Supabase Auth.
- Restrict write/delete operations to authenticated users.
- Avoid exposing service role keys in frontend code.
- Keep only the anon public key in `config.js`.
