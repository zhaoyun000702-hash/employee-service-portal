(() => {
  "use strict";
  const carousel = document.getElementById("news-carousel");
  const slides = Array.from(carousel.querySelectorAll(".slide"));
  const dots = Array.from(carousel.querySelectorAll(".carousel-dot"));
  const status = document.getElementById("carousel-status");
  const newsDialog = document.getElementById("news-dialog");
  const newsTitle = document.getElementById("news-dialog-title");
  const newsBody = document.getElementById("news-dialog-body");
  const concierge = document.getElementById("robot-concierge");
  const launcher = document.getElementById("robot-launcher");
  const welcome = document.getElementById("robot-welcome");
  const welcomeText = "hi，我是智能客服，请问有什么可以帮助您？";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let welcomeAnimation;
  let assistantDocumentUrl;
  let entranceTimer;
  let welcomeDismissTimer;
  let activeIndex = 0;
  let touchStart = null;
  const returnFocus = new WeakMap();
  const articles = [
    {
      title: "员工智能客服全新上线", description: "问制度、查进度、办业务，办公服务更便捷。", icon: "✦",
      content: [
        ["p","员工智能客服现已上线，为你提供统一、便捷的员工服务入口。"],
        ["h3","你可以在这里做什么？"],
        ["ul",["问制度：查阅人事、财务、IT、行政等服务指引。","查进度：了解报销、业务申请等事项的查询方式。","办业务：找到请假申请、设备申领等常用服务入口。"]],
        ["p","点击“立即体验”，开启你的智能办公服务体验。"]
      ]
    },
    {
      title: "员工服务指引，一站轻松查阅", description: "常用制度、业务流程和操作手册，集中查阅。", icon: "▤",
      content: [
        ["p","员工服务中心汇集日常办公所需的操作指引，可通过首页“员工服务中心”区域查找相关手册。"],
        ["h3","常用服务指引"],
        ["ul",["差旅报销：了解提交入口、材料准备和进度查询方式。","请假申请：了解申请入口、信息填写和审批流程。","账号权限：了解账号申请、权限申请与问题反馈方式。","企业邮箱与访客预约：查找对应的配置和预约说明。"]],
        ["p","具体适用条件及办理要求，请以企业已发布的制度和操作手册为准。"]
      ]
    },
    {
      title: "信息安全提醒：守护账号，安心办公", description: "做好账号保护，规范使用 VPN，防范办公风险。", icon: "◇",
      content: [
        ["p","请在日常办公中保护个人账号及企业信息，发现异常及时联系 IT 服务人员。"],
        ["h3","办公安全小提醒"],
        ["ul",["不向他人透露密码、验证码或其他身份凭据。","通过企业认可的入口访问业务系统和 VPN。","谨慎打开来源不明的链接、附件和登录页面。","发现异常登录、可疑邮件或账号问题，及时通过 IT 服务台反馈。"]]
      ]
    }
  ];
  function showSlide(index) {
    activeIndex = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((slide,i) => { const active = i === activeIndex; slide.hidden = !active; slide.inert = !active; slide.classList.toggle("is-active",active); });
    dots.forEach((dot,i) => {
      dot.classList.toggle("is-active",i === activeIndex);
      if (i === activeIndex) dot.setAttribute("aria-current","true"); else dot.removeAttribute("aria-current");
    });
    carousel.dataset.slide = String(activeIndex);
    status.textContent = "第 " + (activeIndex + 1) + " 条，共 3 条：" + articles[activeIndex].title;
  }
  document.getElementById("carousel-prev").addEventListener("click",() => showSlide(activeIndex - 1));
  document.getElementById("carousel-next").addEventListener("click",() => showSlide(activeIndex + 1));
  dots.forEach((dot,i) => dot.addEventListener("click",() => showSlide(i)));
  carousel.addEventListener("keydown",(event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(activeIndex - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showSlide(activeIndex + 1); }
  });
  carousel.addEventListener("touchstart",(event) => {
    if (event.touches.length !== 1) { touchStart = null; return; }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  },{ passive: true });
  carousel.addEventListener("touchend",(event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) showSlide(activeIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  },{ passive: true });
  function openDialog(dialog) {
    if (dialog.open) return;
    let trigger = document.activeElement;
    const parentDialog = trigger && trigger.closest("dialog");
    if (parentDialog && !parentDialog.open) trigger = returnFocus.get(parentDialog) || carousel;
    returnFocus.set(dialog,trigger);
    dialog.showModal();
  }
  function closeDialog(dialog) { if (dialog.open) dialog.close(); }
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click",() => closeDialog(document.getElementById(button.dataset.close)));
  });
  [newsDialog].forEach((dialog) => {
    dialog.addEventListener("click",(event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener("close",() => {
      const target = returnFocus.get(dialog);
      if (target && target.isConnected && !document.querySelector("dialog[open]")) target.focus({ preventScroll: true });
    });
  });
  function renderArticle(index) {
    const article = articles[index];
    newsTitle.textContent = article.title;
    newsBody.replaceChildren();
    const content = document.createElement("div");
    content.className = "article-content";
    article.content.forEach(([tag,value]) => {
      const node = document.createElement(tag);
      if (tag === "ul") value.forEach((line) => { const li = document.createElement("li"); li.textContent = line; node.append(li); });
      else node.textContent = value;
      content.append(node);
    });
    newsBody.append(content);
    if (index === 0) {
      const button = document.createElement("button");
      button.className = "article-action"; button.textContent = "立即体验员工智能客服";
      button.addEventListener("click",() => { closeDialog(newsDialog); openAssistant(); });
      newsBody.append(button);
    }
    openDialog(newsDialog);
  }
  document.getElementById("news-more").addEventListener("click",() => {
    newsTitle.textContent = "企业动态"; newsBody.replaceChildren();
    const list = document.createElement("div"); list.className = "news-list";
    articles.forEach((article,index) => {
      const button = document.createElement("button"); button.className = "news-list-item";
      const icon = document.createElement("span"); icon.className = "news-item-icon"; icon.textContent = article.icon; icon.setAttribute("aria-hidden","true");
      const copy = document.createElement("span"); copy.className = "news-item-copy";
      const title = document.createElement("strong"); title.textContent = article.title;
      const description = document.createElement("small"); description.textContent = article.description;
      copy.append(title,description);
      const arrow = document.createElement("span"); arrow.className = "news-item-arrow"; arrow.textContent = "›"; arrow.setAttribute("aria-hidden","true");
      button.append(icon,copy,arrow); button.addEventListener("click",() => renderArticle(index)); list.append(button);
    });
    newsBody.append(list); openDialog(newsDialog);
  });
  function typeText(element,text,{ onStep, onComplete } = {}) {
    const characters = Array.from(text);
    let index = 0;
    let timer;
    let stopped = false;
    const stop = () => { stopped = true; clearTimeout(timer); element.classList.remove("is-typing"); };
    const finish = () => {
      if (stopped) return;
      stop(); element.textContent = text; onStep?.(); onComplete?.();
    };
    element.textContent = "";
    if (reduceMotion) { finish(); return { finish, cancel: stop }; }
    element.classList.add("is-typing");
    const tick = () => {
      if (stopped) return;
      element.textContent = characters.slice(0,++index).join(""); onStep?.();
      if (index === characters.length) { finish(); return; }
      timer = setTimeout(tick,/[，。！？]/.test(characters[index - 1]) ? 180 : 58);
    };
    timer = setTimeout(tick,160);
    return { finish, cancel: stop };
  }
  function dismissWelcome() {
    clearTimeout(entranceTimer);
    clearTimeout(welcomeDismissTimer);
    welcomeAnimation?.cancel(); welcome.hidden = true;
    document.getElementById("robot-announcement").textContent = "";
    concierge.hidden = false;
    if (welcome.contains(document.activeElement) && !document.querySelector("dialog[open]")) launcher.focus({ preventScroll: true });
  }
  function openAssistant() {
    dismissWelcome();
    const bundled = document.getElementById("standalone-assistant-document");
    if (bundled && !assistantDocumentUrl) {
      const bytes = Uint8Array.from(atob(JSON.parse(bundled.textContent)),character => character.charCodeAt(0));
      const html = new TextDecoder().decode(bytes);
      assistantDocumentUrl = URL.createObjectURL(new Blob([html],{ type: "text/html;charset=utf-8" }));
    }
    const pageUrl = new URL("./assistant.html",window.location.href);
    const revision = document.querySelector?.('meta[name="portal-build"]')?.content;
    if (revision) pageUrl.searchParams.set("v",revision);
    const url = assistantDocumentUrl || pageUrl.href;
    window.open(url,"_blank","noopener,noreferrer,width=1440,height=960,resizable=yes,scrollbars=yes");
  }
  function setupRobotDragging() {
    let pointer = null;
    let suppressClick = false;
    const margin = 12;
    function placeRobot(left,top) {
      const maxLeft = Math.max(margin,document.documentElement.clientWidth - concierge.offsetWidth - margin);
      const maxTop = Math.max(margin,window.innerHeight - concierge.offsetHeight - margin);
      concierge.classList.add("is-positioned");
      Object.assign(concierge.style,{
        left: Math.max(margin,Math.min(left,maxLeft)) + "px",
        top: Math.max(margin,Math.min(top,maxTop)) + "px",
        right: "auto", bottom: "auto"
      });
    }
    function finishDrag(event) {
      if (!pointer || (event && event.pointerId !== pointer.id)) return;
      const finished = pointer;
      pointer = null;
      concierge.classList.remove("is-dragging");
      if (finished.moved) suppressClick = true;
      if (launcher.hasPointerCapture(finished.id)) launcher.releasePointerCapture(finished.id);
    }
    launcher.addEventListener("pointerdown",event => {
      if (!event.isPrimary || event.button !== 0 || pointer) return;
      suppressClick = false;
      const rect = concierge.getBoundingClientRect();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
      launcher.setPointerCapture(event.pointerId);
    });
    launcher.addEventListener("pointermove",event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.moved && Math.hypot(dx,dy) < 6) return;
      if (!pointer.moved) {
        pointer.moved = true;
        dismissWelcome();
        concierge.classList.add("is-dragging");
      }
      event.preventDefault();
      placeRobot(pointer.left + dx,pointer.top + dy);
    });
    ["pointerup","pointercancel","lostpointercapture"].forEach(name => launcher.addEventListener(name,finishDrag));
    launcher.addEventListener("click",event => {
      const pointerClick = event.detail > 0 || Boolean(event.pointerType);
      if (suppressClick && pointerClick) { suppressClick = false; event.preventDefault(); return; }
      suppressClick = false;
      openAssistant();
    });
    launcher.addEventListener("keydown",event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[event.key];
      if (!direction) return;
      event.preventDefault();
      finishDrag();
      dismissWelcome();
      const rect = concierge.getBoundingClientRect();
      const step = event.shiftKey ? 32 : 16;
      placeRobot(rect.left + direction[0] * step,rect.top + direction[1] * step);
    });
    window.addEventListener("resize",() => {
      finishDrag();
      if (!concierge.classList.contains("is-positioned")) return;
      const rect = concierge.getBoundingClientRect();
      placeRobot(rect.left,rect.top);
    });
    window.addEventListener("blur",() => finishDrag());
    window.addEventListener("pagehide",() => finishDrag());
  }
  setupRobotDragging();
  carousel.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click",() => {
      if (button.dataset.action === "assistant") openAssistant();
      else renderArticle(button.dataset.action === "handbook" ? 1 : 2);
    });
  });
  document.getElementById("online-service").addEventListener("click",openAssistant);
  document.getElementById("start-robot-chat").addEventListener("click",openAssistant);
  document.getElementById("dismiss-robot-welcome").addEventListener("click",() => { dismissWelcome(); launcher.focus({ preventScroll: true }); });
  entranceTimer = setTimeout(() => {
    concierge.hidden = false;
    welcomeAnimation = typeText(document.getElementById("robot-welcome-text"),welcomeText,{
      onComplete: () => {
        document.getElementById("robot-announcement").textContent = welcomeText;
        welcomeDismissTimer = setTimeout(dismissWelcome,3000);
      }
    });
  },reduceMotion ? 0 : 500);
  window.addEventListener("pagehide",dismissWelcome);
  let toastTimer;
  function showToast(text) {
    const toast = document.getElementById("portal-toast"); toast.textContent = text; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; },3200);
  }
  function showInfo(title,lines) {
    newsTitle.textContent = title; newsBody.replaceChildren();
    const content = document.createElement("div"); content.className = "article-content";
    lines.forEach(line => { const p = document.createElement("p"); p.textContent = line; content.append(p); });
    newsBody.append(content); openDialog(newsDialog);
  }
  const serviceDescriptions = {
    "会议室预定":["选择会议日期、起止时间、参会人数和设备需求，查询可用会议室后完成预订。"],
    "请假申请":["填写假期类型、开始时间、结束时间和请假事由，核对信息后提交申请。"],
    "费用报销":["准备发票和费用明细，填写报销单并提交；已提交的单据可在财务系统中查看审批进度。"],
    "IT报障":["请描述故障现象、出现时间与使用环境，附上报错截图，便于 IT 服务人员定位问题。"],
    "设备申领":["选择办公设备类型，填写使用用途和领用信息，提交后等待审核与发放。"],
    "账号权限/VPN":["请根据需要选择账号开通、权限申请或 VPN 支持服务。请勿提交密码或验证码。"]
  };
  document.querySelectorAll("[data-service]").forEach(button => button.addEventListener("click",() => {
    const name = button.dataset.service;
    if(name === "员工服务中心") { document.getElementById("manuals-title").scrollIntoView({behavior:"smooth",block:"center"}); return; }
    showInfo(name,serviceDescriptions[name] || ["在这里集中查看"+name+"相关的服务入口和操作指引。","当前可先通过员工智能客服了解办理方式。"]);
  }));
  document.querySelectorAll("[data-info]").forEach(button => button.addEventListener("click",() => {
    const name = button.dataset.info;
    if(name==="通知公告") { showInfo("通知公告",Array.from(document.querySelectorAll(".notice-row")).map(el => el.innerText.replace(/\n/g,"  "))); return; }
    showInfo(name,name==="使用帮助" ? ["通过快捷入口找到常用办公服务，通过员工服务中心查阅操作手册。","企业动态支持左右切换，点击“立即体验”或“在线客服”即可打开智能客服。"] : ["你可以在统一门户中查看日程、通知和常用办公服务。"]);
  }));
  document.querySelectorAll("[data-manual]").forEach(button => button.addEventListener("click",() => showInfo(button.dataset.manual,["操作入口：请在首页快捷入口或对应业务系统中进入相关服务。","办理前准备好所需信息，核对填写内容后再提交。具体材料与审批要求以企业正式发布的制度为准。"])));
  document.querySelectorAll("[data-notice]").forEach(button => button.addEventListener("click",() => showInfo(button.dataset.notice,[button.querySelector("time").textContent,"请及时关注本通知对应的服务安排。具体事项以企业发布的正式通知为准。"])));
  document.querySelectorAll("[data-quick-tab]").forEach(button => button.addEventListener("click",() => {
    document.querySelectorAll("[data-quick-tab]").forEach(tab => tab.setAttribute("aria-selected",String(tab === button)));
    document.querySelectorAll(".quick-card").forEach(card => { card.hidden = button.dataset.quickTab !== "常用服务" && card.dataset.category !== button.dataset.quickTab; });
  }));
  const manualSections = {
    "员工指南":["新员工入职指南","员工服务办理指南","办公资源使用指南","员工常用联系方式"],
    "规章制度":["员工考勤管理制度","费用报销管理制度","信息安全管理制度","办公资产管理制度"],
    "常见问题":["如何提交请假申请？","在哪里查询报销进度？","如何申领办公设备？","VPN 无法连接怎么办？"]
  };
  document.querySelectorAll("[data-manual-tab]").forEach(button => button.addEventListener("click",() => {
    document.querySelectorAll("[data-manual-tab]").forEach(tab => tab.setAttribute("aria-selected",String(tab === button)));
    const isManual = button.dataset.manualTab === "操作手册";
    document.getElementById("manual-artboard").hidden = !isManual;
    const list = document.getElementById("manual-list"); list.hidden = isManual; list.replaceChildren();
    if(!isManual) manualSections[button.dataset.manualTab].forEach(title => {
      const item = document.createElement("button"); item.textContent = title;
      item.addEventListener("click",() => showInfo(title,["请通过对应业务系统查看完整内容，或向员工智能客服咨询相关操作指引。"])); list.append(item);
    });
  }));
  document.querySelectorAll("[data-meeting]").forEach(button => button.addEventListener("click",() => {
    const card = document.getElementById("meeting-card"); card.querySelector(".meeting-actions").hidden = true;
    const response = card.querySelector(".meeting-response"); response.textContent = button.dataset.meeting; response.hidden = false;
    showToast("员工服务项目周会："+button.dataset.meeting);
  }));
  document.querySelectorAll("[data-schedule]").forEach(button => button.addEventListener("click",() => {
    document.querySelectorAll("[data-schedule]").forEach(tab => tab.setAttribute("aria-selected",String(tab === button)));
    document.getElementById("meeting-card").hidden = button.dataset.schedule === "待办";
  }));
  document.querySelectorAll("[data-focus-search]").forEach(button => button.addEventListener("click",() => document.querySelector("#portal-search input").focus()));
  document.getElementById("portal-search").addEventListener("submit",event => {
    event.preventDefault(); const query = event.currentTarget.querySelector("input").value.trim(); if(!query) return;
    const matches = Array.from(document.querySelectorAll("[data-service],[data-manual],[data-notice]")).map(el => el.dataset.service || el.dataset.manual || el.dataset.notice).filter(name => name.toLowerCase().includes(query.toLowerCase()));
    showInfo("搜索结果："+query,matches.length ? [...new Set(matches)] : ["暂未找到匹配的入口。试试“请假”“报销”“设备”或“VPN”。"]);
  });
  ["menu-toggle","apps-toggle"].forEach(id => document.getElementById(id).addEventListener("click",() => {
    document.getElementById("navigation-grid").scrollIntoView({behavior:"smooth",block:"center"});
    document.querySelector("#navigation-grid button").focus({preventScroll:true});
  }));
})();
