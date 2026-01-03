import{e as p}from"./index-XLZZaUMN.js";/**
 * @license lucide-react v0.428.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=p("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);function E(e,s){var h;const n=(h=e.baselines)==null?void 0:h.find(i=>i.id===e.activeBaselineId),a=u(n?n.snapshot.tasks:e.tasks||[]),t=u(e.tasks||[]),o=a>0?(t-a)/a*100:0,r=s.length,c=s.filter(i=>i.status==="approved").length,l=s.filter(i=>i.status==="rejected").length,d=s.filter(i=>i.status==="pending").length,f=o>30,g=f;return{projectId:e.id,projectName:e.name,baselineEffortHours:a,currentEffortHours:t,creepPercentage:o,totalChangeRequests:r,approvedChanges:c,rejectedChanges:l,pendingChanges:d,isOverThreshold:f,requiresRebaseline:g,calculatedAt:new Date().toISOString()}}function u(e){return e.reduce((s,n)=>{const a=new Date(n.startDate),t=new Date(n.endDate),r=Math.ceil((t.getTime()-a.getTime())/(1e3*60*60*24))*8;return s+r},0)}function H(e,s){const n=[],a=[];if(e.budget&&e.actualCost){const t=e.budget-e.actualCost;s.estimatedCostIncrease>t?a.push(`变更成本 (${s.estimatedCostIncrease}) 超过剩余预算 (${t})`):s.estimatedCostIncrease>t*.8&&n.push(`变更将消耗剩余预算的 ${Math.round(s.estimatedCostIncrease/t*100)}%`)}if(s.scheduleImpactDays>0){const t=new Date(e.endDate),o=new Date(t);o.setDate(o.getDate()+s.scheduleImpactDays),n.push(`项目结束日期将从 ${t.toLocaleDateString()} 延后到 ${o.toLocaleDateString()}`)}return(!s.businessJustification||s.businessJustification.length<20)&&a.push("必须提供充分的业务理由（至少 20 个字符）"),{isValid:a.length===0,warnings:n,errors:a}}function I(e,s){const n=[];return(e.tasks||[]).forEach(t=>{if(!s.some(r=>{var c;return(c=r.relatedTaskIds)==null?void 0:c.includes(t.id)})){const r=new Date(t.startDate),c=new Date(t.endDate),d=Math.ceil((c.getTime()-r.getTime())/(1e3*60*60*24))*8;n.push({taskId:t.id,taskName:t.name,reason:"no_requirement_link",estimatedEffort:d})}}),n}function T(e){return e.isOverThreshold?`⚠️ 范围蔓延警告：项目 "${e.projectName}" 的工时已超出基线 ${e.creepPercentage.toFixed(1)}%。
    
当前工时：${e.currentEffortHours} 小时
基线工时：${e.baselineEffortHours} 小时
增加工时：${e.currentEffortHours-e.baselineEffortHours} 小时

建议：
1. 审查所有变更请求（已批准：${e.approvedChanges}，待审批：${e.pendingChanges}）
2. 考虑重新设定项目基线
3. 评估是否需要增加预算或延长工期`:null}export{C as A,E as c,I as d,T as g,H as v};
