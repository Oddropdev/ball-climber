// C0.2: pure physics geometry + deterministic, potentially unbounded wave contract.
// Distance s is measured UP the 60° slab, not vertical world Y.
export const SLOPE_DEGREES=60;
export const SLOPE_RADIANS=SLOPE_DEGREES*Math.PI/180;
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
export const ACTIVE_CAP=48;
export type V3=[number,number,number];
export const UP:V3=[0,SIN_SLOPE,-COS_SLOPE];
export const NORMAL:V3=[0,COS_SLOPE,SIN_SLOPE];
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
export function clamp(x:number,lo:number,hi:number){return Math.min(hi,Math.max(lo,x));}
export function makeRng(seed:number){
 let s=seed>>>0;
 return ()=>{s+=0x6d2b79f5;let x=s;
  x=Math.imul(x^(x>>>15),x|1);
  x^=x+Math.imul(x^(x>>>7),x|61);
  return ((x^(x>>>14))>>>0)/4294967296;
 };
}
export type ObjectKind='rock'|'loot';
export type ObjectShape='sphere'|'box';
export type Pattern='scatter'|'row'|'train'|'diagonal'|'loot-row'|'mixed';
export type SpawnItem={
 wave:number;slot:number;kind:ObjectKind;shape:ObjectShape;
 lane:number;distanceOffset:number;size:V3;
};
export type SpawnWave={id:number;pattern:Pattern;items:SpawnItem[]};
// Stateless waves, deterministic for any nonnegative id. The caller can create
// an unlimited sequence but retains only a bounded number of live Bullet bodies.
export function makeWave(runSeed:number,id:number):SpawnWave{
 if(!Number.isSafeInteger(id)||id<0)throw Error('wave index must be nonnegative');
 const rand=makeRng((runSeed^Math.imul(id+1,0x9e3779b9))>>>0);
 const patterns:Pattern[]=['scatter','row','train','diagonal','loot-row','mixed'];
 const pattern=patterns[id%patterns.length]!;
 const count=pattern==='scatter'?2+Math.floor(rand()*2):
   pattern==='train'?3+Math.floor(rand()*2):
   pattern==='loot-row'?4:pattern==='mixed'?4:3;
 const baseLane=(rand()-.5)*5.7;
 const items:SpawnItem[]=[];
 for(let slot=0;slot<count;slot++){
  const kind:ObjectKind=pattern==='loot-row'?'loot':
    pattern==='mixed'?(slot%2===0?'rock':'loot'):
    pattern==='train'?(slot===count-1?'loot':'rock'):
    rand()<.34?'loot':'rock';
  const shape:ObjectShape=rand()<.43?'box':'sphere';
  const w=kind==='loot'?.48:.7+rand()*.46;
  const h=shape==='box'?(kind==='loot'?.46:.6+rand()*.75):w;
  const depth=shape==='box'?w*(.5+rand()*1.3):w;
  const lane=pattern==='row'||pattern==='loot-row'?
      -3.6+(7.2*(slot+.5)/count):
    pattern==='diagonal'?
      -3.1+slot*(6.2/(count-1)):
    pattern==='train'?
      baseLane+(rand()-.5)*.28:
      clamp(baseLane+(rand()-.5)*4.6,-3.7,3.7);
  const distanceOffset=pattern==='row'||pattern==='loot-row'?
    (rand()-.5)*.28:
    pattern==='train'?slot*1.8:
    pattern==='diagonal'?slot*1.2:
    slot*.9;
  items.push({wave:id,slot,kind,shape,
   lane:Math.round(lane*1000)/1000,distanceOffset,
   size:[w,h,depth]});
 }
 return {id,pattern,items};
}
