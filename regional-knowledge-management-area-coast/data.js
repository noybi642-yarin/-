const KM_DATA = {
  meta: {
    title: "ניהול ידע - אזור החוף",
    subtitle: "חינוך לפסגות",
  },
  authorities: [
    { id: "netanya", name: "נתניה", status: "green", manager: "[הזן כאן מנהל/ת מרכז]", students: "[הזן]", mentors: "[הזן]", openTasks: 0, openRisks: 0 },
    { id: "hadera", name: "חדרה", status: "yellow", manager: "[הזן כאן מנהל/ת מרכז]", students: "[הזן]", mentors: "[הזן]", openTasks: 0, openRisks: 0 },
    { id: "basmat", name: "בסמת טבעון", status: "red", manager: "[הזן כאן מנהל/ת מרכז]", students: "[הזן]", mentors: "[הזן]", openTasks: 0, openRisks: 0 },
    { id: "zarzir", name: "זרזיר", status: "yellow", manager: "[הזן כאן מנהל/ת מרכז]", students: "[הזן]", mentors: "[הזן]", openTasks: 0, openRisks: 0 },
    { id: "haifa", name: "חיפה", status: "green", manager: "[הזן כאן מנהל/ת מרכז]", students: "[הזן]", mentors: "[הזן]", openTasks: 0, openRisks: 0 },
  ],
  overview: {
    sections: [
      ["מבנה האזור", "[הזן כאן תיאור מבנה האזור, הרשויות, המרכזים והקשרים ביניהם]"],
      ["יעדים שנתיים", "[הזן כאן יעדים שנתיים מרכזיים]"],
      ["נתוני מאקרו", "[הזן כאן נתוני מאקרו: תלמידים, מדריכים, מרכזים, שותפים ותקציבים]"],
      ["KPIs", "[הזן כאן מדדי הצלחה מרכזיים]"],
      ["תהליכים מרכזיים", "[הזן כאן תהליכי עבודה מרכזיים באזור]"],
      ["Stakeholders", "[הזן כאן בעלי עניין אזוריים ומערכות יחסים מרכזיות]"],
    ],
  },
  tables: {
    stakeholders: ["שם", "תפקיד", "ארגון", "טלפון", "מייל", "רמת השפעה", "מערכת יחסים", "הערות"],
    centers: ["שם מרכז", "רשות", "מנהל/ת מרכז", "כתובת", "סטטוס", "מספר חניכים", "מספר מדריכים", "הערות"],
    tasks: ["Task", "Owner", "Deadline", "Priority", "Status", "Notes"],
    risks: ["Risk", "Impact", "Probability", "Owner", "Mitigation Plan", "Status"],
    opportunities: ["Opportunity", "Owner", "Potential", "Next Step", "Status", "Notes"],
    documents: ["שם", "סוג", "רשות", "קישור/מיקום", "בעלים", "עדכון אחרון", "הערות"],
    contacts: ["שם", "תפקיד", "ארגון", "רשות", "טלפון", "מייל", "תגיות", "הערות"],
    lessons: ["נושא", "מה עבד", "מה לא עבד", "טעות/סיכון", "תובנה", "המלצה להמשך"],
  },
  knowledgeBase: [
    ["תהליכי עבודה", "[הזן כאן תהליכי עבודה קבועים]"],
    ["נהלים", "[הזן כאן נהלים וקישורים רלוונטיים]"],
    ["Best Practices", "[הזן כאן פרקטיקות מומלצות]"],
    ["Checklists", "[הזן כאן רשימות בדיקה]"],
    ["Templates", "[הזן כאן תבניות שימושיות]"],
  ],
};
