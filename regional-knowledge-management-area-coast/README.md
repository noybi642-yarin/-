# מערכת חפיפה וניהול ידע אזורית

מערכת Knowledge Management אינטראקטיבית לניהול אזור, רשויות, מרכזים, אנשי קשר, משימות, סיכונים, הזדמנויות, מסמכים וידע ניהולי.

המערכת שומרת ל-Supabase כאשר מוגדר חיבור. אם לא הוגדר חיבור, היא עובדת במצב פיתוח מקומי באמצעות `localStorage`.

## קבצים מרכזיים

- `app.html` - נקודת הכניסה.
- `styles.css` - עיצוב RTL responsive בסגנון SaaS.
- `data.js` - מבנה ראשוני, labels ו-placeholders.
- `app.js` - UI, ניווט, CRUD, חיפוש ושמירה.
- `supabaseClient.js` - שכבת הנתונים מול Supabase.
- `config.js` - פרטי החיבור ל-Supabase.
- `supabase-schema.sql` - SQL להקמת הטבלאות.
- `vercel.json` - הכנה לפריסה ב-Vercel.

## טבלאות Supabase

ה-SQL יוצר את הטבלאות:

- `authorities`
- `centers`
- `contacts`
- `tasks`
- `risks`
- `opportunities`
- `notes`
- `documents`

## חיבור Supabase

1. פתח/י פרויקט Supabase חדש.
2. היכנס/י ל-SQL Editor.
3. הדבק/י והריצ/י את כל התוכן של `supabase-schema.sql`.
   אם כבר הרצת את הסכמה בעבר, הרץ/הריצי בנוסף את `supabase-feature-migration.sql`.
4. היכנס/י ל-Project Settings > API.
5. העתק/י את `Project URL` ואת `anon public key`.
6. עדכן/י את `config.js`:

```js
window.KM_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

7. רענן/י את `app.html`. בחלק העליון יופיע `Supabase מחובר`.

## שימוש

- `שמור` שומר את העמוד הנוכחי ל-Supabase כאשר החיבור מוגדר.
- `Auto Save` שומר אוטומטית לאחר עריכה.
- `מי מעדכן/ת?` נשמר כ-`updated_by` ומוצג ב-History/Last Updated.
- `Export PDF` פותח הדפסה/שמירה כ-PDF של העמוד הנוכחי.
- `Attach Files` מצרף קבצים ושומר אותם כפריטי Documents.
- `Activity Log` מציג פעולות שמירה, מחיקה, צירוף קבצים וייצוא.
- `גיבוי JSON` מוריד snapshot של המידע המקומי.
- `ייבוא גיבוי` משחזר snapshot קודם.
- בטבלאות ניתן להוסיף, לערוך, למחוק ולחפש.
- שדות הדאשבורד של הרשויות נשמרים בטבלת `authorities`.

## פריסה ב-Vercel

1. העלה/י את התיקייה ל-GitHub.
2. צור/צרי Project חדש ב-Vercel מה-repository.
3. אין צורך ב-build. הפקודה `build` רק מאשרת שמדובר באפליקציה סטטית.
4. ודא/י שהקבצים `config.js`, `supabaseClient.js`, `app.html`, `app.js`, `data.js`, `styles.css` נמצאים בפריסה.
5. פתח/י את ה-URL של Vercel ובדוק/בדקי שמופיע `Supabase מחובר`.

הערת אבטחה: כרגע ה-SQL כולל policies פתוחות כדי לאפשר עבודה מידית ללא התחברות משתמשים. לפני שימוש ארגוני אמיתי מומלץ להוסיף Supabase Auth ולהגביל הרשאות לפי משתמשים/תפקידים.
