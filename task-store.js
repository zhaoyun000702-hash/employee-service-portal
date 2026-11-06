(() => {
  "use strict";
  const key = "employee-service-portal.tasks.v1";
  const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
  const day = value => dateFormat.format(new Date(value));
  const copy = value => JSON.parse(JSON.stringify(value));
  let memory = [], volatile = false;
  function valid(item) {
    return item && typeof item.id === "string" && typeof item.title === "string" &&
      Number.isFinite(Date.parse(item.created)) && ["pending", "completed"].includes(item.group) &&
      ["pending", "success", "danger", "muted"].includes(item.tone) && Array.isArray(item.fields);
  }
  function read() {
    if (volatile) return memory;
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || "null");
      memory = saved?.version === 1 && Array.isArray(saved.items) ? saved.items.filter(valid) : [];
    } catch { /* Keep the current session usable if storage is unavailable. */ }
    return memory;
  }
  function save(items) {
    memory = items;
    try {
      window.localStorage.setItem(key, JSON.stringify({ version: 1, items }));
      volatile = false;
    } catch { volatile = true; }
    window.dispatchEvent(new CustomEvent("employee-tasks:updated"));
  }
  function list({ date = day(Date.now()), all = false } = {}) {
    const stored = read();
    const items = stored.filter(item => all || day(item.created) === date).sort((a,b) => Date.parse(b.created) - Date.parse(a.created));
    return copy({ items, counts: { all: items.length, pending: items.filter(item => item.group === "pending").length, completed: items.filter(item => item.group === "completed").length }, today_total: stored.filter(item => day(item.created) === day(Date.now())).length });
  }
  function detail(id) { const item = read().find(item => item.id === id); return item ? copy(item) : null; }
  function recordMeeting(receipt) {
    if (receipt?.status !== "confirmed" || typeof receipt.booking_id !== "string" || !receipt.booking_id || typeof receipt.room_name !== "string" || !receipt.room_name || typeof receipt.start_time !== "string" || typeof receipt.end_time !== "string" || !receipt.start_time.includes("T") || !Number.isFinite(Date.parse(receipt.start_time)) || !(Date.parse(receipt.end_time) > Date.parse(receipt.start_time)) || !Number.isInteger(receipt.capacity) || receipt.capacity < 1 || receipt.capacity > 200) return null;
    const items = read();
    const existing = items.find(item => item.id === receipt.booking_id);
    if (existing) return copy(existing);
    const item = {
      id: receipt.booking_id, intent: "meeting", status: "confirmed", title: "会议室预订",
      created: new Date().toISOString(), group: "completed", tone: "success", label: "已完成",
      subtitle: receipt.room_name + " · " + receipt.start_time.slice(0,10) + " " + receipt.start_time.slice(11,16) + "–" + receipt.end_time.slice(11,16),
      result: "预订成功 · " + receipt.capacity + "人",
      fields: [
        { label: "会议主题", value: receipt.meeting_title }, { label: "会议室", value: receipt.room_name },
        { label: "办公园区", value: receipt.office_site }, { label: "位置", value: receipt.location },
        { label: "开始时间", value: receipt.start_time.replace("T"," ").slice(0,16) },
        { label: "结束时间", value: receipt.end_time.replace("T"," ").slice(0,16) },
        { label: "参会人数", value: receipt.capacity }, { label: "设备要求", value: receipt.equipment || [] }
      ]
    };
    save([item, ...items]);
    return copy(item);
  }
  window.PortalTaskStore = Object.freeze({ key, list, detail, recordMeeting });
})();
