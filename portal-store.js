/* Browser-local records only; this module never submits to a business system. */
(() => {
  "use strict";
  const key="employee-portal-records-v1";
  const uid=()=>globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
  function read() { try { const parsed=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(parsed)?parsed:[]; } catch { return []; } }
  function write(records) { localStorage.setItem(key,JSON.stringify(records)); }
  function save(record) {
    const records=read();
    const existing=records.find(item=>item.id===record.id || record.requestKey && item.requestKey===record.requestKey);
    const entry={...existing,...record,id:existing?.id||record.id||uid(),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(existing) records[records.indexOf(existing)]=entry;else records.unshift(entry);
    write(records);return entry;
  }
  function update(id,changes) { const previous=read().find(item=>item.id===id);if(!previous)throw new Error("记录不存在");return save({...previous,...changes}); }
  function fieldVisible(field,values) {
    return Object.entries(field.when || {}).every(([key,allowed]) => allowed.includes(values[key]));
  }
  function shanghaiDate(now) {
    return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0,10);
  }
  function validate(service,values,now=new Date()) {
    const errors={};
    for(const field of service.fields||[]) {
      if (!fieldVisible(field,values)) continue;
      const value=String(values[field.key]??"").trim();
      if(field.required && !value) {errors[field.key]="请填写"+field.label;continue;}
      if(!value)continue;
      if(value.length>1000)errors[field.key]="内容不能超过1000字";
      if(field.options && !field.options.includes(value))errors[field.key]="请选择有效选项";
      if(field.type==="number" && (!Number.isFinite(Number(value))||Number(value)<field.min||Number(value)>field.max||!field.step&&!Number.isInteger(Number(value))))errors[field.key]="请填写有效数值";
      if(["date","datetime-local"].includes(field.type)) {
        const timestamp=Date.parse(value+(field.type==="date"?"T00:00:00+08:00":":00+08:00"));
        if(!Number.isFinite(timestamp))errors[field.key]="日期格式不正确";
        const dateParts=value.slice(0,10).split("-").map(Number);const date=new Date(Date.UTC(dateParts[0],dateParts[1]-1,dateParts[2]));
        if(date.getUTCFullYear()!==dateParts[0]||date.getUTCMonth()+1!==dateParts[1]||date.getUTCDate()!==dateParts[2])errors[field.key]="日期不存在";
        if(field.future && (field.type==="date" ? value<shanghaiDate(now) : timestamp<=now.getTime()))errors[field.key]="请选择今天或之后的有效时间";
        if(field.past && timestamp>now.getTime())errors[field.key]="发生时间不能晚于当前时间";
      }
    }
    if(values.start && values.end && (values.end<values.start || values.end===values.start && service.fields.find(field=>field.key==="end")?.type==="datetime-local"))errors.end="结束时间应晚于开始时间";
    if(service.id==="expense") {
      const lines=values.expenses||[];
      if(!lines.length || lines.some(line=>!String(line.name||"").trim() || !Number.isFinite(Number(line.amount)) || Number(line.amount)<=0 || Number(line.amount)>1000000 || !/^\d+(\.\d{1,2})?$/.test(String(line.amount))))errors.expenses="每项费用需填写名称及大于0、最多两位小数的金额";
    }
    return errors;
  }
  function total(lines) { return (lines.reduce((sum,line)=>sum+Math.round(Number(line.amount||0)*100),0)/100).toFixed(2); }
  window.PortalStore=Object.freeze({read,save,update,validate,total,uid,key,fieldVisible,shanghaiDate});
})();
