(() => {
  "use strict";
  const data = window.PortalData;
  const records = window.PortalStore;
  const main = document.getElementById("portal-view");
  const home = window.PortalNavigation.homeUrl();
  document.getElementById("portal-home-link").href = home;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const find = (items,id) => items.find(item => item.id === id);
  const url = (view,id,draft) => "#" + new URLSearchParams({view,...(id && {id}),...(draft && {draft})});
  const link = (title,view,id,style="") => '<a class="work-button '+style+'" href="'+esc(url(view,id))+'">'+esc(title)+'</a>';
  const empty = message => '<div class="work-card work-empty">'+esc(message)+'</div>';
  const list = items => items.length ? '<div class="work-card">'+items.map(item =>
    '<a class="work-list-row" href="'+esc(url(item.view,item.id))+'"><div class="work-list-copy"><h2>'+esc(item.title)+'</h2><p>'+esc(item.summary)+'</p></div><span class="work-tag muted">'+esc(item.date || item.kind || "查看")+'</span></a>'
  ).join("")+'</div>' : empty("暂无匹配内容");
  const rows = (items,view) => items.map(item => ({...item,view}));
  const heading = (title,summary="") => '<header class="work-page-heading"><h1>'+esc(title)+'</h1><p>'+esc(summary)+'</p></header>';
  const button = (title,style="") => '<button type="button" class="work-button '+style+'">'+title+'</button>';
  let meetingRun;

  function articleSection(part,index,reader) {
    const number = reader ? '<span class="document-section-number" aria-hidden="true">'+String(index+1).padStart(2,"0")+'</span>' : "";
    let content;
    if (part.table) {
      content = '<div class="document-table-scroll"><table class="document-table"><thead><tr>'+
        part.table.columns.map(column=>'<th scope="col">'+esc(column)+'</th>').join("")+'</tr></thead><tbody>'+
        part.table.rows.map(row=>'<tr>'+row.map((cell,cellIndex)=>(cellIndex ? '<td>' : '<th scope="row">')+esc(cell)+(cellIndex ? '</td>' : '</th>')).join("")+'</tr>').join("")+
        '</tbody></table></div>';
    } else if (part.format === "steps" || part.format === "checklist") {
      const tag = part.format === "steps" ? "ol" : "ul";
      content = '<'+tag+' class="document-'+part.format+'">'+part.items.map(line=>'<li>'+esc(line)+'</li>').join("")+'</'+tag+'>';
    } else if (part.faq) {
      content = '<div class="document-faq">'+part.faq.map(([question,answer])=>'<div><h3>'+esc(question)+'</h3><p>'+esc(answer)+'</p></div>').join("")+'</div>';
    } else content = part.items.map(line=>'<p>'+esc(line)+'</p>').join("");
    return '<section class="work-article-section"><h2>'+number+esc(part.title)+'</h2>'+content+'</section>';
  }

  function article(item,view,reader = false) {
    const isNotice = view === "notice";
    const parent = isNotice ? "notices" : "knowledge";
    const sections = item.sections.map((part,index)=>articleSection(part,index,reader)).join("");
    const service = find(data.services,item.service);
    const related = (item.related || []).map(id => find(data.documents,id)).filter(Boolean);
    const breadcrumb = reader ? "" : '<nav class="work-breadcrumb">'+link("返回"+(isNotice ? "通知公告" : "员工服务中心"),parent)+'</nav>';
    const footer = reader ? "" : '<footer class="work-actions">'+(service ? link(service.title,"service",service.id,"primary") : "")+related.map(doc => link(doc.title,"document",doc.id)).join("")+'</footer>';
    const group = reader
      ? '<div class="document-kicker"><span>'+esc(item.group)+'</span>'+(item.version ? '<span class="document-version">v'+esc(item.version)+'</span>' : "")+'</div>'
      : '<span class="work-tag">'+esc(isNotice ? "通知公告" : item.group)+'</span>';
    main.innerHTML = breadcrumb+'<article class="work-card work-article"'+(reader ? "" : ' style="max-width:880px;margin-inline:auto"')+'><header>'+group+'<h1>'+esc(item.title)+'</h1><p class="work-meta"><span>'+esc(item.department)+'</span><time>'+esc(item.date)+'</time></p></header><p class="work-callout">'+esc(item.summary)+'</p>'+sections+footer+'</article>';
  }

  function control(field,value) {
    const attributes = {...field};
    if (field.type === "date" && field.future) attributes.min = records.shanghaiDate(new Date());
    const attrs = ' name="'+field.key+'" '+(field.required ? "required " : "")+
      ["min","max","step","placeholder"].filter(key => attributes[key] != null).map(key => key+'="'+esc(attributes[key])+'"').join(" ");
    if (field.type === "asset-select") return '<select'+attrs+'><option value="">请选择要更换的设备</option>'+data.myAssets.map(asset =>
      '<option value="'+esc(asset.id)+'"'+(asset.id === value ? ' selected' : '')+'>'+esc(asset.name+" · "+asset.model)+'</option>'
    ).join("")+'<option value="asset-unlisted"'+(value === "asset-unlisted" ? ' selected' : '')+'>列表里没有，待核实原设备</option></select>';
    if (field.options) return '<select'+attrs+'><option value="">请选择</option>'+field.options.map(option => '<option'+(option === value ? ' selected' : '')+'>'+esc(option)+'</option>').join("")+'</select>';
    if (field.type === "textarea") return '<textarea maxlength="1000"'+attrs+'>'+esc(value)+'</textarea>';
    return '<input type="'+field.type+'" maxlength="1000" value="'+esc(value)+'"'+attrs+'>';
  }

  function summary(service,values) {
    const fields = service.fields || [
      {key:"booking_id",label:"预订编号"},{key:"meeting_title",label:"会议主题"},
      {key:"room_name",label:"会议室"},{key:"office_site",label:"园区"},{key:"location",label:"楼层"},
      {key:"start_time",label:"开始时间"},{key:"end_time",label:"结束时间"},{key:"capacity",label:"参会人数"}
    ];
    const pairs = fields.map(field => [field.label,field.type === "asset-select"
      ? values.asset_display || (values.asset_unlisted || values.asset_ref === "asset-unlisted" ? "待资产管理员核实" : data.myAssets.find(asset => asset.id === values.asset_ref)?.name)
      : values[field.key]]);
    if (values.expenses?.length) {
      const lines = values.expenses.filter(line => line.name || line.amount);
      lines.forEach(line => pairs.push([line.name || "未命名明细",line.amount ? "¥"+line.amount : "金额未填写"]));
      if (lines.length) pairs.push(["费用合计","¥"+records.total(lines)]);
    }
    if (values.attachments?.length) pairs.push(["附件名称",values.attachments.join("、")]);
    return '<dl class="work-summary">'+pairs.filter(([,value]) => value).map(([name,value]) => {
      const display = String(value).replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}\+08:00)?$/,"$1 $2");
      return '<dt>'+esc(name)+'</dt><dd>'+esc(display)+'</dd>';
    }).join("")+'</dl>';
  }


  const serviceDetails = {
    meeting: {
      owner:"行政服务", tips:["按日期、时段、园区及参会人数筛选。","选择房间并核对会议主题后，再确认预订。","如无符合条件的房间，可调整时间或设备要求。"]
    },
    leave: {
      owner:"人力资源", sections:[["休假信息","leave_type start end reason"],["工作交接","handover contact handover_note"]],
      tips:["先核对假别及可用余额。","跨休息日的区间不等于实际扣减天数，计假结果以 HR 系统为准。"]
    },
    expense: {
      owner:"财务服务", sections:[["报销信息","expense_type project start end trip_ref reason"]], attachment:"票据与证明材料",
      tips:["按实际支出逐笔登记，金额以人民币填写。","差旅报销可填写关联出差单号，避免重复报销。"]
    },
    it: {
      owner:"IT 服务台", sections:[["故障信息","subject issue_type urgency occurred device network reason"],["联系信息","contact"]], attachment:"故障截图与日志",
      tips:["描述实际报错、影响范围和复现步骤。","添加截图前请遮盖账号凭据和敏感数据。"]
    },
    equipment: {
      owner:"资产管理", sections:[["申领信息","request_type equipment_type equipment_name asset_ref quantity office needed reason"],["领用联系","contact"]],
      tips:["设备更换时，从本人名下设备中选择即可。","期望领用日用于安排发放，具体时间取决于库存。"]
    }
  };

  function steps(labels,current) {
    return labels.map((label,index) =>
      '<li class="'+(index === current ? "active" : index < current ? "complete" : "")+'"'+
      (index === current ? ' aria-current="step"' : "")+'><span>'+(index < current ? "✓" : index+1)+'</span>'+esc(label)+'</li>'
    ).join("");
  }

  function leaveBalancePage(service) {
    main.innerHTML = '<nav class="work-breadcrumb"><a href="'+esc(home)+'">首页</a><span aria-hidden="true">›</span><strong>假期查询</strong></nav>'+
      heading(service.title,service.summary)+'<section class="work-card work-section"><div id="leave-balance-content" aria-live="polite"></div>'+
      '<div class="work-form-footer"><button type="button" class="work-button" id="refresh-leave-balance">重新查询</button>'+link("申请请假","service","leave","primary")+'</div></section>';
    const content = main.querySelector("#leave-balance-content");
    const refresh = main.querySelector("#refresh-leave-balance");
    async function load() {
      refresh.disabled = true;
      content.textContent = "正在查询假期余额…";
      try {
        if (!await window.PortalBackend?.ready) throw new Error("暂时无法查询假期余额，请稍后重试。");
        const result = await window.PortalBackend.json("/api/leave-balances");
        if (!content.isConnected) return;
        content.innerHTML = result.balances.length ? '<div class="leave-balance-scroll"><table class="leave-balance-table"><caption>我的假期余额</caption><thead><tr>'+
          ["假期类型","可用","已使用","审批中占用","总额度"].map(label=>'<th scope="col">'+label+'</th>').join("")+'</tr></thead><tbody>'+
          result.balances.map(item=>'<tr><th scope="row">'+esc(item.type)+'</th>'+["available","used","pending","total"].map(key=>'<td>'+esc(item[key])+' 天</td>').join("")+'</tr>').join("")+
          '</tbody></table></div>' : '<p>尚未配置假期账户，请联系 HR 核实。</p>';
      } catch (error) {
        if (content.isConnected) content.textContent = error.message;
      } finally { if (refresh.isConnected) refresh.disabled = false; }
    }
    refresh.onclick = load;
    load();
  }

  function servicePage(service,draftId) {
    if (service.id === "leave_balance") { leaveBalancePage(service); return; }
    const detail = serviceDetails[service.id];
    const guide = find(data.documents,service.guide);
    const isMeeting = service.id === "meeting";
    const labels = isMeeting ? ["设置条件","选择会议室","核对预订","完成"] : ["填写申请","核对信息","保存记录"];
    main.innerHTML =
      '<div class="service-workspace"><nav class="work-breadcrumb" aria-label="面包屑"><a href="'+esc(home)+'">首页</a><span aria-hidden="true">›</span><a href="#view=apps">员工服务</a><span aria-hidden="true">›</span><strong>'+esc(service.title)+'</strong></nav>'+
      '<header class="service-hero"><div class="service-identity"><div class="service-icon"><svg aria-hidden="true"><use href="#i-'+esc(service.icon)+'"/></svg></div><div><h1>'+esc(service.title)+'</h1><p>'+esc(service.summary)+'</p></div></div>'+link(isMeeting ? "我的预订" : "我的申请","requests",detail ? service.id : undefined)+'</header>'+
      '<div class="work-service-layout"><section class="work-card service-main"><ol class="work-steps" aria-label="办理进度"></ol><div id="service-content"></div></section>'+
      '<aside class="work-aside"><section class="work-card service-help"><span class="work-tag blue">'+esc(detail?.owner || service.category)+'</span><h2>办理须知</h2><ul>'+ (detail?.tips || ["请核对信息后保存。"]).map(tip=>'<li>'+esc(tip)+'</li>').join("")+'</ul>'+
      link("查看操作指引","document",guide.id,"text")+'</section><section class="work-card service-help"><h2>记录与状态</h2><p>'+ (isMeeting ? "预订记录保存在当前浏览器，供原型演示使用。" : "可先保存草稿，随后在「我的申请」继续填写。")+'</p></section></aside></div></div>';
    const content = main.querySelector("#service-content");
    const setStep = index => { main.querySelector(".work-steps").innerHTML = steps(labels,index); };
    setStep(0);
    function localPage() {
      if (isMeeting) meetingPage(content,setStep);
      else requestForm(service,detail,content,setStep,draftId);
    }
    if (!window.PortalBackend) { localPage(); return; }
    window.PortalBackend.ready.then(active => {
      if (!content.isConnected) return;
      if (active && ["meeting","leave","equipment"].includes(service.id)) {
        const notice = main.querySelector(".work-aside .service-help:last-child p");
        notice.textContent = "办理结果保存在服务端，可在「我的申请」查看。请核对信息后确认提交。";
        if (service.id === "meeting") main.querySelector(".service-main .work-steps").setAttribute("aria-label","会议室办理进度");
        backendService(content,setStep,service);
      } else localPage();
    });
  }

  async function backendService(content,setStep,service,action) {
    content.textContent = "正在连接办理服务…";
    try {
      const result = action ?
        await window.PortalBackend.run({action}) :
        await window.PortalBackend.json("/api/workflows/start",{intent:service.id,slots:{}});
      if (!content.isConnected) return;
      setStep(result.status === "success" ? (service.id === "meeting" ? 3 : 2) :
        result.status === "awaiting_confirmation" ? (service.id === "meeting" ? 2 : 1) :
        result.status === "awaiting_selection" ? 1 : 0);
      content.replaceChildren();
      const text = document.createElement("p"); text.className = "service-duration"; text.textContent = result.text;
      content.append(text);
      window.PortalBackend.render(content,result,{onAction:meta => backendService(content,setStep,service,meta)});
      if (result.committed) content.insertAdjacentHTML("beforeend",'<div class="work-form-footer">'+link("查看我的申请","requests",service.id)+'</div>');
    } catch (error) {
      if (!content.isConnected) return;
      content.replaceChildren();
      const message = document.createElement("p"); message.className = "work-error"; message.setAttribute("role","alert"); message.textContent = error.message;
      const retry = document.createElement("button"); retry.className = "work-button"; retry.textContent = action ? "刷新当前任务" : "重新打开";
      retry.onclick = () => backendService(content,setStep,service,action ? {...action,action:"refresh"} : undefined);
      content.append(message,retry);
    }
  }

  function loadServerRecords(view,id) {
    const expectedHash = location.hash;
    window.PortalBackend?.ready.then(async active => {
      if (!active) return;
      try {
        const result = await window.PortalBackend.json("/api/requests");
        if (location.hash !== expectedHash) return;
        const statusText = state => state === "confirmed" ? "已预订" : state === "pending_asset_verification" ? "待核实原设备" : "待审批";
        if (view === "requests") {
          const items = result.requests.filter(row => !id || row.intent === id).map(row => ({
            id:row.id,view:"request",kind:statusText(row.status),
            title:row.payload.title || row.payload.subject || find(data.services,row.intent)?.title || "业务申请",
            summary:row.created.replace("T"," ").slice(0,16)
          }));
          main.innerHTML = heading(id === "meeting" ? "我的预订" : "我的申请","服务端业务记录")+list(items);
          return;
        }
        const record = result.requests.find(row => row.id === id);
        if (!record) { main.innerHTML = empty("未找到对应业务记录。"); return; }
        const service = find(data.services,record.intent);
        const payload = {...record.payload};
        if (record.intent === "meeting") Object.assign(payload,{
          booking_id:record.id,meeting_title:payload.title,
          start_time:payload.date+"T"+payload.start,end_time:payload.date+"T"+payload.end
        });
        main.innerHTML = heading(service.title,statusText(record.status))+
          '<section class="work-card service-record">'+summary(service,payload)+
          '<p class="service-duration">业务编号 '+esc(record.id)+'</p><div class="work-form-footer">'+link("返回我的申请","requests",record.intent)+'</div></section>';
      } catch (error) {
        if (location.hash === expectedHash) {
          main.innerHTML = empty(error.message);
          const retry = document.createElement("button"); retry.className = "work-button"; retry.textContent = "重新加载";
          retry.onclick = () => loadServerRecords(view,id); main.append(retry);
        }
      }
    });
  }

  function meetingPage(content,setStep) {
    const engine = window.MeetingBooking;
    engine.resetTask();
    const controller = new AbortController();
    meetingRun = controller;
    const delay = () => Promise.resolve();
    const adapters = engine.createDemoAdapters(delay,{
      getBookings: () => records.read().filter(item => item.type === "meeting").map(item => item.values),
      makeBookingId: params => "MR-" + params.start_time.slice(0,10).replaceAll("-","") + "-" + records.uid().slice(-8).toUpperCase()
    });
    const filters = ["office_site","capacity","date","start","end","equipment"];
    async function run(action) {
      window.MeetingBookingUI.deactivate();
      const progress = document.createElement("p");
      progress.className = "work-loading";
      progress.setAttribute("role","status");
      progress.setAttribute("aria-busy","true");
      progress.textContent = "正在处理预订…";
      content.replaceChildren(progress);
      try {
        const result = await engine.execute({
          question: action ? "" : "预订会议室",action,now:new Date(),signal:controller.signal,adapters,delay,
          step: async (_,message,operation) => { progress.textContent = message; return operation(); }
        });
        if (controller.signal.aborted) return;
        const view = result.view;
        const receipt = view?.receipt;
        content.replaceChildren();
        if (view?.type === "input") {
          const titleOnly = (action?.editTitle && result.status === "editing") || (view.fields.length === 1 && view.fields[0] === "title");
          setStep(titleOnly ? 2 : 0);
          if (titleOnly) {
            view.fields = ["title"];
            view.selected_room ||= engine.getState().selected;
          } else {
            view.fields = filters;
            view.values.date ||= records.shanghaiDate(new Date());
          }
          if (action?.type === "meeting-update" && result.status === "needs_input" && !titleOnly) {
            content.innerHTML = '<p class="work-error" role="alert">请检查查询条件。开始时间须晚于当前时间，结束时间须晚于开始时间。</p>';
          }
        } else if (view?.type === "rooms" || result.status === "no_results") {
          setStep(1);
          const values = view?.filters || engine.getState().slots;
          const criteria = [values.date,values.start+" – "+values.end,values.office_site,values.capacity+" 人",...(values.equipment || [])];
          content.innerHTML = '<div class="service-criteria" aria-label="查询条件">'+criteria.map(value => '<span>'+esc(value)+'</span>').join("")+'</div>';
          if (result.status === "no_results") content.insertAdjacentHTML("beforeend",empty("没有符合条件的空闲会议室。可更换时段、园区或设备要求后再查。"));
          else if (action?.type === "meeting-confirm") content.insertAdjacentHTML("beforeend",'<p class="work-error" role="alert">'+esc(result.text)+'</p>');
        } else if (view?.type === "summary") {
          setStep(2);
          view.edit = {...view.edit,label:"修改会议主题",editTitle:true};
        } else if (receipt) {
          setStep(3);
        } else if (result.text) {
          content.innerHTML = '<p class="work-callout" role="status">'+esc(result.text)+'</p>';
        }
        window.MeetingBookingUI.render(content,result,{onAction:run,portal:true});
        if (receipt) {
          try {
            const record = records.save({type:"meeting",status:"本地预订",values:receipt,requestKey:receipt.booking_id});
            content.insertAdjacentHTML("beforeend",'<p class="service-duration" role="status">预订已保存到当前浏览器。</p><div class="work-form-footer">'+link("查看预订记录","request",record.id)+button("再订一间","primary")+'</div>');
          } catch {
            content.insertAdjacentHTML("beforeend",'<p class="work-error" role="alert">浏览器无法保存预订记录。</p><div class="work-form-footer">'+button("再订一间")+'</div>');
          }
          content.querySelector(".work-form-footer button").onclick = () => { engine.resetTask(); setStep(0); run(); };
        }
      } catch {
        if (controller.signal.aborted) return;
        content.innerHTML = '<p class="work-error" role="alert">暂时无法完成操作，请重新查询。</p>'+button("重新开始");
        content.querySelector("button").onclick = () => { engine.resetTask(); setStep(0); run(); };
      }
    }
    run();
  }

  function requestForm(service,detail,content,setStep,draftId) {
    const draft = draftId && records.read().find(item => item.id === draftId && item.type === service.id && ["草稿","待提交"].includes(item.status));
    if (draftId && !draft) {
      content.innerHTML = empty("这条申请无法编辑。")+link("返回我的申请","requests",service.id);
      return;
    }
    let values = draft ? {...draft.values} : service.id === "equipment" ? {request_type:"新领",quantity:1} : {};
    let files = values.attachments || [];
    const requestKey = draft?.requestKey || records.uid();
    const sections = detail?.sections || [["申请信息",service.fields.map(field=>field.key).join(" ")]];
    const expense = service.id === "expense";

    function save(status) {
      const record = records.save({id:draft?.id,type:service.id,values,status,requestKey});
      location.hash = url("request",record.id);
    }
    function trySave(status,action,error) {
      action.disabled = true;
      try { save(status); }
      catch {
        error.textContent = "当前浏览器无法保存，请检查存储设置后重试。";
        action.disabled = false;
      }
    }

    function edit() {
      setStep(0);
      content.innerHTML = '<form novalidate>'+sections.map(([title,keys]) =>
        '<section class="service-form-section"><h2>'+esc(title)+'</h2><div class="work-form-grid">'+
        keys.split(" ").map(key => {
          const field = service.fields.find(item=>item.key === key);
          return '<label class="work-field '+(field.type === "textarea" ? "wide" : "")+'" data-field="'+field.key+'"><span>'+esc(field.label)+(field.required ? ' <b aria-hidden="true">*</b>' : "")+'</span>'+control(field,values[field.key])+'<small class="work-error" id="field-error-'+field.key+'" hidden></small></label>';
        }).join("")+'</div>'+(service.id === "leave" && title === "休假信息" ? '<p class="service-duration" data-duration hidden></p>' : "")+'</section>'
      ).join("")+(expense ? '<section class="work-expenses"><div class="service-section-heading"><h2>费用明细</h2><button class="work-button" type="button" data-add-line>＋ 添加明细</button></div><div data-lines></div><p class="work-total">报销合计 <strong data-total>¥0.00</strong></p></section>' : "")+
      (detail?.attachment ? '<section class="service-form-section"><h2>'+esc(detail.attachment)+'</h2><div class="work-attachments"><label class="work-button work-upload">＋ 选择附件<input class="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" multiple></label><small>PDF、PNG、JPG，每个文件不超过 10 MB。当前仅登记文件名。</small><div class="work-file-list"></div><p class="work-error" data-file-error role="alert"></p></div></section>' : "")+
      '<p role="alert" class="work-error" data-form-error></p><div class="work-form-footer"><button type="button" class="work-button" data-draft>保存草稿</button><button class="work-button primary">下一步：核对信息</button></div></form>';
      const form = content.querySelector("form");
      const error = form.querySelector("[data-form-error]");
      const fields = [...form.querySelectorAll("[data-field]")];
      function readForm() {
        const inputs = Object.fromEntries([...new FormData(form)].filter(([,value]) => typeof value === "string").map(([name,value]) => [name,value.trim()]));
        if (expense) inputs.expenses = [...form.querySelectorAll(".work-expense-row")].map(row => {
          const [name,amount] = row.querySelectorAll("input");
          return {name:name.value.trim(),amount:amount.value};
        });
        if (detail?.attachment) inputs.attachments = files;
        return inputs;
      }
      function updateFields() {
        const inputs = readForm();
        for (const wrapper of fields) {
          const schema = service.fields.find(item => item.key === wrapper.dataset.field);
          wrapper.hidden = !records.fieldVisible(schema,inputs);
          wrapper.querySelector("[name]").disabled = wrapper.hidden;
        }
        const duration = form.querySelector("[data-duration]");
        if (duration) {
          const hours = (Date.parse(inputs.end + ":00+08:00") - Date.parse(inputs.start + ":00+08:00")) / 3600000;
          duration.hidden = !(hours > 0);
          if (hours > 0) duration.textContent = "起止间隔 "+Number(hours.toFixed(2))+" 小时。实际计假时长以考勤规则为准。";
        }
      }
      function updateTotal() {
        if (expense) form.querySelector("[data-total]").textContent = "¥"+records.total(readForm().expenses);
      }
      if (expense) {
        const lines = form.querySelector("[data-lines]");
        function addLine(line={}) {
          const row = document.createElement("div");
          row.className = "work-expense-row";
          row.innerHTML = '<input aria-label="费用项目" placeholder="例如：市内交通" required maxlength="100" value="'+esc(line.name)+'"><input type="number" aria-label="金额（元）" placeholder="金额（元）" required min="0.01" max="1000000" step="0.01" value="'+esc(line.amount)+'"><button type="button" aria-label="删除明细">×</button>';
          row.querySelector("button").onclick = () => {
            if (lines.children.length > 1) row.remove();
            else row.querySelectorAll("input").forEach(input => { input.value = ""; });
            updateTotal();
          };
          lines.append(row);
          return row;
        }
        (values.expenses?.length ? values.expenses : [{}]).forEach(addLine);
        form.querySelector("[data-add-line]").onclick = () => addLine().querySelector("input").focus();
        updateTotal();
      }
      if (detail?.attachment) {
        const input = form.querySelector('[type="file"]');
        const fileList = form.querySelector(".work-file-list");
        const fileError = form.querySelector("[data-file-error]");
        const showFiles = () => {
          fileList.innerHTML = files.map((name,index) => '<span>'+esc(name)+' <button type="button" data-remove="'+index+'" aria-label="移除 '+esc(name)+'">×</button></span>').join("");
        };
        input.onchange = () => {
          const chosen = [...input.files];
          const invalid = chosen.some(file => !/\.(pdf|jpe?g|png)$/i.test(file.name) || file.size > 10 * 1024 * 1024);
          const next = [...new Set([...files,...chosen.map(file => file.name)])];
          fileError.textContent = invalid ? "请选择不超过 10 MB 的 PDF、PNG 或 JPG。" : next.length > 5 ? "最多可登记 5 个附件。" : "";
          if (!fileError.textContent) files = next;
          input.value = "";
          showFiles();
        };
        fileList.onclick = event => {
          const remove = event.target.closest("[data-remove]");
          if (!remove) return;
          files = files.filter((_,index) => index !== Number(remove.dataset.remove));
          fileError.textContent = "";
          showFiles();
        };
        showFiles();
      }
      updateFields();
      form.oninput = () => { updateFields(); updateTotal(); };
      form.querySelector("[data-draft]").onclick = event => {
        values = readForm();
        trySave("草稿",event.currentTarget,error);
      };
      form.onsubmit = event => {
        event.preventDefault();
        values = readForm();
        const errors = records.validate(service,values);
        for (const wrapper of fields) {
          const input = wrapper.querySelector("[name]");
          const note = wrapper.querySelector("small");
          note.textContent = errors[input.name] || "";
          note.hidden = !note.textContent;
          if (note.hidden) {
            input.removeAttribute("aria-invalid");
            input.removeAttribute("aria-describedby");
          } else {
            input.setAttribute("aria-invalid","true");
            input.setAttribute("aria-describedby",note.id);
          }
        }
        if (Object.keys(errors).length) {
          error.textContent = errors.expenses || "请检查标注的字段。";
          (form.querySelector('[aria-invalid="true"]') || form.querySelector(".work-expense-row input"))?.focus();
          return;
        }
        review();
      };
    }

    function review() {
      setStep(1);
      content.innerHTML = '<h2 tabindex="-1">核对'+esc(service.title)+'信息</h2>'+summary(service,values)+
        '<p class="service-duration">保存后可在「我的申请」查看。此门户尚未连接企业审批系统。</p><p class="work-error" role="alert"></p>'+
        '<div class="work-form-footer">'+button("返回修改")+button("确认保存","primary")+'</div>';
      content.querySelector("h2").focus();
      const [back,confirm] = content.querySelectorAll("button");
      back.onclick = edit;
      confirm.onclick = () => trySave(service.id === "schedule" ? "已保存" : "待提交",confirm,content.querySelector('[role="alert"]'));
    }
    edit();
  }

  function searchable(title,items,initial="") {
    main.innerHTML = heading(title)+'<form class="work-search"><input type="search" aria-label="搜索关键词" placeholder="输入关键词" value="'+esc(initial)+'"><button class="work-button primary">搜索</button></form><div data-results></div>';
    const form = main.querySelector("form");
    const input = form.querySelector("input");
    const refresh = () => {
      const query = input.value.trim().toLowerCase();
      main.querySelector("[data-results]").innerHTML = list(items.filter(item => (item.title+" "+item.summary).toLowerCase().includes(query)));
    };
    form.onsubmit = event => { event.preventDefault(); refresh(); };
    input.oninput = refresh;
    refresh();
  }

  function render() {
    meetingRun?.abort();
    window.MeetingBookingUI.deactivate();
    const params = new URLSearchParams(location.hash.slice(1));
    const view = params.get("view") || "apps";
    const id = params.get("id");
    const reader = view === "document" && params.get("reader") === "1";
    document.body.classList.toggle("source-reader",reader);
    document.title = "员工服务 · 企业协同办公";
    if (view === "notice" || view === "document") {
      const item = find(view === "notice" ? data.notices : data.documents,id);
      if (item) { document.title = item.title; article(item,view,reader); return; }
      if (reader) { main.innerHTML = empty("该文档暂不可用。"); return; }
    }
    if (view === "service") {
      const service = find(data.services,id);
      if (service) { document.title = service.title; servicePage(service,params.get("draft")); return; }
    }
    if (view === "notices") { searchable("通知公告",rows(data.notices,"notice")); return; }
    if (view === "search") { searchable("搜索员工服务",data.search(""),params.get("q") || ""); return; }
    if (view === "knowledge") {
      main.innerHTML = heading("员工服务中心")+[...new Set(data.documents.map(doc => doc.group))].map(group =>
        '<section><h2>'+esc(group)+'</h2>'+list(rows(data.documents.filter(doc => doc.group === group),"document"))+'</section>'
      ).join("");
      return;
    }
    if (view === "apps") {
      main.innerHTML = heading("全部应用")+list([...rows(data.services,"service"),...rows(data.hubs,"hub")]);
      return;
    }
    if (view === "hub") {
      const hub = find(data.hubs,id);
      if (hub) {
        main.innerHTML = heading(hub.title,hub.summary)+list([...rows(hub.services.map(key => find(data.services,key)),"service"),...rows(hub.documents.map(key => find(data.documents,key)),"document")]);
        return;
      }
    }
    if (view === "requests" || view === "schedules") {
      if (view === "requests") loadServerRecords(view,id);
      const schedules = view === "schedules";
      const filter = !schedules && find(data.services,id);
      const items = records.read().filter(item => (item.type === "schedule") === schedules && (!filter || item.type === filter.id)).map(item => ({
        id:item.id,title:item.values.title || item.values.meeting_title || item.values.subject || find(data.services,item.type)?.title || "申请",
        summary:item.values.room_name || item.values.start || item.values.reason || "查看办理详情",kind:item.status,view:"request"
      }));
      const actions = filter ? '<div class="work-actions">'+link("全部申请","requests")+link(filter.id === "meeting" ? "预订会议室" : "新建申请","service",filter.id,"primary")+'</div>' : "";
      main.innerHTML = heading(schedules ? "全部日程" : filter?.id === "meeting" ? "我的预订" : "我的申请",filter?.title || "")+
        (schedules ? '<div class="work-actions">'+link("新建日程","service","schedule","primary")+'</div><section class="work-card work-section"><h2>员工服务项目周会</h2><p>10:00 – 11:00</p></section>' : actions)+
        '<div class="service-records">'+(items.length ? list(items) : empty("暂无记录"))+'</div>';
      return;
    }
    if (view === "request") {
      loadServerRecords(view,id);
      const item = find(records.read(),id);
      const service = item && find(data.services,item.type);
      if (service) {
        const editable = ["草稿","待提交"].includes(item.status);
        const schedules = item.type === "schedule";
        const recordLabel = item.type === "meeting" ? "我的预订" : "我的申请";
        const savedAt = new Date(item.updatedAt || item.createdAt);
        const timestamp = Number.isNaN(savedAt.getTime()) ? "" : new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",dateStyle:"medium",timeStyle:"short"}).format(savedAt);
        main.innerHTML = heading(item.values.title || item.values.meeting_title || service.title)+
          '<section class="work-card service-record"><header><div><h2>'+esc(item.status === "草稿" ? "草稿已保存" : item.status === "待提交" ? "申请已保存" : "记录详情")+'</h2><p>保存于当前浏览器 '+esc(timestamp)+'</p></div><span class="work-tag blue">'+esc(item.status)+'</span></header>'+
          summary(service,item.values)+'<div class="work-form-footer">'+link(schedules ? "全部日程" : recordLabel,schedules ? "schedules" : "requests",schedules ? undefined : item.type)+
          (editable ? '<a class="work-button primary" href="'+esc(url("service",item.type,item.id))+'">继续编辑</a>' : link("返回办理","service",item.type,"primary"))+'</div></section>';
        return;
      }
    }
    if (view === "profile") {
      main.innerHTML = heading("个人中心")+'<section class="work-card work-section"><h2>员工服务</h2><div class="work-actions">'+link("我的申请","requests")+link("我的日程","schedules")+'</div></section>';
      return;
    }
    main.innerHTML = empty("该页面暂不可用。")+link("查看全部应用","apps");
  }
  window.addEventListener("hashchange",() => { render(); window.scrollTo(0,0); });
  render();
})();
