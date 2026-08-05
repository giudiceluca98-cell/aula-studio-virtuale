import { execFileSync } from "node:child_process";import { join } from "node:path";
const files=["src/auth/session.js","src/auth/auth-page.js","src/agenda/agenda.js","src/agenda/core.js","src/agenda/offline.js","api/_lib/agenda-server.js","api/auth/config.js","api/agenda/config.js","api/agenda/subscriptions.js","api/agenda/test-notification.js","api/agenda/process-reminders.js"];
for(const file of files)execFileSync(process.execPath,["--check",join(process.cwd(),file)],{stdio:"pipe"});
console.log(`Controllo sintattico completato: ${files.length} file.`);
