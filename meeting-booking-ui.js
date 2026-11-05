(() => {
  "use strict";
  const activeWidgets = new Set();
  function node(tag,className,text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
  function deactivate() { for (const widget of activeWidgets) { widget.controls.forEach(control => { control.disabled = true; }); widget.root.dataset.inactive = "true"; } activeWidgets.clear(); }
  function render(container,result,{ onAction }) {
    const view = result.view;
    const genericActions = result.actions || [];
    if (!view && !genericActions.length) return;
    const root = node("section","meeting-widget"); root.setAttribute("aria-label","会议室预订");
    const widget = { root,controls: [] }; activeWidgets.add(widget);
    function send(meta,message) { if (root.dataset.inactive === "true") return; widget.controls.forEach(control => { control.disabled = true; }); root.dataset.inactive = "true"; onAction(meta,message || meta.label); }
    function button(meta,className = "meeting-secondary",label = meta.label) { const el = node("button",className,label); el.type = "button"; widget.controls.push(el); el.addEventListener("click",() => { if (!el.disabled) send(meta,meta.message || label); }); return el; }
    function heading(title) { const row = node("header","meeting-widget-heading"); row.append(node("h3","",title)); root.append(row); }
    function fields(values) {
      const list = node("dl","meeting-summary-fields");
      const pairs = [["会议主题",values.meeting_title],["会议室",values.room_name],["办公地点",[values.office_site,values.location].filter(Boolean).join(" · ")],["使用时间",values.date ? values.date + " " + values.start + "–" + values.end : values.start_time?.replace("T"," ").slice(0,16) + " 至 " + values.end_time?.slice(11,16)],["参会人数",values.capacity + " 人"],["设备要求",values.equipment?.join("、") || "无特殊要求"]];
      pairs.forEach(([key,value]) => { list.append(node("dt","",key),node("dd","",value || "—")); }); root.append(list);
    }
    if (view?.type === "rooms") {
      heading("可选会议室（" + view.rooms.length + "）");
      const cards = node("div","meeting-room-list");
      view.rooms.forEach(room => {
        const card = node("article","meeting-room-card");
        const info = node("div","meeting-room-info");
        const conditions = node("p","meeting-room-conditions",[room.office_site,room.location,"可容纳 " + room.capacity + " 人",...room.equipment].filter(Boolean).join(" · "));
        conditions.title = conditions.textContent; conditions.tabIndex = 0;
        info.append(node("h4","",room.name),conditions);
        card.append(info,button({ ...room.action,message: "选择 " + room.name + "。" },"meeting-room-select","选择")); cards.append(card);
      }); root.append(cards);
      const footer = node("footer","meeting-widget-footer"); footer.append(button(view.edit,"meeting-text-button","调整条件")); root.append(footer);
    } else if (view?.type === "summary") {
      heading("确认预订信息"); fields(view.values);
      root.append(node("p","meeting-widget-note","请核对以上信息，确认后提交。"));
      const actions = node("div","meeting-buttons"); actions.append(button(view.confirm,"meeting-primary"),button(view.edit),button(view.reselect,"meeting-text-button")); root.append(actions);
    } else if (view?.type === "receipt") {
      heading("预订成功");
      const status = node("div","meeting-receipt-id"); status.append(node("span","","预订编号"),node("strong","",view.receipt.booking_id),node("span","meeting-receipt-state","已确认")); root.append(status);
      fields(view.receipt);
    } else if (view?.type === "input") {
      heading(result.status === "editing" ? "修改预订信息" : "补充预订信息");
      if (view.selected_room) root.append(node("p","meeting-selected-note","已选择：" + view.selected_room.name + " · " + view.selected_room.location));
      const form = node("form","meeting-input-form"); const controls = {};
      const config = { date: ["会议日期","date"],start: ["开始时间","time"],end: ["结束时间","time"],capacity: ["参会人数","number"],office_site: ["办公地点","select"],title: ["会议主题","text"] };
      view.fields.forEach(field => {
        if (field === "equipment") {
          const set = node("fieldset","meeting-equipment-input"); set.append(node("legend","","设备要求（选填）")); controls.equipment = [];
          ["投影","视频会议","白板"].forEach(value => { const label = node("label"); const checkbox = node("input"); checkbox.type = "checkbox"; checkbox.value = value; checkbox.checked = (view.values.equipment || []).includes(value); label.append(checkbox,node("span","",value)); set.append(label); controls.equipment.push(checkbox); widget.controls.push(checkbox); }); form.append(set); return;
        }
        const [title,type] = config[field]; const label = node("label","meeting-input-field"); label.append(node("span","",title)); const control = node(type === "select" ? "select" : "input");
        if (type === "select") ["",...view.office_options].forEach(value => { const option = node("option","",value || "请选择办公地点"); option.value = value; control.append(option); }); else control.type = type;
        control.name = field; control.required = true; control.value = view.values[field] ?? "";
        if (field === "capacity") { control.min = "1"; control.max = "200"; control.step = "1"; }
        if (field === "title") { control.maxLength = 100; control.placeholder = "例如：项目沟通会"; }
        controls[field] = control; widget.controls.push(control); label.append(control); form.append(label);
      });
      const submit = node("button","meeting-primary",result.status === "editing" ? "更新预订信息" : "继续"); submit.type = "submit"; widget.controls.push(submit); form.append(submit);
      form.addEventListener("submit",event => { event.preventDefault(); if (root.dataset.inactive === "true" || !form.reportValidity()) return; const values = {}; Object.entries(controls).forEach(([field,control]) => { values[field] = field === "equipment" ? control.filter(item => item.checked).map(item => item.value) : field === "capacity" ? Number(control.value) : control.value.trim(); }); send({ ...view.action,values },result.status === "editing" ? "更新会议室预订信息。" : "补充会议室预订信息。" ); });
      root.append(form);
    }
    if (genericActions.length) { const actions = node("div","meeting-buttons"); genericActions.forEach(meta => actions.append(button(meta,meta.type === "meeting-check-status" ? "meeting-primary" : "meeting-secondary"))); root.append(actions); }
    container.append(root);
  }
  window.MeetingBookingUI = Object.freeze({ render,deactivate });
})();
