import{d as P}from"./index-CE-3AOow.js";function w(t){const e=new Date,n=new Date(t.startDate),o=new Date(t.endDate),s=P(o,n),a=P(e,n),u=Math.min(Math.max(a/s,0),1),l=t.budget||t.totalBudget||0,d=t.actualCost||t.budgetUsed||0,f=l*u,g=(t.progress||0)/100,r=l*g,i=d,c=f>0?r/f:1,m=i>0?r/i:1,h=r-f,D=r-i,p=m>0?l/m:l,x=p-i,C=l-p,S=l-r,I=l-i,E=I>0?S/I:1;return{projectId:t.id,asOfDate:e.toISOString(),plannedValue:f,earnedValue:r,actualCost:i,schedulePerformanceIndex:c,costPerformanceIndex:m,scheduleVariance:h,costVariance:D,estimateAtCompletion:p,estimateToComplete:x,varianceAtCompletion:C,toCompletePerformanceIndex:E}}function $(t,e=10){const n=new Date(t.startDate),o=new Date(t.endDate),s=new Date,a=P(o,n),u=t.budget||t.totalBudget||0,l=(t.progress||0)/100,d=t.actualCost||t.budgetUsed||0,f=[];for(let g=0;g<=e;g++){const r=g/e,i=Math.floor(a*r),c=new Date(n);c.setDate(c.getDate()+i);const m=c<=s,h=u*r;let D=0;if(m){const x=Math.min(r/(P(s,n)/a)*l,l);D=u*x}let p=0;if(m){const x=D/(u*l||1);p=d*x}f.push({date:c.toISOString().split("T")[0],pv:Math.round(h),ev:Math.round(D),ac:Math.round(p)})}return f}function F(t){let e;t.schedulePerformanceIndex>=1.05?e="ahead":t.schedulePerformanceIndex>=.95?e="on-track":e="behind";let n;t.costPerformanceIndex>=1.05?n="under-budget":t.costPerformanceIndex>=.95?n="on-budget":n="over-budget";let o;return t.schedulePerformanceIndex>=.95&&t.costPerformanceIndex>=.95?o="good":t.schedulePerformanceIndex>=.85&&t.costPerformanceIndex>=.85?o="warning":o="critical",{scheduleStatus:e,costStatus:n,overallHealth:o}}function j(t){return t>=1e4?`¥${(t/1e4).toFixed(1)}万`:`¥${t.toLocaleString()}`}function O(t){return t.toFixed(2)}function k(t){return t>=1.05?"text-green-600 dark:text-green-400":t>=.95?"text-blue-600 dark:text-blue-400":t>=.85?"text-orange-600 dark:text-orange-400":"text-red-600 dark:text-red-400"}function M(t){const e=[],n=t.filter(o=>o.status==="active"||o.status==="planning");for(let o=0;o<n.length;o++)for(let s=o+1;s<n.length;s++){const a=n[o],u=n[s],l=V(a,u),d=y(a,u);if(l.length>0||d){const f={id:`dep-${a.id}-${u.id}`,sourceProjectId:a.id,sourceProjectName:a.name,targetProjectId:u.id,targetProjectName:u.name,dependencyType:d||"finish-to-start",description:l.length>0?`共享资源: ${l.join(", ")}`:"时间依赖",criticalPath:!1,status:"active",createdDate:new Date().toISOString()};e.push(f)}}return e}function V(t,e){const n=(t.resourceRequirements||[]).map(s=>s.resourceId),o=(e.resourceRequirements||[]).map(s=>s.resourceId);return n.filter(s=>o.includes(s))}function y(t,e){const n=new Date(t.startDate),o=new Date(t.endDate),s=new Date(e.startDate),a=new Date(e.endDate);return s>o&&Math.abs(s.getTime()-o.getTime())<7*24*60*60*1e3?"finish-to-start":Math.abs(n.getTime()-s.getTime())<7*24*60*60*1e3?"start-to-start":Math.abs(o.getTime()-a.getTime())<7*24*60*60*1e3?"finish-to-finish":null}function A(t,e){const n=new Map,o=new Map;t.forEach(r=>{n.set(r.id,[]),o.set(r.id,0)}),e.forEach(r=>{var i;(i=n.get(r.sourceProjectId))==null||i.push(r.targetProjectId),o.set(r.targetProjectId,(o.get(r.targetProjectId)||0)+1)});const s=[];o.forEach((r,i)=>{r===0&&s.push(i)});const a=new Map,u=new Map;for(t.forEach(r=>{a.set(r.id,0),u.set(r.id,null)});s.length>0;){const r=s.shift(),i=t.find(h=>h.id===r);if(!i)continue;const c=Math.ceil((new Date(i.endDate).getTime()-new Date(i.startDate).getTime())/(1e3*60*60*24));(n.get(r)||[]).forEach(h=>{const D=(a.get(r)||0)+c;D>(a.get(h)||0)&&(a.set(h,D),u.set(h,r)),o.set(h,(o.get(h)||0)-1),o.get(h)===0&&s.push(h)})}let l=0,d=null;a.forEach((r,i)=>{r>l&&(l=r,d=i)});const f=[];let g=d;for(;g;)f.unshift(g),g=u.get(g)||null;return f}function L(t,e,n,o){const s=[],a=new Map;o.forEach(d=>{a.has(d.sourceProjectId)||a.set(d.sourceProjectId,[]),a.get(d.sourceProjectId).push(d.targetProjectId)});const u=[{projectId:t,accumulatedDelay:e}],l=new Set;for(;u.length>0;){const{projectId:d,accumulatedDelay:f}=u.shift();if(l.has(d))continue;l.add(d);const g=n.find(i=>i.id===d);if(!g)continue;if(d!==t){const i=new Date(g.endDate),c=new Date(i);c.setDate(c.getDate()+f),s.push({projectId:d,projectName:g.name,originalEndDate:g.endDate,newEndDate:c.toISOString().split("T")[0],delayDays:f})}(a.get(d)||[]).forEach(i=>{u.push({projectId:i,accumulatedDelay:f})})}return s}function N(t,e){var r,i;const n=new Map,o=new Map;t.forEach(c=>{n.set(c.id,0),o.set(c.id,0)}),e.forEach(c=>{o.set(c.sourceProjectId,(o.get(c.sourceProjectId)||0)+1),n.set(c.targetProjectId,(n.get(c.targetProjectId)||0)+1)});const s=e.filter(c=>c.criticalPath).length;let a=0,u=null;n.forEach((c,m)=>{c>a&&(a=c,u=m)});let l=0,d=null;o.forEach((c,m)=>{c>l&&(l=c,d=m)});const f=u?{id:u,name:((r=t.find(c=>c.id===u))==null?void 0:r.name)||"",count:a}:null,g=d?{id:d,name:((i=t.find(c=>c.id===d))==null?void 0:i.name)||"",count:l}:null;return{totalDependencies:e.length,criticalDependencies:s,mostDependentProject:f,mostBlockingProject:g}}function B(t){const e=w(t),n=["项目名称","截止日期","计划价值(PV)","挣值(EV)","实际成本(AC)","进度绩效指数(SPI)","成本绩效指数(CPI)","进度偏差(SV)","成本偏差(CV)","完工估算(EAC)","完工尚需估算(ETC)","完工偏差(VAC)","完工尚需绩效指数(TCPI)"],o=[t.name,new Date(e.asOfDate).toLocaleDateString("zh-CN"),e.plannedValue.toFixed(2),e.earnedValue.toFixed(2),e.actualCost.toFixed(2),e.schedulePerformanceIndex.toFixed(3),e.costPerformanceIndex.toFixed(3),e.scheduleVariance.toFixed(2),e.costVariance.toFixed(2),e.estimateAtCompletion.toFixed(2),e.estimateToComplete.toFixed(2),e.varianceAtCompletion.toFixed(2),e.toCompletePerformanceIndex.toFixed(3)],s=[n.join(","),o.join(",")].join(`
`);b(s,`EVM报告_${t.name}_${new Date().toISOString().split("T")[0]}.csv`)}function R(t){const e=M(t),n=["源项目","目标项目","依赖类型","描述","关键路径","状态","创建日期"],o=e.map(a=>[a.sourceProjectName,a.targetProjectName,a.dependencyType,a.description,a.criticalPath?"是":"否",a.status==="active"?"活跃":a.status==="resolved"?"已解决":"已断开",new Date(a.createdDate).toLocaleDateString("zh-CN")]),s=[n.join(","),...o.map(a=>a.join(","))].join(`
`);b(s,`跨项目依赖分析_${new Date().toISOString().split("T")[0]}.csv`)}function z(t){const e=w(t),n=`
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
    `;v(n,`EVM报告_${t.name}`)}function b(t,e){const n="\uFEFF",o=new Blob([n+t],{type:"text/csv;charset=utf-8;"}),s=document.createElement("a"),a=URL.createObjectURL(o);s.setAttribute("href",a),s.setAttribute("download",e),s.style.visibility="hidden",document.body.appendChild(s),s.click(),document.body.removeChild(s)}function v(t,e){const n=window.open("","_blank");n&&(n.document.write(t),n.document.close(),n.focus(),setTimeout(()=>{n.print()},500))}export{F as a,O as b,w as c,k as d,B as e,j as f,$ as g,z as h,M as i,A as j,N as k,R as l,L as s};
