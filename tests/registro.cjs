const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const R=require('../actividades/archivo-engine/rules.js');
class Sheet{constructor(headers){this.rows=[headers]}getLastRow(){return this.rows.length}getLastColumn(){return this.rows[0].length}appendRow(row){this.rows.push([...row])}getRange(r,c,n=1,m=1){const self=this;return{getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>self.rows[r-1+i]?.[c-1+j]??'')),setValues(values){values.forEach((v,i)=>{self.rows[r-1+i]??=[];v.forEach((x,j)=>self.rows[r-1+i][c-1+j]=x)});return this},clearContent(){for(let i=0;i<n;i++)for(let j=0;j<m;j++)if(self.rows[r-1+i])self.rows[r-1+i][c-1+j]='';return this},setNumberFormat(){return this}}}}
const sheets={Alumnos:new Sheet(['id','name','group','hash','created']),Estado:new Sheet(['id','state','date','basic','hacker']),Evidencias:new Sheet(['id','student','json','date']),Sesiones:new Sheet(Array(12).fill('header')),Trimestres:new Sheet(['term','from','until','assigned']),Resumen:new Sheet(Array(9).fill('header'))};
sheets.Trimestres.appendRow(['1',new Date('2020-01-01'),new Date('2100-01-01'),'1,2,3']);sheets.Trimestres.appendRow(['2',new Date('2100-01-01'),new Date('2101-01-01'),'']);
const props={OS5_SHEET_ID:'private-sheet',PEPPER:'fixture-only',CLASS_CODE:'TEST-CLASS'},cache=new Map();
const c={ArchiveRules:R,Date,JSON,Set,Map,Number,String,Array,Error,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url')},SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets[n]})}};
vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../backend/Code.gs'),'utf8'),c);const call=p=>{c.payload=p;return vm.runInContext('api_(payload)',c)};
const alumno={name:'Alumno ficticio',group:'5 A',pin:'123456'};
assert.throws(()=>call({...alumno,action:'register',classCode:'incorrect'}));
let result=call({...alumno,action:'register',classCode:'TEST-CLASS'});assert.equal(result.state.revision,0);assert.equal(sheets.Alumnos.rows.length,2);assert(!sheets.Alumnos.rows[1][3].includes(alumno.pin));
assert.throws(()=>call({...alumno,pin:'999999',action:'load'}));
const model=R.build('central',0),task=model.tasks[0];model.files.push({name:task.name,path:task.path});
const entry={id:'evidence-one',date:'2026-11-25T12:00:00Z',mission:1,action:'accredited',ok:true,detail:{evidence:{request:task,destination:task.path,name:task.name,folders:model.folders,files:model.files}}};
const report={id:'session-first-123',revision:0,reason:'class',logs:[entry],snapshot:{level:0,taskIndex:1,completed:[],model}};
result=call({...alumno,action:'save',report});assert.equal(result.summary.basic,1);assert.equal(result.revision,1);assert.equal(sheets.Sesiones.rows.length,2);
result=call({...alumno,action:'save',report});assert.equal(result.duplicate,true);assert.equal(sheets.Sesiones.rows.length,2);assert.equal(sheets.Evidencias.rows.length,2);
result=call({...alumno,action:'load'});assert.equal(result.state.snapshot.taskIndex,1);assert.equal(result.state.logs.length,1);
// Repetir encargo con otra evidencia no eleva el número acreditado.
result=call({...alumno,action:'save',report:{...report,id:'session-second-123',revision:1,logs:[{...entry,id:'evidence-two'}]}});assert.equal(result.summary.basic,1);
const summary=sheets.Resumen.rows.find(r=>r[0]===alumno.name&&r[2]==='1');assert.equal(summary[4],1);assert.equal(summary[5],3.3);assert.equal(sheets.Resumen.rows.find(r=>r[2]==='2')[5],'');
assert.throws(()=>call({...alumno,action:'save',report:{...report,id:'stale-session-123',revision:0}}),/reciente/);
const forged=JSON.parse(JSON.stringify(entry));forged.id='forged-entry';forged.detail.evidence.destination='Videos';
assert.throws(()=>call({...alumno,action:'save',report:{...report,id:'forged-session-123',revision:2,logs:[forged]}}),/evidencia/);
// Otro alumno no hereda evidencias ni snapshot; las notas docentes se conservan.
summary[8]='Revisado por el profesor';call({name:'Otro alumno',group:'5 A',pin:'234567',classCode:'TEST-CLASS',action:'register'});result=call({name:'Otro alumno',group:'5 A',pin:'234567',action:'load'});assert.equal(result.state.logs.length,0);assert.equal(result.state.snapshot,null);
vm.runInContext('actualizarResumen()',c);assert.equal(sheets.Resumen.rows.find(r=>r[0]===alumno.name&&r[2]==='1')[8],'Revisado por el profesor');
console.log('PASS: identidad, claves cifradas, aislamiento, envío parcial, recuperación, idempotencia, conflictos, evidencias canónicas y trimestre sin duplicados.');
