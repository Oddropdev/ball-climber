// C1.4: physically present fast-start intercepts, no delayed spawns.
// Concentrated in first 4-22m so repeated uphill swipes meet traffic.
import {makeRng,massFor,type ObjectShape,type SpawnItem,type V3} from './Course';
import type {Biome} from './LevelSpec';
const PROGRESS=[4.5,7.5,10.5,14,18,22] as const;
const SHAPES:ObjectShape[]=['chair','chair','barrel','chair','beam','sphere'];
export function rushPack(seed:number,biome:Biome){
 const r=makeRng((seed^0x792bac61)>>>0);
 const biomeShift:Record<Biome,number>={
  rocky:0,stormwall:1,scrapfall:2,candy:3};
 const shift=biomeShift[biome];
 return PROGRESS.map((progress,i)=>{
  const shape=SHAPES[(i+shift)%SHAPES.length]!;
  const reward=i===5;
  const finalShape=reward?'sphere':shape;
  const size:V3=finalShape==='chair'?
   [2.25+r()*.25,3.8+r()*.45,1.65+r()*.3]:
   finalShape==='barrel'?[1.45,2.35,1.45]:
   finalShape==='beam'?[3.05,.55,.75]:
   [reward?.72:1.35,reward?.72:1.35,reward?.72:1.35];
  // Alternate traffic, including near-center furniture: player has
  // at least one open side lane and still controls outcomes by swiping.
  const side=(i+shift)%2?1:-1;
  const lane=reward?side*2.0:
   (i%3===0?side*.45:side*(.85+r()*.65));
  const item:SpawnItem={wave:-3,slot:i,shape:finalShape,
   kind:reward?'loot':'rock',lane:Math.round(lane*1000)/1000,
   delay:0,size,mass:massFor(reward?'loot':'rock',size),giant:false};
  return {progress:progress+(r()-.5)*.5,item};
 });
}
