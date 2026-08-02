import rrulePackage from "rrule";
const { RRule, rrulestr } = rrulePackage;

export const DAY = 86400000;
export const pad = (n) => String(n).padStart(2,"0");
export const localInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
export const startOfDay = (date) => new Date(date.getFullYear(),date.getMonth(),date.getDate());
export function startOfWeek(date, weekStartsOn=1){const d=startOfDay(date);const diff=(d.getDay()-weekStartsOn+7)%7;d.setDate(d.getDate()-diff);return d;}
export function viewRange(view, anchor, weekStartsOn=1){
  if(view==="day") return {start:startOfDay(anchor),end:new Date(startOfDay(anchor).getTime()+DAY)};
  if(view==="week"){const start=startOfWeek(anchor,weekStartsOn);return {start,end:new Date(start.getTime()+7*DAY)};}
  if(view==="month"){const start=new Date(anchor.getFullYear(),anchor.getMonth(),1);const grid=startOfWeek(start,weekStartsOn);return {start:grid,end:new Date(grid.getTime()+42*DAY)};}
  return {start:startOfDay(anchor),end:new Date(startOfDay(anchor).getTime()+90*DAY)};
}
export function recurrenceRule(kind,start,custom="",timezone="UTC"){
  const values=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(start).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
  const dt=`DTSTART;TZID=${timezone}:${values.year}${values.month}${values.day}T${values.hour}${values.minute}${values.second}`;
  const rules={daily:"FREQ=DAILY",weekly:"FREQ=WEEKLY",weekdays:"FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",monthly:"FREQ=MONTHLY",yearly:"FREQ=YEARLY"};
  const body=kind==="custom"?custom.trim().replace(/^RRULE:/i,""):rules[kind];
  return body?`${dt}\nRRULE:${body}`:null;
}
export function expandEvents(events,range){
  const exceptions=new Map();
  for(const e of events) if(e.recurrence_parent_id&&e.recurrence_exception_date) exceptions.set(`${e.recurrence_parent_id}:${e.recurrence_exception_date}`,e);
  const result=[];
  for(const event of events){
    if(event.recurrence_parent_id) continue;
    if(!event.recurrence_rule){if(new Date(event.ends_at)>range.start&&new Date(event.starts_at)<range.end)result.push({...event,occurrence_at:event.starts_at});continue;}
    try{
      const rule=rrulestr(event.recurrence_rule,{forceset:false});
      const starts=rule.between(range.start,range.end,true);
      const duration=new Date(event.ends_at)-new Date(event.starts_at);
      for(const start of starts){
        const key=`${event.id}:${dateKey(start)}`;const override=exceptions.get(key);
        if(override){if(override.status!=="cancelled")result.push({...override,series_event_id:event.id,occurrence_at:start.toISOString()});}
        else result.push({...event,id:`${event.id}@${start.toISOString()}`,series_event_id:event.id,starts_at:start.toISOString(),ends_at:new Date(start.getTime()+duration).toISOString(),occurrence_at:start.toISOString()});
      }
    }catch{if(new Date(event.ends_at)>range.start&&new Date(event.starts_at)<range.end)result.push({...event,occurrence_at:event.starts_at,recurrence_invalid:true});}
  }
  return result.sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
}
export function occupiedMetrics(events,range){
  const intervals=events.filter(e=>e.status!=="cancelled").map(e=>[Math.max(+new Date(e.starts_at),+range.start),Math.min(+new Date(e.ends_at),+range.end)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  const total=intervals.reduce((sum,[a,b])=>sum+b-a,0);let occupied=0,overlaps=0,current=null;
  for(const interval of intervals){if(!current){current=[...interval];continue;}if(interval[0]<current[1]){overlaps++;current[1]=Math.max(current[1],interval[1]);}else{occupied+=current[1]-current[0];current=[...interval];}}
  if(current)occupied+=current[1]-current[0];
  return {eventHours:total/3600000,occupiedHours:occupied/3600000,freeHours:Math.max(0,(+range.end-+range.start-occupied)/3600000),overlaps,count:events.length};
}
export function reminderRows(event,userId,offsets,occurrenceAt=event.starts_at){return offsets.map(offset=>({event_id:event.id,user_id:userId,offset_minutes:Number(offset),occurrence_at:occurrenceAt,scheduled_at:new Date(new Date(occurrenceAt).getTime()-Number(offset)*60000).toISOString(),status:"pending"}));}
export function escapeText(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
