(() => {
  "use strict";
  let active = false;
  let conversationId = null;
  const widgets = new Set();
  const expectsBackend = ["localhost","127.0.0.1","[::1]"].includes(location.hostname);
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  // Delegation also covers fields created after a multi-turn reply or page switch.
  globalThis.document?.addEventListener?.("click", event => {
    const input = event.target;
    if (input?.tagName !== "INPUT" || !["date","time","datetime-local"].includes(input.type) ||
        input.disabled || input.readOnly || typeof input.showPicker !== "function") return;
    try {
      input.showPicker();
      event.preventDefault();
    } catch {
      // Keep native interaction available when the browser disallows showPicker.
    }
  });
  const ready = /^https?:$/.test(location.protocol) ? fetch("/api/health", {
    signal: AbortSignal.timeout(3000), credentials: "same-origin"
  }).then(response => response.ok ? response.json() : null).then(result => {
    active = result?.backend === true || expectsBackend;
    return active;
  }).catch(() => { active = expectsBackend; return active; }) : Promise.resolve(false);

  async function request(url, payload, signal) {
    const response = await fetch(url, {
      method: payload === undefined ? "GET" : "POST", credentials: "same-origin", signal,
      headers: payload === undefined ? {} : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.error || "请求未完成，请稍后重试。");
      error.status = response.status; throw error;
    }
    return response;
  }
  async function json(url, payload, signal) {
    const result = await (await request(url, payload, signal)).json();
    notifyTask(result);
    return result;
  }
  const taskReference = result => result.view?.receipt?.id || result.handoff_id;
  function notifyTask(result) {
    if (taskReference(result)) window.PortalTasks?.sync();
  }
  function recovery(meta) {
    return {
      backend: true, status: "result_unknown", text: "请求可能已提交，请先核实结果，避免重复办理。",
      actions: [{ ...meta, action: "status", label: "核实提交结果" }]
    };
  }
  function leaveQuery(type = "全部") {
    return {
      backend: true, intent: "leave_balance", status: "needs_input", text: "选择需要查询的假期类型。",
      view: { type: "leave-query", selected: type, action: { type: "backend-leave-query", label: "查询假期余额" } }
    };
  }
  async function run({ question, action, signal, onEvent = () => {} }) {
    if (action?.type === "backend-start") {
      if (action.intent === "leave_balance") return leaveQuery(action.leave_type);
      onEvent({type:"step",id:"prepare-form",state:"running",label:"准备办理表单",message:"正在准备填写条件…"});
      const result = await json("/api/workflows/start",{intent:action.intent,entry:"self_service",slots:{}},signal);
      onEvent({type:"step",id:"prepare-form",state:"done"});
      return result;
    }
    if (action?.type === "backend-leave-query") {
      onEvent({type:"step",id:"leave-query",state:"running",label:"查询假期余额",message:"正在查询假期余额和审批占用…"});
      const result = await json("/api/leave-balances",{type:action.leave_type || "全部"},signal);
      onEvent({type:"step",id:"leave-query",state:"done"});
      return {
        backend:true,intent:"leave_balance",status:"done",text:"查询完成，你的假期余额如下：",
        view:{type:"leave-balances",items:result.balances,edit:{type:"backend-start",intent:"leave_balance",leave_type:result.type,label:"修改查询条件"}}
      };
    }
    if (action?.type === "backend-action") {
      onEvent({ type: "step", id: "business-action", state: "running", label: action.action === "confirm" ? "提交并核验业务结果" : "核对业务信息", message: action.action === "confirm" ? "正在提交，请稍等。" : "正在处理，请稍等。" });
      try {
        const result = await json("/api/workflows/action", action, signal);
        onEvent({ type: "step", id: "business-action", state: "done" });
        return result;
      } catch (error) {
        if (action.action === "confirm" && !signal?.aborted && (!error.status || error.status >= 500)) return recovery(action);
        throw error;
      }
    }
    const response = await request("/api/chat", { question, conversation_id: conversationId }, signal);
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = "", result;
    function consume(line) {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === "conversation") conversationId = event.id;
      else if (event.type === "complete") { result = event.result; notifyTask(result); }
      else if (event.type === "failure") throw new Error(event.message);
      else onEvent(event);
    }
    try {
      for (;;) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop();
        lines.forEach(consume);
        if (chunk.done) break;
      }
      if (buffer) consume(buffer);
      if (!result) throw new Error("连接已中断，请重新发送问题。");
      return result;
    } finally { reader.cancel().catch(() => {}); }
  }
  function deactivate() {
    for (const widget of widgets) {
      widget.querySelectorAll("button,input,select,textarea").forEach(control => { control.disabled = true; });
    }
    widgets.clear();
    window.MeetingBookingUI?.deactivate();
  }
  function render(container, result, { onAction }) {
    const root = node("section", "meeting-widget backend-widget");
    function send(meta) { deactivate(); onAction(meta, meta.label); }
    function button(meta, primary = false) {
      const control = node("button", primary ? "meeting-primary" : "meeting-secondary", meta.label);
      control.type = "button"; control.onclick = () => send(meta); return control;
    }
    const view = result.view;
    if (view?.type === "rooms") window.MeetingBookingUI.render(root, result, { onAction: send, portal: false });
    if (view?.type === "leave-query") {
      root.append(node("h3","","假期查询"));
      const form = node("form","meeting-input-form");
      const field = node("label","meeting-input-field");
      field.append(node("span","","假期类型"));
      const select = node("select"); select.name = "leave_type";
      for (const type of ["全部","年假","调休"]) {
        const option = node("option","",type); option.value = type; select.append(option);
      }
      select.value = view.selected;
      field.append(select); form.append(field);
      const submit = node("button","meeting-primary",view.action.label); submit.type = "submit"; form.append(submit);
      form.onsubmit = event => {
        event.preventDefault();
        send({...view.action,leave_type:select.value});
      };
      root.append(form);
    }
    if (view?.type === "leave-balances") {
      if (!view.items.length) root.append(node("p","","尚未配置对应假期账户，请联系 HR 核实。"));
      else {
        const scroll = node("div","backend-balance-scroll");
        const table = node("table","backend-balance-table");
        table.setAttribute("aria-label","假期余额");
        const head = node("thead"),header = node("tr");
        for (const label of ["假期类型","可用","已使用","审批中","总额度"]) header.append(node("th","",label));
        head.append(header); table.append(head);
        const body = node("tbody");
        for (const item of view.items) {
          const row = node("tr");
          row.append(node("td","",item.type));
          for (const key of ["available","used","pending","total"]) row.append(node("td","",item[key] + " 天"));
          body.append(row);
        }
        table.append(body); scroll.append(table); root.append(scroll);
      }
      if (view.edit) root.append(button(view.edit));
    }
    if (view?.type === "assets") {
      root.append(node("h3", "", "我的设备"));
      const list = node("div", "meeting-room-list");
      list.setAttribute("role","list");
      for (const asset of view.assets) {
        const row = node("div", "meeting-room-card");
        row.setAttribute("role","listitem");
        const info = node("div", "meeting-room-info");
        info.append(node("h4", "", asset.name), node("p", "backend-asset-meta", [asset.model,asset.location].filter(Boolean).join(" · ")));
        const select = button(asset.action);
        select.className = "meeting-room-select";
        select.textContent = "选择";
        select.setAttribute("aria-label",asset.action.label);
        row.append(info,select); list.append(row);
      }
      root.append(list);
      const footer = node("div","meeting-widget-footer");
      const unlisted = button(view.unlisted);
      unlisted.className = "meeting-text-button";
      footer.append(unlisted); root.append(footer);
    }
    if (view?.type === "backend-input") {
      root.append(node("h3", "", view.title || "填写办理信息"));
      if (view.values.asset_display || view.values.asset_unlisted) root.append(node("p","backend-asset-meta","原设备：" + (view.values.asset_display || "待资产管理员核实")));
      const form = node("form", "meeting-input-form");
      for (const field of view.fields) {
        const label = node(field.type === "checkboxes" ? "fieldset" : "label", "meeting-input-field");
        label.append(node(field.type === "checkboxes" ? "legend" : "span", "", field.label + (field.required ? " *" : "")));
        if (field.type === "checkboxes") {
          const set = node("div", "backend-checkboxes");
          for (const option of field.options) {
            const optionLabel = node("label"), checkbox = node("input");
            checkbox.type = "checkbox"; checkbox.name = field.key; checkbox.value = option;
            checkbox.checked = (view.values[field.key] || []).includes(option);
            optionLabel.append(checkbox, node("span", "", option)); set.append(optionLabel);
          }
          label.append(set);
        } else {
          const control = node(field.options ? "select" : field.type === "textarea" ? "textarea" : "input");
          if (field.options) for (const value of ["", ...field.options]) {
            const option = node("option", "", value || "请选择"); option.value = value; control.append(option);
          }
          else if (field.type !== "textarea") control.type = field.type;
          control.name = field.key; control.required = Boolean(field.required); control.value = view.values[field.key] ?? "";
          for (const attr of ["min", "max", "step", "placeholder"]) if (field[attr] !== undefined) control.setAttribute(attr, field[attr]);
          label.append(control);
        }
        if (view.errors[field.key]) label.append(node("small", "work-error", view.errors[field.key]));
        form.append(label);
      }
      const submit = node("button", "meeting-primary", view.action.label);
      submit.type = "submit";
      const buttons = node("div","meeting-buttons backend-form-actions");
      buttons.append(submit);
      if (view.cancel) buttons.append(button(view.cancel));
      if (view.choose_asset) buttons.append(button(view.choose_asset));
      form.append(buttons);
      function conditions() {
        const values = Object.fromEntries(new FormData(form));
        for (const field of view.fields) {
          const control = form.querySelector('[name="' + field.key + '"]');
          if (!control) continue;
          const wrapper = control.closest(".meeting-input-field");
          const visible = Object.entries(field.when || {}).every(([key, allowed]) => allowed.includes(values[key]));
          wrapper.hidden = !visible;
          wrapper.querySelectorAll("input,select,textarea").forEach(input => { input.disabled = !visible; });
        }
      }
      form.onchange = conditions;
      conditions();
      form.onsubmit = event => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form));
        for (const field of view.fields) {
          if (field.type === "checkboxes") values[field.key] = new FormData(form).getAll(field.key);
        }
        send({ ...view.action, values });
      };
      root.append(form);
    }
    if (view?.type === "backend-summary") {
      root.append(node("h3", "", "核对办理信息"));
      const list = node("dl", "meeting-summary-fields");
      view.fields.forEach(field => { if (field.value !== undefined && field.value !== "") list.append(node("dt", "", field.label), node("dd", "", Array.isArray(field.value) ? field.value.join("、") : field.value)); });
      const buttons = node("div", "meeting-buttons");
      buttons.append(button(view.edit), button(view.cancel), button(view.confirm, true));
      if (view.choose_asset) buttons.prepend(button(view.choose_asset));
      root.append(list, buttons);
    }
    if (view?.type === "backend-receipt") {
      root.append(node("h3", "", "业务回执"));
      const list = node("dl", "meeting-summary-fields");
      for (const [title, value] of [["编号", view.receipt.id], ["状态", view.receipt.status === "confirmed" ? "已预订" : view.receipt.status === "pending_asset_verification" ? "待核实原设备" : "待审批"], ["提交时间", view.receipt.created]]) {
        list.append(node("dt", "", title), node("dd", "", value));
      }
      root.append(list);
    }
    if (result.actions?.length) {
      const buttons = node("div", "meeting-buttons");
      result.actions.forEach(meta => buttons.append(button(meta)));
      root.append(buttons);
    }
    if (root.children.length) {
      widgets.add(root);
      container.append(root);
    }
    if (window.PortalTasks && taskReference(result)) {
      const link = node("button", "task-record-link", "已同步到今日任务 · 查看任务 ›");
      link.type = "button";
      link.onclick = () => window.PortalTasks.open(taskReference(result));
      container.append(link);
    }
    if (result.sources?.length) {
      const references = node("section", "answer-sources");
      references.setAttribute("aria-label", "参考来源");
      references.append(node("p", "answer-sources-label", "参考来源"));
      const list = node("ol", "answer-source-list");
      for (const source of result.sources) {
        const item = node("li");
        const link = node("a", "answer-source-link", source.title);
        const url = new URL("./portal.html", document.baseURI);
        url.hash = new URLSearchParams({ view: "document", id: source.id, reader: "1" }).toString();
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", source.title + "，在新标签页打开原文");
        item.append(link);
        if (source.version) item.append(node("span", "answer-source-version", "v" + source.version));
        list.append(item);
      }
      references.append(list);
      container.append(references);
    }
  }
  window.PortalBackend = {
    ready, get active() { return active; }, json, run, render, deactivate, recovery,
    reset: () => { conversationId = null; }
  };
})();
