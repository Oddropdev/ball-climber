// C1.2: pre-existing live avalanche plus biome-specific obstacle identity.
import {makeRng,massFor,type SpawnItem,type ObjectShape,type V3} from './Course';
import type {Biome} from './LevelSpec';
export const PREWARM_PROGRESS=[14,18,23,27,32,36,40,43] as const;
export const MYSTERY_BOX_HEIGHT=13.5;
export const MYSTERY_BOX_SIZE=7.2;
const PROFILE:Record<Biome,readonly ObjectShape[]>={
 rocky:['hammer','mace','barrel','beam','bouncer','dumbbell'],
 stormwall:['cross','paddle','mace','bouncer','beam','barrel'],
 scrapfall:['dumbbell','gate','hammer','cross','barrel','beam'],
 candy:['mace','paddle','bouncer','cross','dumbbell','gate']
};
const shapeSize=(shape:ObjectShape,rng:()=>number):V3=>{
 switch(shape){
 case 'table':return [2.25+rng()*.65,3.85+rng()*.8,1.55+rng()*.5];
 case 'chair':return [1.8+rng()*.55,3.65+rng()*.65,1.5+rng()*.5];
 case 'barrel':return [1.1+rng()*.38,1.8+rng()*.7,1.1+rng()*.38];
 case 'beam':return [2.5+rng()*1.0,.36+rng()*.18,.65+rng()*.3];
 case 'bouncer':return [1.15+rng()*.4,1.15+rng()*.4,1.15+rng()*.4];
 case 'hammer':return [2.8+rng()*.55,2.25+rng()*.65,1.15+rng()*.25];
 case 'cross':return [2.5+rng()*.6,1.2+rng()*.35,2.5+rng()*.6];
 case 'dumbbell':return [2.85+rng()*.55,1.45+rng()*.35,1.45+rng()*.35];
 case 'mace':return [1.8+rng()*.5,1.8+rng()*.5,1.8+rng()*.5];
 case 'gate':return [2.6+rng()*.45,3.0+rng()*.65,1.35+rng()*.3];
 case 'paddle':return [2.6+rng()*.5,2.6+rng()*.65,1.05+rng()*.25];
 case 'light':return [.72,.65,.65];
 default:{const n=1.0+rng()*.32;return [n,n,n];}
 }
};
export function warmStartItems(seed:number,biome:Biome='rocky'):
 Array<{item:SpawnItem;progress:number}>{
 const rand=makeRng((seed^0x51d58a47)>>>0);
 const first=PROFILE[biome][0]!;
 const second=biome==='rocky'?'beam':PROFILE[biome][1]!;
 const shapes:ObjectShape[]=[first,'sphere','barrel','table',
  'sphere',second,'chair','bouncer'];
 return PREWARM_PROGRESS.map((progress,i)=>{
  const shape=shapes[i]!;
  const kind=i===1||i===4||i===7?'loot':'rock';
  const size=shapeSize(shape,rand);
  const lane=(i%2?-1:1)*(1.0+rand()*2.2);
  const item:SpawnItem={
   wave:-1,slot:i,kind,shape,
   lane:Math.round(lane*1000)/1000,delay:0,size,
   mass:massFor(kind,size),giant:false
  };
  return {item,progress};
 });
}
export function refineInfiniteItem(item:SpawnItem,seed:number,
 biome:Biome='rocky'):SpawnItem{
 if(item.kind==='loot'||item.shape==='light')return item;
 const rand=makeRng((seed^Math.imul(item.wave+17,192791)^
  Math.imul(item.slot+3,92473))>>>0);
 const next={...item};
 if(item.shape==='table'){
  next.size=shapeSize('table',rand);
 }else if(item.shape==='chair'){
  next.size=shapeSize('chair',rand);
 }else if(rand()<.66){
  const shapes=PROFILE[biome];
  next.shape=shapes[Math.floor(rand()*shapes.length)]!;
  next.size=shapeSize(next.shape,rand);
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
