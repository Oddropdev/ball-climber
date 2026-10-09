// Offline local browser preview of the built game; no npm dev server needed.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url))),port=4182;
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript',
 '.css':'text/css','.wasm':'application/wasm','.json':'application/json',
 '.png':'image/png','.glb':'model/gltf-binary'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??'/',`http://localhost:${port}`).pathname);
  const file=resolve(root,pathname.slice(1)||'index.html');
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}/`;
 process.stdout.write('Ball Climber C0: '+url+'\nPress Ctrl+C to stop.\n');
 if(process.platform==='win32'){
  const child=spawn('cmd.exe',['/c','start','',url],{stdio:'ignore',detached:true});
  child.unref();
 }
});
