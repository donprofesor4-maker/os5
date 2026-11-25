const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../actividades/archivo-engine/rules.js'),grade='quinto-primaria';
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');

class El{constructor(){this.children=[];this.style={};this.dataset={};this.value='';this.attrs={}}append(x){this.children.push(x)}replaceChildren(){this.children=[]}setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]}focus(){}showModal(){this.open=true}close(){this.open=false}set innerHTML(v){this.html=v;this.children=[]}get innerHTML(){return this.html}}
let storage={};
for(const theme of ['central']){
const els={},events=[];const c={ArchiveRules:R,document:{body:{dataset:{theme}},getElementById:id=>els[id]??=new El(),createElement:()=>new El()},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},CustomEvent:class{constructor(type,v){this.type=type;this.detail=v.detail}},window:{dispatchEvent:e=>events.push(e),location:{href:''}}};vm.createContext(c);vm.runInContext(read('actividades/archivo-engine/evidence.js'),c);vm.runInContext(read('actividades/archivo-engine/game.js'),c);const run=s=>vm.runInContext(s,c);
assert.equal(run('sound'),false);run("$('continue').onclick()");assert.equal(run('taskIndex'),0);run('selectLevel(9)');assert.equal(run('level'),0);
// Acceso directo al hacker, como OS4, sin exigir completar los niveles.
run("$('hacker').onclick()");assert.equal(run('level'),10);assert.equal(run('model.tasks.length'),6);run('selectLevel(0)');
for(let level=0;level<11;level++){
run(`selectLevel(${level})`);assert.equal(run('level'),level);
for(let i=0;i<(level===10?6:3);i++){
assert.equal(run('taskIndex'),i);run("$('begin').onclick();path='';save()");assert.equal(run('solved'),false);assert.equal(els.onomatopoeia.textContent,'¡UPS!');
run("path=task().path;$('filename').value=task().name");
if(level>=8)run("{let parent='';for(const part of task().path.split('/')){const r=R.createFolder(model.folders,parent,part);if(r.ok)model.folders.push(r.path);parent=parent?parent+'/'+part:part}}");
if(level===5||level===6){run("$('filename').value='incorrecto.txt';save()");assert.equal(run('solved'),false);run("$('filename').value=task().name")}
run('save()');assert.equal(run('solved'),true);if(level===10&&i===5)assert(run('model.files.some(f=>f.name===task().file&&f.path===task().from)'),'El respaldo conserva el original');assert.equal(els.onomatopoeia.textContent,'¡CLIC!');assert(run('model.files.some(f=>f.name===task().name&&f.path===task().path)'));if(level===6)assert(run('model.files.some(f=>f.name===task().file&&f.path===task().path)'));if(level===7||level===10&&i===4)assert(!run('model.files.some(f=>f.name===task().file&&f.path===task().from)'));
const eventCount=events.length;run('save()');assert.equal(events.length,eventCount);run("$('continue').onclick()");
}}
assert.equal(events.length,36);assert.equal(run('completed.length'),11);assert.equal(c.window.location.href,'../../index.html');
const record=JSON.parse(storage['donprofesor.os.p5.entregas.v1']),module='Entregas de quinto';const credit=record.logs.filter(x=>x.module===module&&x.action==='accredited');assert.equal(credit.length,36);assert.equal(credit.filter(x=>x.detail.competence==='Avanzada').length,6);assert(credit.every(x=>x.detail.errors>=1&&x.detail.attempts>=2&&x.detail.evidence.files&&x.date));
// Recarga y aislamiento por alumno: el juego nunca escribe en la clave de OS4.
assert(storage[`os5-entregas-${theme}-v1`]);assert(!storage[`os4-archivos-${theme}-v1`]);run("selectLevel(0);$('begin').onclick();path=task().path;$('filename').value=task().name;save();restore();loadTask()");assert.equal(run('taskIndex'),1);
console.log('PASS '+theme+': 36 encargos de quinto, niveles, hacker directo, errores, versiones, movimiento, evidencias y recarga.');
}
const record=JSON.parse(storage['donprofesor.os.p5.entregas.v1']);assert(new Set(record.logs.filter(x=>x.action==='accredited').map(x=>x.module)).size===1);
assert.equal(R.createFolder(['Documentos'],'Documentos','../mal').ok,false);assert.equal(R.createFolder(['Documentos'],'Documentos','').ok,false);
console.log('PASS: las entregas alimentan la bitácora de quinto.');
