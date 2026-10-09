// C0.3: geometry + reproducible, limitless avalanche layouts.
// Runtime caps are PER KIND, never a preallocated fixed-length obstacle list.
export const SLOPE_DEGREES=60;
export const SLOPE_RADIANS=Math.PI/3;
export const SIN_SLOPE=Math.sin(SLOPE_RADIANS);
export const COS_SLOPE=Math.cos(SLOPE_RADIANS);
export const SLOPE_LENGTH=48;
export const LEVEL_HEIGHT=SLOPE_LENGTH*SIN_SLOPE;
export const WALL_HALF_WIDTH=5;
export const PLAYER_RADIUS=.58;
export const SLAB_THICKNESS=.85;
export const BASE_Y=.6;
export const BASE_Z=0;
export const CHECKPOINT_GAP=12;
export const MAX_ROCKS=50;
export const MAX_LOOT=50;
export const ACTIVE_CAP=MAX_ROCKS+MAX_LOOT;
// Hard safety ceilings are unchanged. Typical active population is far lower.
export const HAZARD_SOFT_TARGET=24;
export const LOOT_SOFT_TARGET=30;
export const EMITTER_S=SLOPE_LENGTH+2.5;
export type V3=[number,number,number];
export const UP:V3=[0,SIN_SLOPE,-COS_SLOPE];
export const NORMAL:V3=[0,COS_SLOPE,SIN_SLOPE];
export const clamp=(x:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,x));
export function onSlope(distance:number,normalOffset=SLAB_THICKNESS/2+PLAYER_RADIUS+.025,x=0):V3{
 return [x,BASE_Y+distance*SIN_SLOPE+normalOffset*COS_SLOPE,
  BASE_Z-distance*COS_SLOPE+normalOffset*SIN_SLOPE];
}
export function slopePosition(pos:{x:number;y:number;z:number}){
 const dy=pos.y-BASE_Y,dz=pos.z-BASE_Z;
 return {progress:dy*SIN_SLOPE-dz*COS_SLOPE,
  normalDistance:dy*COS_SLOPE+dz*SIN_SLOPE};
}
export function nearestCheckpoint(progress:number){
 return Math.max(2,2+Math.floor(Math.max(0,progress-2)/CHECKPOINT_GAP)*CHECKPOINT_GAP);
}
export function shouldRecover(pos:{x:number;y:number;z:number}){
 if(![pos.x,pos.y,pos.z].every(Number.isFinite))return true;
 const {progress,normalDistance}=slopePosition(pos);
 return pos.x<-WALL_HALF_WIDTH-PLAYER_RADIUS-.35 ||
  pos.x>WALL_HALF_WIDTH+PLAYER_RADIUS+.35 ||
  progress<-.7 || normalDistance<-.5 || normalDistance>6.5;
}
export function makeRng(seed:number){
 let s=seed>>>0;
 return ()=>{s+=0x6d2b79f5;let x=s;
  x=Math.imul(x^(x>>>15),x|1);
  x^=x+Math.imul(x^(x>>>7),x|61);
  return ((x^(x>>>14))>>>0)/4294967296;
 };
}
export type ObjectKind='rock'|'loot';
export type ObjectShape='sphere'|'box'|'table'|'chair'|'light'|
 'barrel'|'beam'|'bouncer';
export type Pattern='scatter'|'row'|'train'|'diagonal'|'loot-row'|'mixed'|
 'cluster'|'giant'|'spiral'|'loot-train'|'wall'|'burst';
export type SpawnItem={
 wave:number;slot:number;kind:ObjectKind;shape:ObjectShape;
 lane:number;delay:number;size:V3;mass:number;giant:boolean;
};
export type SpawnWave={id:number;pattern:Pattern;items:SpawnItem[]};
export const PATTERNS:Pattern[]=[
 'scatter','row','train','diagonal','loot-row','mixed',
 'cluster','giant','spiral','loot-train','wall','burst'
];
function patternFor(seed:number,id:number):Pattern{
 // Shuffled 12-wave bags, so randomness is strong WITHOUT starving trains/giants.
 const bag=Math.floor(id/PATTERNS.length),rng=makeRng((seed^Math.imul(bag+1,0x45d9f3b))>>>0);
 const indices=PATTERNS.map((_,i)=>i);
 for(let i=indices.length-1;i>0;i--){
  const j=Math.floor(rng()*(i+1));[indices[i],indices[j]]=[indices[j]!,indices[i]!];
 }
 return PATTERNS[indices[id%PATTERNS.length]!]!;
}
export function massFor(kind:ObjectKind,size:V3,giant=false){
 // Mass is physical, scaled by volume. Giants are genuinely heavier and
 // impart more momentum on impact, but capped for Bullet stability.
 const volume=size[0]*size[1]*size[2];
 return kind==='loot'?clamp(.25+volume*.55,.35,3.5):
  clamp(2+volume*(giant?2.2:1.3),2.2,260);
}
export function makeWave(seed:number,id:number):SpawnWave{
 if(!Number.isSafeInteger(id)||id<0)throw Error('wave index must be nonnegative');
 const pattern=patternFor(seed,id);
 const random=makeRng((seed^Math.imul(id+1,0x9e3779b9))>>>0);
 const count=pattern==='scatter'?3+Math.floor(random()*4):
  pattern==='train'||pattern==='loot-train'?4+Math.floor(random()*3):
  pattern==='row'||pattern==='loot-row'?5+Math.floor(random()*3):
  pattern==='wall'?4+Math.floor(random()*3):
  pattern==='giant'?2+Math.floor(random()*3):
  3+Math.floor(random()*5);
 const baseLane=(random()-.5)*5.8;
 const items:SpawnItem[]=[];
 for(let slot=0;slot<count;slot++){
  const requestedGiant=pattern==='giant'&&slot===0 || pattern==='burst'&&random()<.07;
  const kind:ObjectKind=pattern==='loot-row'||pattern==='loot-train'?'loot':
   pattern==='giant'&&slot===0?'rock':
   pattern==='mixed'||pattern==='burst'?slot%2?'loot':'rock':
   random()<.57?'loot':'rock';
  const giant=kind==='rock'&&requestedGiant;
  // Furniture has open, physically traversable leg gaps rather than a
  // single solid collision box. Many large shapes can pass over the player.
  const furniture=kind==='rock'&&(giant||pattern==='wall'&&slot%2===0||
    pattern==='cluster'&&slot===0||random()<.16);
  const shape:ObjectShape=kind==='rock'&& !furniture&&random()<.30?'light':
    furniture?(random()<.58?'table':'chair'):
    random()<.5?'box':'sphere';
  const width=shape==='table'?3.6+random()*1.5:
    shape==='chair'?2.8+random()*.8:
    giant?2.5+random()*1.8:
    kind==='rock'?.7+random()*1.0:.5+random()*.6;
  const height=shape==='table'?2.4+random()*.65:
    shape==='chair'?2.8+random()*.55:
    giant?2+random()*2:shape==='box'?width*(.55+random()*1.45):width;
  const depth=shape==='table'?2.6+random()*.6:
    shape==='chair'?2.6+random()*.65:
    giant?2+random()*2:shape==='box'?width*(.45+random()*1.5):width;
  const lane=pattern==='row'||pattern==='loot-row'||pattern==='wall'?
   -4.35+8.7*(slot+.5)/count:
   pattern==='diagonal'||pattern==='spiral'?
    -3.8+7.6*(slot/(count-1)):
   pattern==='train'||pattern==='loot-train'||pattern==='cluster'?
    baseLane+(random()-.5)*(pattern==='cluster'?1.8:.28):
   giant?clamp((random()-.5)*4,-2,2):
    clamp(baseLane+(random()-.5)*8,-4.25,4.25);
  // True queues use staggered EMISSION TIMES from the SAME summit box.
  // Rows fall simultaneously in parallel lanes; trains fall sequentially.
  const delay=pattern==='train'||pattern==='loot-train'?
   slot*(.20+random()*.13):
   pattern==='diagonal'||pattern==='spiral'?slot*.14:
   pattern==='cluster'?Math.floor(slot/2)*.12:
   pattern==='wall'?Math.floor(slot/5)*.13:
   pattern==='burst'?random()*.5:random()*.07;
  const size:V3=[
   Math.round(width*100)/100,Math.round(height*100)/100,
   Math.round(depth*100)/100
  ];
  items.push({wave:id,slot,kind,shape,
   lane:Math.round(lane*1000)/1000,delay:Math.round(delay*1000)/1000,
   size,mass:shape==='light'?.14:massFor(kind,size,giant),giant});
 }
 return {id,pattern,items};
}
