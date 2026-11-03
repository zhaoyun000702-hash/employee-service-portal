(() => {
  "use strict";
  const questions = [
    { title: "VPN 登录失败如何处理", category: "网络", tag: "热门", match: /vpn|网络|远程办公|连接失败/i, refs: ["VPN 登录操作手册","账号权限申请流程","远程办公常见问题","密码重置指引","联系 IT 服务台"] },
    { title: "企业邮箱首次配置指引", category: "账号", tag: "推荐", match: /邮箱|邮件|outlook/i, refs: ["企业邮箱配置指引","联系 IT 服务台"] },
    { title: "请假申请流程说明", category: "制度", match: /请假|年假|调休|休假/, refs: ["请假申请操作手册"] },
    { title: "设备申领操作手册", category: "设备", match: /设备|申领|电脑|显示器|键盘|鼠标/, refs: ["设备申领操作手册"] },
    { title: "账号权限开通 FAQ", category: "账号", match: /权限|账号|密码|开通|解锁/, refs: ["账号权限申请流程","密码重置指引"] },
    { title: "费用报销提交规范", category: "制度", match: /报销|财务|发票|差旅/, refs: ["费用报销提交规范"] },
    { title: "会议室预订流程", category: "设备", match: /会议|预订|预定|开会/, refs: ["会议室预定流程"] },
    { title: "访客预约操作说明", category: "更多", match: /访客|来访|门禁|预约/, refs: ["访客预约操作说明"] }
  ];
  const documents = {
    "VPN 登录操作手册": ["通过企业认可的入口打开 VPN 客户端，确认使用正确的账号格式。","核对当前网络、账号状态与身份验证结果，记录完整报错信息。","密码过期或账号锁定时，按企业账号管理流程处理；请勿在聊天中发送密码或验证码。"],
    "账号权限申请流程": ["确认申请系统、权限范围、业务用途与使用期限。","按照企业要求完成负责人及系统管理员审批，审批结果以业务系统记录为准。"],
    "远程办公常见问题": ["先确认本地网络可用，再检查 VPN 客户端与身份验证状态。","如仅个别业务系统无法访问，请记录系统名称、故障时间与报错现象，联系对应服务人员。"],
    "密码重置指引": ["通过企业统一身份认证或账号管理入口发起密码重置。","完成身份核验后设置符合企业要求的新密码，并重新登录相关客户端。"],
    "VPN 账号解锁指引": ["出现账号锁定提示时，先停止反复尝试登录，并记录完整报错信息。","通过企业认可的账号管理入口或 IT 服务台核验身份，按账号解锁流程处理。","确认账号恢复后重新登录；不要在聊天中发送密码或验证码。"],
    "VPN 连接超时排查指引": ["先确认基础网络是否可用，并记录 VPN 客户端的完整报错及发生时间。","若基础网络正常，需由 IT 核查 VPN 网关、服务公告及客户端连接配置，避免仅凭超时认定密码错误。","服务恢复或配置核实后重试；仍异常时，将客户端版本、网络环境和报错截图提交 IT 服务台。"],
    "联系 IT 服务台": ["请准备故障现象、发生时间、使用环境与报错截图。","通过企业在线客服或 IT 服务台提交问题，勿提供密码、验证码等凭据。"],
    "企业邮箱配置指引": ["确认邮箱账号已开通，使用企业指定的客户端和配置参数。","完成登录验证后测试收发邮件；服务地址与端口请查阅企业正式配置指引。"],
    "请假申请操作手册": ["选择假期类型，核对余额、适用条件与请假时长。","填写起止时间、事由及交接安排，确认信息后到 HR 系统提交。"],
    "设备申领操作手册": ["填写设备类型、数量、使用用途与期望领用日期。","核对信息后按资产管理流程申请，实际审批、库存和发放结果以企业系统为准。"],
    "费用报销提交规范": ["准备费用发票或其他合规票据，并核对日期、金额与费用明细。","准备对应的支付凭证；差旅费用还需关联出差审批及行程、住宿等业务材料，具体要求以适用制度为准。","填写报销单并核对总金额，提交后通过财务系统关注审批进度。"],
    "新员工入职准备指引": ["报到准备：确认入职日期、报到地点和联系人，按 HR 提供的材料清单准备资料。","账号准备：确认所属部门及需要使用的系统，按账号权限流程申请企业账号与业务权限。","办公准备：根据岗位需要核对电脑、显示器等设备需求，并按设备申领流程准备申请信息。"],
    "会议室预定流程": ["准备会议主题、日期、时间、人数和设备需求。","进入会议室系统核对可用时段，确认预订成功后通知参会人员。"],
    "访客预约操作说明": ["提前确认来访日期、时间、地点与接待人。","按企业要求提交预约，审批通过后向访客发送正式入场指引。"],
    "座机通话异常排查指引": ["先确认是所有通话还是特定号码出现异常，以及对方是否也听到断续，并记录发生时段。","检查听筒线、电话线或网线是否插牢；在不影响业务的前提下，由有权限的人员协助替换已知正常的连接线进行对比。","若为网络电话，记录是否伴随网络波动、其他设备是否同时异常，并请 IT 核查网络和语音服务状态。","若仍未恢复，请向 IT 服务台提供设备品牌型号、异常现象及已做的检查。上述为通用排查说明，具体操作需核对该设备的正式指引。"]
  };
  const announcements = [
    { title: "国庆期间 IT 服务支持安排通知", date: "2024–09–14", body: "假期如遇影响办公的 IT 问题，请通过企业 IT 服务台反馈，描述问题现象、影响范围与发生时间。具体服务时段以企业正式公布的值班安排为准。" },
    { title: "企业邮箱系统升级维护公告", date: "2024–09–12", body: "邮箱维护期间请提前保存工作内容，并关注企业通知中的维护时段与服务恢复安排。升级后若出现异常，可记录报错信息并联系 IT 服务台。" },
    { title: "新员工账号开通服务指引", date: "2024–09–10", body: "新员工可按入职指引申请企业账号与业务系统权限。请核对所属部门、使用系统、权限范围与业务用途，审批结果以企业系统记录为准。" }
  ];
  const toolFields = {
    "申请设备": [["设备类型","select","笔记本电脑","显示器","键盘鼠标","其他办公设备"],["数量","number"],["期望领用日期","date"],["使用用途","textarea"]],
    "请假申请": [["假期类型","select","年假","调休","事假","其他假期"],["开始时间","datetime-local"],["结束时间","datetime-local"],["请假事由","textarea"]],
    "系统权限申请": [["申请系统","text"],["所需权限","text"],["使用期限","date"],["业务用途","textarea"]],
    "IT 报障": [["问题类型","select","VPN 与网络","账号与权限","办公设备","企业邮箱","其他问题"],["发生时间","datetime-local"],["问题现象","textarea"]]
  };
  const toolNames = ["会议室预定",...Object.keys(toolFields)];
  function matchTopic(question) {
    if (/(?:座机|电话)/.test(question) && /断断续续|断续|杂音|声音|掉音/.test(question)) return { title: "座机通话异常排查", category: "设备", refs: ["座机通话异常排查指引"] };
    return questions.find(item => item.match.test(question));
  }
  function filterQuestions(query,category) {
    const keyword = query.replace(/\s+/g,"").toLowerCase();
    return questions.filter(item => (item.title + item.category).replace(/\s+/g,"").toLowerCase().includes(keyword) || item.match.test(keyword)).map((item,index) => ({ item,index })).sort((a,b) => (category === "更多" || a.item.category === b.item.category ? a.index - b.index : Number(b.item.category === category) - Number(a.item.category === category) || a.index - b.index)).map(entry => entry.item);
  }

  const transcript = document.getElementById("chat-transcript");
  const questionInput = document.getElementById("assistant-question");
  const composer = document.getElementById("assistant-composer");
  const sendButton = document.getElementById("assistant-send");
  const sheet = document.getElementById("assistant-sheet");
  const sheetBody = document.getElementById("sheet-body");
  const questionList = document.getElementById("question-list");
  const searchInput = document.getElementById("help-search");
  const robotImage = document.getElementById("assistant-avatar-source").src;
  const userImage = document.getElementById("user-avatar-source").src;
  const assistantWelcome = document.getElementById("assistant-welcome").textContent.trim();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeCategory = "网络";
  let sheetReturnFocus;
  let stream;
  let pendingItems = [];
  let toastTimer;

  function node(tag,className,text) { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; }
  function icon(id,className) { const svg = document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("aria-hidden","true"); if (className) svg.setAttribute("class",className); const use = document.createElementNS("http://www.w3.org/2000/svg","use"); use.setAttribute("href","#" + id); svg.append(use); return svg; }
  function toast(text) { const element = document.getElementById("chat-toast"); clearTimeout(toastTimer); element.textContent = text; element.hidden = false; toastTimer = setTimeout(() => { element.hidden = true; },3200); }
  function scrollConversation() { transcript.scrollTop = transcript.scrollHeight; }
  function timeNow() { return new Intl.DateTimeFormat("zh-CN",{ hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Shanghai" }).format(new Date()); }
  function appendMessage(role,text = "") {
    const article = node("article","chat-message from-" + role);
    const avatar = node("img","chat-avatar " + (role === "assistant" ? "bot-avatar" : "user-avatar")); avatar.src = role === "assistant" ? robotImage : userImage; avatar.alt = role === "assistant" ? "智能客服" : "我的头像";
    const content = node("div","message-content"); const bubble = node("div","message-bubble" + (role === "assistant" ? " answer-bubble" : ""));
    if (text) bubble.append(node("div","streamed-answer",text));
    content.append(bubble,node("time","",timeNow())); article.append(avatar,content); transcript.append(article); scrollConversation(); return bubble;
  }
  function startConversation() {
    stopReply(); transcript.replaceChildren(); pendingItems = []; renderPending(); questionInput.value = "";
    globalThis.window?.AssistantExecution?.resetConversation?.();
    globalThis.window?.MeetingBookingUI?.deactivate?.();
    const bubble = appendMessage("assistant",assistantWelcome);
    bubble.closest("article").classList.add("welcome-message"); bubble.nextElementSibling.hidden = true;
    document.getElementById("chat-navigation").hidden = true; document.getElementById("chat-menu").setAttribute("aria-expanded","false");
    document.getElementById("composer-menu").hidden = true; document.getElementById("composer-more").setAttribute("aria-expanded","false");
    questionInput.focus({ preventScroll: true });
  }
  function openSheet(title,content) {
    if (!sheet.open) sheetReturnFocus = document.activeElement;
    document.getElementById("sheet-title").textContent = title; sheetBody.replaceChildren();
    if (typeof content === "string") sheetBody.append(node("p","",content)); else sheetBody.append(content);
    if (!sheet.open) sheet.showModal();
  }
  function closeSheet() { if (sheet.open) sheet.close(); }
  sheet.addEventListener("close",() => { if (sheetReturnFocus?.isConnected) sheetReturnFocus.focus({ preventScroll: true }); else questionInput.focus({ preventScroll: true }); });
  document.getElementById("close-sheet").addEventListener("click",closeSheet);
  sheet.addEventListener("click",event => { if (event.target !== sheet) return; const rect = sheet.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSheet(); });
  function openDocument(title) {
    const content = node("div"); (documents[title] || ["请通过企业知识库查阅该指引的完整版本。"]).forEach(text => content.append(node("p","",text)));
    if (title === "联系 IT 服务台") { const button = node("button","draft-submit","整理报障信息"); button.dataset.tool = "IT 报障"; content.append(button); }
    openSheet(title,content);
  }
  function renderQuestionList() {
    const matches = filterQuestions(searchInput.value,activeCategory); questionList.replaceChildren();
    matches.forEach((item,index) => {
      const button = node("button","question-row"); button.dataset.question = item.title;
      button.append(node("span","question-rank",String(index + 1)),node("span","question-label",item.title));
      if (item.tag) button.append(node("span","question-tag",item.tag)); button.append(icon("i-right")); questionList.append(button);
    });
    questionList.hidden = !matches.length; document.getElementById("no-questions").hidden = Boolean(matches.length);
  }
  function setCategory(button) {
    document.querySelectorAll("[data-category]").forEach(tab => { const selected = tab === button; tab.setAttribute("aria-selected",String(selected)); tab.tabIndex = selected ? 0 : -1; });
    activeCategory = button.dataset.category; renderQuestionList();
  }
  const tabs = Array.from(document.querySelectorAll("[data-category]"));
  tabs.forEach((button,index) => {
    button.addEventListener("click",() => setCategory(button));
    button.addEventListener("keydown",event => { let next; if (event.key === "ArrowRight") next = (index + 1) % tabs.length; if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length; if (event.key === "Home") next = 0; if (event.key === "End") next = tabs.length - 1; if (next === undefined) return; event.preventDefault(); setCategory(tabs[next]); tabs[next].focus(); });
  });
  searchInput.addEventListener("input",renderQuestionList);
  function showList(title,items,attribute) { const list = node("div","sheet-list"); items.forEach(item => { const button = node("button","",item); button.dataset[attribute] = item; button.append(icon("i-right")); list.append(button); }); openSheet(title,list); }
  document.getElementById("more-questions").addEventListener("click",() => showList("热门问题",questions.map(item => item.title),"question"));
  document.getElementById("more-tools").addEventListener("click",() => showList("自助工具",toolNames,"tool"));
  document.getElementById("chat-apps").addEventListener("click",() => showList("自助工具",toolNames,"tool"));
  document.getElementById("cite-knowledge").addEventListener("click",() => showList("选择要引用的知识",Object.keys(documents),"cite"));
  document.getElementById("more-notices").addEventListener("click",() => { const list = node("div","sheet-list"); announcements.forEach((item,index) => { const button = node("button","",item.title); button.dataset.announcement = String(index); list.append(button); }); openSheet("服务公告",list); });
  function setGenerating(generating) { sendButton.classList.toggle("is-generating",generating); sendButton.querySelector("span").textContent = generating ? "停止" : "发送"; sendButton.setAttribute("aria-label",generating ? "停止生成回答" : "发送消息"); }
  function stopReply() { if (stream) { stream.stop(); stream = null; } }
  function renderReferences(bubble,references) {
    if (!references?.length) return;
    const section = node("div","answer-references"); section.append(node("p","","你还可以查看以下相关内容："));
    references.forEach(title => { const button = node("button"); button.dataset.doc = title; button.append(icon("chat-file"),document.createTextNode(title),icon("i-right","reference-arrow")); section.append(button); }); bubble.append(section);
  }
  function reply(content,question) {
    stopReply();
    const bubble = appendMessage("assistant"); bubble.setAttribute("aria-busy","true");
    const text = node("div","streamed-answer"); bubble.append(text);
    const intro = question ? window.AssistantExecution.rewriteQuery(question).intro : "";
    const fullText = (intro ? intro + "\n\n" : "") + content;
    const characters = Array.from(fullText); let index = 0, timer, finished = false;
    function finish(complete) {
      if (finished) return; finished = true; clearTimeout(timer);
      if (complete) text.textContent = fullText;
      else if (!text.textContent) text.textContent = "已停止生成，你可以继续输入问题。";
      bubble.setAttribute("aria-busy","false"); stream = null; setGenerating(false); scrollConversation();
    }
    function tick() { index = Math.min(index + 5,characters.length); text.textContent = characters.slice(0,index).join(""); scrollConversation(); if (index === characters.length) finish(true); else timer = setTimeout(tick,26); }
    stream = { stop: () => finish(false) }; setGenerating(true);
    if (reducedMotion) finish(true); else timer = setTimeout(tick,260);
  }
  function renderTaskActions(container,actions) {
    window.MeetingBookingUI.render(container,actions,{ onAction: (action,message) => {
      stopReply(); appendMessage("user",message || action.label); executeTask("",null,action);
    } });
  }
  function executeTask(question,topic,action) {
    stopReply();
    if (action?.type?.startsWith("meeting-") || window.AssistantExecution.classify?.(question,topic) === "skill") window.MeetingBookingUI.deactivate();
    const controller = new AbortController();
    const bubble = appendMessage("assistant"); bubble.classList.add("task-answer"); bubble.setAttribute("aria-busy","true");
    bubble.closest("article").classList.add("has-execution");
    const trace = node("details","execution-trace"); trace.open = true; trace.dataset.state = "running";
    const summary = node("summary","execution-summary");
    const indicator = node("span","execution-indicator"); indicator.setAttribute("aria-hidden","true");
    const summaryText = node("span","execution-summary-text","正在开始任务…");
    const elapsed = node("span","execution-elapsed","0 秒"); elapsed.setAttribute("aria-hidden","true");
    summary.append(indicator,summaryText,elapsed,icon("i-down","execution-chevron"));
    const steps = node("ol","execution-steps"); steps.setAttribute("aria-label","关键执行步骤");
    trace.append(summary,steps);
    const answer = node("div","task-answer-content"); answer.hidden = true;
    const text = node("div","streamed-answer"); answer.append(text);
    bubble.append(trace,answer);
    const announcement = document.getElementById("execution-status");
    const stepViews = new Map(); const started = Date.now();
    let timer, finished = false, committed = false, bookingSubmitted = false, resultStatus = "", resolvedResult, phaseMessage = "正在开始任务…", fullText = "", lastAnnounced = 0;
    function status(message) { phaseMessage = message; summaryText.textContent = message; announcement.textContent = message; }
    const clock = setInterval(() => {
      const seconds = Math.floor((Date.now() - started) / 1000); elapsed.textContent = seconds + " 秒";
      if (seconds >= 10) summaryText.textContent = phaseMessage + "（仍在处理）";
      if (seconds >= lastAnnounced + 15) { announcement.textContent = phaseMessage + "，已等待 " + seconds + " 秒。"; lastAnnounced = seconds; }
    },1000);
    function settle(state,message) {
      if (finished) return; finished = true; clearTimeout(timer); clearInterval(clock);
      trace.dataset.state = state; elapsed.textContent = Math.max(1,Math.ceil((Date.now() - started) / 1000)) + " 秒";
      const completed = [...stepViews.values()].filter(view => view.row.dataset.state === "done").length;
      for (const view of stepViews.values()) {
        if (view.row.dataset.state === "running") view.row.dataset.state = state === "error" ? "error" : state === "unknown" || resultStatus === "result_unknown" ? "unknown" : "cancelled";
      }
      if (state === "done") {
        trace.open = false;
        const labels = { needs_input: "请补充预订信息",needs_auth: "请先认证身份",awaiting_selection: "请选择会议室",awaiting_confirmation: "等待你确认预订",editing: "请修改预订信息",success: "预订成功",result_unknown: "预订结果待核实",no_results: "暂无匹配会议室",query_error: "会议室查询暂未完成",stale: "请使用最新预订信息",not_created: "已核实，尚未创建预订",rejected: "预订未提交成功",cancelled: "本次流程已结束" };
        status((labels[resultStatus] || "已完成") + (completed ? " · " + completed + " 个步骤" : ""));
        if (!stepViews.size) trace.hidden = true;
      } else if (state === "unknown") status("预订结果待核实");
      else {
        status(message || "已停止本次任务");
        answer.hidden = false;
        if (!text.textContent) text.textContent = state === "error" ? "这次任务暂时没有完成，请稍后重试。" : "已停止，你可以继续输入问题，或重新执行本次任务。";
        const retry = node("button","task-retry","重新执行"); retry.type = "button"; retry.dataset.question = question || "预订会议室"; answer.append(retry);
      }
      bubble.setAttribute("aria-busy","false");
      stream = null; setGenerating(false); scrollConversation();
    }
    function onEvent(event) {
      if (finished) return;
      if (event.type === "step") {
        if (event.id === "rewrite") return;
        let view = stepViews.get(event.id);
        if (!view && event.state === "running") {
          const row = node("li","execution-step");
          const marker = node("span","execution-step-marker"); marker.setAttribute("aria-hidden","true");
          const content = node("div","execution-step-content");
          const title = node("span","execution-step-title",event.label || event.message); const detail = node("span","execution-step-detail");
          content.append(title,detail); row.append(marker,content);
          steps.append(row); view = { row,detail }; stepViews.set(event.id,view);
        }
        if (!view) return;
        view.row.dataset.state = event.state; view.detail.textContent = event.detail || "";
        if (event.message) status(event.message);
      }
      if (event.type === "result") status("关键步骤已完成，正在整理回答…");
      if (event.type === "booking-submitting") bookingSubmitted = true;
      if (event.type === "result_unknown") { resultStatus = "result_unknown"; status(event.message); }
      if (event.type === "error") settle("error",event.message);
      if (event.type === "cancelled") settle("cancelled",event.message);
      scrollConversation();
    }
    stream = { stop: () => {
      if (committed) { text.textContent = fullText; renderTaskActions(answer,resolvedResult); settle("done"); }
      else if (bookingSubmitted) {
        controller.abort(); const recovery = window.MeetingBooking.recoveryResult(); answer.hidden = false; text.textContent = recovery.text;
        renderTaskActions(answer,recovery); settle("unknown");
      } else { controller.abort(); settle("cancelled"); }
    } }; setGenerating(true);
    window.AssistantExecution.run({ question, topic, action, documents, signal: controller.signal, onEvent }).then(result => {
      if (finished) return;
      answer.hidden = false; fullText = result.text; committed = Boolean(result.committed); resultStatus = result.status || ""; resolvedResult = result;
      const characters = Array.from(fullText); let index = 0;
      function tick() {
        if (finished) return;
        index = reducedMotion ? characters.length : Math.min(index + 5,characters.length);
        text.textContent = characters.slice(0,index).join(""); scrollConversation();
        if (index === characters.length) { renderReferences(answer,result.references); renderTaskActions(answer,result); settle("done"); }
        else timer = setTimeout(tick,26);
      }
      status("正在为你整理回答…"); tick();
    }).catch(error => { if (!finished) settle(error.name === "AbortError" ? "cancelled" : "error"); });
  }
  const exampleButtons = document.getElementById("task-example-buttons");
  window.AssistantExecution.examples.forEach(example => {
    const button = node("button","task-example"); button.type = "button"; button.dataset.example = example.id; button.title = example.question;
    button.append(node("span","",example.label)); exampleButtons.append(button);
  });
  function renderPending() {
    const container = document.getElementById("composer-attachments"); container.replaceChildren(); container.hidden = !pendingItems.length;
    pendingItems.forEach((item,index) => { const chip = node("span","attachment-chip"); chip.append(node("span","",(item.type === "knowledge" ? "@ " : "") + item.name)); const remove = node("button","","×"); remove.type = "button"; remove.setAttribute("aria-label","移除 " + item.name); remove.addEventListener("click",() => { pendingItems.splice(index,1); renderPending(); }); chip.append(remove); container.append(chip); });
  }
  function sendQuestion(value) {
    const text = value.trim(); if (!text && !pendingItems.length) { questionInput.focus(); return; }
    stopReply();
    const items = pendingItems; pendingItems = []; renderPending(); questionInput.value = "";
    const bubble = appendMessage("user",text || "请帮我查看以下内容。");
    if (items.length) bubble.append(node("div","message-attachment",items.map(item => (item.type === "knowledge" ? "引用：" : "附件：") + item.name).join("\n")));
    closeSheet();
    if (/^(人工|转人工|人工客服|联系人工客服)$/.test(text)) { reply("我可以先帮你整理需要人工跟进的问题。请说明问题现象、影响范围与发生时间，也可以通过右侧知识入口查看“联系 IT 服务台”。",text); return; }
    const topic = questions.find(item => item.title === text) || matchTopic(text + " " + items.filter(item => item.type === "knowledge").map(item => item.name).join(" "));
    if (window.AssistantExecution.classify(text,topic) !== "chat") executeTask(text,topic);
    else reply(items.some(item => item.type === "file") ? "已添加附件。请补充你希望核对的问题或需要办理的事项；附件尚未进行内容解析。你也可以点击上方四个入口，体验不同任务的执行过程。" : "已收到你的问题。你可以咨询制度、设备、账号或网络相关的办公服务，也可以点击上方入口，体验查文档、查询假期余额、预订会议室和 VPN 故障排查。如需人工帮助，请输入“人工”。",text);
    questionInput.focus({ preventScroll: true });
  }
  composer.addEventListener("submit",event => { event.preventDefault(); if (stream) { stopReply(); return; } sendQuestion(questionInput.value); });
  questionInput.addEventListener("keydown",event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); composer.requestSubmit(); } });
  function addFiles(files) {
    for (const file of Array.from(files)) {
      if (pendingItems.length >= 5) { toast("一次最多添加 5 项附件或知识引用。"); break; }
      if (file.size > 10 * 1024 * 1024) { toast(file.name + " 超过 10 MB，请选择较小的文件。"); continue; }
      pendingItems.push({ name: file.name, type: "file" });
    }
    renderPending(); questionInput.focus({ preventScroll: true });
  }
  for (const [buttonId,inputId] of [["attach-file","file-picker"],["attach-image","image-picker"]]) {
    const picker = document.getElementById(inputId); document.getElementById(buttonId).addEventListener("click",() => picker.click()); picker.addEventListener("change",() => { addFiles(picker.files); picker.value = ""; });
  }
  function openTool(title) {
    if (title === "会议室预定") { closeSheet(); sendQuestion("我想预订会议室"); return; }
    const fields = toolFields[title]; if (!fields) return;
    const form = node("form","draft-form");
    fields.forEach(([label,type,...options]) => {
      const wrapper = node("label","",label); const control = node(type === "select" ? "select" : type === "textarea" ? "textarea" : "input"); control.name = label; control.required = true;
      if (type === "select") options.forEach(value => { const option = node("option","",value); option.value = value; control.append(option); });
      else if (type !== "textarea") control.type = type;
      if (type === "number") { control.min = "1"; control.max = "200"; control.value = "1"; } if (type === "text" || type === "textarea") control.maxLength = 300;
      wrapper.append(control); form.append(wrapper);
    });
    form.append(node("p","draft-note","填写信息后可生成申请草稿，核对后通过对应业务系统提交。"));
    const submit = node("button","draft-submit","生成申请草稿"); submit.type = "submit"; form.append(submit);
    form.addEventListener("submit",event => {
      event.preventDefault(); const values = Array.from(new FormData(form)); const data = Object.fromEntries(values);
      if (data["开始时间"] && data["结束时间"] && data["开始时间"] >= data["结束时间"]) { toast("结束时间应晚于开始时间。"); return; }
      stopReply(); closeSheet(); appendMessage("user","我想办理" + title + "。");
      appendMessage("assistant",title + "草稿已生成：\n" + values.map(([key,value]) => key + "：" + value).join("\n") + "\n\n请核对以上信息后，通过对应业务系统提交。当前尚未发起实际业务申请。");
    });
    openSheet(title,form);
  }
  document.addEventListener("click",event => {
    if (!event.target.closest("#composer-more,#composer-menu")) { document.getElementById("composer-menu").hidden = true; document.getElementById("composer-more").setAttribute("aria-expanded","false"); }
    if (!event.target.closest("#chat-menu,#chat-navigation")) { document.getElementById("chat-navigation").hidden = true; document.getElementById("chat-menu").setAttribute("aria-expanded","false"); }
    const target = event.target.closest("button"); if (!target) return;
    if (target.dataset.example) { const example = window.AssistantExecution.examples.find(item => item.id === target.dataset.example); if (example) sendQuestion(example.question); }
    if (target.dataset.doc) openDocument(target.dataset.doc);
    if (target.dataset.question) sendQuestion(target.dataset.question);
    if (target.dataset.tool) openTool(target.dataset.tool);
    if (target.dataset.announcement !== undefined) { const item = announcements[Number(target.dataset.announcement)]; if (item) { const content = node("div"); content.append(node("p","draft-note",item.date),node("p","",item.body)); openSheet(item.title,content); } }
    if (target.dataset.cite) { if (pendingItems.length >= 5) { toast("一次最多添加 5 项附件或知识引用。"); return; } if (!pendingItems.some(item => item.type === "knowledge" && item.name === target.dataset.cite)) pendingItems.push({type:"knowledge",name:target.dataset.cite}); renderPending(); closeSheet(); questionInput.focus(); }
    if (target.hasAttribute("data-new-conversation")) startConversation();
  });
  for (const [buttonId,panelId] of [["chat-menu","chat-navigation"],["composer-more","composer-menu"]]) document.getElementById(buttonId).addEventListener("click",event => { const panel = document.getElementById(panelId); panel.hidden = !panel.hidden; event.currentTarget.setAttribute("aria-expanded",String(!panel.hidden)); });
  document.getElementById("dismiss-chat-tip").addEventListener("click",() => { document.getElementById("chat-tip").hidden = true; });
  document.getElementById("contact-support").addEventListener("click",() => sendQuestion("人工"));
  document.getElementById("chat-help").addEventListener("click",() => openSheet("使用帮助","输入问题后点击“发送”或按回车；Shift + 回车可换行。上方四个入口提供文档查询、假期余额查询、会议室预订和 VPN 故障排查。预订会议室时，请先选择会议室，再核对摘要并确认提交。执行过程中逐步显示关键动作与已用时间；点击“停止”可中断。回答开头会说明本次处理的问题。"));
  document.getElementById("chat-profile").addEventListener("click",() => {
    const content = node("div"); content.append(node("p","","管理当前登录状态。退出后，办理会议室预订需重新登录。"));
    const logout = node("button","draft-submit","退出登录"); logout.addEventListener("click",() => { window.MeetingBooking.setDemoAuthenticated(false); startConversation(); closeSheet(); toast("已退出登录。"); }); content.append(logout); openSheet("个人中心",content);
  });
  document.getElementById("back-to-portal").addEventListener("click",() => { if (location.protocol === "blob:") { window.close(); return; } location.href = new URL(location.protocol === "file:" ? "./employee-portal.html" : "./index.html",location.href).href; });
  window.addEventListener("pagehide",() => { stopReply(); clearTimeout(toastTimer); });
  renderQuestionList();
})();
