/** OS5 · Registro privado. Publicar como aplicación web, ejecutar como propietario. */
const DB_KEY = 'OS5_SHEET_ID';
function doGet() { return ContentService.createTextOutput('OS5 · Servicio de expedientes.'); }
function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (JSON.stringify(p).length > 250000) throw Error('El reporte es demasiado grande.');
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try { return json_(api_(p)); } finally { lock.releaseLock(); }
  } catch (e) { return json_({ok:false,error:String(e.message || e)}); }
}
function json_(v) { return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON); }
function db_() {
  const id = PropertiesService.getScriptProperties().getProperty(DB_KEY);
  if (!id) throw Error('El profesor todavía no ha activado el registro.');
  return SpreadsheetApp.openById(id);
}
function rows_(name) { const s=db_().getSheetByName(name); return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues():[]; }
function safe_(v) { return String(v).replace(/^[=+@-]/,"'").slice(0,120); }
function hash_(v) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v)); }
function clean_(s,max) { s=String(s||'').trim().replace(/\s+/g,' '); if(!s||s.length>max)throw Error('Revisa los datos del alumno.'); return s; }
function identity_(p) {
  const name=clean_(p.name,80), group=clean_(p.group,20), pin=String(p.pin||'');
  if(!/^\d{6}$/.test(pin))throw Error('La clave personal debe tener seis números.');
  const props=PropertiesService.getScriptProperties();
  const id=hash_(name.normalize('NFKC').toLocaleLowerCase('es')+'|'+group.normalize('NFKC').toLocaleLowerCase('es'));
  const digest=hash_(props.getProperty('PEPPER')+'|'+id+'|'+pin);
  const cache=CacheService.getScriptCache(), key='fail_'+id;
  if(Number(cache.get(key)||0)>=8)throw Error('Demasiados intentos. Espera diez minutos y pide ayuda al profesor.');
  const roster=rows_('Alumnos'), index=roster.findIndex(r=>r[0]===id);
  if(index<0) {
    if(p.action!=='register')throw Error('No encontramos ese alumno. Revisa nombre y grupo o elige Primera vez.');
    if(String(p.classCode||'')!==props.getProperty('CLASS_CODE'))throw Error('Pide al profesor el código de clase.');
    db_().getSheetByName('Alumnos').appendRow([id,safe_(name),safe_(group),digest,new Date()]);
  } else if(roster[index][3]!==digest) {
    cache.put(key,String(Number(cache.get(key)||0)+1),600);
    throw Error('Los datos o la clave no coinciden.');
  }
  cache.remove(key); return {id,name,group};
}
function api_(p) {
  if(!['register','load','save'].includes(p.action))throw Error('Operación no disponible.');
  const student=identity_(p);
  const sheet=db_().getSheetByName('Estado'), all=rows_('Estado'), index=all.findIndex(r=>r[0]===student.id);
  let state=index<0?{version:1,logs:[],snapshot:null,revision:0}:JSON.parse(all[index][1]);
  state.logs=rows_('Evidencias').filter(r=>r[1]===student.id).map(r=>JSON.parse(r[2]));
  if(p.action!=='save')return {ok:true,state,student:{name:student.name,group:student.group}};
  const report=p.report;
  if(!report||!/^[-\w]{12,80}$/.test(report.id)||!Array.isArray(report.logs))throw Error('Reporte inválido.');
  const sessions=rows_('Sesiones');
  if(state.lastReportId===report.id||sessions.some(r=>r[0]===report.id&&r[2]===student.id))return {ok:true,duplicate:true,revision:state.revision};
  if(report.revision!==state.revision)throw Error('Hay un avance más reciente en otra computadora. Descarga tu bitácora, sal y vuelve a entrar para recuperarlo.');
  const now=new Date(), existing=new Set(state.logs.map(x=>x.id)), additions=[];
  for(const entry of report.logs) {
    if(!entry||typeof entry.id!=='string'||entry.id.length>100||existing.has(entry.id))continue;
    if(!Number.isInteger(entry.mission)||entry.mission<1||entry.mission>36||!['guardar','crear carpeta','accredited'].includes(entry.action))continue;
    if(entry.action==='accredited'&&!validCredit_(entry))throw Error('Una evidencia no coincide con el encargo. Pide ayuda al profesor.');
    entry.receivedAt=now.toISOString(); if(JSON.stringify(entry).length>44000)throw Error('Evidencia demasiado grande.'); state.logs.push(entry); additions.push([entry.id,student.id,JSON.stringify(entry),now]); existing.add(entry.id);
  }
  if(state.logs.length>1800)throw Error('La bitácora está llena. Pide al profesor que la archive.');
  // El expediente conserva todas las evidencias; las repeticiones no duplican encargos.
  const summary=summary_(state.logs);
  if(report.snapshot) {
    const s=report.snapshot;
    if(!Number.isInteger(s.level)||s.level<0||s.level>10||!Number.isInteger(s.taskIndex)||!s.model||!Array.isArray(s.model.files)||!Array.isArray(s.model.folders))throw Error('Punto de continuación inválido.');
    if(s.taskIndex<0||s.taskIndex>=ArchiveRules.build('central',s.level).tasks.length||!Array.isArray(s.completed)||!s.completed.every(n=>Number.isInteger(n)&&n>=0&&n<=10))throw Error('Punto de continuación inválido.');
    state.snapshot=s;
  }
  state.revision++; state.updatedAt=now.toISOString();
  state.lastReportId=report.id;
  const encoded=JSON.stringify({...state,logs:undefined});
  if(encoded.length>45000)throw Error('El expediente necesita archivarse. Descarga la bitácora y avisa al profesor.');
  const values=[student.id,encoded,now,summary.basic,summary.hacker];
  if(additions.length){const ev=db_().getSheetByName('Evidencias'); ev.getRange(ev.getLastRow()+1,1,additions.length,4).setValues(additions);}
  if(index<0)sheet.appendRow(values);else sheet.getRange(index+2,1,1,values.length).setValues([values]);
  db_().getSheetByName('Sesiones').appendRow([report.id,now,student.id,safe_(student.name),safe_(student.group),summary.basic,summary.hacker,summary.errors,report.reason==='finished'?'Juego terminado':'Fin de clase',state.snapshot?state.snapshot.level+1:'',state.snapshot?state.snapshot.taskIndex+1:'',state.revision]);
  updateSummary_();
  return {ok:true,revision:state.revision,savedAt:state.updatedAt,summary};
}
function validCredit_(entry) {
  const level=entry.mission<=30?Math.floor((entry.mission-1)/3):10;
  const order=entry.mission<=30?(entry.mission-1)%3:entry.mission-31;
  const expected=ArchiveRules.build('central',level).tasks[order], d=entry.detail, e=d&&d.evidence;
  if(!e||e.destination!==expected.path||e.name!==expected.name||JSON.stringify(e.request)!==JSON.stringify(expected))return false;
  if(!Array.isArray(e.folders)||!e.folders.includes(expected.path)||!Array.isArray(e.files))return false;
  if(!e.files.some(f=>f.path===expected.path&&f.name===expected.name))return false;
  if(expected.action==='backup'&&!e.files.some(f=>f.path===expected.from&&f.name===expected.file))return false;
  if(expected.from&&expected.action!=='backup'&&e.files.some(f=>f.path===expected.from&&f.name===expected.file))return false;
  return true;
}
function summary_(logs) {
  const ids=new Set(logs.filter(x=>x.action==='accredited'&&x.ok).map(x=>x.mission));
  return {basic:[...ids].filter(x=>x<=30).length,hacker:[...ids].filter(x=>x>30).length,errors:logs.filter(x=>!x.ok).length};
}
/** Ejecutar una vez desde el editor. Nunca desde la aplicación pública. */
function prepararRegistro() {
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty(DB_KEY))return;
  const ss=SpreadsheetApp.create('OS5 · Expedientes y evaluación trimestral');
  const schemas={Evidencias:['Evidencia ID','Alumno ID','Evidencia JSON','Fecha recibida'],Alumnos:['ID','Alumno','Grupo','Clave cifrada','Alta'],Estado:['ID','Expediente JSON','Último envío','Básicas','Hacker'],Sesiones:['Reporte ID','Fecha de recepción','Alumno ID','Alumno','Grupo','Básicas acreditadas / 30','Hacker / 6','Errores acumulados','Motivo','Nivel siguiente','Encargo siguiente','Revisión'],Trimestres:['Trimestre','Desde (inclusive)','Hasta (exclusive)','Encargos básicos asignados (1 a 30, separados por coma)'],Resumen:['Alumno','Grupo','Trimestre','Asignados','Acreditados','Promedio propuesto / 10','Hacker (informativo)','Último envío','Nota docente']};
  ss.getSheets()[0].setName('Trimestres');
  Object.keys(schemas).forEach(name=>{const s=ss.getSheetByName(name)||ss.insertSheet(name); s.appendRow(schemas[name]);s.setFrozenRows(1);s.getRange(1,1,1,schemas[name].length).setBackground('#17365d').setFontColor('white').setFontWeight('bold');s.setColumnWidths(1,schemas[name].length,155);});
  const term=ss.getSheetByName('Trimestres');
  term.getRange(2,1,3,4).setValues([['1',new Date(2026,7,1),new Date(2026,11,1),Array.from({length:30},(_,i)=>i+1).join(',')],['2',new Date(2026,11,1),new Date(2027,3,1),''],['3',new Date(2027,3,1),new Date(2027,7,1),'']]);
  term.getRange('B2:C4').setNumberFormat('yyyy-mm-dd');term.setColumnWidth(4,580);
  ss.getSheetByName('Estado').hideSheet();ss.getSheetByName('Alumnos').hideSheet();
  props.setProperties({OS5_SHEET_ID:ss.getId(),PEPPER:Utilities.getUuid()+Utilities.getUuid(),CLASS_CODE:Utilities.getUuid().slice(0,8).toUpperCase()});
  const guide=ss.insertSheet('Inicio'); guide.getRange(1,1,9,2).setValues([
    ['OS5 · Panel docente','Solo el propietario debe acceder a esta hoja.'],
    ['Código de clase',props.getProperty('CLASS_CODE')],
    ['Ingreso del alumno','Nombre, grupo y clave personal de seis números. Primera vez: código de clase.'],
    ['Trimestres','Ajusta fechas y encargos asignados. Las fechas son una propuesta editable.'],
    ['Promedio propuesto','10 × encargos básicos acreditados dentro del periodo / encargos asignados. Sin asignación: sin nota.'],
    ['Repeticiones','Cada encargo cuenta una sola vez por trimestre. Los envíos y los intentos no se promedian.'],
    ['Reto hacker','Se registra por separado; no penaliza a quien no lo realiza.'],
    ['Revisión docente','Resumen es una propuesta del juego, no una calificación oficial. Nota docente se conserva.'],
    ['Actualizar','Ejecuta actualizarResumen después de cambiar las fechas o asignaciones.']]);
  guide.setColumnWidth(1,190);guide.setColumnWidth(2,760);guide.getRange('A1:B9').setWrap(true);guide.autoResizeRows(1,9);ss.setActiveSheet(guide);
  console.log(ss.getUrl());
}
function actualizarResumen(){updateSummary_();}
function updateSummary_() {
  const ss=db_(), terms=rows_('Trimestres'), roster=rows_('Alumnos'), states=rows_('Estado');
  const sheet=ss.getSheetByName('Resumen'), old=rows_('Resumen'), notes=new Map(old.map(r=>[r[0]+'|'+r[1]+'|'+r[2],r[8]]));
  const output=[];
  for(const s of states){const person=roster.find(r=>r[0]===s[0]);if(!person)continue;const state=JSON.parse(s[1]);state.logs=rows_('Evidencias').filter(r=>r[1]===s[0]).map(r=>JSON.parse(r[2]));
    for(const t of terms){if(!(t[1] instanceof Date)||!(t[2] instanceof Date))continue;
      const assigned=[...new Set(String(t[3]).split(',').map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=30))];
      const logs=state.logs.filter(x=>new Date(x.receivedAt)>=t[1]&&new Date(x.receivedAt)<t[2]);
      const ids=new Set(logs.filter(x=>x.action==='accredited'&&x.ok).map(x=>x.mission));
      const count=assigned.filter(n=>ids.has(n)).length;
      output.push([person[1],person[2],String(t[0]),assigned.length,count,assigned.length?Math.round(100*count/assigned.length)/10:'',summary_(logs).hacker,s[2],notes.get(person[1]+'|'+person[2]+'|'+t[0])||'']);
    }
  }
  if(sheet.getLastRow()>1)sheet.getRange(2,1,sheet.getLastRow()-1,9).clearContent();
  if(output.length){sheet.getRange(2,1,output.length,9).setValues(output);sheet.getRange(2,6,output.length,1).setNumberFormat('0.0');sheet.getRange(2,8,output.length,1).setNumberFormat('yyyy-mm-dd hh:mm');}
}
