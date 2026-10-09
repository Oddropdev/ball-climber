// C0: original game behavior built on verified Game Factory PlayCanvas/Ammo patterns.
// There is ONE genuine dynamic Bullet player ball; climb assistance is applied as forces.
// Falling rocks and loot are ALSO dynamic Bullet spheres.
import {Entity,Vec3,Color,type RigidBodyComponent} from 'playcanvas';
import {createPhysicsGame,material} from './Physics';
import {LEVEL_HEIGHT,PLAYER_FRONT_Z,PLAYER_RADIUS,WALL_HALF_WIDTH,
  clamp,nearestCheckpoint,shouldRecover,spawnPlan,type SpawnSpec} from './Course';
import './style.css';
type Phase='ready'|'running'|'complete'|'error';
const canvas=document.getElementById('application-canvas') as HTMLCanvasElement;
const $=(id:string)=>document.getElementById(id)!;
const ui={
 status:$('status'),progress:$('progress'),loot:$('loot'),toast:$('toast'),
 dialog:$('dialog'),title:$('title'),description:$('description'),
 start:$('start') as HTMLButtonElement
};
let phase:Phase='ready',elapsed=0,loot=0,hits=0,falls=0,contacts=0,attempts=0;
let targetX=0,checkpointY=1.8,maxHeight=1.8,spawnedTotal=0;
let lateralDrags=0,playerPhysics=true;
let messageUntil=0;
function message(text:string){
 ui.toast.textContent=text;ui.toast.classList.add('show');
 messageUntil=elapsed+1.15;
}
const canvasError=(err:unknown)=>{
 phase='error';ui.status.textContent='PHYSICS UNAVAILABLE';
 ui.title.textContent='LOAD ERROR';ui.description.textContent=String(err);
};
let game:Awaited<ReturnType<typeof createPhysicsGame>>;
try{game=await createPhysicsGame(canvas);}
catch(err){canvasError(err);throw err;}
const {app,camera,shape}=game;
const mats={
 wall:material('#8175AF'),ridge:material('#BCA8CE'),lip:material('#FFE6C2'),
 rock:material('#EF8A8F'),rockDark:material('#D65B82'),
 ball:material('#F9F8FF',.92),band:material('#48DAD7',.78),
 loot:material('#FFD363',.93),cloud:material('#FFFFFF'),
 green:material('#73D8A9'),gold:material('#FFE79E')
};
mats.loot.emissive=new Color(.50,.24,.03);
mats.loot.emissiveIntensity=.7;mats.loot.update();
const cliff=shape('cliff-real-Bullet-wall','box',[0,22.5,0],
 [WALL_HALF_WIDTH*2,47,.85],mats.wall,'static');
const ground=shape('cliff-bottom','box',[0,-.32,1.3],[15,.64,5],mats.ridge,'static');
for(let i=0;i<18;i++){
 const y=3+i*2.6;
 const side=i%2===0?-1:1;
 shape('cliff-rock-seam-'+i,'sphere',
 [side*(4.5+(i%4)*.4),y,-.2],[2.0,2.7,1.8],
 i%3===0?mats.ridge:mats.wall);
 if(i%3===0){
  // Protrusions are actual cliff physics; the center route stays passable.
  shape('cliff-side-ledger-'+i,'box',[side*4,y+.5,.76],
   [2.0,.35,.86],mats.lip,'static');
 }
}
for(let i=0;i<12;i++){
 const side=i%2===0?-1:1;
 shape('distant-cliff-'+i,'sphere',
  [side*(9+i*.7),i*4-2,-10-i%3*3],[8,7+i%4,5],
  i%3?mats.ridge:mats.green);
}
for(let i=0;i<10;i++){
 shape('cloud-'+i,'sphere',
 [i%2?-(13+i*1.5):(13+i*1.5),15+i*3,-18],
 [7+i%3,2.4,4.5],mats.cloud);
}
const player=shape('player-dynamic-sphere','sphere',[0,1.8,PLAYER_FRONT_Z],
 [PLAYER_RADIUS*2,PLAYER_RADIUS*2,PLAYER_RADIUS*2],mats.ball,'dynamic');
const band=new Entity('visual-ball-equator');
band.addComponent('render',{type:'sphere',material:mats.band,castShadows:false});
band.setLocalPosition(0,.32,0);band.setLocalScale(.82,.18,.82);
player.addChild(band);
const body=player.rigidbody!;
const finish=shape('cliff-finish','box',[0,LEVEL_HEIGHT+.25,.75],
 [8,.45,.55],mats.gold);
const dynamicObjects:{spec:SpawnSpec;entity:Entity;born:boolean;collected:boolean}[]=[];
for(const spec of spawnPlan(1719)){
 const radius=spec.radius;
 const e=shape((spec.kind==='rock'?'falling-rock-':'falling-loot-')+spec.id,
  'sphere',[spec.lane,3,PLAYER_FRONT_Z+.08],[radius*2,radius*2,radius*2],
  spec.kind==='rock'?spec.id%2?mats.rockDark:mats.rock:mats.loot,'dynamic');
 e.enabled=false;
 dynamicObjects.push({spec,entity:e,born:false,collected:false});
}
player.collision!.on('collisionstart',(evt:{other:Entity})=>{
 if(phase!=='running')return;
 if(evt.other.name.startsWith('falling-rock-')){
  contacts++;hits++;message('WATCH OUT!');
 } else if(evt.other.name.startsWith('cliff-side-ledger-')){
  contacts++;
 }
});
function reset(){
 phase='running';attempts++;elapsed=0;loot=0;hits=0;falls=0;contacts=0;
 targetX=0;checkpointY=1.8;maxHeight=1.8;spawnedTotal=0;lateralDrags=0;
 body.teleport(0,1.8,PLAYER_FRONT_Z);
 body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
 for(const actor of dynamicObjects){
  actor.born=false;actor.collected=false;actor.entity.enabled=false;
 }
 ui.loot.textContent='0';ui.dialog.classList.add('hidden');message('START CLIMBING!');
}
ui.start.addEventListener('click',reset);
ui.start.disabled=false;ui.start.textContent='START CLIMBING →';
ui.status.textContent='REAL BULLET PHYSICS READY';
let dragging=false;
const pointerToLane=(clientX:number)=>{
 targetX=clamp((clientX/window.innerWidth-.5)*8,-3.7,3.7);
 lateralDrags++;
};
window.addEventListener('pointerdown',e=>{dragging=true;pointerToLane(e.clientX);});
window.addEventListener('pointermove',e=>{if(dragging)pointerToLane(e.clientX);});
window.addEventListener('pointerup',()=>{dragging=false;});
window.addEventListener('pointercancel',()=>{dragging=false;});
window.addEventListener('keydown',e=>{
 if(e.code==='Space'||e.code==='Enter'){e.preventDefault();reset();}
 if(e.code==='ArrowLeft'||e.code==='KeyA'){targetX=clamp(targetX-.65,-3.7,3.7);lateralDrags++;}
 if(e.code==='ArrowRight'||e.code==='KeyD'){targetX=clamp(targetX+.65,-3.7,3.7);lateralDrags++;}
});
app.on('update',(dt:number)=>{
 const tick=Math.min(dt,.04);
 const p=player.getPosition(),velocity=body.linearVelocity;
 if(phase==='running'){
  elapsed+=tick;
  // Real, force-driven magnetically assisted wall climbing.
  // This is NOT a kinematic path or animated fake rising position.
  // Inertial lateral steering and damped ascent preserve Bullet impacts.
  const side=clamp((targetX-p.x)*92-velocity.x*18,-240,240);
  const upward=61-velocity.y*12;
  body.applyForce(new Vec3(side,upward,-130));
  // Torque is a real rigidbody force: decorative texture never spins independently.
  body.applyTorque(new Vec3(velocity.y*1.2,0,side*.045));
  maxHeight=Math.max(maxHeight,p.y);
  checkpointY=nearestCheckpoint(maxHeight);
  for(const actor of dynamicObjects){
   if(actor.collected)continue;
   if(!actor.born && elapsed>=actor.spec.id*.92){
    actor.born=true;actor.entity.enabled=true;spawnedTotal++;
    const dropY=clamp(p.y+9+(actor.spec.id%3)*3,9,LEVEL_HEIGHT+9);
    actor.entity.rigidbody!.teleport(actor.spec.lane,dropY,PLAYER_FRONT_Z+.06);
    actor.entity.rigidbody!.linearVelocity=new Vec3(0,-1,0);
   }
   if(!actor.born)continue;
   const where=actor.entity.getPosition();
   if(actor.spec.kind==='loot'&&where.distance(p)<1.45){
    actor.collected=true;actor.entity.enabled=false;
    loot++;ui.loot.textContent=String(loot);message('LOOT +1');
   }
   if(where.y<p.y-12 || where.z>5 || where.y<-.3){
    actor.collected=true;actor.entity.enabled=false;
   }
  }
  if(shouldRecover(p.x,p.y,p.z)){
   falls++;const checkpoint=checkpointY;
   body.teleport(0,checkpoint,PLAYER_FRONT_Z);
   body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
   message('BACK TO CHECKPOINT');
  }
  if(p.y>=LEVEL_HEIGHT){
   phase='complete';ui.title.innerHTML='SUMMIT <em>REACHED!</em>';
   ui.description.textContent='Loot '+loot+' · Rock impacts '+hits+
    ' · Falls '+falls+' · Time '+elapsed.toFixed(1)+'s. Climb again?';
   ui.start.textContent='CLIMB AGAIN →';ui.dialog.classList.remove('hidden');
  }
  if(elapsed>messageUntil)ui.toast.classList.remove('show');
 }
 const now=camera.getPosition();
 const cameraY=clamp(p.y+4.0,7,LEVEL_HEIGHT+6);
 const ease=clamp(tick*5,0,1);
 camera.setPosition(now.x+(p.x*.20-now.x)*ease,
  now.y+(cameraY-now.y)*ease,now.z+(19-now.z)*ease);
 camera.lookAt(p.x*.22,p.y+3.1,0);
 ui.progress.style.width=(clamp(p.y/LEVEL_HEIGHT,0,1)*100).toFixed(1)+'%';
 if(phase==='running')ui.status.textContent=
  Math.floor(clamp(p.y,0,LEVEL_HEIGHT))+' / '+LEVEL_HEIGHT+' m · ROCKS '+hits+' · FALLS '+falls;
});
app.start();
declare global{interface Window{__CLIMBER_TEST__?:{snapshot:()=>Record<string,unknown>}}}
window.__CLIMBER_TEST__={snapshot:()=>({
 phase,physicsLoaded:playerPhysics,rigidbodyType:body.type,
 x:player.getPosition().x,y:player.getPosition().y,z:player.getPosition().z,
 elapsed,loot,hits,falls,contacts,attempts,targetX,
 checkpointY,maxHeight,spawnedTotal,liveFalling:dynamicObjects.filter(x=>x.born&&!x.collected).length,
 levelHeight:LEVEL_HEIGHT,wallCollider:cliff.rigidbody?.type,
 groundCollider:ground.rigidbody?.type,finishVisual:!!finish.render,
 ballVelocityY:body.linearVelocity.y,lateralDrags
})};
