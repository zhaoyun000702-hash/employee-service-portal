(() => {
  "use strict";
  const panel = document.getElementById("today-task-panel");
  const toggle = document.getElementById("today-task-toggle");
  if (!panel || !toggle) return;
  const list = document.getElementById("today-task-list");
  const title = document.getElementById("today-task-title");
  const badge = document.getElementById("today-task-count");
  const controls = document.getElementById("today-task-controls");
  const dateInput = document.getElementById("today-task-date");
  const allDates = document.getElementById("all-task-dates");
  const refresh = document.getElementById("refresh-tasks");
  const back = document.getElementById("back-to-tasks");
  const filters = Array.from(panel.querySelectorAll("[data-task-filter]"));
  const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  let date = today(), lastToday = date, filter = "all", data, detailId, generation = 0, returnFocus;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const time = (value, full = false) => new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", ...(full && { year: "numeric", month: "2-digit", day: "2-digit" }),
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date(value));
  function position() {
    if (panel.hidden) return;
    const bar = document.querySelector(".assistant-topbar").getBoundingClientRect();
    const right = Math.max(12, window.innerWidth - bar.right + (window.parent !== window ? 14 : 0));
    const top = Math.max(8, bar.bottom + 8);
    panel.style.top = top + "px";
    panel.style.right = right + "px";
    panel.style.setProperty("--task-panel-top", top + "px");
    const trigger = toggle.getBoundingClientRect();
    panel.style.setProperty("--task-arrow-right", Math.max(22, Math.min(panel.getBoundingClientRect().width - 22, window.innerWidth - right - (trigger.left + trigger.width / 2))) + "px");
  }
  function status(item) {
    return node("span", "today-task-status " + item.tone, item.label);
  }
  function paintControls() {
    title.textContent = detailId ? "任务详情" : date === null ? "全部任务" : date === today() ? "今日任务" : "当日任务";
    controls.hidden = Boolean(detailId);
    back.hidden = !detailId;
    dateInput.value = date || "";
    allDates.textContent = date === null ? "返回今日 ›" : "查看全部 ›";
    for (const button of filters) {
      button.setAttribute("aria-pressed", String(button.dataset.taskFilter === filter));
      button.querySelector("span").textContent = data ? data.counts[button.dataset.taskFilter] : "—";
    }
  }
  function paintList() {
    paintControls();
    list.replaceChildren();
    if (!data) return;
    const items = data.items.filter(item => filter === "all" || item.group === filter);
    if (!items.length) {
      const names = { all: "任务", pending: "待处理任务", completed: "已完成任务" };
      list.append(node("p", "today-task-empty", "暂无" + names[filter]), node("p", "today-task-hint", "确认提交后的办理记录会显示在这里。"));
      return;
    }
    for (const item of items) {
      const row = node("article", "today-task-item");
      row.dataset.taskId = item.id;
      const heading = node("div", "today-task-item-heading");
      heading.append(node("h3", "", item.title), status(item));
      const footer = node("div", "today-task-item-footer");
      const stamp = node("time", "", time(item.created, date === null));
      stamp.dateTime = item.created;
      const button = node("button", "today-task-link", item.intent === "equipment" || item.intent === "leave" ? "查看申请 ›" : "查看详情 ›");
      button.type = "button";
      button.setAttribute("aria-label", "查看" + item.title + "详情，" + item.subtitle);
      button.onclick = () => { detailId = item.id; load(); };
      footer.append(stamp, button);
      row.append(heading, node("p", "today-task-subtitle", item.subtitle), node("p", "today-task-result", item.result), footer);
      list.append(row);
    }
  }
  function paintDetail(item) {
    paintControls();
    const heading = node("div", "today-task-item-heading");
    heading.append(node("h3", "", item.title), status(item));
    const fields = node("dl", "today-task-fields");
    const pairs = [
      { label: item.intent === "meeting" ? "预订编号" : item.intent === "handoff" ? "服务单号" : "申请编号", value: item.id },
      { label: "办理时间", value: time(item.created, true) },
      ...(item.fields || [])
    ];
    for (const field of pairs) {
      const value = Array.isArray(field.value) ? field.value.join("、") || "无" : String(field.value ?? "");
      fields.append(node("dt", "", field.label), node("dd", "", value));
    }
    list.replaceChildren(heading, node("p", "today-task-detail-result", item.result), fields);
    list.scrollTop = 0;
  }
  async function load(quiet = false) {
    const currentToday = today();
    if (date === lastToday) date = currentToday;
    lastToday = currentToday;
    const version = ++generation;
    refresh.disabled = true;
    list.setAttribute("aria-busy", "true");
    if (!quiet) {
      paintControls();
      list.replaceChildren(node("p", "today-task-empty", detailId ? "正在读取办理结果…" : "正在读取任务…"));
    }
    try {
      const result = await window.PortalTaskStore.list({ date, all: date === null });
      if (version !== generation) return;
      data = result;
      badge.textContent = result.today_total > 99 ? "99+" : String(result.today_total);
      badge.hidden = !result.today_total;
      toggle.setAttribute("aria-label", "查看今日任务，共" + result.today_total + "项");
      if (detailId) {
        const detail = { task: window.PortalTaskStore.detail(detailId) };
        if (!detail.task) throw new Error("未找到这项任务，请返回任务列表。");
        if (version !== generation) return;
        paintDetail(detail.task);
      } else paintList();
    } catch (error) {
      if (version !== generation) return;
      data = undefined;
      badge.hidden = true;
      paintControls();
      list.replaceChildren(node("p", "today-task-empty", error.message || "暂时无法读取任务，请点击刷新重试。"));
    } finally {
      if (version === generation) {
        refresh.disabled = false;
        list.setAttribute("aria-busy", "false");
      }
    }
  }
  function open(id) {
    if (panel.hidden) returnFocus = document.activeElement;
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    detailId = id || undefined;
    position();
    panel.focus({ preventScroll: true });
    return load();
  }
  function close(restoreFocus = true) {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) (returnFocus?.isConnected ? returnFocus : toggle).focus({ preventScroll: true });
  }
  toggle.addEventListener("click", () => panel.hidden ? open() : close());
  document.getElementById("close-tasks").addEventListener("click", () => close());
  refresh.addEventListener("click", () => load());
  back.addEventListener("click", () => { detailId = undefined; load(); });
  dateInput.addEventListener("change", () => { date = dateInput.value || null; detailId = undefined; load(); });
  allDates.addEventListener("click", () => { date = date === null ? today() : null; detailId = undefined; load(); });
  for (const button of filters) button.addEventListener("click", () => { filter = button.dataset.taskFilter; paintList(); list.scrollTop = 0; });
  document.addEventListener("pointerdown", event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || event.isComposing || panel.hidden || document.getElementById("assistant-sheet")?.open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }, true);
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, true);
  window.addEventListener("focus", () => load(true));
  window.addEventListener("employee-tasks:updated", () => load(true));
  window.addEventListener("storage", event => { if (event.key === window.PortalTaskStore.key || event.key === null) load(true); });
  const poll = setInterval(() => { if (!panel.hidden && !document.hidden) load(true); }, 30000);
  window.addEventListener("pagehide", () => { clearInterval(poll); });
  window.PortalTasks = { open, close, sync: () => load(true), get isOpen() { return !panel.hidden; } };
  load(true);
})();
