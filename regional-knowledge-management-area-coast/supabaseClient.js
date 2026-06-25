(function () {
  const config = window.KM_SUPABASE_CONFIG || {};
  const enabled = Boolean(config.url && config.anonKey && window.supabase);
  const supabaseUrl = enabled ? config.url.replace(/\/rest\/v1\/?$/, "") : "";
  const client = enabled ? window.supabase.createClient(supabaseUrl, config.anonKey) : null;

  const tableMap = {
    centers: "centers",
    contacts: "contacts",
    stakeholders: "contacts",
    tasks: "tasks",
    risks: "risks",
    opportunities: "opportunities",
    documents: "documents",
    lessons: "notes",
    activity_log: "activity_log",
  };

  const authorityFieldMap = {
    students: "students_count",
    mentors: "mentors_count",
    manager: "center_manager",
    lastUpdate: "last_update",
    openTasks: "open_tasks_count",
    openRisks: "open_risks_count",
  };

  function isConfigured() {
    return enabled;
  }

  function normalizeAuthority(row) {
    return {
      id: row.id,
      name: row.name,
      status: row.status || "green",
      students: valueOrPlaceholder(row.students_count),
      mentors: valueOrPlaceholder(row.mentors_count),
      manager: row.center_manager || "[הזן כאן מנהל/ת מרכז]",
      lastUpdate: row.last_update || "[הזן]",
      openTasks: valueOrZero(row.open_tasks_count),
      openRisks: valueOrZero(row.open_risks_count),
    };
  }

  function valueOrPlaceholder(value) {
    return value === null || value === undefined || value === "" ? "[הזן]" : String(value);
  }

  function valueOrZero(value) {
    return value === null || value === undefined || value === "" ? 0 : value;
  }

  function rowToCells(row, headers) {
    if (row.payload && Array.isArray(row.payload.cells)) return row.payload.cells;
    return headers.map((header) => row[headerToColumn(header)] || `[הזן כאן ${header}]`);
  }

  function headerToColumn(header) {
    return String(header)
      .toLowerCase()
      .replaceAll(" ", "_")
      .replaceAll("/", "_")
      .replace(/[^\w]/g, "");
  }

  function rowsKey(tableKey, contextKey) {
    return `table:${contextKey}:${tableKey}`;
  }

  async function loadAuthorities(fallbackAuthorities) {
    if (!enabled) return fallbackAuthorities;
    try {
      const { data, error } = await client.from("authorities").select("*").order("name");
      if (error) {
        console.warn("Supabase authorities load failed", error);
        return fallbackAuthorities;
      }
      if (data.length) return data.map(normalizeAuthority);

      const seedRows = fallbackAuthorities.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        students_count: null,
        mentors_count: null,
        center_manager: null,
        last_update: null,
        open_tasks_count: 0,
        open_risks_count: 0,
      }));
      await client.from("authorities").upsert(seedRows);
      return fallbackAuthorities;
    } catch (error) {
      console.warn("Supabase authorities load threw", error);
      return fallbackAuthorities;
    }
  }

  async function saveAuthorityField(authorityId, field, value) {
    localStorage.setItem(`authority:${authorityId}:${field}`, value);
    if (!enabled) return { ok: true, mode: "local" };
    const column = authorityFieldMap[field];
    if (!column) return { ok: false };
    const payload = { [column]: value, updated_at: new Date().toISOString(), updated_by: currentUser() };
    const { error } = await client.from("authorities").update(payload).eq("id", authorityId);
    if (error) console.warn("Supabase authority save failed", error);
    return { ok: !error, error };
  }

  async function loadRows(tableKey, headers, contextKey, authorityId) {
    const local = JSON.parse(localStorage.getItem(rowsKey(tableKey, contextKey)) || "null");
    if (!enabled) return local;
    const dbTable = tableMap[tableKey];
    if (!dbTable) return local;

    let query = client.from(dbTable).select("*").order("sort_order", { ascending: true });
    if (authorityId && ["tasks", "risks", "opportunities", "documents", "contacts", "centers"].includes(dbTable)) {
      query = query.eq("authority_id", authorityId);
    }
    if (tableKey === "lessons") query = query.eq("note_type", "lesson");

    const { data, error } = await query;
    if (error) {
      console.warn(`Supabase ${dbTable} load failed`, error);
      return local;
    }
    if (!data.length) return local;
    const rows = data.map((row) => ({ id: row.id, cells: rowToCells(row, headers) }));
    localStorage.setItem(rowsKey(tableKey, contextKey), JSON.stringify(rows));
    return rows;
  }

  async function saveRows(tableKey, headers, contextKey, rows, authorityId) {
    localStorage.setItem(rowsKey(tableKey, contextKey), JSON.stringify(rows));
    if (!enabled) return { ok: true, mode: "local" };
    const dbTable = tableMap[tableKey];
    if (!dbTable) return { ok: false };

    const records = rows.map((row, index) => {
      const record = {
        id: row.id && !String(row.id).startsWith("local-") ? row.id : crypto.randomUUID(),
        authority_id: authorityId || null,
        title: row.cells[0] || null,
        payload: { headers, cells: row.cells },
        sort_order: index,
        updated_at: new Date().toISOString(),
        updated_by: currentUser(),
      };
      if (dbTable !== "notes") {
        record.status = findCell(headers, row.cells, "Status") || findCell(headers, row.cells, "סטטוס") || null;
      }
      if (dbTable === "notes") {
        record.storage_key = `lesson:${record.id}`;
        record.note_type = "lesson";
        record.content = row.cells.join("\n");
      }
      return record;
    });
    const { data, error } = await client.from(dbTable).upsert(records).select("id");
    if (error) {
      console.warn(`Supabase ${dbTable} save failed`, error);
      return { ok: false, error };
    }
    return { ok: true, ids: data.map((row) => row.id) };
  }

  async function deleteRow(tableKey, rowId) {
    if (!enabled || !rowId || String(rowId).startsWith("local-")) return { ok: true };
    const dbTable = tableMap[tableKey];
    if (!dbTable) return { ok: false };
    const { error } = await client.from(dbTable).delete().eq("id", rowId);
    if (error) console.warn(`Supabase ${dbTable} delete failed`, error);
    return { ok: !error, error };
  }

  function findCell(headers, cells, wanted) {
    const index = headers.findIndex((header) => String(header).toLowerCase() === String(wanted).toLowerCase());
    return index >= 0 ? cells[index] : "";
  }

  async function loadNote(storageKey) {
    const local = localStorage.getItem(storageKey);
    if (!enabled) return local;
    const { data, error } = await client
      .from("notes")
      .select("content")
      .eq("storage_key", storageKey)
      .maybeSingle();
    if (error) {
      console.warn("Supabase note load failed", error);
      return local;
    }
    if (data && data.content !== null) {
      localStorage.setItem(storageKey, data.content);
      return data.content;
    }
    return local;
  }

  async function saveNote(storageKey, content, meta = {}) {
    localStorage.setItem(storageKey, content);
    if (!enabled) return { ok: true, mode: "local" };
    const { error } = await client.from("notes").upsert({
      storage_key: storageKey,
      authority_id: meta.authorityId || null,
      note_type: meta.noteType || "page_note",
      title: meta.title || storageKey,
      content,
      updated_by: currentUser(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "storage_key" });
    if (error) console.warn("Supabase note save failed", error);
    return { ok: !error, error };
  }

  async function loadActivity(limit = 50) {
    const local = JSON.parse(localStorage.getItem("km:activityLog") || "[]");
    if (!enabled) return local.slice(0, limit);
    const { data, error } = await client
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("Supabase activity log load failed", error);
      return local.slice(0, limit);
    }
    localStorage.setItem("km:activityLog", JSON.stringify(data));
    return data;
  }

  async function logActivity(action, entityType, entityId, summary) {
    const record = {
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      summary,
      updated_by: currentUser(),
      created_at: new Date().toISOString(),
    };
    const local = JSON.parse(localStorage.getItem("km:activityLog") || "[]");
    local.unshift({ id: `local-${crypto.randomUUID()}`, ...record });
    localStorage.setItem("km:activityLog", JSON.stringify(local.slice(0, 100)));
    if (!enabled) return { ok: true, mode: "local" };
    const { error } = await client.from("activity_log").insert(record);
    if (error) console.warn("Supabase activity log save failed", error);
    return { ok: !error, error };
  }

  async function saveAttachment(fileRecord) {
    const local = JSON.parse(localStorage.getItem("km:attachments") || "[]");
    local.unshift(fileRecord);
    localStorage.setItem("km:attachments", JSON.stringify(local.slice(0, 100)));
    if (!enabled) return { ok: true, mode: "local" };
    const { error } = await client.from("documents").insert({
      authority_id: fileRecord.authority_id || null,
      title: fileRecord.name,
      status: "attached",
      payload: fileRecord,
      updated_by: currentUser(),
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("Supabase attachment save failed", error);
    return { ok: !error, error };
  }

  function currentUser() {
    return localStorage.getItem("km:currentUser") || "משתמש/ת";
  }

  window.KM_DB = {
    isConfigured,
    loadAuthorities,
    saveAuthorityField,
    loadRows,
    saveRows,
    deleteRow,
    loadNote,
    saveNote,
    loadActivity,
    logActivity,
    saveAttachment,
  };
})();
