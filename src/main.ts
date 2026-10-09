// C0.5 — real 60° Bullet slope. Player movement ONLY from discrete swipes;
// falling physics bodies receive drag independently of the ball.
import {Entity,Vec3,Color,Texture,PIXELFORMAT_RGBA8,BLEND_NORMAL,type MeshInstance,type Material} from 'playcanvas';
import {createPhysicsGame,material} from './Physics';
import {makeFurniture,furnitureOpening} from './Furniture';
import {PLAYER_SWIPE_IMPULSE,PLAYER_CHAIN_INCREMENT,PLAYER_MAX_FORWARD_SPEED,
 PLAYER_ANTISLIDE_FORCE,PLAYER_SWIPE_COOLDOWN,HAZARD_RELEASE_SPEED,
 HAZARD_MAX_AGE_SECONDS,hazardBrakingForce,
 BASE_PLAYER_MASS,MAX_CHARGE,MAX_PLAYER_MASS,
 chargedBySwipe,chargeAfterIdle,massForCharge,scaleImpulseForMass,
 lateralControlFraction} from './Motion';
import {visualOcclusionTier,type OcclusionTier} from './Visibility';
import {SLOPE_DEGREES,SLOPE_LENGTH,SIN_SLOPE,COS_SLOPE,LEVEL_HEIGHT,
  WALL_HALF_WIDTH,PLAYER_RADIUS,SLAB_THICKNESS,UP,NORMAL,onSlope,
  slopePosition,nearestCheckpoint,shouldRecover,makeWave,clamp,
  ACTIVE_CAP,MAX_ROCKS,MAX_LOOT,HAZARD_SOFT_TARGET,LOOT_SOFT_TARGET,
  EMITTER_S,PATTERNS,type SpawnItem,type Pattern} from './Course';
import {levelSpec,type LevelSpec} from './LevelSpec';
import {buildClimbLevel,type ClimbLevel} from './ClimbLevel';
import {SKINS,safeSave,purchaseSkin,bankSummitLoot,unlockNextLevel,
 type ClimbSave} from './SkinShop';
import './style.css';
type Phase='ready'|'running'|'summit'|'complete'|'error';
const params=new URL(window.location.href).searchParams;
const infiniteMode=params.get('mode')==='infinite';
const testMode=infiniteMode&&params.get('test')==='1';
const saveKey='oddrop-ball-climber-c1-v1';
function readSave():ClimbSave{
 if(!infiniteMode)return safeSave(null);
 try{return safeSave(JSON.parse(localStorage.getItem(saveKey)||'null'));}
 catch{return safeSave(null);}
}
let save=readSave(),currentSpec:LevelSpec=levelSpec(save.level);
let levelScene:ClimbLevel|null=null;
let stagedLevels=0,disposedLevels=0,summitEvents=0,onSummit=false;
let summitContactEvents=0,summitContactPending=false;
let lastSummitContactProgress=0,verifiedSummitArrivals=0;
const canvas=document.getElementById('application-canvas') as HTMLCanvasElement;
const $=(id:string)=>document.getElementById(id)!;
const ui={
 status:$('status'),progress:$('progress'),loot:$('loot'),toast:$('toast'),
 dialog:$('dialog'),title:$('title'),description:$('description'),
 start:$('start') as HTMLButtonElement,
 badge:$('level-badge'),summary:$('summit-summary'),
 shop:$('shop-button') as HTMLButtonElement,
 shopPanel:$('shop-panel'),shopCredits:$('shop-credits'),
 shopItems:$('shop-items'),shopBack:$('shop-back') as HTMLButtonElement
};
let phase:Phase='ready',elapsed=0,loot=0,hits=0,falls=0,contacts=0,attempts=0;
let spawnedTotal=0,destroyedTotal=0,spawnWaves=0,maxLive=0;
let liveRocks=0,liveLoot=0,peakRocks=0,peakLoot=0,spawnSkipped=0;
let heavyHits=0,giantsSpawned=0,maxRockMass=0;
let furnitureSpawned=0,lightPropsSpawned=0,lightImpacts=0;
let verifiedCompoundFurniture=0,minVerifiedGap=100;
let ghostedActors=0,peakGhosted=0,cameraOcclusionChecks=0;
let strongOcclusionEvents=0,lastSideControlFraction=1;
let lastOcclusionScan=-1e3;let hazardMotionTicks=0,hazardSampleSpeed=0;
let totalRock=0,totalLoot=0,totalBox=0,totalSphere=0;
let checkpointS=2,maxProgress=2,sideFlicks=0,forwardFlicks=0;
let appliedSwipeCount=0,lastAppliedSwipeMagnitude=0;
let chargeLevel=0,peakChargeLevel=0,lastWeightSwipeTime=-100;
let maximumChargedMass=BASE_PLAYER_MASS,massUpdateCount=0;
let speedCapActivations=0,chargedMediumImpacts=0;
let lastFlickTime=-100,maxForwardSpeed=0,spawnNextAt=1,spawnWaveIndex=0;
let swipeChain=0,lastSwipeEnd=-100,pendingImpulse=0,pendingSideImpulse=0;
let messageUntil=0;
const WAVE_SEED=1719;
const root=document.getElementById('game')!;
if(infiniteMode){root.classList.add('infinite');ui.badge.hidden=false;}
const FLICK_COOLDOWN=PLAYER_SWIPE_COOLDOWN;
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
const toColor=(hex:string)=>{
 const n=parseInt(hex.slice(1),16);
 return new Color(((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255);
};
const themes=new Map<string,{
 road:ReturnType<typeof material>;trim:ReturnType<typeof material>;
 island:ReturnType<typeof material>;marker:ReturnType<typeof material>
}>();
function paletteFor(spec:LevelSpec){
 const key=spec.biome,existing=themes.get(key);
 if(existing)return existing;
 const made={road:material(spec.road,.7),trim:material(spec.stripe,.75),
  island:material(spec.island,.68),marker:material('#FFF3BC',.9)};
 themes.set(key,made);return made;
}
(app.systems.rigidbody as {gravity:Vec3}).gravity.set(0,-12,0);
const mats={
 road:material('#9A83D1',.7),roadStripe:material('#BEAFE4'),
 edge:material('#FFD5B6'),rock:material('#EC8791'),
 rockDark:material('#E66B78'),crate:material('#D97EA5'),
 rectangle:material('#DA686A'),loot:material('#FFE06D',.94),
 lootBox:material('#FFD15C',.92),ball:material('#F9FAFE',.93),
 band:material('#43DCCF',.82),cloud:material('#FFFFFF'),
 island:material('#88D4CD'),gold:material('#FFF1A9'),
 furniture:material('#E97485',.73),chair:material('#C95472',.73),
 light:material('#6EE2D4',.78)
};
mats.loot.emissive=new Color(.65,.35,.03);mats.loot.emissiveIntensity=1.1;mats.loot.update();
// Shared fade materials avoid per-object GPU material allocation.
const ghostMat=material('#EB8995',.38);
ghostMat.opacity=.15;ghostMat.blendType=BLEND_NORMAL;
ghostMat.depthWrite=false;ghostMat.update();
const ghostNearMat=material('#EB8995',.38);
ghostNearMat.opacity=.045;ghostNearMat.blendType=BLEND_NORMAL;
ghostNearMat.depthWrite=false;ghostNearMat.update();
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
 [PLAYER_RADIUS*2,PLAYER_RADIUS*2,PLAYER_RADIUS*2],mats.ball,'dynamic',0,BASE_PLAYER_MASS);
const band=new Entity('player-ball-stripe');
band.addComponent('render',{type:'sphere',material:mats.band,castShadows:false});
band.setLocalPosition(0,.29,0);band.setLocalScale(.85,.17,.85);
player.addChild(band);
const body=player.rigidbody!;
const skinMaterials=new Map(SKINS.map(s=>[s.id,material(s.color,.94)]));
function applySkin(){
 const selected=SKINS.find(s=>s.id===save.equipped)!;
 const visual=player.children[0] as Entity;
 for(const i of visual.render!.meshInstances)i.material=skinMaterials.get(selected.id)!;
 mats.band.diffuse=toColor(selected.band);mats.band.update();
}
function persist(){
 try{localStorage.setItem(saveKey,JSON.stringify(save));}
 catch{ /* still playable in disabled local storage */ }
}
function refreshBadge(){
 ui.badge.textContent='LEVEL '+currentSpec.index+' · '+currentSpec.title;
 if(infiniteMode)ui.status.textContent='LEVEL '+currentSpec.index+' · SWIPE UP';
}
function stageLevel(){
 if(!infiniteMode)return;
 if(levelScene){levelScene.dispose();disposedLevels++;}
 currentSpec=levelSpec(save.level);
 const p=paletteFor(currentSpec);
 levelScene=buildClimbLevel(currentSpec,shape,p);stagedLevels++;
 for(const v of (ramp.children[0] as Entity).render!.meshInstances)v.material=p.road;
 for(const marker of ledges)
  for(const m of (marker.children[0] as Entity).render!.meshInstances)m.material=p.trim;
 camera.camera!.clearColor.copy(toColor(currentSpec.sky));
 refreshBadge();
}
if(infiniteMode){stageLevel();applySkin();}
// Assigning RigidBodyComponent.mass invokes PlayCanvas's REAL Bullet mass
// setter (including inertia). Never resize the collider or ghost obstacles.
function setCharge(level:number){
 const next=Math.max(0,Math.min(MAX_CHARGE,Math.floor(level)));
 if(next===chargeLevel&&Math.abs(body.mass-massForCharge(next))<.00001)return;
 chargeLevel=next;
 body.mass=massForCharge(next);
 massUpdateCount++;
 maximumChargedMass=Math.max(maximumChargedMass,body.mass);
 mats.band.emissive=new Color(.04+next*.065,.2+next*.1,.23+next*.075);
 mats.band.emissiveIntensity=.2+next*.25;
 mats.band.update();
}
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
  original:RenderSurface[];ghostTier:OcclusionTier};
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
 if(actor.ghostTier>0)ghostedActors--;
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
 const initialSpeed=HAZARD_RELEASE_SPEED+(item.slot%4)*.22;
 rb.linearVelocity=new Vec3(outward,-initialSpeed*SIN_SLOPE,
  initialSpeed*COS_SLOPE);
 if(item.shape==='box')rb.angularVelocity=new Vec3(.3,item.slot%2?1.4:-1.4,.55);
 active.push({item,entity:e,bornAt:elapsed,original:collectRenders(e),ghostTier:0});
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
  const wave=makeWave(infiniteMode?currentSpec.waveSeed:WAVE_SEED,spawnWaveIndex++);
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
   pos.y< -12||elapsed-actor.bornAt>HAZARD_MAX_AGE_SECONDS)removeActor(i);
 }
}
let lastImpact=-100;
player.collision!.on('collisionstart',(evt:{other:Entity})=>{
 if(phase!=='running')return;
 if(infiniteMode&&levelScene&&evt.other===levelScene.summit){
  const p=player.getPosition();
  const progress=slopePosition(p).progress;
  summitContactEvents++;
  lastSummitContactProgress=progress;
  if(body.type==='dynamic'&&progress>=SLOPE_LENGTH-1.5&&
    p.y>=levelScene.summitTop+PLAYER_RADIUS-.35&&
    p.z<-23.4&&Math.abs(p.x)<=WALL_HALF_WIDTH)
   summitContactPending=true;
  return;
 }
 if(evt.other.name.startsWith('falling-rock-')&&elapsed-lastImpact>.13){
  contacts++;hits++;lastImpact=elapsed;
  const actor=active.find(a=>a.entity===evt.other);
  if(actor&&actor.item.shape==='light'){
   lightImpacts++;message('SOFT BOUNCE!');
  }else if(actor&&actor.item.mass>=3&&actor.item.mass<=16&&chargeLevel>=2){
   chargedMediumImpacts++;
   message('WEIGHT PUSH!');
  }else if(actor&&actor.item.mass>40){
   heavyHits++;message('HEAVY IMPACT!');
  }else message('ROCK IMPACT!');
 }
});
function reset(){
 disposeActors();
 if(infiniteMode)stageLevel();
 if(body.type!=='dynamic')body.type='dynamic';
 onSummit=false;summitContactPending=false;
 summitContactEvents=0;lastSummitContactProgress=0;
 ui.shop.hidden=true;ui.shopPanel.hidden=true;ui.summary.hidden=true;
 ui.start.hidden=false;root.classList.remove('summit');
 ui.start.textContent=infiniteMode?'CLIMB LEVEL '+save.level+' →':'CLIMB AGAIN →';
 phase='running';attempts++;elapsed=0;loot=0;hits=0;falls=0;contacts=0;

 spawnedTotal=0;destroyedTotal=0;spawnWaves=0;maxLive=0;
 liveRocks=0;liveLoot=0;peakRocks=0;peakLoot=0;spawnSkipped=0;
 heavyHits=0;giantsSpawned=0;maxRockMass=0;
 furnitureSpawned=0;lightPropsSpawned=0;lightImpacts=0;
 verifiedCompoundFurniture=0;minVerifiedGap=100;
 ghostedActors=0;peakGhosted=0;cameraOcclusionChecks=0;
 strongOcclusionEvents=0;lastSideControlFraction=1;
 lastOcclusionScan=-1e3;hazardMotionTicks=0;hazardSampleSpeed=0;
 totalRock=0;totalLoot=0;totalBox=0;totalSphere=0;
 for(const k of Object.keys(patterns) as Pattern[])patterns[k]=0;
 sideFlicks=0;forwardFlicks=0;maxForwardSpeed=0;
 appliedSwipeCount=0;lastAppliedSwipeMagnitude=0;
 setCharge(0);peakChargeLevel=0;lastWeightSwipeTime=-100;
 maximumChargedMass=BASE_PLAYER_MASS;massUpdateCount=0;
 speedCapActivations=0;chargedMediumImpacts=0;
 checkpointS=2;maxProgress=2;spawnNextAt=.2;spawnWaveIndex=0;
 swipeChain=0;lastSwipeEnd=-100;lastFlickTime=-100;
 pendingImpulse=0;pendingSideImpulse=0;
 body.teleport(...initial);
 body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
 ui.loot.textContent='0';ui.dialog.classList.add('hidden');
 if(infiniteMode)applySkin();
 root.classList.add('playing');
 message('SWIPE UP TO CLIMB!');
}
function enterSummit(){
 if(!infiniteMode||phase!=='running'||!levelScene)return;
 // A genuine Bullet contact with this level's physical summit is required.
 if(!summitContactPending||summitContactEvents<1)return;
 summitContactPending=false;
 phase='summit';onSummit=true;summitEvents++;verifiedSummitArrivals++;
 // Only after a real uphill approach, park on an actual Bullet plateau.
 const pos=player.getPosition();
 body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
 body.type='kinematic';
 body.teleport(clamp(pos.x,-3,3),levelScene.summitTop+PLAYER_RADIUS+.07,-30.5);
 disposeActors();setCharge(0);peakChargeLevel=0;
 pendingImpulse=0;pendingSideImpulse=0;
 save=bankSummitLoot(save,loot);persist();
 ui.summary.textContent='LEVEL '+save.level+' CLEARED · +'+loot+
  ' LOOT · BANK '+save.wallet;
 ui.title.innerHTML='SUMMIT <em>REACHED!</em>';
 ui.description.textContent=currentSpec.title+
  ' · '+elapsed.toFixed(1)+'s · '+falls+' falls. Loot buys ball skins only.';
 ui.start.textContent='NEXT LEVEL →';ui.start.hidden=false;
 ui.shop.hidden=false;ui.shopPanel.hidden=true;ui.summary.hidden=false;
 ui.dialog.classList.remove('hidden');
 root.classList.remove('playing');root.classList.add('summit');
}
function showShop(){
 if(!infiniteMode||phase!=='summit')return;
 ui.shopPanel.hidden=false;ui.start.hidden=true;ui.shop.hidden=true;
 ui.shopCredits.textContent='BANK: '+save.wallet+' LOOT';
 ui.shopItems.replaceChildren();
 for(const skin of SKINS){
  const owned=save.owned.includes(skin.id),button=document.createElement('button');
  button.type='button';button.className='skin-item';
  button.disabled=!owned&&save.wallet<skin.price;
  const swatch=document.createElement('span');swatch.className='skin-swatch';
  swatch.style.background=skin.color;
  const name=document.createElement('span');name.textContent=skin.name;
  const price=document.createElement('small');
  price.textContent=save.equipped===skin.id?'EQUIPPED':
   owned?'EQUIP':skin.price+' LOOT';
  button.append(swatch,name,price);
  button.addEventListener('click',()=>{
   save=purchaseSkin(save,skin.id);applySkin();persist();showShop();
  });
  ui.shopItems.append(button);
 }
}
ui.shop.addEventListener('click',showShop);
ui.shopBack.addEventListener('click',()=>{
 ui.shopPanel.hidden=true;ui.start.hidden=false;ui.shop.hidden=false;
});
ui.start.addEventListener('click',()=>{
 if(infiniteMode&&phase==='summit'){
  save=unlockNextLevel(save);persist();reset();
 }else reset();
});
ui.start.disabled=false;ui.start.textContent=infiniteMode?
 'CLIMB LEVEL '+save.level+' →':'START CLIMBING →';
ui.status.textContent='REAL 60° BULLET RAMP READY';
ui.description.textContent='Every UP swipe rolls the ball a little farther. Swipe left/right to dodge. Watch slower falling furniture, roll beneath the legs and push aside lightweight debris. There is NO automatic ascent.';
ui.title.innerHTML='ROLL <em>UPHILL.</em>';
if(infiniteMode)ui.description.textContent='Climb to a REAL summit platform. '+
 'Bank falling loot, visit the cosmetic-only shop or start the next '+
 'seeded level. 1,000+ reproducible levels, no power upgrades.';
function requestFlick(direction:'up'|'left'|'right'){
 if(phase!=='running'||elapsed-lastFlickTime<FLICK_COOLDOWN)return;
 const p=player.getPosition(),s=slopePosition(p);
 if(s.normalDistance>SLAB_THICKNESS/2+PLAYER_RADIUS+1.8)return;
 lastFlickTime=elapsed;
 if(direction==='up'){
  if(elapsed-lastSwipeEnd<.9)swipeChain=Math.min(4,swipeChain+1);
  else swipeChain=0;
  lastSwipeEnd=elapsed;forwardFlicks++;
  peakChargeLevel=chargedBySwipe(chargeLevel,elapsed-lastWeightSwipeTime);
  lastWeightSwipeTime=elapsed;
  setCharge(peakChargeLevel);
  pendingImpulse+=PLAYER_SWIPE_IMPULSE+swipeChain*PLAYER_CHAIN_INCREMENT;
  message(chargeLevel>1?'WEIGHT x'+(body.mass/BASE_PLAYER_MASS).toFixed(1):'ROLL!');
 }else{
  sideFlicks++;
  lastSideControlFraction=lateralControlFraction(chargeLevel);
  pendingSideImpulse+=(direction==='left'?-1:1)*3.65*lastSideControlFraction;
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
window.addEventListener('blur',()=>{pointerStart=null;});
window.addEventListener('keydown',e=>{
 if((e.code==='Space'||e.code==='Enter')&&
 (phase==='ready'||phase==='complete')){e.preventDefault();reset();return;}
 if(e.code==='ArrowUp'||e.code==='KeyW'){
  e.preventDefault();if(!e.repeat)requestFlick('up');
 }
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
  // Charged mass fades when swipes stop. Real Bullet mass + inertia updates
  // happen only on level change, never every frame.
  setCharge(chargeAfterIdle(peakChargeLevel,elapsed-lastWeightSwipeTime));
  // Partial anti-slide support is weaker than slope gravity. It cannot
  // move the ball upward by itself. A swipe is always required to climb.
  const normalMassRatio=body.mass/BASE_PLAYER_MASS;
  body.applyForce(new Vec3(0,PLAYER_ANTISLIDE_FORCE*normalMassRatio*SIN_SLOPE,
    -PLAYER_ANTISLIDE_FORCE*normalMassRatio*COS_SLOPE));
  // Apply a SMALL mass-scaled counterforce and downhill drag ONLY to
  // dynamic avalanche objects. Never slow the world's physics clock.
  let downSpeedTotal=0;
  for(const actor of active){
    const rb=actor.entity.rigidbody!;
    const actualV=rb.linearVelocity;
    const downhillSpeed=Math.max(0,-forwardVelocity(actualV));
    const opposite=hazardBrakingForce(actor.item.mass,downhillSpeed);
    rb.applyForce(new Vec3(0,opposite*SIN_SLOPE,-opposite*COS_SLOPE));
    downSpeedTotal+=downhillSpeed;
    hazardMotionTicks++;
  }
  hazardSampleSpeed=active.length?downSpeedTotal/active.length:0;
  if(pendingImpulse){
   const next=clamp(pendingImpulse,0,32);pendingImpulse=0;
   const speed=forwardVelocity(v);
   const bounded=Math.max(0,Math.min(next,(PLAYER_MAX_FORWARD_SPEED-speed)*1.4));
   if(bounded>0){
    // Scale momentum impulse by real mass: charging adds PUSH POWER, not
    // free speed and not an accidental inability to move a heavy ball.
    const physicalImpulse=scaleImpulseForMass(bounded,body.mass);
    appliedSwipeCount++;lastAppliedSwipeMagnitude=physicalImpulse;
    body.applyImpulse(new Vec3(0,physicalImpulse*SIN_SLOPE,
      -physicalImpulse*COS_SLOPE));
    body.applyTorqueImpulse(new Vec3(Math.min(1.85,bounded*.19)*normalMassRatio,0,0));
   }
  }
  if(pendingSideImpulse){
   body.applyImpulse(new Vec3(clamp(pendingSideImpulse,-7,7)*normalMassRatio,0,0));
   pendingSideImpulse=0;
  }
  // Enforce the uphill ceiling even if a huge contact (or repeated quick
  // swipes) adds momentum. Preserve sideways/downhill/normal components.
  const velocityNow=body.linearVelocity;
  const uphill=forwardVelocity(velocityNow);
  if(uphill>PLAYER_MAX_FORWARD_SPEED){
   const excess=uphill-PLAYER_MAX_FORWARD_SPEED;
   body.linearVelocity=new Vec3(velocityNow.x,
    velocityNow.y-excess*SIN_SLOPE,
    velocityNow.z+excess*COS_SLOPE);
   speedCapActivations++;
  }
  maxForwardSpeed=Math.max(maxForwardSpeed,forwardVelocity(body.linearVelocity));
  maxProgress=Math.max(maxProgress,frame.progress);
  checkpointS=nearestCheckpoint(maxProgress);
  if(!infiniteMode||frame.progress<45)streamSpawns();
  else pending.length=0;
  reapActors(frame.progress,p);
  // Tilted slope recovery is invalid on a horizontal summit surface.
  const summitApproach=infiniteMode&&frame.progress>=46;
  const offSummit=summitApproach&&(
   Math.abs(p.x)>WALL_HALF_WIDTH+PLAYER_RADIUS+.55||
   p.y<(levelScene?.summitTop??0)-8||p.z< -41);
  if(shouldRecover(p)&&(!summitApproach||offSummit)){
   falls++;
   // Losing progress is meaningful: return to previous checkpoint,
   // not to the current peak or an invisible perpetual magnet.
   const checkpoint=Math.max(2,checkpointS-12);
   body.teleport(...onSlope(checkpoint));
   body.linearVelocity=new Vec3();body.angularVelocity=new Vec3();
   setCharge(0);peakChargeLevel=0;lastWeightSwipeTime=-100;
   pendingImpulse=0;pendingSideImpulse=0;swipeChain=0;
   message('FELL — BACK DOWN!');
  }
  if(infiniteMode&&summitContactPending)enterSummit();
  if(!infiniteMode&&frame.progress>=SLOPE_LENGTH){
   phase='complete';ui.title.innerHTML='SUMMIT <em>REACHED!</em>';
   ui.description.textContent='Loot '+loot+' · Impacts '+hits+' · Falls '+falls+
    ' · Flicks '+forwardFlicks+' · Time '+elapsed.toFixed(1)+'s. Climb again?';
   ui.start.textContent='CLIMB AGAIN →';ui.dialog.classList.remove('hidden');
    root.classList.remove('playing');
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
   const nextTier=visualOcclusionTier(fromVec,toVec,[c.x,c.y,c.z],
     radius,a.item.kind==='loot');
   if(nextTier===a.ghostTier)continue;
   if(a.ghostTier===0&&nextTier>0)ghostedActors++;
   else if(a.ghostTier>0&&nextTier===0)ghostedActors--;
   a.ghostTier=nextTier;
   if(nextTier===2)strongOcclusionEvents++;
   for(const visual of a.original)visual.instance.material=
     nextTier===2?ghostNearMat:nextTier===1?ghostMat:visual.material;
  }
  peakGhosted=Math.max(peakGhosted,ghostedActors);
 }
 ui.progress.style.width=(clamp(frame.progress/SLOPE_LENGTH,0,1)*100).toFixed(1)+'%';
 if(phase==='running')ui.status.textContent=
  Math.floor(clamp(frame.progress,0,SLOPE_LENGTH))+' / '+SLOPE_LENGTH+
  'm · MASS ×'+(body.mass/BASE_PLAYER_MASS).toFixed(1)+
  ' · FALLS '+falls;
});
app.start();
declare global{interface Window{__CLIMBER_TEST__?:{
 snapshot:()=>Record<string,unknown>;approachSummit?:()=>void
}}}
window.__CLIMBER_TEST__={
 approachSummit:testMode?()=>{
  if(phase!=='running'||body.type!=='dynamic')return;
  // Test-only accelerated physics starting point. Does NOT call enterSummit
  // or set phase: PlayCanvas/Bullet still advances uphill to summit detection.
  const p=onSlope(SLOPE_LENGTH-.75);
  body.teleport(...p);
  body.linearVelocity=new Vec3(0,9.8*SIN_SLOPE,-9.8*COS_SLOPE);
  body.angularVelocity=new Vec3();
 }:undefined,
 snapshot:()=>({
 phase,physicsLoaded:true,rigidbodyType:body.type,
  infiniteMode,levelIndex:currentSpec.index,
  biome:currentSpec.biome,levelTitle:currentSpec.title,
  levelSeed:currentSpec.seed,waveSeed:currentSpec.waveSeed,
  summitPlatformType:levelScene?.summit.rigidbody?.type??null,
  summitPlatformTop:levelScene?.summitTop??null,
  sceneEntities:levelScene?.sceneEntities??0,
  levelPhysicalObstacles:levelScene?.physicalEntities??0,
  stagedLevels,disposedLevels,summitEvents,onSummit,
  summitContactEvents,summitContactPending,
  lastSummitContactProgress,verifiedSummitArrivals,
  wallet:save.wallet,ownedSkins:[...save.owned],equippedSkin:save.equipped,
  shopVisible:!ui.shopPanel.hidden,levelLoot:loot,
 x:player.getPosition().x,y:player.getPosition().y,z:player.getPosition().z,
 progress:slopePosition(player.getPosition()).progress,
 normalDistance:slopePosition(player.getPosition()).normalDistance,
 elapsed,loot,hits,falls,contacts,attempts,
 checkpointS,maxProgress,spawnedTotal,destroyedTotal,spawnWaves,maxLive,
 liveFalling:active.length,activeCap:ACTIVE_CAP,
 liveRocks,liveLoot,peakRocks,peakLoot,maxRocks:MAX_ROCKS,maxLoot:MAX_LOOT,
 queued:pending.length,spawnSkipped,giantsSpawned,maxRockMass,heavyHits,
 furnitureSpawned,verifiedCompoundFurniture,minVerifiedGap,
 lightPropsSpawned,lightImpacts,ghostedActors,strongOcclusionEvents,
  lastSideControlFraction,lightweightLateralControl:lateralControlFraction(0),
  heavyweightLateralControl:lateralControlFraction(MAX_CHARGE),
 peakGhosted,cameraOcclusionChecks,hazardMotionTicks,hazardSampleSpeed,
 swipeOnly:true,playerMotorEnabled:false,
 hazardReleaseSpeed:HAZARD_RELEASE_SPEED,
 playerSwipeImpulse:PLAYER_SWIPE_IMPULSE,
 maxAllowedForwardSpeed:PLAYER_MAX_FORWARD_SPEED,
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
 appliedSwipeCount,lastAppliedSwipeMagnitude,
 playerMass:body.mass,basePlayerMass:BASE_PLAYER_MASS,
 maxPlayerMass:MAX_PLAYER_MASS,chargeLevel,peakChargeLevel,
 massUpdateCount,maximumChargedMass,speedCapActivations,
 chargedMediumImpacts,
 cameraY:camera.getPosition().y,cameraZ:camera.getPosition().z,
 ballVelocityY:body.linearVelocity.y
})};
