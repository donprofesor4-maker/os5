(function(root){'use strict';
const base='os5.registro.v1', $=id=>document.getElementById(id), config=root.OS5_REGISTRO||{};
let person=null, revision=0, pending=null;
function freeze(on){document.querySelector('main').inert=on;}
const uid=()=>crypto.randomUUID();
// Conserva el historial anónimo anterior; nunca lo atribuye a un alumno por su nombre.
try{for(const [kind,legacy] of [['evidence','donprofesor.os.p5.entregas.v1'],['game','os5-entregas-central-v1']]){const guest=base+'.invitado.'+kind;if(!localStorage.getItem(guest)&&localStorage.getItem(legacy))localStorage.setItem(guest,localStorage.getItem(legacy));}}catch{}
function scope(){return person?base+'.'+encodeURIComponent(person.name.toLocaleLowerCase('es')+'|'+person.group.toLocaleLowerCase('es')):base+'.invitado';}
function key(kind){return scope()+'.'+kind;}
function read(kind,fallback){try{return JSON.parse(localStorage.getItem(key(kind)))??fallback;}catch{return fallback;}}
function write(kind,value){localStorage.setItem(key(kind),JSON.stringify(value));}
function status(message){$('registro-status').textContent=message;}
async function request(payload){
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),25000);
  try { const res=await fetch(config.endpoint,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:controller.signal});
    if(!res.ok)throw Error('El servidor no confirmó el envío.');const data=await res.json();if(!data.ok)throw Error(data.error||'No se pudo guardar.');return data;
  }finally{clearTimeout(timeout);}
}
function auth(){return {name:person.name,group:person.group,pin:person.pin};}
function normalize(s){return s.trim().replace(/\s+/g,' ');}
async function enter(event){event.preventDefault();const submit=$('registro-enter');submit.disabled=true;
  try {
    if(!config.endpoint)throw Error('El registro en la nube todavía no está activado. Puedes practicar como invitado y descargar la bitácora.');
    const candidate={name:normalize($('alumno-name').value),group:normalize($('alumno-group').value),pin:$('alumno-pin').value};
    const data=await request({...candidate,action:$('alumno-first').checked?'register':'load',classCode:$('alumno-class').value.trim()});
    person=candidate;revision=data.state.revision||0;pending=read('pending',null);
    const local=read('evidence',{version:1,logs:[]}), remote=data.state.logs||[];
    const merged=new Map(remote.map(x=>[x.id,x]));local.logs.forEach(x=>{if(!merged.has(x.id))merged.set(x.id,x);});
    write('evidence',{version:1,logs:[...merged.values()]});write('synced',remote.map(x=>x.id));freeze(!!pending);
    if(!pending&&data.state.snapshot)write('game',data.state.snapshot);
    if(!pending)write('revision',revision);
    $('registro-dialog').close();$('registro-student').textContent=person.name+' · '+person.group;
    $('registro-send').disabled=false;$('registro-switch').hidden=false;root.dispatchEvent(new Event('os5:identity'));
    status(pending?'Hay un reporte pendiente. Pulsa «Guardar y terminar clase» para reintentarlo.':'Expediente recuperado. Tu clave no se guarda en esta computadora.');
  }catch(e){$('registro-error').textContent=e.name==='AbortError'?'La conexión tardó demasiado. Intenta de nuevo.':e.message;}
  finally{submit.disabled=false;}
}
async function send(reason='class'){
  if(!person){$('registro-dialog').showModal();return;}
  const b=$('registro-send');b.disabled=true;freeze(true);status('Enviando… espera la confirmación.');
  try{
    root.dispatchEvent(new Event('os5:checkpoint'));
    pending??=read('pending',null);
    if(!pending){pending={id:uid(),revision:read('revision',revision),reason,logs:read('evidence',{logs:[]}).logs.filter(x=>!read('synced',[]).includes(x.id)),snapshot:read('game',null)};write('pending',pending);}
    const data=await request({...auth(),action:'save',report:pending});
    revision=data.revision;write('revision',revision);localStorage.removeItem(key('pending'));pending=null;
    status('✓ Reporte guardado en el expediente del profesor. Puedes cerrar la clase.');
    // La sesión termina después de un envío confirmado: el siguiente alumno vuelve a identificarse.
    $('registro-send').textContent='Reporte enviado · Volver a entrar';
    person=null;root.dispatchEvent(new Event('os5:identity'));$('registro-student').textContent='Sesión cerrada';freeze(false);$('registro-form').reset();$('class-row').hidden=true;$('registro-error').textContent='✓ Reporte guardado. Tu sesión terminó; el siguiente alumno puede entrar.';$('registro-dialog').showModal();
  }catch(e){if(/más reciente/.test(e.message))$('registro-recover').hidden=false;status((e.name==='AbortError'?'No llegó la confirmación.':e.message)+' Tu reporte sigue pendiente en esta computadora. Reintenta antes de cerrar.');}
  finally{b.disabled=false;}
}
root.OS5Registro={key,read,write,uid,send,isStudent:()=>!!person};
$('registro-form').addEventListener('submit',enter);
$('alumno-first').addEventListener('change',()=>{$('class-row').hidden=!$('alumno-first').checked;});
$('registro-send').onclick=()=>send();
$('registro-recover').onclick=async()=>{
  if(!person)return;
  const b=$('registro-recover');b.disabled=true;
  try{
    const data=await request({...auth(),action:'load'});
    // El conflicto queda archivado localmente para que el profesor pueda revisarlo.
    const archived=read('conflicts',[]);archived.push({date:new Date().toISOString(),report:pending});write('conflicts',archived);
    const logs=new Map(data.state.logs.map(x=>[x.id,x]));read('evidence',{logs:[]}).logs.forEach(x=>{if(!logs.has(x.id))logs.set(x.id,x)});
    write('evidence',{version:1,logs:[...logs.values()]});write('synced',data.state.logs.map(x=>x.id));
    write('game',data.state.snapshot);write('revision',data.state.revision);revision=data.state.revision;
    localStorage.removeItem(key('pending'));pending=null;freeze(false);b.hidden=true;
    root.dispatchEvent(new Event('os5:identity'));status('Punto de continuación más reciente recuperado. Se conservaron tus evidencias locales; vuelve a guardar el reporte.');
  }catch(e){status(e.message);}finally{b.disabled=false;}
};
$('registro-switch').onclick=()=>{if(person&& !confirm('¿Cambiar de alumno? Guarda primero tu reporte para conservarlo en la nube.'))return;person=null;pending=null;freeze(false);root.dispatchEvent(new Event('os5:identity'));$('registro-form').reset();$('class-row').hidden=true;$('registro-dialog').showModal();};
$('registro-guest').onclick=()=>{person=null;freeze(false);$('registro-dialog').close();status('Modo invitado: solo se guarda en esta computadora. Descarga tu bitácora al salir.');};
$('registro-open').onclick=()=>$('registro-dialog').showModal();
root.addEventListener('beforeunload',event=>{if(person){event.preventDefault();event.returnValue='';}});
$('registro-dialog').addEventListener('cancel',e=>e.preventDefault());
$('registro-dialog').showModal();
})(window);
