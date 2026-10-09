// C1.1: fix first-10-second avalanche starvation, without moving the
// original C0.7 emitter or modifying the player swipe-only physics.
import {makeRng,massFor,type SpawnItem,type ObjectShape,type V3} from './Course';
export const PREWARM_PROGRESS=[14,18,23,27,32,36,40,43] as const;
export const MYSTERY_BOX_HEIGHT=13.5;
export const MYSTERY_BOX_SIZE=7.2;
export function warmStartItems(seed:number):Array<{item:SpawnItem;progress:number}>{
 const rand=makeRng((seed^0x51d58a47)>>>0);
 const shapes:ObjectShape[]=['box','sphere','barrel','table',
  'sphere','beam','chair','bouncer'];
 return PREWARM_PROGRESS.map((progress,i)=>{
  const shape=shapes[i]!;
  const kind=i===1||i===4||i===7?'loot':'rock';
  // Prepositioned dynamic objects represent avalanche flow ALREADY on the
  // hillside when the player starts, not magically teleported live obstacles.
  const size:V3=shape==='table'?[2.6,4.05,1.75]:
   shape==='chair'?[2.05,3.8,1.7]:
   shape==='barrel'?[1.15,2.05,1.15]:
   shape==='beam'?[3,.42,.62]:
   shape==='bouncer'?[1.28,1.28,1.28]:
   shape==='light'?[.72,.65,.65]:
   [1.0+rand()*.32,1.0+rand()*.32,1.0+rand()*.32];
  const lane=(i%2?-1:1)*(1.0+rand()*2.2);
  const item:SpawnItem={
   wave:-1,slot:i,kind,shape,
   lane:Math.round(lane*1000)/1000,delay:0,size,
   mass:shape==='light'?.14:massFor(kind,size),
   giant:false
  };
  return {item,progress};
 });
}
export function refineInfiniteItem(item:SpawnItem,seed:number):SpawnItem{
 if(item.kind==='loot'||item.shape==='light')return item;
 const rand=makeRng((seed^Math.imul(item.wave+17,192791)^
  Math.imul(item.slot+3,92473))>>>0);
 const next={...item};
 if(item.shape==='table'){
  next.size=[2.25+rand()*.65,3.85+rand()*.8,1.55+rand()*.5];
 }else if(item.shape==='chair'){
  next.size=[1.8+rand()*.55,3.65+rand()*.65,1.5+rand()*.5];
 }else if(rand()<.48){
  const shapes:ObjectShape[]=['barrel','beam','bouncer'];
  next.shape=shapes[Math.floor(rand()*shapes.length)]!;
  next.size=next.shape==='barrel'?[1.2,2+rand()*.75,1.2]:
   next.shape==='beam'?[2.6+rand()*1.0,.35+rand()*.2,.7]:
   [1.2+rand()*.4,1.2+rand()*.4,1.2+rand()*.4];
 }
 next.mass=massFor(next.kind,next.size,next.giant);
 return next;
}
export function smoothSummitBlend(progress:number,onSummit:boolean){
 if(onSummit)return 1;
 const t=Math.min(1,Math.max(0,(progress-40)/8));
 return t*t*(3-2*t);
}
export function summitCameraOffsets(blend:number){
 const t=Math.min(1,Math.max(0,blend));
 return {
  vertical:0+(4.2*t),
  behind:11.8+2.7*t,
  focusHeight:4.33-3.5*t,
  focusAhead:2.5+1.5*t
 };
}
