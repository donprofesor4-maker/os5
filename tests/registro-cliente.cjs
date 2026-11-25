const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
class Element{constructor(){this.value='';this.hidden=false;this.disabled=false;this.checked=false;this.listeners={};}addEventListener(n,f){this.listeners[n]=f}showModal(){this.open=true}close(){this.open=false}reset(){}}
const elements={},main={inert:false},storage=new Map(),events={},calls=[];let offline=false;
const get=id=>elements[id]??=new Element();
const c={OS5_REGISTRO:{endpoint:'https://fixture.invalid/exec'},crypto:require('node:crypto'),AbortController,setTimeout,clearTimeout,Event:class{constructor(type){this.type=type}},document:{getElementById:get,querySelector:()=>main},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},confirm:()=>true,addEventListener:(n,f)=>(events[n]??=[]).push(f),dispatchEvent:e=>(events[e.type]||[]).forEach(f=>f(e)),fetch:async(url,opt)=>{const p=JSON.parse(opt.body);calls.push(p);if(offline)throw Error('Sin red');return{ok:true,json:async()=>p.action==='save'?{ok:true,revision:1}:{ok:true,state:{revision:0,logs:[],snapshot:null}}}}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../actividades/archivo-engine/registro.js'),'utf8'),c);
get('alumno-name').value='Alumno de prueba';get('alumno-group').value='5 A';get('alumno-pin').value='123456';
await get('registro-form').listeners.submit({preventDefault(){}});assert(c.OS5Registro.isStudent());const firstKey=c.OS5Registro.key('game');
c.OS5Registro.write('game',{level:0,taskIndex:1});c.OS5Registro.write('evidence',{logs:[{id:'test-credit',mission:1,action:'accredited',ok:true}]});
offline=true;await c.OS5Registro.send();assert(main.inert);assert(get('registro-status').textContent.includes('pendiente'));const pending=c.OS5Registro.read('pending');assert.equal(pending.logs.length,1);assert(!get('registro-status').textContent.includes('✓'));
offline=false;await c.OS5Registro.send();assert.equal(calls.at(-1).report.id,pending.id);assert(!c.OS5Registro.isStudent());assert(get('registro-status').textContent.includes('guardado'));assert(!main.inert);assert(get('registro-dialog').open);assert([...storage.values()].every(v=>!v.includes('123456')));
get('alumno-name').value='Otro alumno';await get('registro-form').listeners.submit({preventDefault(){}});assert.notEqual(c.OS5Registro.key('game'),firstKey);assert.equal(c.OS5Registro.read('game',null),null);assert.equal(c.OS5Registro.read('evidence').logs.length,0);
console.log('PASS: identidad local, claves solo en memoria, cola sin red, reenvío con mismo ID, confirmación real, cierre e aislamiento.');
})().catch(e=>{console.error(e);process.exit(1)});
