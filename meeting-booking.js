/* Browser-only booking demo. Identity, schemas and business writes are adapters;
   production must enforce authentication, permissions and tokens on the server. */
(() => {
  "use strict";
  const copy = value => JSON.parse(JSON.stringify(value));
  const officeSites = ["总部园区","研发园区"];
  const equipmentOptions = ["投影","视频会议","白板"];
  const schemas = {
    query_available_rooms: { required: ["employee_id","start_time","end_time","office_site","capacity"], properties: { employee_id: "string", start_time: "datetime", end_time: "datetime", office_site: officeSites, capacity: "positive_integer", equipment: equipmentOptions } },
    create_meeting_booking: { required: ["employee_id","room_id","start_time","end_time","office_site","capacity","meeting_title","confirmation_token","idempotency_key"], properties: { employee_id: "string", room_id: "string", start_time: "datetime", end_time: "datetime", office_site: officeSites, capacity: "positive_integer", equipment: equipmentOptions, meeting_title: "string", confirmation_token: "string", idempotency_key: "string" } }
  };
  const rooms = [
    { id: "A301", name: "A301 会议室", office_site: "总部园区", location: "A栋3层", capacity: 10, equipment: ["投影","白板"] },
    { id: "A502", name: "A502 会议室", office_site: "总部园区", location: "A栋5层", capacity: 12, equipment: ["视频会议","投影"] },
    { id: "B201", name: "B201 会议室", office_site: "总部园区", location: "B栋2层", capacity: 6, equipment: ["投影","白板"] },
    { id: "C101", name: "C101 会议室", office_site: "研发园区", location: "C栋1层", capacity: 8, equipment: ["视频会议","投影"] }
  ];
  const receipts = new Map(), issuedConfirmations = new Map();
  const previousSequence = (window.PortalTaskStore?.list({ all: true }).items || []).reduce((max,item) => Math.max(max,Number(item.id.split("-").at(-1)) || 0),0);
  let authenticated = true, sequence = 0, bookingSequence = previousSequence, activeRun = 0;
  const identity = () => authenticated ? { employee_id: "DEMO-EMP-001", office_sites: [...officeSites] } : null;
  const newTask = () => ({ id: "meeting-task-" + ++sequence, version: 0, status: "idle", slots: { equipment: [] }, employee_id: null, evidence: null, selected: null, confirmation: null, submission: null, receipt: null, lastQuestion: "" });
  let task = newTask();
  function invalidateConfirmation() { if (task.confirmation) issuedConfirmations.delete(task.confirmation.token); task.confirmation = null; }
  function resetTask() { activeRun++; invalidateConfirmation(); task = newTask(); }
  function localDate(now) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en",{ timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map(part => [part.type,part.value]));
    return parts.year + "-" + parts.month + "-" + parts.day;
  }
  function dateValid(value) { const parsed = new Date(value + "T00:00:00Z"); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value; }
  function timeValue(hour,minute = "00",afternoon = false) { let h = +hour; if (afternoon && h < 12) h += 12; return h >= 0 && h < 24 && +minute < 60 ? String(h).padStart(2,"0") + ":" + minute.padStart(2,"0") : ""; }
  function extractSlots({ query, context = {}, task_memory = {}, now = new Date() }) {
    const base = { ...context,...task_memory }, partial = {};
    const explicit = query.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/);
    if (explicit) { const date = explicit[1] + "-" + explicit[2].padStart(2,"0") + "-" + explicit[3].padStart(2,"0"); partial.date = dateValid(date) ? date : ""; }
    else if (/今天|明天|后天/.test(query)) {
      if ((query.match(/今天|明天|后天/g) || []).length > 1) partial.date = "";
      else { const day = new Date(localDate(now) + "T00:00:00Z"); day.setUTCDate(day.getUTCDate() + (/后天/.test(query) ? 2 : /明天/.test(query) ? 1 : 0)); partial.date = day.toISOString().slice(0,10); }
    }
    const time = query.match(/(\d{1,2})[:：](\d{2})\s*(?:到|至|[-–—~～])\s*(\d{1,2})[:：](\d{2})/);
    const chineseTime = query.match(/(上午|下午|晚上)?\s*(\d{1,2})点(?:([0-5]?\d)分?)?\s*(?:到|至|[-–—~～])\s*(上午|下午|晚上)?\s*(\d{1,2})点(?:([0-5]?\d)分?)?/);
    if (time) { partial.start = timeValue(time[1],time[2]); partial.end = timeValue(time[3],time[4]); }
    else if (chineseTime) { partial.start = timeValue(chineseTime[2],chineseTime[3] || "00",/下午|晚上/.test(chineseTime[1] || "")); partial.end = timeValue(chineseTime[5],chineseTime[6] || "00",/下午|晚上/.test(chineseTime[4] || chineseTime[1] || "")); }
    const capacity = query.match(/(-?\d+)\s*(?:个)?(?:人|位)/); if (capacity) partial.capacity = Number(capacity[1]);
    const site = officeSites.filter(item => query.includes(item));
    if (site.length) partial.office_site = site.length === 1 ? site[0] : "";
    else if (/办公地点|地点|园区/.test(query) && !/会议室预订/.test(query)) { const value = query.match(/(?:办公地点|地点)(?:是|为|改为|[:：])\s*([^，,。；;]+)/); if (value) partial.office_site = value[1].trim(); }
    if (/无(?:特殊)?(?:设备)?要求|不需要(?:任何)?设备|无需设备/.test(query)) partial.equipment = [];
    else if (equipmentOptions.some(item => query.includes(item))) {
      const requested = equipmentOptions.filter(item => query.includes(item) && !new RegExp("(?:不需要|无需|取消|去掉)" + item).test(query));
      partial.equipment = /再加|增加|还需要/.test(query) ? [...new Set([...(base.equipment || []),...requested])] : /取消|去掉/.test(query) ? (base.equipment || []).filter(item => !query.includes(item)) : requested;
    }
    const title = query.match(/(?:会议)?主题(?:是|为|改为|改成|[:：])\s*([^，,。；;\n]+)/); if (title) partial.title = title[1].trim();
    return partial;
  }
  function validateSlots(slots,phase,now) {
    const fields = [];
    if (!slots.date || !dateValid(slots.date)) fields.push("date");
    if (!/^\d{2}:\d{2}$/.test(slots.start || "") || +slots.start.slice(0,2) > 23 || +slots.start.slice(3) > 59) fields.push("start");
    if (!/^\d{2}:\d{2}$/.test(slots.end || "") || +slots.end.slice(0,2) > 23 || +slots.end.slice(3) > 59) fields.push("end");
    if (slots.start && slots.end && slots.start >= slots.end) fields.push("start","end");
    if (slots.date && slots.start && Date.parse(slots.date + "T" + slots.start + ":00+08:00") <= now.getTime()) fields.push("date","start","end");
    if (!Number.isInteger(slots.capacity) || slots.capacity < 1 || slots.capacity > 200) fields.push("capacity");
    if (!officeSites.includes(slots.office_site)) fields.push("office_site");
    if (!Array.isArray(slots.equipment) || slots.equipment.some(item => !equipmentOptions.includes(item))) fields.push("equipment");
    if (phase === "submit" && (!slots.title || slots.title.length > 100)) fields.push("title");
    return [...new Set(fields)];
  }
  const filterSignature = slots => JSON.stringify([slots.date,slots.start,slots.end,slots.office_site,slots.capacity,[...(slots.equipment || [])].sort()]);
  const fullSignature = slots => filterSignature(slots) + "|" + (slots.title || "") + "|" + (slots.room_id || "");
  function sanitizeSlots(input) {
    const result = {};
    for (const field of ["date","start","end","office_site","capacity","equipment","title"]) {
      if (!Object.hasOwn(input || {},field)) continue;
      result[field] = field === "capacity" ? Number(input[field]) : field === "equipment" ? Array.isArray(input[field]) ? input[field].map(String) : null : String(input[field] ?? "").trim();
    }
    return result;
  }
  function clearEvidence() { task.evidence = null; task.selected = null; delete task.slots.room_id; invalidateConfirmation(); }
  function mergeSlots(partial) {
    const next = { ...task.slots,...partial }; const changed = fullSignature(next) !== fullSignature(task.slots);
    if (changed) { const filterChanged = filterSignature(next) !== filterSignature(task.slots); task.version++; task.slots = next; invalidateConfirmation(); if (filterChanged) clearEvidence(); }
  }
  function canonicalQuestion() { const s = task.slots; return ["预订会议室",s.date,s.start && s.end ? s.start + "–" + s.end : "",s.office_site,s.capacity ? s.capacity + "人" : "",s.equipment?.length ? "设备：" + s.equipment.join("、") : "",s.title ? "主题：" + s.title : ""].filter(Boolean).join("，"); }
  function makeResult(status,text,view,actions = []) { task.status = status; return { kind: "skill",status,text,query: canonicalQuestion(),view,actions,references: [],committed: status === "success",task_id: task.id,version: task.version }; }
  function notice(text,actions = []) { return { kind: "skill",status: "stale",text,query: canonicalQuestion(),actions,references: [],committed: false,task_id: task.id,version: task.version }; }
  function action(type,label,extra = {}) { return { type,label,task_id: task.id,version: task.version,...extra }; }
  const fieldNames = { date: "会议日期",start: "开始时间",end: "结束时间",capacity: "参会人数",office_site: "办公地点",equipment: "设备要求",title: "会议主题" };
  function inputResult(fields,text) { return makeResult("needs_input",text || "请补充或确认：" + fields.map(field => fieldNames[field]).join("、") + "。",{ type: "input",fields,values: copy(task.slots),office_options: officeSites,selected_room: task.selected ? copy(task.selected) : null,action: action("meeting-update","补充预订信息") }); }
  function summaryValues(room) { return { meeting_title: task.slots.title,room_name: room.name,office_site: room.office_site,location: room.location,date: task.slots.date,start: task.slots.start,end: task.slots.end,capacity: task.slots.capacity,equipment: [...task.slots.equipment] }; }
  function queryParams(employee) { const s = task.slots; return { employee_id: employee.employee_id,start_time: s.date + "T" + s.start + ":00+08:00",end_time: s.date + "T" + s.end + ":00+08:00",office_site: s.office_site,capacity: s.capacity,equipment: [...s.equipment] }; }
  function paramsSignature(params) { return JSON.stringify([params.employee_id,params.room_id,params.start_time,params.end_time,params.office_site,params.capacity,[...(params.equipment || [])].sort(),params.meeting_title]); }
  function allowed(employeeId,site) { return authenticated && employeeId === "DEMO-EMP-001" && officeSites.includes(site); }
  function roomMatches(room,params) { return room.office_site === params.office_site && room.capacity >= params.capacity && params.equipment.every(item => room.equipment.includes(item)); }
  function occupied(roomId,params) { return [...receipts.values()].some(receipt => receipt.room_id === roomId && receipt.start_time < params.end_time && params.start_time < receipt.end_time); }
  function createDemoAdapters(delay) {
    return {
      getIdentity: async () => identity(),
      authenticateDemo: async () => { authenticated = true; return identity(); },
      getSchema: async name => { if (!schemas[name]) throw new Error("Unknown booking schema"); return copy(schemas[name]); },
      extractSlots: async input => extractSlots(input),
      async query_available_rooms(params) {
        await delay(1450,params.signal); if (params.signal.aborted) throw params.signal.reason;
        if (!allowed(params.employee_id,params.office_site)) return { status: "denied",rooms: [] };
        return { status: "ok",rooms: rooms.filter(room => roomMatches(room,params) && !occupied(room.id,params)).map(copy) };
      },
      async create_meeting_booking(params) {
        await delay(1450,params.signal); if (params.signal.aborted) throw params.signal.reason;
        const key = params.employee_id + ":" + params.idempotency_key;
        if (receipts.has(key)) { const receipt = receipts.get(key); return paramsSignature(receipt) === paramsSignature(params) ? { status: "success",receipt: copy(receipt) } : { status: "invalid_confirmation" }; }
        const issued = issuedConfirmations.get(params.confirmation_token);
        if (!issued || issued.key !== params.idempotency_key || issued.signature !== paramsSignature(params) || issued.expiresAt <= params.now.getTime()) return { status: "invalid_confirmation" };
        if (!allowed(params.employee_id,params.office_site)) return { status: "denied" };
        const room = rooms.find(item => item.id === params.room_id);
        if (!room || !roomMatches(room,params) || occupied(room.id,params)) return { status: "conflict" };
        const receipt = { booking_id: "MR-" + params.start_time.slice(0,10).replace(/-/g,"") + "-" + String(++bookingSequence).padStart(4,"0"),status: "confirmed",employee_id: params.employee_id,room_id: room.id,room_name: room.name,office_site: room.office_site,location: room.location,start_time: params.start_time,end_time: params.end_time,capacity: params.capacity,equipment: [...params.equipment],meeting_title: params.meeting_title };
        receipts.set(key,receipt); return { status: "success",receipt: copy(receipt) };
      },
      async get_meeting_booking_status(params) {
        await delay(900,params.signal); if (params.signal.aborted) throw params.signal.reason;
        if (!authenticated || params.employee_id !== "DEMO-EMP-001") return { status: "denied" };
        const receipt = receipts.get(params.employee_id + ":" + params.idempotency_key);
        return receipt ? { status: "success",receipt: copy(receipt) } : { status: "not_found" };
      }
    };
  }
  function accepts(question) {
    if (task.status === "idle") return false;
    return /^(?:确认|确认预订|提交|重新查询|查一下结果|核实状态|取消|取消本次预订)[。！!\s]*$/.test(question) || /第[一二三四1234]间|选.*(?:A301|A502|B201|C101)|主题(?:是|为|改)|\d{1,2}[:：]\d{2}|\d+个?人|总部园区|研发园区|调整条件|改(?:成|为).*\d|增加.*(?:投影|白板)|取消投影/.test(question);
  }
  function recoveryResult() { return makeResult("result_unknown","预订请求已发出，但提交结果尚未确认。请先核实状态，确认是否已创建；系统不会自动重复预订。",null,[action("meeting-check-status","核实预订状态",{ idempotency_key: task.submission?.key })]); }
  function receiptResult(receipt) {
    const expected = task.submission?.params;
    if (!receipt?.booking_id || receipt.status !== "confirmed" || expected && (receipt.room_id !== expected.room_id || receipt.start_time !== expected.start_time || receipt.end_time !== expected.end_time || receipt.employee_id && receipt.employee_id !== expected.employee_id)) return recoveryResult();
    task.receipt = copy(receipt); if (task.submission) task.submission.status = "success";
    window.PortalTaskStore?.recordMeeting(receipt);
    return makeResult("success","会议室预订成功，回执信息如下。",{ type: "receipt",receipt: copy(receipt) });
  }
  async function execute({ question,action: incoming,now,signal,step,onEvent = () => {},adapters,delay }) {
    if (incoming && incoming.task_id !== task.id) return notice("这条预订操作来自旧任务，请使用最新消息中的候选或确认摘要。");
    if (incoming && incoming.type !== "meeting-check-status" && incoming.version !== task.version) return notice("信息已更新，请使用最新候选列表或确认摘要；旧确认已失效。");
    const runId = ++activeRun;
    const current = () => runId === activeRun;
    const ensureCurrent = () => { if (!current() || signal.aborted) { const error = new Error("预订任务已更新或停止"); error.name = "AbortError"; throw error; } };
    const read = async operation => { ensureCurrent(); const value = await operation(); ensureCurrent(); return value; };
    const phase = async (...args) => read(() => step(...args));
    const services = { ...createDemoAdapters(delay),...(adapters || {}) };
    let input = question || "";
    if (incoming?.type === "meeting-authenticate") await read(() => services.authenticateDemo());
    const employee = await read(() => services.getIdentity());
    if (!employee?.employee_id) { if (input) task.lastQuestion = input; return makeResult("needs_auth","请先完成身份认证，再查询或预订会议室。",null,[action("meeting-authenticate","登录")]); }
    if (task.employee_id && task.employee_id !== employee.employee_id) { invalidateConfirmation(); task = newTask(); task.employee_id = employee.employee_id; return inputResult(["date","start","end","office_site","capacity"],"登录身份已变化，请重新确认查询条件。"); }
    task.employee_id = employee.employee_id;
    if (incoming?.type === "meeting-authenticate") input = task.lastQuestion;
    if ((task.status === "result_unknown" || task.status === "submitting") && incoming?.type !== "meeting-check-status" && !/^查一下结果|^核实状态/.test(input)) return recoveryResult();
    if (incoming?.type === "meeting-check-status" || task.status === "result_unknown" && /^查一下结果|^核实状态/.test(input)) {
      if (!task.submission) return makeResult("needs_input","暂无需要核实的提交记录。",null,[action("meeting-requery","重新查询会议室")]);
      if (incoming?.idempotency_key && incoming.idempotency_key !== task.submission.key) return notice("该核实操作不对应当前预订请求，请使用最新的核实按钮。");
      try {
        const lookup = await phase({ id: "verify_result",label: "核实预订结果" },"正在核实刚才的预订请求，请稍等。",() => services.get_meeting_booking_status({ employee_id: employee.employee_id,idempotency_key: task.submission.key,signal }),value => value.status === "success" ? "已找到成功回执" : value.status === "not_found" ? "确认尚未创建预订" : "结果仍待核实");
        if (lookup.status === "success") return receiptResult(lookup.receipt);
        if (lookup.status === "not_found") { task.submission = null; clearEvidence(); return makeResult("not_created","已核实：该请求尚未创建预订。请重新查询并选择会议室，再确认提交。",null,[action("meeting-requery","重新查询会议室")]); }
      } catch (error) { if (!current() || signal.aborted) throw error; }
      return recoveryResult();
    }
    if (/^(?:取消|取消本次预订)[。！!\s]*$/.test(input) || incoming?.type === "meeting-cancel") { if (task.receipt) return makeResult("success","已完成的预订需通过对应业务系统办理取消。",{ type: "receipt",receipt: task.receipt }); resetTask(); return makeResult("cancelled","已结束本次预订流程，未创建新预订。"); }
    if (incoming && incoming.version !== task.version) return notice("信息已更新，请使用最新候选列表或确认摘要；旧确认已失效。");
    if (task.status === "success" && !incoming && /预订|预定|预约/.test(input)) { invalidateConfirmation(); task = newTask(); task.employee_id = employee.employee_id; }
    const querySchema = await read(() => services.getSchema("query_available_rooms"));
    const extracted = incoming?.type === "meeting-update" ? Object.fromEntries(Object.entries(incoming.values || {}).filter(([key]) => ["date","start","end","office_site","capacity","equipment","title"].includes(key))) : await read(() => services.extractSlots({ query: input,context: copy(task.slots),task_memory: copy(task.slots),schema: querySchema,now }));
    mergeSlots(sanitizeSlots(extracted));
    if (input && !incoming) task.lastQuestion = input;
    const missing = validateSlots(task.slots,"query",now);
    if (missing.length) { clearEvidence(); return inputResult(missing); }
    if (incoming?.type === "meeting-edit") return makeResult("editing","你可以修改预订信息；影响筛选结果的条件变更后，会重新查询会议室。",{ type: "input",fields: ["date","start","end","office_site","capacity","equipment","title"],values: copy(task.slots),office_options: officeSites,action: action("meeting-update","更新预订信息") });
    let selectId = incoming?.type === "meeting-select" ? incoming.room_id : "";
    if (!incoming && task.evidence) {
      const ordinal = input.match(/第([一二三四1234])间/); const ids = { 一: 0,二: 1,三: 2,四: 3,"1": 0,"2": 1,"3": 2,"4": 3 };
      if (ordinal) selectId = task.evidence.rooms[ids[ordinal[1]]]?.id || "invalid";
      else if (/选/.test(input)) selectId = input.match(/A301|A502|B201|C101/)?.[0] || "";
    }
    if (selectId) {
      const evidence = task.evidence;
      if (!evidence || incoming && incoming.query_id !== evidence.query_id || evidence.expiresAt <= now.getTime() || evidence.signature !== filterSignature(task.slots)) { clearEvidence(); return makeResult("stale","该候选列表已失效，请重新查询后选择。",null,[action("meeting-requery","重新查询会议室")]); }
      const room = evidence.rooms.find(item => item.id === selectId);
      if (!room) return notice("请从最新候选列表中选择会议室，不能使用列表以外的编号。");
      task.selected = copy(room); task.slots.room_id = room.id; task.version++; invalidateConfirmation();
    }
    const confirmRequested = incoming?.type === "meeting-confirm" || !incoming && /^(?:确认|确认预订|提交)[。！!\s]*$/.test(input);
    if (confirmRequested) {
      if (task.receipt) return receiptResult(task.receipt);
      const confirmation = task.confirmation;
      if (!confirmation || task.status !== "awaiting_confirmation" || confirmation.signature !== fullSignature(task.slots) || confirmation.expiresAt <= now.getTime() || incoming && incoming.confirmation_token !== confirmation.token) return notice("预订信息已变化或确认已过期，请重新核对最新摘要后确认。",[action("meeting-prepare-summary","重新核对预订摘要")]);
      const submitMissing = validateSlots(task.slots,"submit",now); if (submitMissing.length) return inputResult(submitMissing);
      await read(() => services.getSchema("create_meeting_booking"));
      const params = { ...queryParams(employee),room_id: task.selected.id,meeting_title: task.slots.title,confirmation_token: confirmation.token,idempotency_key: confirmation.key };
      task.submission = { key: confirmation.key,params: copy(params),status: "submitting" }; task.status = "submitting";
      onEvent({ type: "booking-submitting",task_id: task.id });
      let submitted;
      try { submitted = await phase({ id: "submit",label: "提交会议室预订" },"正在提交预订，并核验实时空闲状态。",() => services.create_meeting_booking({ ...params,now,signal }),value => value.status === "success" ? "业务回执已返回" : value.status === "conflict" ? "该时段已被占用" : "正在确认提交结果"); }
      catch (error) { if (!current()) throw error; task.submission.status = "unknown"; return recoveryResult(); }
      if (submitted.status === "success") return receiptResult(submitted.receipt);
      if (submitted.status === "conflict") { task.submission = null; clearEvidence(); return await queryRooms("刚才选择的会议室已被占用，我会重新查询。请重新选择并确认。"); }
      if (submitted.status === "denied" || submitted.status === "invalid_confirmation") { task.submission = null; invalidateConfirmation(); return makeResult("rejected","预订未提交成功，权限或确认信息校验未通过，请重新核对。",null,[action("meeting-requery","重新查询会议室")]); }
      task.submission.status = "unknown"; return recoveryResult();
    }
    if (task.selected && task.evidence && task.evidence.expiresAt > now.getTime() && task.evidence.signature === filterSignature(task.slots) && incoming?.type !== "meeting-requery") return await prepareSummary();
    return await queryRooms();

    async function prepareSummary() {
      await read(() => services.getSchema("create_meeting_booking"));
      const needed = validateSlots(task.slots,"submit",now); if (needed.length) return inputResult(needed,"会议室已选好，请补充" + needed.map(field => fieldNames[field]).join("、") + "，再核对预订摘要。");
      await phase({ id: "summary",label: "核对预订摘要" },"已整理好预订摘要，请你核对后确认。",async () => {},"确认前不会创建预订");
      invalidateConfirmation();
      const token = "demo-confirm-" + ++sequence, key = "demo-request-" + task.id + "-" + task.version + "-" + sequence;
      task.confirmation = { token,key,signature: fullSignature(task.slots),expiresAt: now.getTime() + 10 * 60 * 1000 };
      const params = { ...queryParams(employee),room_id: task.selected.id,meeting_title: task.slots.title };
      issuedConfirmations.set(token,{ key,signature: paramsSignature(params),expiresAt: task.confirmation.expiresAt });
      return makeResult("awaiting_confirmation","请核对下面的完整摘要。确认后才提交预订。",{ type: "summary",values: summaryValues(task.selected),confirm: action("meeting-confirm","确认预订",{ confirmation_token: token }),edit: action("meeting-edit","修改信息"),reselect: action("meeting-requery","重新选择会议室") });
    }
    async function queryRooms(prefix = "") {
      clearEvidence(); task.version++; task.status = "querying";
      const params = queryParams(employee);
      let found;
      try { found = await phase({ id: "rooms",label: "查询空闲会议室" },prefix || "正在按时间、地点、人数和设备要求查询空闲会议室。",() => services.query_available_rooms({ ...params,signal }),value => value.status === "ok" ? "本次查询返回 " + value.rooms.length + " 间可用会议室" : "查询未通过权限校验"); }
      catch (error) { if (!current()) throw error; clearEvidence(); if (signal.aborted) throw error; return makeResult("query_error","会议室查询暂时失败，请稍后重试。不会使用之前的空闲结果代替本次查询。",null,[action("meeting-requery","重新查询会议室")]); }
      if (found.status !== "ok") return makeResult("query_error","当前身份或办公地点权限未通过校验，请核对登录状态和办公地点。",null,[action("meeting-edit","修改查询条件")]);
      if (!found.rooms.length) return makeResult("no_results","没有找到符合当前条件的会议室。你可以调整时间、地点、人数或设备要求后重新查询。",null,[action("meeting-edit","调整查询条件")]);
      task.evidence = { query_id: "room-query-" + ++sequence,rooms: copy(found.rooms),conditions: copy(task.slots),signature: filterSignature(task.slots),employee_id: employee.employee_id,expiresAt: now.getTime() + 10 * 60 * 1000 };
      await phase({ id: "candidates",label: "整理候选会议室" },"查询结果已整理好，请先选择会议室。",async () => {},"查询结果不会锁定会议室");
      return makeResult("awaiting_selection",prefix || "已找到符合条件的会议室。请先选择一间，再核对预订摘要。",{ type: "rooms",filters: copy(task.slots),rooms: copy(found.rooms).map(room => ({ ...room,action: action("meeting-select","选择会议室",{ room_id: room.id,query_id: task.evidence.query_id }) })),edit: action("meeting-edit","调整查询条件") });
    }
  }
  window.MeetingBooking = Object.freeze({ execute,accepts,resetTask,recoveryResult,createDemoAdapters,extractSlots,validateSlots,schemas,getState: () => copy(task),setDemoAuthenticated: value => { authenticated = Boolean(value); } });
})();
