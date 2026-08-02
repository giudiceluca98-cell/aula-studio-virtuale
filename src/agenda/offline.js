const DB="aula-agenda-cache-v1";const VERSION=1;
function open(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("cache"))db.createObjectStore("cache");if(!db.objectStoreNames.contains("queue"))db.createObjectStore("queue",{keyPath:"queueId"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function tx(store,mode,work){const db=await open();return new Promise((resolve,reject)=>{const transaction=db.transaction(store,mode);const request=work(transaction.objectStore(store));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);transaction.oncomplete=()=>db.close();});}
export const cacheSet=(key,value)=>tx("cache","readwrite",s=>s.put(value,key));
export const cacheGet=(key)=>tx("cache","readonly",s=>s.get(key));
export const queueAdd=(mutation)=>tx("queue","readwrite",s=>s.put({...mutation,queueId:crypto.randomUUID(),queuedAt:new Date().toISOString()}));
export const queueAll=()=>tx("queue","readonly",s=>s.getAll());
export const queueRemove=(id)=>tx("queue","readwrite",s=>s.delete(id));
