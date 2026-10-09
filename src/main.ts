// C0.2 — genuine 60° Bullet slope. No animation-driven climbing.
// One upward swipe = one finite roll+forward impulse. Left/right = one lateral impulse.
import {Entity,Vec3,Color,Texture,PIXELFORMAT_RGBA8} from 'playcanvas';
import {createPhysicsGame,material} from './Physics';
import {SLOPE_DEGREES,SLOPE_LENGTH,SIN_SLOPE,COS_SLOPE,LEVEL_HEIGHT,
  WALL_HALF_WIDTH,PLAYER_RADIUS,SLAB_THICKNESS,UP,NORMAL,onSlope,
  slopePosition,nearestCheckpoint,shouldRecover,makeWave,clamp,
  ACTIVE_CAP,MAX_ROCKS,MAX_LOOT,EMITTER_S,PATTERNS,type SpawnItem,type Pattern} from './Course';
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
let spawnedTotal=0,destroyedTotal=0,spawnWaves=0,maxLive=0;
let liveRocks=0,liveLoot=0,peakRocks=0,peakLoot=0,spawnSkipped=0;
let heavyHits=0,giantsSpawned=0,maxRockMass=0;
let totalRock=0,totalLoot=0,totalBox=0,totalSphere=0;
let checkpointS=2,maxProgress=2,sideFlicks=0,forwardFlicks=0;
let lastFlickTime=-100,maxForwardSpeed=0,spawnNextAt=1,spawnWaveIndex=0;
let swipeChain=0,lastSwipeEnd=-100,pendingImpulse=0,pendingSideImpulse=0;
let messageUntil=0;
const WAVE_SEED=1719;
const FLICK_COOLDOWN=.12;
function message(text:string){
 ui.toast.textContent=text;ui.toast.classList.add('show');
 messageUntil=elapsed+1;
}
let game:Awaited<ReturnType<typeof createPhysicsGame>>;
try{game=await createPhysicsGame(canvas);}
catch(err){
 phase='error';ui.status.textContent='PHYSICS UNAVAILABLE';
 ui.title.textContent='LOAD ERROR';ui.description.textContent=String(err);
 throw err;
}
const {app,camera,shape,device,viewport}=game;
(app.systems.rigidbody as {gravity:Vec3}).gravity.set(0,-12,0);
const mats={
 road:material('#9A83D1',.7),roadStripe:material('#BEAFE4'),
 edge:material('#FFD5B6'),rock:material('#EC8791'),
 rockDark:material('#E66B78'),crate:material('#D97EA5'),
 rectangle:material('#FFB681'),loot:material('#FFE06D',.94),
 lootBox:material('#70E6CF',.92),ball:material('#F9FAFE',.93),
 band:material('#43DCCF',.82),cloud:material('#FFFFFF'),
 island:material('#88D4CD'),gold:material('#FFF1A9')
};
mats.loot.emissive=new Color(.65,.35,.03);mats.loot.emissiveIntensity=1.1;mats.loot.update();
const TRACK_CENTER=onSlope(SLOPE_LENGTH/2,0);
const ramp=shape('sixty-degree-static-Bullet-ramp','box',TRACK_CENTER,
 [WALL_HALF_WIDTH*2,SLAB_THICKNESS,SLOPE_LENGTH+5],mats.road,'static',SLOPE_DEGREES);
const ledges:Entity[]=[];
for(let i=0;i<=24;i++){
 const s=i*2;
 const marker=shape('slope-band-'+i,'box',onSlope(s,SLAB_THICKNESS/2+.025),
 [WALL_HALF_WIDTH*2-.2,.045,.16],
 i%4===0?mats.edge:mats.roadStripe,false,SLOPE_DEGREES);
 ledges.push(marker);
}
// Side edges are VISUAL GUIDES only. Falling over them is a genuine failure.
for(let i=0;i<18;i++){
 const s=2+i*2.6,side=i%2?1:-1;
 shape('side-cliff-'+i,'sphere',onSlope(s,-2.2,side*(7.7+(i%4)*.5)),
 [3.3,3.3,3.3],i%3?mats.island:mats.roadStripe);
 if(i%3===0)shape('distant-cloud-'+i,'sphere',
  onSlope(s,4.5,side*15),[8,3.8,6.5],mats.cloud);
}
const initial=onSlope(2);
const player=shape('player-dynamic-Bullet-ball','sphere',initial,
 [PLAYER_RADIUS*2,PLAYER_RADIUS*2,PLAYER_RADIUS*2],mats.ball,'dynamic');
const band=new Entity('player-ball-stripe');
band.addComponent('render',{type:'sphere',material:mats.band,castShadows:false});
band.setLocalPosition(0,.29,0);band.setLocalScale(.85,.17,.85);
player.addChild(band);
const body=player.rigidbody!;
const finish=shape('summit-finish','box',onSlope(SLOPE_LENGTH,.55),
 [WALL_HALF_WIDTH*2,.28,.85],mats.gold,false,SLOPE_DEGREES);
// All the hazards originate at this giant ? box above the summit.
// Procedural license-free texture, visible from the climbing camera.
const face=document.createElement('canvas');face.width=256;face.height=256;
const ink=face.getContext('2d');
if(!ink)throw Error('2D canvas unavailable for mystery box');
ink.fillStyle='#8550C9';ink.fillRect(0,0,256,256);
ink.strokeStyle='#FFE59A';ink.lineWidth=16;ink.strokeRect(12,12,232,232);
ink.fillStyle='#FFF9A3';ink.shadowColor='#FFD479';ink.shadowBlur=18;
ink.textAlign='center';ink.textBaseline='middle';ink.font='900 188px Arial';
ink.fillText('?',128,135);
const tex=new Texture(device,{width:256,height:256,format:PIXELFORMAT_RGBA8,mipmaps:true});
tex.setSource(face);
const boxMaterial=material('#FFFFFF',.85);
boxMaterial.diffuseMap=tex;boxMaterial.emissive=new Color(.18,.09,.28);
boxMaterial.emissiveIntensity=.75;boxMaterial.update();
const mysteryBox=shape('single-summit-mystery-question-box','box',
 onSlope(SLOPE_LENGTH+4,3.4),[5.3,5.3,5.3],boxMaterial);
const chute=shape('mystery-summit-drop-port','cylinder',
 onSlope(SLOPE_LENGTH+2.7,1.1),[3.3,.34,3.3],mats.gold);
type DynamicActor={item:SpawnItem;entity:Entity;bornAt:number};
const active:DynamicActor[]=[];
const patterns:Record<Pattern,number>={scatter:0,row:0,train:0,diagonal:0,'loot-row':0,mixed:0};
function disposeActors(){
 for(const a of active)a.entity.destroy();
 destroyedTotal+=active.length;active.length=0;
}
function spawnActor(item:SpawnItem,sourceS:number){
 const s=clamp(sourceS+10.5+item.distanceOffset,6,SLOPE_LENGTH+6);
 const clearance=SLAB_THICKNESS/2+Math.max(...item.size)*.55+1.1;
 const pos=onSlope(s,clearance,item.lane);
 const kind=item.kind;
 const mat=kind==='loot'?(item.shape==='sphere'?mats.loot:mats.lootBox):
  (item.shape==='sphere'?(item.slot%2?mats.rockDark:mats.rock):
  item.size[1]>item.size[0]?mats.rectangle:mats.crate);
 const e=shape((kind==='rock'?'falling-rock-':'falling-loot-')+
  item.wave+'-'+item.slot,item.shape,pos,item.size,mat,'dynamic',SLOPE_DEGREES);
 const rb=e.rigidbody!;
 rb.linearVelocity=new Vec3(0,-1.3,0);
 if(item.shape==='box')rb.angularVelocity=new Vec3(.2,1.5,0);
 active.push({item,entity:e,bornAt:elapsed});
 spawnedTotal++;
 if(kind==='rock')totalRock++;else totalLoot++;
 if(item.shape==='box')totalBox++;else totalSphere++;
 maxLive=Math.max(maxLive,active.length);
}
function streamSpawns(playerS:number){
 if(elapsed<spawnNextAt)return;
 if(active.length>=ACTIVE_CAP-7){spawnNextAt=elapsed+.35;return;}
 const wave=makeWave(WAVE_SEED,spawnWaveIndex++);
 patterns[wave.pattern]++;
 spawnWaves++;
 for(const item of wave.items){
  if(active.length>=ACTIVE_CAP)break;
  spawnActor(item,playerS);
 }
 // Endless sequence of NEW seeded waves, bounded live physics bodies.
 spawnNextAt=elapsed+(spawnWaves%4===0?.78:1.22);
}
function reapActors(playerS:number,p:Vec3){
 for(let i=active.length-1;i>=0;i--){
  const a=active[i]!,pos=a.entity.getPosition(),s=slopePosition(pos);
  if(a.item.kind==='loot'&&p.distance(pos)<1.4){
   loot++;ui.loot.textContent=String(loot);message('LOOT +1');
   a.entity.destroy();active.splice(i,1);destroyedTotal++;continue;
  }
  // Reclaim Bullet body, collider, render mesh and entity — not hide-only.
  if(s.progress<playerS-16||s.progress< -4||s.progress>playerS+45||
     s.normalDistance< -7||pos.y< -10||elapsed-a.bornAt>16){
    a.entity.destroy();active.splice(i,1);destroyedTotal++;
  }
 }
}
let lastImpact=-100;
player.collision!.on('collisionstart',(evt:{other:Entity})=>{
 if(phase!=='running')return;
 if(evt.other.name.startsWith('falling-rock-')&&elapsed-lastImpact>.13){
  contacts++;hits++;lastImpact=elapsed;message('ROCK IMPACT!');
 }
});
function reset(){
 disposeActors();
 phase='running';attempts++;elapsed=0;loot=0;hits=0;falls=0;contacts=0;
 spawnedTotal=0;destroyedTotal=0;spawnWaves=0;maxLive=0;
 totalRock=0;totalLoot=0;totalBox=0;totalSphere=0;
 for(const k of Object.keys(patterns) as Pattern[])patterns[k]=0;
 sideFlicks=0;forwardFlicks=0;maxForwardSpeed=0;
 checkpointS=2;maxProgress=2;spawnNextAt=.6;spawnWaveIndex=0;
 swipeChain=0;lastSwipeEnd=-100;lastFlickTime=-100;
 pendingImpulse=0;pendingSideImpulse=0;
 body.teleport(...initial);
 body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
 ui.loot.textContent='0';ui.dialog.classList.add('hidden');
 message('FLICK UP TO ROLL!');
}
ui.start.addEventListener('click',reset);
ui.start.disabled=false;ui.start.textContent='START CLIMBING →';
ui.status.textContent='REAL 60° BULLET RAMP READY';
ui.description.textContent='Flick UP for one physical roll. Flick left/right to dodge. Repeat flicks to build speed. Gravity and collisions can send you backwards or over the edge.';
ui.title.innerHTML='ROLL <em>UPHILL.</em>';
function requestFlick(direction:'up'|'left'|'right'){
 if(phase!=='running'||elapsed-lastFlickTime<FLICK_COOLDOWN)return;
 const p=player.getPosition(),s=slopePosition(p);
 if(s.normalDistance>SLAB_THICKNESS/2+PLAYER_RADIUS+1.8)return;
 lastFlickTime=elapsed;
 if(direction==='up'){
  if(elapsed-lastSwipeEnd<.9)swipeChain=Math.min(4,swipeChain+1);
  else swipeChain=0;
  lastSwipeEnd=elapsed;forwardFlicks++;
  pendingImpulse+=11.6+swipeChain*1.6;
  message(swipeChain?'CHAIN x'+(swipeChain+1):'ROLL!');
 }else{
  sideFlicks++;pendingSideImpulse+=(direction==='left'?-1:1)*3.65;
 }
}
let pointerStart:{x:number;y:number;id:number}|null=null;
window.addEventListener('pointerdown',e=>{
 if(phase!=='running'||(e.target instanceof Element&&e.target.closest('#dialog')))return;
 pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};
});
window.addEventListener('pointerup',e=>{
 const first=pointerStart;pointerStart=null;
 if(!first||first.id!==e.pointerId)return;
 const dx=e.clientX-first.x,dy=e.clientY-first.y;
 if(dy< -32&&Math.abs(dy)>Math.abs(dx)*.76)requestFlick('up');
 else if(Math.abs(dx)>36)requestFlick(dx<0?'left':'right');
});
window.addEventListener('pointercancel',()=>{pointerStart=null;});
window.addEventListener('keydown',e=>{
 if((e.code==='Space'||e.code==='Enter')&&phase!=='running'){e.preventDefault();reset();return;}
 if(e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();requestFlick('up');}
 if(e.code==='ArrowLeft'||e.code==='KeyA'){e.preventDefault();requestFlick('left');}
 if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();requestFlick('right');}
 if(e.code==='KeyR'){e.preventDefault();reset();}
});
const forwardVelocity=(v:Vec3)=>v.y*SIN_SLOPE-v.z*COS_SLOPE;
app.on('update',(dt:number)=>{
 const tick=Math.min(dt,.04);
 const p=player.getPosition(),v=body.linearVelocity;
 const frame=slopePosition(p);
 if(phase==='running'){
  elapsed+=tick;
  // Partial anti-slide traction compensates severe slope only; net physics
  // still drives the ball DOWNHILL without a flick. No perpetual motor.
  body.applyForce(new Vec3(0,6.5*SIN_SLOPE,-6.5*COS_SLOPE));
  if(pendingImpulse){
   const next=clamp(pendingImpulse,0,42);pendingImpulse=0;
   const speed=forwardVelocity(v);
   const bounded=Math.max(0,Math.min(next,(23-speed)*1.4));
   if(bounded>0){
    body.applyImpulse(new Vec3(0,bounded*SIN_SLOPE,-bounded*COS_SLOPE));
    body.applyTorqueImpulse(new Vec3(Math.min(2.75,bounded*.20),0,0));
   }
  }
  if(pendingSideImpulse){
   body.applyImpulse(new Vec3(clamp(pendingSideImpulse,-7,7),0,0));
   pendingSideImpulse=0;
  }
  maxForwardSpeed=Math.max(maxForwardSpeed,forwardVelocity(body.linearVelocity));
  maxProgress=Math.max(maxProgress,frame.progress);
  checkpointS=nearestCheckpoint(maxProgress);
  streamSpawns();
  reapActors(frame.progress,p);
  if(shouldRecover(p)){
   falls++;
   // Losing progress is meaningful: return to previous checkpoint,
   // not to the current peak or an invisible perpetual magnet.
   const checkpoint=Math.max(2,checkpointS-12);
   body.teleport(...onSlope(checkpoint));
   body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
   message('FELL — BACK DOWN!');
  }
  if(frame.progress>=SLOPE_LENGTH){
   phase='complete';ui.title.innerHTML='SUMMIT <em>REACHED!</em>';
   ui.description.textContent='Loot '+loot+' · Impacts '+hits+' · Falls '+falls+
    ' · Flicks '+forwardFlicks+' · Time '+elapsed.toFixed(1)+'s. Climb again?';
   ui.start.textContent='CLIMB AGAIN →';ui.dialog.classList.remove('hidden');
  }
  if(elapsed>messageUntil)ui.toast.classList.remove('show');
 }
 // Chase camera: behind the ball, ~1.5m below its height, looking steeply
 // uphill. Above the actual slab along its normal, never top-down.
 const cameraTarget=new Vec3(
  p.x*.67,
  p.y-UP[1]*8+NORMAL[1]*11,
  p.z-UP[2]*8+NORMAL[2]*11);
 const now=camera.getPosition(),ease=clamp(tick*5.5,0,1);
 camera.setPosition(
  now.x+(cameraTarget.x-now.x)*ease,
  now.y+(cameraTarget.y-now.y)*ease,
  now.z+(cameraTarget.z-now.z)*ease);
 camera.lookAt(p.x*.82,p.y+UP[1]*16,p.z+UP[2]*16);
 camera.camera!.fov=60;
 ui.progress.style.width=(clamp(frame.progress/SLOPE_LENGTH,0,1)*100).toFixed(1)+'%';
 if(phase==='running')ui.status.textContent=
  Math.floor(clamp(frame.progress,0,SLOPE_LENGTH))+' / '+SLOPE_LENGTH+
  ' m SLOPE · FLICKS '+forwardFlicks+' · FALLS '+falls;
});
app.start();
declare global{interface Window{__CLIMBER_TEST__?:{snapshot:()=>Record<string,unknown>}}}
window.__CLIMBER_TEST__={snapshot:()=>({
 phase,physicsLoaded:true,rigidbodyType:body.type,
 x:player.getPosition().x,y:player.getPosition().y,z:player.getPosition().z,
 progress:slopePosition(player.getPosition()).progress,
 normalDistance:slopePosition(player.getPosition()).normalDistance,
 elapsed,loot,hits,falls,contacts,attempts,
 checkpointS,maxProgress,spawnedTotal,destroyedTotal,spawnWaves,maxLive,
 liveFalling:active.length,activeCap:ACTIVE_CAP,
 totalRock,totalLoot,totalBox,totalSphere,patterns,
 slopeDegrees:SLOPE_DEGREES,slopeLength:SLOPE_LENGTH,
 levelHeight:LEVEL_HEIGHT,rampCollider:ramp.rigidbody?.type,
 finishVisual:!!finish.children.length,
 forwardSpeed:forwardVelocity(body.linearVelocity),
 maxForwardSpeed,forwardFlicks,sideFlicks,swipeChain,
 cameraY:camera.getPosition().y,cameraZ:camera.getPosition().z,
 ballVelocityY:body.linearVelocity.y
})};
