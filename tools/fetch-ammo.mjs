// Copied from Game Factory's proven W9.4 physics provisioning contract.
// Keep both files self-hosted and SHA256 pinned; no runtime CDN dependency.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const origin='https://developer.playcanvas.com/assets/modules/ammo/';
const destination=path.resolve('public/ammo');
fs.mkdirSync(destination,{recursive:true});
const expected=[
 {name:'ammo.wasm.js',kind:'js',min:10_000,max:2_000_000,sha256:'8481c5250507d3f2c0cecff7cc55a34727f52f96590a2304556a43ca4cf4e0b3'},
 {name:'ammo.wasm.wasm',kind:'wasm',min:100_000,max:5_000_000,sha256:'de36b300b25d244a79ae56ef0e7fee5efe2a3281f346a134945eef0b2fbaa5d8'}
];
for(const item of expected){
 const file=path.join(destination,item.name);
 let bytes;
 if(fs.existsSync(file))bytes=fs.readFileSync(file);
 else{
  const response=await fetch(new URL(item.name,origin),{signal:AbortSignal.timeout(30_000)});
  if(!response.ok)throw Error('Ammo HTTP '+response.status);
  bytes=Buffer.from(await response.arrayBuffer());
 }
 if(bytes.length<item.min||bytes.length>item.max)throw Error('Unexpected physics file size: '+item.name);
 if(item.kind==='wasm'&&bytes.subarray(0,4).toString('hex')!=='0061736d')throw Error('Invalid WASM');
 if(item.kind==='js'&&!bytes.toString('utf8').includes('Ammo'))throw Error('Invalid Ammo glue');
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(hash!==item.sha256)throw Error('Ammo SHA mismatch: '+item.name);
 fs.writeFileSync(file,bytes);
 console.log(item.name+' SHA256 verified '+hash);
}
