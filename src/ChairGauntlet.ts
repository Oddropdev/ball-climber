// C1.3: small seeded chair gauntlet occupying the real hillside from
// the first frame. One true Bullet compound per chair, never decorative.
import {makeRng,massFor,type SpawnItem,type V3} from './Course';
import type {Biome} from './LevelSpec';
const PROGRESS=[8,12,17,23,28,34,39,42] as const;
export function chairGauntlet(seed:number,biome:Biome){
 const r=makeRng((seed^0x6cab78a1)>>>0);
 const shift:Record<Biome,number>={rocky:0,stormwall:1,
  scrapfall:2,candy:3};
 return PROGRESS.map((progress,i)=>{
  // Six big traversable chairs and two rewards. Player must actually
  // steer, but the entire road is never covered by an impassable wall.
  const reward=i===2||i===5;
  const shape=reward?'sphere':i===6?'table':'chair';
  const width=shape==='chair'?1.85+r()*.43:shape==='table'?2.3+r()*.45:.65;
  const height=shape==='chair'?3.8+r()*.5:shape==='table'?3.9+r()*.5:.7;
  const depth=shape==='chair'?1.55+r()*.32:shape==='table'?1.75+r()*.2:.65;
  const size:V3=[width,height,depth];
  // Level identity changes obstacle side and placement, not just color.
  const side=(i+shift[biome])%2===0?1:-1;
  const lane=reward?side*(2.0+r()*.9):
   i%3===0?side*(.25+r()*.55):side*(1.1+r()*.85);
  const item:SpawnItem={wave:-2,slot:i,
   kind:reward?'loot':'rock',shape,
   lane:Math.round(lane*1000)/1000,delay:0,size,
   mass:massFor(reward?'loot':'rock',size),giant:false};
  return {progress:progress+(r()-.5)*1.1,item};
 });
}
