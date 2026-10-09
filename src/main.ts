// C0.2 — genuine 60° Bullet slope. No animation-driven climbing.
// One upward swipe = one finite roll+forward impulse. Left/right = one lateral impulse.
import {Entity,Vec3,Color,Texture,PIXELFORMAT_RGBA8,BLEND_NORMAL,type MeshInstance,type Material} from 'playcanvas';
import {createPhysicsGame,material} from './Physics';
import {makeFurniture,furnitureOpening} from './Furniture';
import {blocksCameraSegment} from './Visibility';
import {SLOPE_DEGREES,SLOPE_LENGTH,SIN_SLOPE,COS_SLOPE,LEVEL_HEIGHT,
  WALL_HALF_WIDTH,PLAYER_RADIUS,SLAB_THICKNESS,UP,NORMAL,onSlope,
  slopePosition,nearestCheckpoint,shouldRecover,makeWave,clamp,
  ACTIVE_CAP,MAX_ROCKS,MAX_LOOT,HAZARD_SOFT_TARGET,LOOT_SOFT_TARGET,
  EMITTER_S,PATTERNS,type SpawnItem,type Pattern} from './Course';
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
let furnitureSpawned=0,lightPropsSpawned=0,lightImpacts=0;
let verifiedCompoundFurniture=0,minVerifiedGap=100;
let ghostedActors=0,peakGhosted=0,cameraOcclusionChecks=0;
let lastOcclusionScan=-1e3;let continuousSeconds=0,baseDriveFrames=0;
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
 island:material('#88D4CD'),gold:material('#FFF1A9'),
 furniture:material('#FFC68B',.73),chair:material('#99D7F1',.73),
 light:material('#D8FBE7',.78)
};
mats.loot.emissive=new Color(.65,.35,.03);mats.loot.emissiveIntensity=1.1;mats.loot.update();
const ghostMat=material('#D7FAF5',.38);
ghostMat.opacity=.19;ghostMat.blendType=BLEND_NORMAL;
ghostMat.depthWrite=false;ghostMat.update();
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
type RenderSurface={instance:MeshInstance;material:Material};
type DynamicActor={item:SpawnItem;entity:Entity;bornAt:number;
  original:RenderSurface[];ghosted:boolean};
const collectRenders=(root:Entity):RenderSurface[]=>{
 const pieces:RenderSurface[]=[];
 const walk=(node:Entity)=>{
  if(node.render)for(const instance of node.render.meshInstances)
   pieces.push({instance,material:instance.material});
  for(const child of node.children)walk(child as Entity);
 };
 walk(root);return pieces;
};
type Queued={item:SpawnItem;at:number};
const active:DynamicActor[]=[];
const pending:Queued[]=[];
const patterns=Object.fromEntries(PATTERNS.map(p=>[p,0])) as Record<Pattern,number>;
function removeActor(i:number){
 const actor=active[i]!;
 if(actor.ghosted)ghostedActors--;
 if(actor.item.kind==='rock')liveRocks--;else liveLoot--;
 actor.entity.destroy();active.splice(i,1);destroyedTotal++;
}
function disposeActors(){
 while(active.length)removeActor(active.length-1);
 pending.length=0;
}
function spawnActor(item:SpawnItem){
 // Genuine physics origin: the summit, NOT an emitter moving with the player.
 const departureX=item.lane*.13;
 const clearance=SLAB_THICKNESS/2+Math.max(...item.size)*.65+1.1;
 const position=onSlope(EMITTER_S,clearance,departureX);
 const mat=item.shape==='light'?mats.light:item.kind==='loot'?
  (item.shape==='sphere'?mats.loot:mats.lootBox):
  (item.shape==='sphere'?(item.slot%2?mats.rockDark:mats.rock):
   item.giant?mats.rockDark:item.size[1]>item.size[0]?mats.rectangle:mats.crate);
 const e=item.shape==='table'||item.shape==='chair'?
  makeFurniture(app,item,position,
    item.shape==='table'?mats.furniture:mats.chair):
  shape((item.kind==='rock'?'falling-rock-':'falling-loot-')+
   item.wave+'-'+item.slot,item.shape==='light'?'box':item.shape,
   position,item.size,mat,'dynamic',SLOPE_DEGREES,item.mass);
 const rb=e.rigidbody!;
 if(item.shape==='light'){
  rb.restitution=.6;rb.linearDamping=.025;rb.angularDamping=.06;
 }
 const outward=(item.lane-departureX)*.92;
 const initialSpeed=4.3+(item.slot%4)*.4;
 rb.linearVelocity=new Vec3(outward,-initialSpeed*SIN_SLOPE,
  initialSpeed*COS_SLOPE);
 if(item.shape==='box')rb.angularVelocity=new Vec3(.3,item.slot%2?1.4:-1.4,.55);
 active.push({item,entity:e,bornAt:elapsed,original:collectRenders(e),ghosted:false});
 if(item.shape==='table'||item.shape==='chair'){
  furnitureSpawned++;
  const opening=furnitureOpening(item);
  minVerifiedGap=Math.min(minVerifiedGap,opening.width,opening.height);
  if(e.collision?.type==='compound'&&e.rigidbody?.type==='dynamic'&&
     e.children.filter(child=>(child as Entity).collision).length>=5)
     verifiedCompoundFurniture++;
 }
 if(item.shape==='light')lightPropsSpawned++;
 spawnedTotal++;
 if(item.kind==='rock'){
  totalRock++;liveRocks++;
  maxRockMass=Math.max(maxRockMass,item.mass);
  if(item.giant)giantsSpawned++;
 }else{totalLoot++;liveLoot++;}
 if(item.shape==='box')totalBox++;else totalSphere++;
 maxLive=Math.max(maxLive,active.length);
 peakRocks=Math.max(peakRocks,liveRocks);
 peakLoot=Math.max(peakLoot,liveLoot);
}
function streamSpawns(){
 // One pattern per wave, but each item has its OWN emission time.
 // Train = actual back-to-back falling objects, not a painted line.
 if(elapsed>=spawnNextAt&&pending.length<58){
  const wave=makeWave(WAVE_SEED,spawnWaveIndex++);
  patterns[wave.pattern]++;spawnWaves++;
  for(const item of wave.items)pending.push({item,at:elapsed+item.delay});
  // Lower the physical danger density but preserve visually rich mixed bursts.
  spawnNextAt=elapsed+(spawnWaves%5===0?.78:1.18);
 }
 pending.sort((a,b)=>a.at-b.at);
 for(let i=0;i<pending.length;){
  const job=pending[i]!;
  if(job.at>elapsed)break;
  const limit=job.item.kind==='rock'?
   Math.min(MAX_ROCKS,HAZARD_SOFT_TARGET):Math.min(MAX_LOOT,LOOT_SOFT_TARGET);
  const slotFree=job.item.kind==='rock'?liveRocks<limit:liveLoot<limit;
  if(slotFree&&active.length<ACTIVE_CAP){
   spawnActor(job.item);pending.splice(i,1);
  }else if(elapsed-job.at>1.2){
   pending.splice(i,1);spawnSkipped++;
  }else i++;
 }
}
function reapActors(playerS:number,p:Vec3){
 for(let i=active.length-1;i>=0;i--){
  const actor=active[i]!,pos=actor.entity.getPosition();
  const loc=slopePosition(pos);
  if(actor.item.kind==='loot'&&p.distance(pos)<1.5){
   loot++;ui.loot.textContent=String(loot);message('LOOT +1');
   removeActor(i);continue;
  }
  // Entity.destroy() releases the real Bullet body, not just the visual.
  if(loc.progress<Math.max(-4,playerS-18)||loc.progress< -6||
   loc.progress>EMITTER_S+10||loc.normalDistance< -9||
   pos.y< -12||elapsed-actor.bornAt>13)removeActor(i);
 }
}
let lastImpact=-100;
player.collision!.on('collisionstart',(evt:{other:Entity})=>{
 if(phase!=='running')return;
 if(evt.other.name.startsWith('falling-rock-')&&elapsed-lastImpact>.13){
  contacts++;hits++;lastImpact=elapsed;
  const actor=active.find(a=>a.entity===evt.other);
  if(actor&&actor.item.shape==='light'){
   lightImpacts++;message('SOFT BOUNCE!');
  }else if(actor&&actor.item.mass>40){
   heavyHits++;message('HEAVY IMPACT!');
  }else message('ROCK IMPACT!');
 }
});
function reset(){
 disposeActors();
 phase='running';attempts++;elapsed=0;loot=0;hits=0;falls=0;contacts=0;
 pointerHeld=false;keyHeld=false;
 spawnedTotal=0;destroyedTotal=0;spawnWaves=0;maxLive=0;
 liveRocks=0;liveLoot=0;peakRocks=0;peakLoot=0;spawnSkipped=0;
 heavyHits=0;giantsSpawned=0;maxRockMass=0;
 furnitureSpawned=0;lightPropsSpawned=0;lightImpacts=0;
 verifiedCompoundFurniture=0;minVerifiedGap=100;
 ghostedActors=0;peakGhosted=0;cameraOcclusionChecks=0;
 lastOcclusionScan=-1e3;continuousSeconds=0;baseDriveFrames=0;
 totalRock=0;totalLoot=0;totalBox=0;totalSphere=0;
 for(const k of Object.keys(patterns) as Pattern[])patterns[k]=0;
 sideFlicks=0;forwardFlicks=0;maxForwardSpeed=0;
 checkpointS=2;maxProgress=2;spawnNextAt=.2;spawnWaveIndex=0;
 swipeChain=0;lastSwipeEnd=-100;lastFlickTime=-100;
 pendingImpulse=0;pendingSideImpulse=0;
 body.teleport(...initial);
 body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
 ui.loot.textContent='0';ui.dialog.classList.add('hidden');
 message('ROLL UPHILL · SWIPE FOR BOOST!');
}
ui.start.addEventListener('click',reset);
ui.start.disabled=false;ui.start.textContent='START CLIMBING →';
ui.status.textContent='REAL 60° BULLET RAMP READY';
ui.description.textContent='The ball keeps rolling uphill. Hold to drive faster, swipe UP for a burst and swipe sideways to dodge. Run between the legs of huge falling furniture, collect loot and shove aside feather-light props!';
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
let pointerHeld=false,keyHeld=false;
window.addEventListener('pointerdown',e=>{
 if(phase!=='running'||(e.target instanceof Element&&e.target.closest('#dialog')))return;
 pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};
 pointerHeld=true;
});
window.addEventListener('pointerup',e=>{
 const first=pointerStart;pointerStart=null;pointerHeld=false;
 if(!first||first.id!==e.pointerId)return;
 const dx=e.clientX-first.x,dy=e.clientY-first.y;
 if(dy< -32&&Math.abs(dy)>Math.abs(dx)*.76)requestFlick('up');
 else if(Math.abs(dx)>36)requestFlick(dx<0?'left':'right');
});
window.addEventListener('pointercancel',()=>{pointerStart=null;pointerHeld=false;});
window.addEventListener('blur',()=>{pointerHeld=false;keyHeld=false;pointerStart=null;});
window.addEventListener('keydown',e=>{
 if((e.code==='Space'||e.code==='Enter')&&phase!=='running'){e.preventDefault();reset();return;}
 if(e.code==='ArrowUp'||e.code==='KeyW'){
  e.preventDefault();keyHeld=true;if(!e.repeat)requestFlick('up');
 }
 if(e.code==='ArrowLeft'||e.code==='KeyA'){e.preventDefault();requestFlick('left');}
 if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();requestFlick('right');}
 if(e.code==='KeyR'){e.preventDefault();reset();}
});
window.addEventListener('keyup',e=>{
 if(e.code==='ArrowUp'||e.code==='KeyW')keyHeld=false;
});
const forwardVelocity=(v:Vec3)=>v.y*SIN_SLOPE-v.z*COS_SLOPE;
app.on('update',(dt:number)=>{
 const tick=Math.min(dt,.04);
 const p=player.getPosition(),v=body.linearVelocity;
 const frame=slopePosition(p);
 if(phase==='running'){
  elapsed+=tick;
  // Low baseline motor for continuous player-controlled forward travel.
  // It applies a FORCE to the real Bullet ball; it is not a teleport,
  // locked constraint, or guaranteed speed. Impacts can overpower it.
  const speed=forwardVelocity(v);
  const baseline=clamp(15.6+(2.0-speed)*3.2,0,24);
  const holding=pointerHeld||keyHeld;
  const climbingForce=baseline+(holding?11:0);
  body.applyForce(new Vec3(0,climbingForce*SIN_SLOPE,
    -climbingForce*COS_SLOPE));
  baseDriveFrames++;if(holding)continuousSeconds+=tick;
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
 // A resilient chase camera ALWAYS re-centers on the actual displaced
 // ball, rather than staying anchored to an uphill point after impacts.
 const cameraTarget=new Vec3(
  p.x*.74,p.y-UP[1]*6+NORMAL[1]*10.2,
  p.z-UP[2]*6+NORMAL[2]*10.2);
 const now=camera.getPosition();
 const lag=now.distance(cameraTarget);
 const ease=lag>7?1:clamp(tick*9,0,1);
 camera.setPosition(
  now.x+(cameraTarget.x-now.x)*ease,
  now.y+(cameraTarget.y-now.y)*ease,
  now.z+(cameraTarget.z-now.z)*ease);
 camera.lookAt(p.x*.9,p.y+UP[1]*5,p.z+UP[2]*5);
 camera.camera!.fov=61;
 // The WORLD is still physically solid. Only obstructing VISUAL meshes
 // turn translucent when between camera and ball. No camera teleports.
 if(elapsed-lastOcclusionScan>.095){
  lastOcclusionScan=elapsed;cameraOcclusionChecks++;
  const from=camera.getPosition(),to=player.getPosition();
  const fromVec:[number,number,number]=[from.x,from.y,from.z];
  const toVec:[number,number,number]=[to.x,to.y,to.z];
  for(const a of active){
   const c=a.entity.getPosition();
   const radius=Math.max(...a.item.size)*.7+PLAYER_RADIUS+.3;
   const blocking=blocksCameraSegment(fromVec,toVec,[c.x,c.y,c.z],radius);
   if(blocking===a.ghosted)continue;
   a.ghosted=blocking;ghostedActors+=blocking?1:-1;
   for(const visual of a.original)visual.instance.material=
     blocking?ghostMat:visual.material;
  }
  peakGhosted=Math.max(peakGhosted,ghostedActors);
 }
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
 liveRocks,liveLoot,peakRocks,peakLoot,maxRocks:MAX_ROCKS,maxLoot:MAX_LOOT,
 queued:pending.length,spawnSkipped,giantsSpawned,maxRockMass,heavyHits,
 furnitureSpawned,verifiedCompoundFurniture,minVerifiedGap,
 lightPropsSpawned,lightImpacts,ghostedActors,
 peakGhosted,cameraOcclusionChecks,continuousSeconds,baseDriveFrames,
 holding: pointerHeld||keyHeld,
 softRockTarget:HAZARD_SOFT_TARGET,softLootTarget:LOOT_SOFT_TARGET,
 openFurnitureCount:active.filter(a=>a.item.shape==='table'||a.item.shape==='chair').length,
 furnitureCompoundBodies:active.filter(a=>
  (a.item.shape==='table'||a.item.shape==='chair')&&
  a.entity.collision?.type==='compound'&&a.entity.rigidbody?.type==='dynamic').length,
 minFurnitureOpening:active.filter(a=>a.item.shape==='table'||a.item.shape==='chair')
   .reduce((min,a)=>Math.min(min,furnitureOpening(a.item).width),100),
 emitterProgress:EMITTER_S,mysteryVisible:mysteryBox.enabled,
 mysteryName:mysteryBox.name,chuteVisible:chute.enabled,
 viewportW:viewport().width,viewportH:viewport().height,
 resizeEvents:viewport().resizeEvents,
 canvasClientWidth:canvas.getBoundingClientRect().width,
 canvasClientHeight:canvas.getBoundingClientRect().height,
 renderWidth:device.width,renderHeight:device.height,
 totalRock,totalLoot,totalBox,totalSphere,patterns,
 slopeDegrees:SLOPE_DEGREES,slopeLength:SLOPE_LENGTH,
 levelHeight:LEVEL_HEIGHT,rampCollider:ramp.rigidbody?.type,
 finishVisual:!!finish.children.length,
 forwardSpeed:forwardVelocity(body.linearVelocity),
 maxForwardSpeed,forwardFlicks,sideFlicks,swipeChain,
 cameraY:camera.getPosition().y,cameraZ:camera.getPosition().z,
 ballVelocityY:body.linearVelocity.y
})};
