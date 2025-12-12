import{d as P}from"./index-BwaMe8jX.js";function w(t){const e=new Date,o=new Date(t.startDate),a=new Date(t.endDate),r=P(a,o),s=P(e,o),l=Math.min(Math.max(s/r,0),1),d=t.budget||t.totalBudget||0,c=t.actualCost||t.budgetUsed||0,u=d*l,f=(t.progress||0)/100,n=d*f,i=c,h=u>0?n/u:1,D=i>0?n/i:1,g=n-u,m=n-i,p=D>0?d/D:d,x=p-i,C=d-p,S=d-n,I=d-i,E=I>0?S/I:1;return{projectId:t.id,asOfDate:e.toISOString(),plannedValue:u,earnedValue:n,actualCost:i,schedulePerformanceIndex:h,costPerformanceIndex:D,scheduleVariance:g,costVariance:m,estimateAtCompletion:p,estimateToComplete:x,varianceAtCompletion:C,toCompletePerformanceIndex:E}}function $(t,e=10){const o=new Date(t.startDate),a=new Date(t.endDate),r=new Date,s=P(a,o),l=t.budget||t.totalBudget||0,d=(t.progress||0)/100,c=t.actualCost||t.budgetUsed||0,u=[];for(let f=0;f<=e;f++){const n=f/e,i=Math.floor(s*n),h=new Date(o);h.setDate(h.getDate()+i);const D=h<=r,g=l*n;let m=0;if(D){const x=Math.min(n/(P(r,o)/s)*d,d);m=l*x}let p=0;if(D){const x=m/(l*d||1);p=c*x}u.push({date:h.toISOString().split("T")[0],pv:Math.round(g),ev:Math.round(m),ac:Math.round(p)})}return u}function F(t){let e;t.schedulePerformanceIndex>=1.05?e="ahead":t.schedulePerformanceIndex>=.95?e="on-track":e="behind";let o;t.costPerformanceIndex>=1.05?o="under-budget":t.costPerformanceIndex>=.95?o="on-budget":o="over-budget";let a;return t.schedulePerformanceIndex>=.95&&t.costPerformanceIndex>=.95?a="good":t.schedulePerformanceIndex>=.85&&t.costPerformanceIndex>=.85?a="warning":a="critical",{scheduleStatus:e,costStatus:o,overallHealth:a}}function j(t){return t>=1e4?`¥${(t/1e4).toFixed(1)}万`:`¥${t.toLocaleString()}`}function O(t){return t.toFixed(2)}function k(t){return t>=1.05?"text-green-600 dark:text-green-400":t>=.95?"text-blue-600 dark:text-blue-400":t>=.85?"text-orange-600 dark:text-orange-400":"text-red-600 dark:text-red-400"}function M(t){const e=[],o=t.filter(a=>a.status==="active"||a.status==="planning");for(let a=0;a<o.length;a++)for(let r=a+1;r<o.length;r++){const s=o[a],l=o[r],d=V(s,l),c=y(s,l);if(d.length>0||c){const u={id:`dep-${s.id}-${l.id}`,sourceProjectId:s.id,sourceProjectName:s.name,targetProjectId:l.id,targetProjectName:l.name,dependencyType:c||"finish-to-start",description:d.length>0?`共享资源: ${d.join(", ")}`:"时间依赖",criticalPath:!1,status:"active",createdDate:new Date().toISOString()};e.push(u)}}return e}function V(t,e){const o=(t.resourceRequirements||[]).map(r=>r.resourceId),a=(e.resourceRequirements||[]).map(r=>r.resourceId);return o.filter(r=>a.includes(r))}function y(t,e){const o=new Date(t.startDate),a=new Date(t.endDate),r=new Date(e.startDate),s=new Date(e.endDate);return r>a&&Math.abs(r.getTime()-a.getTime())<10080*60*1e3?"finish-to-start":Math.abs(o.getTime()-r.getTime())<10080*60*1e3?"start-to-start":Math.abs(a.getTime()-s.getTime())<10080*60*1e3?"finish-to-finish":null}function A(t,e){const o=new Map,a=new Map;t.forEach(n=>{o.set(n.id,[]),a.set(n.id,0)}),e.forEach(n=>{o.get(n.sourceProjectId)?.push(n.targetProjectId),a.set(n.targetProjectId,(a.get(n.targetProjectId)||0)+1)});const r=[];a.forEach((n,i)=>{n===0&&r.push(i)});const s=new Map,l=new Map;for(t.forEach(n=>{s.set(n.id,0),l.set(n.id,null)});r.length>0;){const n=r.shift(),i=t.find(g=>g.id===n);if(!i)continue;const h=Math.ceil((new Date(i.endDate).getTime()-new Date(i.startDate).getTime())/(1e3*60*60*24));(o.get(n)||[]).forEach(g=>{const m=(s.get(n)||0)+h;m>(s.get(g)||0)&&(s.set(g,m),l.set(g,n)),a.set(g,(a.get(g)||0)-1),a.get(g)===0&&r.push(g)})}let d=0,c=null;s.forEach((n,i)=>{n>d&&(d=n,c=i)});const u=[];let f=c;for(;f;)u.unshift(f),f=l.get(f)||null;return u}function L(t,e,o,a){const r=[],s=new Map;a.forEach(c=>{s.has(c.sourceProjectId)||s.set(c.sourceProjectId,[]),s.get(c.sourceProjectId).push(c.targetProjectId)});const l=[{projectId:t,accumulatedDelay:e}],d=new Set;for(;l.length>0;){const{projectId:c,accumulatedDelay:u}=l.shift();if(d.has(c))continue;d.add(c);const f=o.find(i=>i.id===c);if(!f)continue;if(c!==t){const i=new Date(f.endDate),h=new Date(i);h.setDate(h.getDate()+u),r.push({projectId:c,projectName:f.name,originalEndDate:f.endDate,newEndDate:h.toISOString().split("T")[0],delayDays:u})}(s.get(c)||[]).forEach(i=>{l.push({projectId:i,accumulatedDelay:u})})}return r}function N(t,e){const o=new Map,a=new Map;t.forEach(n=>{o.set(n.id,0),a.set(n.id,0)}),e.forEach(n=>{a.set(n.sourceProjectId,(a.get(n.sourceProjectId)||0)+1),o.set(n.targetProjectId,(o.get(n.targetProjectId)||0)+1)});const r=e.filter(n=>n.criticalPath).length;let s=0,l=null;o.forEach((n,i)=>{n>s&&(s=n,l=i)});let d=0,c=null;a.forEach((n,i)=>{n>d&&(d=n,c=i)});const u=l?{id:l,name:t.find(n=>n.id===l)?.name||"",count:s}:null,f=c?{id:c,name:t.find(n=>n.id===c)?.name||"",count:d}:null;return{totalDependencies:e.length,criticalDependencies:r,mostDependentProject:u,mostBlockingProject:f}}function B(t){const e=w(t),o=["项目名称","截止日期","计划价值(PV)","挣值(EV)","实际成本(AC)","进度绩效指数(SPI)","成本绩效指数(CPI)","进度偏差(SV)","成本偏差(CV)","完工估算(EAC)","完工尚需估算(ETC)","完工偏差(VAC)","完工尚需绩效指数(TCPI)"],a=[t.name,new Date(e.asOfDate).toLocaleDateString("zh-CN"),e.plannedValue.toFixed(2),e.earnedValue.toFixed(2),e.actualCost.toFixed(2),e.schedulePerformanceIndex.toFixed(3),e.costPerformanceIndex.toFixed(3),e.scheduleVariance.toFixed(2),e.costVariance.toFixed(2),e.estimateAtCompletion.toFixed(2),e.estimateToComplete.toFixed(2),e.varianceAtCompletion.toFixed(2),e.toCompletePerformanceIndex.toFixed(3)],r=[o.join(","),a.join(",")].join(`
`);b(r,`EVM报告_${t.name}_${new Date().toISOString().split("T")[0]}.csv`)}function R(t){const e=M(t),o=["源项目","目标项目","依赖类型","描述","关键路径","状态","创建日期"],a=e.map(s=>[s.sourceProjectName,s.targetProjectName,s.dependencyType,s.description,s.criticalPath?"是":"否",s.status==="active"?"活跃":s.status==="resolved"?"已解决":"已断开",new Date(s.createdDate).toLocaleDateString("zh-CN")]),r=[o.join(","),...a.map(s=>s.join(","))].join(`
`);b(r,`跨项目依赖分析_${new Date().toISOString().split("T")[0]}.csv`)}function z(t){const e=w(t),o=`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>EVM 报告 - ${t.name}</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>挣值管理 (EVM) 报告</h1>
    <div style="margin: 20px 0;">
        <p><strong>项目名称：</strong>${t.name}</p>
        <p><strong>项目经理：</strong>${t.manager||"未分配"}</p>
        <p><strong>报告日期：</strong>${new Date(e.asOfDate).toLocaleDateString("zh-CN")}</p>
    </div>
    <h2>核心指标</h2>
    <table>
        <tr><th>指标</th><th>值</th><th>说明</th></tr>
        <tr><td>计划价值 (PV)</td><td>¥${e.plannedValue.toLocaleString()}</td><td>按计划应该完成的工作价值</td></tr>
        <tr><td>挣值 (EV)</td><td>¥${e.earnedValue.toLocaleString()}</td><td>实际完成的工作价值</td></tr>
        <tr><td>实际成本 (AC)</td><td>¥${e.actualCost.toLocaleString()}</td><td>实际花费的成本</td></tr>
    </table>
    <h2>绩效指数</h2>
    <table>
        <tr><th>指标</th><th>值</th><th>状态</th></tr>
        <tr><td>进度绩效指数 (SPI)</td><td>${e.schedulePerformanceIndex.toFixed(3)}</td><td class="${e.schedulePerformanceIndex>=1?"positive":"negative"}">${e.schedulePerformanceIndex>=1?"进度超前":"进度落后"}</td></tr>
        <tr><td>成本绩效指数 (CPI)</td><td>${e.costPerformanceIndex.toFixed(3)}</td><td class="${e.costPerformanceIndex>=1?"positive":"negative"}">${e.costPerformanceIndex>=1?"成本节约":"成本超支"}</td></tr>
    </table>
    <div class="footer">
        <p>此报告由 Visorq PMO 系统自动生成 · 生成时间：${new Date().toLocaleString("zh-CN")}</p>
    </div>
</body>
</html>
    `;v(o,`EVM报告_${t.name}`)}function b(t,e){const a=new Blob(["\uFEFF"+t],{type:"text/csv;charset=utf-8;"}),r=document.createElement("a"),s=URL.createObjectURL(a);r.setAttribute("href",s),r.setAttribute("download",e),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}function v(t,e){const o=window.open("","_blank");o&&(o.document.write(t),o.document.close(),o.focus(),setTimeout(()=>{o.print()},500))}export{F as a,O as b,w as c,k as d,B as e,j as f,$ as g,z as h,M as i,A as j,N as k,R as l,L as s};
