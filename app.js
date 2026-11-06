(() => {
  "use strict";
  const assistantDialog = document.getElementById("assistant-dialog");
  const assistantFrame = document.getElementById("assistant-frame");
  const concierge = document.getElementById("robot-concierge");
  const launcher = document.getElementById("robot-launcher");
  const welcome = document.getElementById("robot-welcome");
  const welcomeText = "hi，我是智能客服，请问有什么可以帮助您？";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const returnFocus = new WeakMap();
  let welcomeAnimation, entranceTimer, toastTimer;
  function openDialog(dialog) {
    if (dialog.open) return;
    let trigger = document.activeElement;
    const parentDialog = trigger && trigger.closest("dialog");
    if (parentDialog && !parentDialog.open) trigger = returnFocus.get(parentDialog) || launcher;
    returnFocus.set(dialog,trigger);
    dialog.showModal();
  }
  function closeDialog(dialog) { if (dialog.open) dialog.close(); }
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click",() => closeDialog(document.getElementById(button.dataset.close)));
  });
  [assistantDialog].forEach((dialog) => {
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
    welcomeAnimation?.cancel(); welcome.hidden = true;
    document.getElementById("robot-announcement").textContent = "";
    concierge.hidden = false;
    if (welcome.contains(document.activeElement) && !document.querySelector("dialog[open]")) launcher.focus({ preventScroll: true });
  }
  function openAssistant() {
    clearTimeout(toastTimer);
    document.getElementById("portal-toast").hidden = true;
    dismissWelcome();
    if (!assistantFrame.dataset.initialized) {
      const bundled = document.getElementById("standalone-assistant-document");
      if (bundled) {
        const bytes = Uint8Array.from(atob(JSON.parse(bundled.textContent)),character => character.charCodeAt(0));
        assistantFrame.srcdoc = new TextDecoder().decode(bytes);
      } else {
        const pageUrl = new URL("./assistant.html",window.location.href);
        const revision = document.querySelector?.('meta[name="portal-build"]')?.content;
        if (revision) pageUrl.searchParams.set("v",revision);
        assistantFrame.src = pageUrl.href;
      }
      assistantFrame.dataset.initialized = "true";
    }
    openDialog(assistantDialog);
    assistantFrame.contentWindow?.postMessage({ type: "employee-assistant:focus" },"*");
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
  assistantFrame.addEventListener("load",() => {
    if (assistantDialog.open) assistantFrame.contentWindow?.postMessage({ type: "employee-assistant:focus" },"*");
  });
  window.addEventListener("message",event => {
    if (event.source !== assistantFrame.contentWindow) return;
    if (event.data?.type === "employee-assistant:close") closeDialog(assistantDialog);
  });
  function updateRobotHomePosition() {
    if (concierge.classList.contains("is-positioned") || document.documentElement.clientWidth <= 900) return;
    const schedule = document.querySelector(".schedule-panel");
    const navigation = document.querySelector(".navigation-panel");
    if (!schedule || !navigation) return;
    const scheduleRect = schedule.getBoundingClientRect();
    const navigationRect = navigation.getBoundingClientRect();
    concierge.style.setProperty("--robot-home-x",(navigationRect.left + navigationRect.width * .75) + "px");
    concierge.style.setProperty("--robot-home-y",((scheduleRect.bottom + navigationRect.top) / 2 - 8) + "px");
  }
  updateRobotHomePosition();
  window.addEventListener("resize",updateRobotHomePosition);
  window.addEventListener("load",updateRobotHomePosition,{ once: true });

  function showWelcome() {
    clearTimeout(entranceTimer);
    welcomeAnimation?.cancel();
    concierge.hidden = false;
    welcome.hidden = false;
    document.getElementById("robot-announcement").textContent = "";
    welcomeAnimation = typeText(document.getElementById("robot-welcome-text"),welcomeText,{
      onComplete: () => { document.getElementById("robot-announcement").textContent = welcomeText; }
    });
  }
  function showUnavailable() {
    const toast = document.getElementById("portal-toast");
    toast.textContent = "该功能尚未实现，请点击右侧的智能客服进行问答";
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; },4500);
    showWelcome();
  }
  document.addEventListener("click",event => {
    const target = event.target.closest?.("button,a,input,select,textarea,[role=button],[tabindex]");
    if (!target || target.closest("#robot-concierge,#assistant-dialog")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showUnavailable();
  },true);
  document.getElementById("portal-search").addEventListener("submit",event => {
    event.preventDefault();
    showUnavailable();
  });
  document.getElementById("start-robot-chat").addEventListener("click",openAssistant);
  document.getElementById("dismiss-robot-welcome").addEventListener("click",() => {
    dismissWelcome();
    launcher.focus({ preventScroll: true });
  });
  entranceTimer = setTimeout(showWelcome,reduceMotion ? 0 : 500);
  window.addEventListener("pagehide",() => { dismissWelcome(); clearTimeout(toastTimer); });
})();
