/* Task events are independent of the chat UI. Replace the local adapters with
   backend requests when the actual knowledge base, tools and Skills are ready. */
(() => {
  "use strict";
  const examples = Object.freeze([
    { id: "rag", label: "查报销材料", question: "差旅报销需要准备哪些材料？" },
    { id: "tool", label: "查询假期余额", question: "帮我查一下我还剩多少天年假和调休。" },
    { id: "skill", label: "预订会议室", question: "帮我预订明天14:00到15:00，总部园区的会议室，6个人，需要投影，主题是项目沟通会。" },
    { id: "plan", label: "VPN故障排查", question: "我的 VPN 连不上，提示连接超时，帮我排查一下。" }
  ]);
  function classify(question, topic) {
    if (/vpn/i.test(question) && /无法|失败|连不上|连接不上|异常|故障|超时|断开|报错|排查|不能|登录不了|锁定/.test(question)) return "plan";
    if (/会议室/.test(question) && /预订|预定|预约|订|查找/.test(question) && (!/流程|制度|规则|手册|指引|怎么|如何/.test(question) || /帮我|我要|我想|替我/.test(question))) return "skill";
    if (/年假|调休|假期|休假|请假余额/.test(question) && /查|多少|几天|还剩|剩余|余额/.test(question)) return "tool";
    if (window.MeetingBooking.accepts(question)) return "skill";
    return topic ? "rag" : "chat";
  }
  function rewriteQuery(question,{ topic, kind = classify(question,topic) } = {}) {
    // Conservative local rewrite: preserve the user's entities and constraints.
    // A backend semantic rewriter can replace this function without changing UI.
    const original = String(question || "").trim();
    if (!original) return { original, query: "", intro: "" };
    let body = original.replace(/\s+/g," ").replace(/^(?:你好|您好)[，,！!。\s]*/,"").replace(/^(?:请问|请帮我|麻烦你帮我|麻烦帮我|帮我)[，,\s]*/,"").replace(/[？?。！!]+$/,"").trim();
    if (!body) body = original;
    let query, intro;
    if ((kind === "rag" || kind === "chat") && /(?:座机|电话)/.test(body) && /断断续续|断续|杂音|声音|掉音/.test(body) && !/已解决|无需|不用|不需要/.test(body)) {
      const subject = body.replace(/[，,\s]*(?:请问)?(?:应该|可以|该|要)?(?:怎么|如何)(?:办|处理|解决|排查)(?:呢|啊|呀)?$/,"").replace(/^(?:我的|我这边的)/,"").replace(/的问题$/,"");
      query = subject + "，应如何排查和处理？";
      intro = "你好，关于" + subject + "的问题，可以先按以下通用步骤排查：";
    } else {
      query = body + (/怎么|如何|哪些|什么|多少|能否|是否|哪里|吗$/.test(body) ? "？" : "。");
      const endings = { rag: "相关文档中的说明如下：", tool: "假期查询情况如下：", skill: "会议室预订处理情况如下：", plan: "排查情况如下：" };
      intro = "你好，关于你提出的“" + body + "”，" + (endings[kind] || "我来帮你进一步确认。");
    }
    return { original, query, intro };
  }
  function abortError() { const error = new Error("任务已停止"); error.name = "AbortError"; return error; }
  function checkSignal(signal) { if (signal?.aborted) throw signal.reason || abortError(); }
  function abortable(operation,signal) {
    return new Promise((resolve,reject) => {
      if (signal.aborted) { reject(signal.reason || abortError()); return; }
      const cancel = () => reject(signal.reason || abortError());
      signal.addEventListener("abort",cancel,{ once: true });
      Promise.resolve().then(operation).then(resolve,reject).finally(() => signal.removeEventListener("abort",cancel));
    });
  }
  function wait(milliseconds,signal) {
    return new Promise((resolve,reject) => {
      if (signal.aborted) { reject(signal.reason || abortError()); return; }
      const cancel = () => { clearTimeout(timer); reject(signal.reason || abortError()); };
      const timer = setTimeout(() => { signal.removeEventListener("abort",cancel); resolve(); },milliseconds);
      signal.addEventListener("abort",cancel,{ once: true });
    });
  }
  function createLocalAdapters(documents,delay = wait) {
    return {
      async searchKnowledge({ titles, signal }) {
        await delay(1250,signal); checkSignal(signal);
        return [...new Set(titles)].filter(title => documents[title]).map(title => ({ title, passages: [...documents[title]] }));
      },
      async queryLeaveBalance({ types, signal }) {
        await delay(1900,signal); checkSignal(signal);
        return [
          { type: "年假", total: 15, used: 6, pending: 1, available: 8 },
          { type: "调休", total: 3, used: 1, pending: .5, available: 1.5 }
        ].filter(item => types.includes(item.type));
      },
      async queryVpnAccount({ question, signal }) {
        await delay(1300,signal); checkSignal(signal);
        return { state: /锁定/.test(question) ? "locked" : /密码.*过期|凭据.*过期/.test(question) ? "expired" : "active" };
      },
      async checkVpnNetwork({ question, signal }) {
        await delay(1400,signal); checkSignal(signal);
        return { internet: !/断网|本地网络异常|网络不可用/.test(question) };
      },
      async checkVpnGateway({ question, signal }) {
        await delay(1500,signal); checkSignal(signal);
        return { available: !/超时|维护|服务故障/.test(question) };
      }
    };
  }
  async function run({ question, topic, documents, action, now = new Date(), signal: parentSignal, onEvent = () => {}, adapters, delay = wait, timeoutMs = 60000 }) {
    const kind = action?.type?.startsWith("meeting-") ? "skill" : classify(question,topic);
    if (kind === "chat") throw new Error("当前暂不支持该任务");
    const controller = new AbortController();
    const cancel = () => controller.abort(parentSignal?.reason || abortError());
    parentSignal?.addEventListener("abort",cancel,{ once: true });
    if (parentSignal?.aborted) cancel();
    const signal = controller.signal;
    const timeout = setTimeout(() => { const error = new Error("等待时间较长，请稍后重试。"); error.name = "TimeoutError"; controller.abort(error); },timeoutMs);
    const services = adapters || createLocalAdapters(documents,delay);
    let activeStep;
    const emit = event => { checkSignal(signal); onEvent(event); };
    async function step(current,message,operation,details) {
      activeStep = current.id;
      emit({ ...current, type: "step", state: "running", message, detail: typeof details === "string" ? details : "" });
      const value = await abortable(operation,signal); checkSignal(signal);
      emit({ type: "step", id: current.id, state: "done", detail: typeof details === "function" ? details(value) : details || "" });
      return value;
    }
    const pause = milliseconds => delay(milliseconds,signal);
    try {
      emit({ type: "start", kind });
      const understanding = rewriteQuery(question,{ topic, kind });
      const query = understanding.query;
      let text, view, references = [];
      if (kind === "rag") {
        const hits = await step({ id: "retrieve", label: "检索对应文档", kind: "RAG" },"稍等下哈，我给你找找对应文档~",() => services.searchKnowledge({ titles: topic.refs, question: query, signal }),hits => hits.length ? "检索到 " + hits.length + " 份相关文档" : "未找到对应文档");
        if (!hits.length) throw new Error("没有找到可引用的文档，请换个关键词试试。");
        await step({ id: "read", label: "核对文档中的相关说明" },"找到相关文档了，我再核对一下具体说明。",() => pause(1000),"核对适用范围和操作要求");
        references = hits.map(hit => hit.title);
        text = hits.flatMap(hit => hit.passages).map((passage,index) => (index + 1) + ". " + passage).join("\n");
        await step({ id: "compose", label: "整理回答与引用来源" },"我把要点和文档来源整理给你。",() => pause(650),"回答保留可点击的文档来源");
      } else if (kind === "tool") {
        const types = ["年假","调休"].filter(type => query.includes(type)); if (!types.length) types.push("年假","调休");
        await step({ id: "check", label: "确认假期查询范围" },"我先确认你要查询的假期类型。",() => pause(650),types.join("、"));
        const balances = await step({ id: "query", label: "查询假期余额", kind: "Tool" },"正在查询你的假期余额，请稍等。",() => services.queryLeaveBalance({ types, question: query, signal }),items => "查询到 " + items.length + " 类假期记录");
        await step({ id: "compose", label: "整理可用假期与占用情况" },"查到了，我把可用余额和审批占用一起列给你。",() => pause(600),"分别列出可用、已使用和审批中的天数");
        text = "你的假期余额如下：";
        view = {type:"leave-balances",items:balances};
      } else if (kind === "skill") {
        const meeting = await window.MeetingBooking.execute({ question: query,action,now,signal,step,onEvent,adapters,delay });
        if (meeting.status === "result_unknown") onEvent({ type: "result_unknown",message: "预订结果尚未确认，请先核实状态。" });
        else emit({ type: "result",kind });
        const intro = rewriteQuery(meeting.query || query,{ kind: "skill" }).intro;
        return { ...meeting,text: intro + "\n\n" + meeting.text };
      } else {
        await step({ id: "assess", label: "确认 VPN 故障现象" },"我先根据你提供的报错确认排查方向。",() => pause(700),"根据报错及后续检查结果选择下一步");
        const findings = []; let conclusion = "", guide = "VPN 登录操作手册";
        if (/账号|密码|认证|锁定|登录/.test(query)) {
          const account = await step({ id: "account", label: "检查 VPN 账号状态", kind: "Tool" },"先检查 VPN 账号状态。",() => services.queryVpnAccount({ question: query, signal }),value => value.state === "locked" ? "账号状态：已锁定" : value.state === "expired" ? "账号状态：密码已过期" : "账号状态：正常");
          if (account.state === "locked") { conclusion = "账号已锁定，应先按账号解锁流程处理。"; guide = "VPN 账号解锁指引"; }
          else if (account.state === "expired") { conclusion = "账号的密码已过期，应先完成密码重置。"; guide = "密码重置指引"; }
          findings.push("账号状态：" + (account.state === "locked" ? "已锁定" : account.state === "expired" ? "密码已过期" : "正常"));
        }
        if (!conclusion) {
          const network = await step({ id: "network", label: "检查网络连通情况", kind: "Tool" },"接下来检查网络连通情况。",() => services.checkVpnNetwork({ question: query, signal }),value => value.internet ? "本地网络连通正常" : "本地网络不可用");
          findings.push("本地网络：" + (network.internet ? "连通正常" : "不可用"));
          if (!network.internet) { conclusion = "本地网络不可用，需先恢复基础网络连接。"; guide = "远程办公常见问题"; }
          else {
            const gateway = await step({ id: "gateway", label: "检查 VPN 网关服务", kind: "Tool" },"网络连通正常，我再检查 VPN 网关服务。",() => services.checkVpnGateway({ question: query, signal }),value => value.available ? "VPN 网关服务正常" : "VPN 网关暂不可用");
            findings.push("VPN 网关：" + (gateway.available ? "服务正常" : "暂不可用"));
            conclusion = gateway.available ? "目前未定位到明确原因，建议记录客户端版本、完整报错和发生时间后交由 IT 进一步排查。" : "VPN 网关暂不可用，需要联系 IT 核查服务状态；暂不能仅凭超时认定为账号问题。";
            guide = "VPN 连接超时排查指引";
          }
        }
        const hits = await step({ id: "retrieve", label: "查阅对应处理指引", kind: "RAG" },"根据刚才的检查结果，我查一下对应处理指引。",() => services.searchKnowledge({ titles: [guide,"联系 IT 服务台"], question: query, signal }),items => "找到 " + items.length + " 份相关指引");
        if (!hits.length) throw new Error("排查指引暂不可用"); references = hits.map(item => item.title);
        await step({ id: "compose", label: "汇总排查结果与处理建议" },"我把检查结果和下一步建议整理给你。",() => pause(650),"区分已检查结果与仍需核实的信息");
        text = "排查结果：\n" + findings.map(item => "· " + item).join("\n") + "\n\n" + conclusion + "\n\n处理建议：\n" + hits[0].passages.map((passage,index) => (index + 1) + ". " + passage).join("\n");
      }
      emit({ type: "result", kind });
      return { kind, query, text: understanding.intro + "\n\n" + text, view, references, actions: [], committed: false };
    } catch (error) {
      const stopped = error.name === "AbortError" || parentSignal?.aborted;
      onEvent({ type: stopped ? "cancelled" : "error", id: activeStep, message: stopped ? "已停止本次任务" : error.name === "TimeoutError" ? "等待时间较长，请稍后重试。" : "这一步暂时没有完成，你可以重试。" });
      throw error;
    } finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener("abort",cancel);
    }
  }
  window.AssistantExecution = Object.freeze({ examples, classify, rewriteQuery, run, createLocalAdapters, resetConversation: () => window.MeetingBooking.resetTask() });
})();
