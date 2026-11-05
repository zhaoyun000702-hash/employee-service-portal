/* Frontend content and service schemas. Replace with published content/API data when connected. */
(() => {
  "use strict";
  const section = (title,...items) => ({ title,items });
  const tableSection = (title,columns,rows) => ({
    title,table:{columns,rows},
    items:rows.map(row=>columns.map((column,index)=>column+"："+row[index]).join("；"))
  });
  const listSection = (title,format,...items) => ({title,format,items});
  const faqSection = (title,entries) => ({title,faq:entries,items:entries.map(([question,answer])=>question+" "+answer)});
  const notices = [
    { id: "vpn-maintenance",title: "VPN系统维护通知",department: "信息技术部",date: "2026-10-07 06:00",summary: "维护期间，VPN 连接可能短暂中断，请提前保存工作。",service: "it",related: ["vpn-help","access-manual"],sections: [
      section("维护安排","维护时间：2026年10月8日22:00至10月9日02:00。","影响范围：通过公司 VPN 访问内部办公系统的员工。维护期间可能出现短暂断线或登录失败。"),
      section("员工操作指引","维护开始前保存远程工作内容，退出正在编辑的内部系统。","避免在维护时段执行大文件传输或长时间运行的远程任务。","维护结束后重新连接 VPN；若仍无法连接，记录发生时间、客户端版本及完整报错。"),
      section("问题反馈","通过“IT报障”提交问题，故障类型选择“网络与VPN”，附上已尝试的操作。","报障时请勿填写密码、验证码或其他登录凭据。") ] },
    { id: "expense-reminder",title: "月度费用报销提交提醒",department: "财务部",date: "2026-10-06 09:00",summary: "请及时整理本月费用材料，核对票据与费用明细后提交。",service: "expense",related: ["travel-manual","expense-policy"],sections: [
      section("提交前核对","按出差或费用事项整理票据，核对日期、金额、用途和所属项目。","差旅费用准备出差申请、行程说明，以及交通和住宿票据；其他费用附对应事项说明。"),
      section("提交与跟进","在“费用报销”填写报销类型、费用期间、明细金额和事由，核对汇总金额。","提交后在“我的申请”查看单据；需补充材料时，先核对退回原因，再修改对应信息。"),
      section("注意事项","同一票据不要重复报销。费用归属或材料要求存在疑问时，先向财务确认。","请妥善保留原始材料，不要将银行卡密码等无关信息写入申请。") ] },
    { id: "attendance-update",title: "考勤管理制度更新通知",department: "人力资源部",date: "2026-10-05 10:00",summary: "请核对个人考勤记录，及时补充异常原因与相关说明。",service: "attendance",related: ["attendance-policy","leave-manual"],sections: [
      section("调整内容","统一通过员工门户查看考勤异常并提交说明。","请假、出差与补卡记录应关联同一时段，避免重复申报。"),
      section("员工需完成的事项","核对异常日期、班次与打卡记录。","如有漏打卡，填写实际到岗时间及原因；如已办理请假或出差，补充对应申请编号。","在提交前检查日期和说明，按页面要求补充证明材料。"),
      section("查询与反馈","在“HR系统”查看相关入口与申请记录。","对考勤记录有异议时，联系所属部门考勤负责人核实，不自行推算最终工资影响。") ] },
    { id: "meeting-arrangement",title: "会议室使用安排调整通知",department: "行政部",date: "2026-10-04 14:00",summary: "会议室按预约时间使用，变更安排前请先核对资源状态。",service: "meeting",related: ["office-guide","meeting-faq"],sections: [
      section("预约要求","按会议时间、人数和设备要求查询会议室，优先选择容量合适的房间。","查询到空闲房间并不代表已锁定；选择后需核对预订摘要并确认。"),
      section("使用与变更","会议开始前检查设备，结束后关闭设备并恢复桌椅。","时间、人数或设备需求发生变化时，重新查询符合条件的房间。","不能继续使用时，及时通过会议管理入口反馈，便于释放资源。"),
      section("支持入口","通过“会议室预定”查看候选与预订结果。","遇到门锁或投影故障，请通过“IT报障”描述会议室位置及问题。") ] }
  ];
  const documents = [];
  function doc(id,title,group,summary,service,...sections) { documents.push({id,title,group,summary,service,sections,department: group === "规章制度" ? "员工服务中心" : "企业内部员工客服部门",date:"2026-11-04 09:00",version:"1.0"}); }
  doc("travel-manual","差旅报销操作手册","操作手册","按一次出差整理材料、登记费用，核对票据、金额和附件后保存申请，并跟进后续处理状态。","expense",
    section("适用范围与办理原则",
      "本手册说明差旅费用的材料整理、单据填写和记录核对方法，适用于需要办理差旅报销的员工。",
      "按同一次出差归集费用；不同项目或不同出差事项的支出分别说明归属。同一票据不要重复报销。",
      "具体报销额度、费用范围、审批要求和提交时限，以员工所在单位的现行制度为准；有疑问时先向财务确认。"),
    tableSection("报销材料清单",["材料","准备内容","核对重点"],[
      ["出差申请或关联单据","与本次出差对应的申请记录；流程要求关联单号时一并整理。","出差人、地点和日期与实际行程一致。"],
      ["行程与业务说明","说明出差目的、起止日期、到访地点及对应业务事项。","能够说明费用与本次出差的关联。"],
      ["交通票据","整理机票、火车票等交通及市内交通票据，按日期归集。","核对姓名、路线、日期、金额，避免混入其他行程。"],
      ["住宿票据","整理与住宿日期对应的票据及费用明细。","住宿日期与行程相符，票据与申报金额对应。"],
      ["支付凭证及补充说明","按费用类型和适用制度准备支付记录、分摊或差额说明。","凭证可辨认；需解释的差异有对应说明。"],
      ["附件文件","按费用事项整理清晰、完整、可辨认的材料。","附件名称能对应费用明细，不遗漏关键页面。"]
    ]),
    tableSection("申请信息怎么填写",["填写项","填写方法","常见检查"],[
      ["报销类型","进入“费用报销”，选择“差旅报销”。","避免选成其他费用类型。"],
      ["费用期间","按本次出差或实际发生费用的起止日期填写。","开始、结束日期顺序正确，与行程对应。"],
      ["项目或费用归属","按实际业务事项填写所属项目或费用说明。","不将无关项目的费用混在同一明细中。"],
      ["费用明细","逐条登记费用名称、金额和用途；一条明细对应清晰的费用事项。","核对单项金额、费用分类和合计金额。"],
      ["关联单据与附件","按页面要求填写出差单号，选择与明细对应的附件。","单号可核对，附件内容与申报事项一致。"]
    ]),
    listSection("办理步骤","steps",
      "整理本次出差的行程与费用，先核对适用制度及所需材料。",
      "打开“费用报销”，选择“差旅报销”，填写费用期间与业务说明。",
      "逐条登记费用类型、金额和用途，核对各明细及汇总金额。",
      "按费用事项整理附件，检查名称、内容和明细是否对应。",
      "在确认页核对申请信息；保存前再次检查项目、金额及附件名称。",
      "进入“我的申请”查看记录。是否已正式提交、进入审批或完成付款，以业务系统状态和回执为准。"),
    listSection("保存或提交前核对","checklist",
      "出差人、行程和费用期间一致，日期不存在遗漏或倒置。",
      "费用用途清楚，项目或费用归属与实际业务一致。",
      "票据与申报明细对应，同一票据没有重复使用。",
      "各项金额、合计金额与附件凭证能够相互核对。",
      "附件清晰完整，文件名称便于辨认对应事项。",
      "差额、分摊或特殊情况已说明；不确定的要求已向财务核实。"),
    tableSection("退回与异常处理",["遇到的情况","处理方法","处理后检查"],[
      ["申请被退回","先阅读退回原因，再修改对应字段或补充所需材料。","更正后重新核对摘要，按业务系统要求处理。"],
      ["金额或票据不一致","逐项核对票据、支付凭证与明细，说明差额或分摊原因。","不要为凑合计金额而随意改写实际支出。"],
      ["缺少票据或证明材料","先确认缺少的具体材料，再向财务核实补充方式。","不以无关票据替代，也不自行推定可以免交。"],
      ["保存或提交结果不明确","先查看“我的申请”中的记录与业务回执，再决定下一步。","避免反复创建相同申请；仍无法确认时联系服务人员核实。"]
    ]),
    faqSection("常见问题",[
      ["出差打车费需要准备什么？","整理交通票据、对应支付凭证，以及日期、路线和出差用途说明；具体材料要求核对适用制度。"],
      ["不同项目的费用可以混填吗？","分别说明项目或费用归属，保证每条明细与实际业务对应，不把无关支出混入同一事项。"],
      ["保存申请就代表报销成功了吗？","保存草稿或申请记录不等于审批通过、报销完成或款项已支付，最终以业务系统状态和回执为准。"],
      ["报销标准或材料要求不清楚怎么办？","先核对所在单位当前适用的制度；仍有疑问时，提供出差地点、日期、费用类型和具体问题，请财务确认。"]
    ]));
  doc("leave-manual","请假申请操作手册","操作手册","选择假期类型，填写起止时间和请假事由。","leave",
    section("申请前准备","确认请假类型、起止时间及期间工作交接安排。","实际可用假期以 HR 系统为准；不要仅凭历史余额确定是否足够。"),
    section("填写与确认","选择假期类型，填写开始、结束时间和事由；结束时间应晚于开始时间。","补充交接人或联系方式，在确认页核对时间范围后保存。"),
    section("查看申请","进入“我的申请”，筛选“请假申请”查看记录。","申请时间发生变化时先修改记录；已进入正式审批的申请应按 HR 系统流程处理。"));
  doc("access-manual","账号权限申请操作手册","操作手册","按最小必要范围申请账号、业务权限或 VPN。","access",
    section("选择申请类型","区分账号开通、系统权限和 VPN 访问，填写目标系统及使用用途。","只申请完成工作所需的权限，填写有效期，不使用他人账号代办。"),
    section("填写必需信息","填写系统名称、所需角色或访问范围、使用起止日期与业务理由。","权限范围不明确时，先向系统负责人确认；不要把推测的角色作为已批准权限。"),
    section("跟进与安全","保存后在“我的申请”查看记录，账号是否开通以业务系统结果为准。","不要在申请、聊天或截图中提交密码、验证码和私钥。"));
  doc("mail-manual","企业邮箱配置手册","操作手册","完成邮箱登录、客户端配置与常见错误检查。","it",
    section("确认账号与入口","从企业提供的邮箱入口登录，确认本人账号可用。","客户端的服务器地址、端口及认证方式应使用 IT 发布的配置，不自行猜测。"),
    section("配置客户端","在客户端中选择添加工作邮箱，填写企业邮箱地址并完成身份验证。","按企业配置启用加密连接，发送一封测试邮件并检查收发结果。"),
    section("配置失败处理","记录客户端名称、版本及完整错误提示，检查网络与账号状态。","如需报障，选择“邮箱”，说明失败发生在登录、发送还是接收阶段。"));
  doc("visitor-manual","访客预约操作手册","操作手册","填写访客、到访时间与接待地点。","visitor",
    section("预约准备","确认访客姓名、联系信息、来访目的和接待人。","与访客确认到访时间及办公地点，避免填写无关敏感资料。"),
    section("填写预约","填写到访日期、预计到达和离开时间、来访人数与接待地点。","确认访客信息后保存预约，通行结果以门禁或访客系统通知为准。"),
    section("变更与接待","访客或时间变化时及时修改预约，避免重复创建。","到访当天由接待人按园区要求完成核验与接待。"));
  doc("onboarding-guide","新员工入职指南","员工指南","按账号、设备和办公资料三个环节完成入职准备。","equipment",
    section("账号与身份","按 HR 通知完成入职资料核对。","领取本人工作账号，按要求完成首次登录与身份认证。"),
    section("办公资源","通过“设备申领”填写工作设备需求，确认办公地点与用途。","通过“账号权限/VPN”申请业务系统所需权限。"),
    section("常用资料","阅读考勤、信息安全与资产使用制度。","配置企业邮箱，确认直属负责人、设备领用和常用服务入口。"));
  doc("service-guide","员工服务办理指南","员工指南","快速找到办理入口、申请记录和问题反馈。","leave",
    section("选择服务","请假与考勤进入 HR；费用进入财务报销；网络和软件问题进入 IT 服务台。","设备和会议室进入行政服务，操作不清楚时先查看相关手册。"),
    section("办理与跟进","填写必要信息，在确认页核对后保存。","通过“我的申请”按类型、状态或编号查找记录。"),
    section("需要帮助","描述具体问题、发生时间及已尝试的操作。","不要只填写“用不了”；清楚的现象有助于客服定位。"));
  doc("office-guide","办公资源使用指南","员工指南","会议室、办公设备与园区资源的使用说明。","meeting",
    section("会议室","根据时间、地点、人数和设备筛选房间，确认后查看预订结果。","使用结束后恢复现场，避免占用他人时段。"),
    section("办公设备","按用途申领设备，领取时核对型号、配件及资产编号。","故障设备不要自行拆修，通过服务台反馈。"),
    section("资产流转","设备借用、转交或离职归还时保留交接记录。","设备丢失或账号泄露时立即反馈相关负责人。"));
  doc("contacts-guide","员工常用联系方式","员工指南","按事项找到负责团队及反馈入口。","it",
    section("HR相关","请假、考勤、入职资料：通过“HR系统”选择对应服务。"),
    section("财务与行政","票据、报销材料：进入“财务报销”；会议室、设备：进入对应行政入口。"),
    section("IT与安全","账号、网络、软件问题：进入“IT服务台”；可疑邮件或信息泄露：进入“信息安全中心”。","提交问题时填写可联系到本人的方式，团队电话以企业通讯录为准。"));
  doc("attendance-policy","员工考勤管理制度","规章制度","核对考勤记录，按实际情况办理请假和异常说明。","attendance",
    section("适用与记录","按员工所属单位、岗位及班次执行对应考勤要求。","考勤记录、请假时间与出差时间应保持一致。"),
    section("异常处理","发现漏卡、记录缺失或时段不符时，核实日期和原因再提交说明。","请假、补卡与出差不重复申报相同时段。"),
    section("核对与反馈","如对记录存在异议，补充能支持事实的信息，交由考勤负责人核实。","本页不推算工资扣减或其他人事处理结果。"));
  doc("expense-policy","费用报销管理制度","规章制度","费用真实、票据匹配、明细完整，避免重复报销。","expense",
    section("基本要求","费用应与真实业务事项对应，填写用途及费用归属。","票据内容与申报明细一致，不重复使用同一票据。"),
    section("材料与审批","差旅费用关联出差和行程材料；其他费用关联对应事项说明。","金额标准、审批权限及提交时限应核对员工所在单位的现行制度。"),
    section("退回与补充","按退回原因补充资料，不用无关票据替换缺失材料。","金额或费用归属发生变化时，重新核对申请摘要。"));
  doc("security-policy","信息安全管理制度","规章制度","保护企业账号、文件和业务数据。","security",
    section("账号保护","账号仅限本人使用，不共享密码、验证码或认证令牌。","只通过企业认可的入口访问业务系统。"),
    section("文件与权限","按必要范围申请访问权限，不将内部资料上传到未经批准的外部服务。","分享文件前核对收件人、权限和文件中的敏感信息。"),
    section("异常报告","发现可疑邮件、异常登录或数据外泄迹象时及时报告。","保留必要时间与现象信息，不继续打开可疑附件或链接。"));
  doc("asset-policy","办公资产管理制度","规章制度","设备申领、领用确认和资产流转要求。","equipment",
    section("申领与领用","按工作用途申请设备，说明设备类别、数量和使用地点。","领取时核对资产编号、配件和设备状态。"),
    section("使用与维护","妥善保管办公设备，按要求安装和使用软件。","发现故障通过 IT 服务台报修，不自行拆卸关键部件。"),
    section("交接与归还","借用、岗位变化或离职时，按资产流程完成交接或归还。","资产状态以业务系统的交接记录为准。"));
  doc("leave-faq","如何提交请假申请？","常见问题","从填写时间到查看申请记录。","leave",
    section("操作方法","打开“请假申请”，选择假期类型、起止时间并填写事由。","在确认页核对信息后保存，通过“我的申请”查看。"),section("常见检查","结束时间必须晚于开始时间，假期类型应与实际情况一致。","余额和正式审批结果以 HR 系统为准。"));
  doc("expense-faq","在哪里查询报销进度？","常见问题","按编号或类型定位报销申请。","expense",
    section("查询方式","进入“财务报销”，打开“我的申请”，筛选费用报销。","打开申请可查看编号、金额、材料与当前保存状态。"),section("注意事项","本地保存的申请不代表财务已受理；正式审批记录应以财务系统为准。"));
  doc("equipment-faq","如何申领办公设备？","常见问题","填写用途和设备需求后核对申请。","equipment",
    section("办理步骤","打开“设备申领”，选择设备类别，填写数量、使用地点及用途。","确认后保存申请；领取时核对设备和配件。"),section("更换设备","从本人设备列表选择要更换的设备，并补充更换原因。","列表中找不到对应设备时，选择“列表里没有”，提交后核实原设备。"));
  doc("vpn-help","VPN 无法连接怎么办？","常见问题","先核对网络和报错，再选择对应处理方式。","it",
    section("先检查基础信息","确认本地网络可用，并使用企业认可的 VPN 客户端和入口。","记录完整报错、发生时间和客户端版本；不要仅凭连接超时判断账号被锁。"),
    section("按现象处理","认证失败时检查账号状态和身份验证要求；网络中断时先恢复本地网络。","如处于维护窗口，查看 VPN 系统维护通知。"),
    section("仍未恢复","提交 IT 报障，说明已尝试的操作并附必要截图。","不要发送密码或验证码，不自行修改企业网络安全配置。"));
  doc("meeting-faq","会议室预订流程","常见问题","查询、选择、确认和查看预订结果。","meeting",
    section("操作流程","填写日期、起止时间、办公地点、人数及设备要求。","选择候选会议室，补齐主题，核对摘要后确认。"),section("异常处理","查询结果不会锁定房间；条件变更后应重新查询。","提交结果不明时先核实结果，避免重复预订。"));
  const myAssets = [
    {id:"ASSET-001",name:"显示器",equipment_type:"显示器",equipment_name:"",model:"Dell P2422H",location:"总部园区"},
    {id:"ASSET-002",name:"无线鼠标",equipment_type:"其他",equipment_name:"鼠标",model:"罗技 M650",location:"总部园区"},
    {id:"ASSET-003",name:"有线鼠标",equipment_type:"其他",equipment_name:"鼠标",model:"联想 M120",location:"总部园区"},
    {id:"ASSET-004",name:"笔记本电脑",equipment_type:"笔记本电脑",equipment_name:"",model:"ThinkPad T14",location:"总部园区"}
  ];
  const field = (key,label,type="text",options={}) => ({key,label,type,...options});
  const services = [
    {id:"meeting",title:"会议室预定",category:"行政",summary:"查询空闲会议室，选择后确认预订。",icon:"calendar",guide:"meeting-faq"},
    {
      id:"leave",title:"请假申请",category:"HR服务",summary:"选择假别和起止时间，填写事由及工作交接安排。",icon:"calendar",guide:"leave-manual",
      fields:[
        field("leave_type","假别","select",{options:["年假","调休","事假","病假"],required:true}),
        field("start","开始时间","datetime-local",{required:true}), field("end","结束时间","datetime-local",{required:true}),
        field("reason","请假事由","textarea",{required:true,placeholder:"简要说明请假原因"}),
        field("handover","工作交接人","text",{placeholder:"填写交接同事姓名"}),
        field("contact","休假期间联系方式","tel"),
        field("handover_note","交接事项","textarea",{placeholder:"填写需交接的任务、截止时间和资料位置"})
      ]
    },
    {
      id:"expense",title:"费用报销",category:"财务服务",summary:"登记费用归属和逐笔明细，核对报销合计与票据。",icon:"money",guide:"travel-manual",
      fields:[
        field("expense_type","报销类型","select",{options:["差旅报销","办公费用","培训费用","其他费用"],required:true}),
        field("project","费用归属项目 / 部门","text",{required:true}),
        field("start","费用开始日期","date",{required:true}), field("end","费用结束日期","date",{required:true}),
        field("trip_ref","关联出差单号","text",{when:{expense_type:["差旅报销"]}}),
        field("reason","费用事由","textarea",{required:true,placeholder:"说明费用用途及对应的业务事项"})
      ]
    },
    {
      id:"it",title:"IT报障",category:"IT服务",summary:"提供故障现象、影响范围和复现信息，帮助 IT 定位问题。",icon:"monitor",guide:"vpn-help",
      fields:[
        field("subject","故障标题","text",{required:true,placeholder:"例如：连接 VPN 后无法访问内部系统"}),
        field("issue_type","故障分类","select",{options:["网络与VPN","邮箱","办公电脑","业务系统","其他"],required:true}),
        field("urgency","影响程度","select",{options:["不影响主要工作","部分工作受影响","无法继续工作"],required:true}),
        field("occurred","发生时间","datetime-local",{required:true,past:true}),
        field("device","设备编号 / 系统名称","text",{required:true}),
        field("network","当前网络环境","select",{options:["公司办公网络","家庭网络","手机热点","其他"],when:{issue_type:["网络与VPN"]}}),
        field("reason","故障现象与已尝试的操作","textarea",{required:true,placeholder:"说明操作步骤、完整报错和是否能重复出现。请勿填写密码或验证码。"}),
        field("contact","联系方式","tel",{required:true})
      ]
    },
    {
      id:"equipment",title:"设备申领",category:"行政",summary:"选择新领或更换，登记设备、数量和领用地点。",icon:"box",guide:"asset-policy",
      fields:[
        field("request_type","申领方式","select",{options:["新领","更换"],required:true}),
        field("equipment_type","设备类型","select",{options:["笔记本电脑","显示器","键鼠套装","耳机","其他"],required:true}),
        field("equipment_name","设备名称","text",{required:true,when:{equipment_type:["其他"]}}),
        field("asset_ref","要更换的设备","asset-select",{required:true,managed:true,when:{request_type:["更换"]}}),
        field("quantity","申领数量","number",{min:1,max:20,required:true}),
        field("office","领用地点","select",{options:["总部园区","研发园区"],required:true}),
        field("needed","期望领用日期","date",{required:true,future:true}),
        field("reason","工作用途 / 更换原因","textarea",{required:true}),
        field("contact","联系方式","tel",{required:true})
      ]
    },
    {id:"leave_balance",title:"假期查询",category:"HR服务",summary:"查询年假、调休的可用余额及审批占用。",icon:"calendar",guide:"leave-manual"},
    {id:"visitor",title:"访客预约",category:"行政",summary:"登记到访信息与接待安排。",icon:"person",guide:"visitor-manual",fields:[field("visitor","访客姓名","text",{required:true}),field("company","来访单位"),field("contact","访客联系方式","text",{required:true}),field("host","接待人","text",{required:true}),field("office","接待地点","text",{required:true}),field("start","到访时间","datetime-local",{required:true,future:true}),field("end","离开时间","datetime-local",{required:true}),field("reason","来访目的","textarea",{required:true})]},
    {id:"purchase",title:"采购申请",category:"采购",summary:"登记采购物品、预算与使用用途。",icon:"cart",guide:"asset-policy",fields:[field("item","采购物品","text",{required:true}),field("quantity","数量","number",{min:1,max:999,required:true}),field("budget","预算金额（元）","number",{min:.01,max:1000000,step:.01,required:true}),field("needed","期望到货日期","date",{required:true,future:true}),field("reason","采购用途","textarea",{required:true})]},
    {id:"attendance",title:"考勤异常说明",category:"HR服务",summary:"核对异常日期并补充事实说明。",icon:"calendar",guide:"attendance-policy",fields:[field("date","异常日期","date",{required:true}),field("attendance_type","异常类型","select",{options:["漏打卡","记录缺失","请假关联异常","其他"],required:true}),field("actual_time","实际到岗 / 离岗时间","time",{required:true}),field("reason","原因说明","textarea",{required:true}),field("related","关联申请编号（选填）")]},
    {id:"security",title:"信息安全事件反馈",category:"IT服务",summary:"报告可疑邮件、异常登录或文件泄露迹象。",icon:"shield",guide:"security-policy",fields:[field("event_type","事件类型","select",{options:["可疑邮件","异常登录","设备丢失","疑似信息泄露","其他"],required:true}),field("occurred","发现时间","datetime-local",{required:true}),field("reason","现象与影响范围","textarea",{required:true}),field("contact","联系方式","text",{required:true})]},
    {id:"signoff",title:"设备签收",category:"行政",summary:"核对领用设备、资产编号及配件。",icon:"box",guide:"asset-policy",fields:[field("device","设备名称","text",{required:true}),field("asset_id","资产编号","text",{required:true}),field("condition","设备状态","select",{options:["设备与配件正常","存在异常，需核实"],required:true}),field("reason","配件与情况说明","textarea",{required:true})]},
    {id:"schedule",title:"新建日程",category:"日程",summary:"记录主题、地点和起止时间。",icon:"calendar",guide:"office-guide",fields:[field("title","日程主题","text",{required:true}),field("start","开始时间","datetime-local",{required:true,future:true}),field("end","结束时间","datetime-local",{required:true}),field("office","地点"),field("reason","日程说明","textarea")]}
  ];
  const hubs = [
    {id:"hr",title:"HR系统",summary:"假期查询、请假、考勤与员工指南",services:["leave_balance","leave","attendance"],documents:["onboarding-guide","attendance-policy","leave-manual"]},
    {id:"finance",title:"财务报销",summary:"费用申请、材料核对与申请记录",services:["expense"],documents:["travel-manual","expense-policy","expense-faq"]},
    {id:"procurement",title:"采购系统",summary:"采购需求与办公设备申请",services:["purchase","equipment"],documents:["asset-policy","equipment-faq"]},
    {id:"it",title:"IT服务台",summary:"账号、网络、邮箱和设备问题处理",services:["it"],documents:["vpn-help","mail-manual","access-manual"]},
    {id:"security",title:"信息安全中心",summary:"安全指引、账号保护与事件反馈",services:["security"],documents:["security-policy","access-manual"]},
    {id:"assets",title:"资产平台",summary:"设备申领、签收与资产使用要求",services:["equipment","signoff"],documents:["asset-policy","office-guide"]}
  ];
  const aliases = {"财务报销":{view:"hub",id:"finance"},"IT服务台":{view:"hub",id:"it"},"HR系统":{view:"hub",id:"hr"},"采购系统":{view:"hub",id:"procurement"},"信息安全中心":{view:"hub",id:"security"},"资产平台":{view:"hub",id:"assets"},"员工服务中心":{view:"knowledge"}};
  function routeFor(name) { if(aliases[name]) return aliases[name];const service=services.find(item=>item.title===name);return service?{view:"service",id:service.id}:null; }
  function search(query,group="all") {
    const needle=query.trim().toLowerCase();
    return [ ...services.map(item=>({...item,kind:"服务",view:"service"})),...documents.map(item=>({...item,kind:item.group,view:"document"})),...notices.map(item=>({...item,kind:"通知",view:"notice"})),...hubs.map(item=>({...item,kind:"应用",view:"hub"})) ].filter(item=>(group==="all" || item.kind===group) && (item.title+item.summary).toLowerCase().includes(needle));
  }
  window.PortalData = Object.freeze({notices,documents,services,hubs,myAssets,routeFor,search});
})();
