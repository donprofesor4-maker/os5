(function(root){
'use strict';
const roots=['Escritorio','Descargas','Documentos','Imágenes','Música','Videos'];
const central=[[["Instrucciones.pdf", "Documentos"], ["Árbol.png", "Imágenes"], ["Ideas.txt", "Documentos"]], [["Canción.mp3", "Música"], ["Experimento.mp4", "Videos"], ["Portada.png", "Imágenes"]], [["Resumen.txt", "Documentos/Español"], ["Fracciones.pdf", "Documentos/Matemáticas"], ["Observaciones.txt", "Documentos/Ciencias"]], [["Semillas.txt", "Documentos/Ciencias/Plantas"], ["Mariposa.png", "Imágenes/Animales"], ["Montaña.png", "Imágenes/Paisajes"]], [["Lectura.pdf", "Documentos/Español/Lecturas"], ["Agua.txt", "Documentos/Ciencias/Agua"], ["Mapa.png", "Imágenes/Geografía/Mapas"]], [["archivo01.txt", "Documentos/Ciencias", "Plantas - observaciones.txt"], ["imagen02.png", "Imágenes/Paisajes", "Montaña - paisaje.png"], ["archivo03.pptx", "Documentos/Presentaciones", "Misión azul - exposición.pptx"]], [["Cuento.txt", "Documentos/Español", "Cuento - revisado.txt"], ["Plantas.png", "Imágenes/Plantas", "Plantas - nueva imagen.png"], ["Misión azul.pptx", "Documentos/Presentaciones", "Misión azul - versión final.pptx"]], [["Resumen.txt", "Documentos/Español", null, "Imágenes"], ["Experimento.mp4", "Videos", null, "Música"], ["Portada.png", "Imágenes/Proyecto", null, "Documentos"]], [["Plan.txt", "Documentos/Proyecto azul"], ["Portada.png", "Documentos/Proyecto azul"], ["Exposición.pptx", "Documentos/Proyecto azul"]], [["Informe.txt", "Documentos/Entrega de quinto/Textos"], ["Tierra.png", "Documentos/Entrega de quinto/Imágenes"], ["Proyecto.pptx", "Documentos/Entrega de quinto/Presentaciones"]], [["borrador01.txt", "Documentos/Misión azul/Tierra/Textos", "Tierra - informe final.txt"], ["captura02.png", "Documentos/Misión azul/Tierra/Imágenes", "Tierra - paisaje.png"], ["Luna.png", "Documentos/Misión azul/Cielo/Imágenes", "Luna - versión nueva.png"], ["exposicion03.pptx", "Documentos/Misión azul/Presentación", "Misión azul - entrega final.pptx"], ["Fuentes.pdf", "Documentos/Misión azul/Fuentes", "Fuentes - consultadas.pdf", "Descargas"], ["Informe.txt", "Documentos/Misión azul/Respaldo", "Informe - respaldo.txt", "Documentos/Borradores", "backup"]]];
const space=central;
const levelNames=["Guardar en su lugar", "Imagen, audio y video", "Carpetas por materia", "Dentro de otra carpeta", "Rutas de investigación", "Nombres que explican", "Conservar versiones", "Rescatar archivos", "Crear el proyecto", "Preparar la entrega", "Reto hacker · Misión azul"];
const spaceNames=levelNames;
function normalize(s){return String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es')}
function build(theme,index){
 const source=theme==='space'?space:central, tasks=source[index].map(([file,path,name,from,action])=>({file,path,name:name||file,from:from||null,action:action||(from?"move":"save")}));
 const folders=new Set(roots);let files=[];
 const addPath=path=>{const parts=path.split('/');for(let i=1;i<=parts.length;i++)folders.add(parts.slice(0,i).join('/'))};
 tasks.forEach(t=>{if(index<8)addPath(t.path);if(t.from){addPath(t.from);files.push({name:t.file,path:t.from})}if(index===6)files.push({name:t.file,path:t.path})});
 if(index>=2&&index<8){['Imágenes/Animales','Imágenes/Paisajes','Documentos/Proyectos'].forEach(addPath)}
 if(index===10){
  const duplicate=tasks[2];addPath(duplicate.path);files.push({name:duplicate.file,path:duplicate.path});
  addPath('Documentos/Borradores');addPath('Documentos/Proyecto anterior/Reportes');
  addPath(tasks[0].path.split('/').slice(0,2).join('/')+'/Borradores');
  files.push({name:tasks[1].file,path:'Descargas'},{name:'Informe - versión anterior.txt',path:'Documentos/Borradores'});
 }
 return {tasks,folders:[...folders],files};
}
function validate(task,path,name,files){
 if(task.from&&!files.some(f=>f.path===task.from&&normalize(f.name)===normalize(task.file)))return {ok:false,message:'El archivo de origen no está disponible. Revisa el encargo.'};
 if(normalize(path)!==normalize(task.path))return {ok:false,message:`El destino es ${task.path.replaceAll('/',' › ')}. Revisa la ruta antes de guardar.`};
 if(normalize(name)!==normalize(task.name))return {ok:false,message:`Escribe el nombre solicitado: ${task.name}`};
 if(files.some(f=>f.path===path&&normalize(f.name)===normalize(name)))return {ok:false,message:'Ese nombre ya existe. Conserva el original y usa el nombre nuevo del encargo.'};
 return {ok:true};
}
function createFolder(folders,parent,name){
 name=String(name).trim();if(!name||/[\\/<>:"|?*]/.test(name)||/^\.+$/.test(name))return {ok:false,message:'Escribe un nombre de carpeta válido, sin diagonales ni signos especiales.'};
 if(parent&&!folders.includes(parent))return {ok:false,message:'Abre primero una carpeta válida.'};
 const path=parent?parent+'/'+name:name;if(folders.some(p=>normalize(p)===normalize(path)))return {ok:false,message:'Esta carpeta ya existe. Ábrela para continuar.'};
 return {ok:true,path};
}
const api={build,validate,createFolder,normalize,levelNames,spaceNames};
if(typeof module!=='undefined')module.exports=api;else root.ArchiveRules=api;
})(typeof window!=='undefined'?window:globalThis);
