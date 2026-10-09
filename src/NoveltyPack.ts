// C1.7: extra creative silhouettes are real prewarmed dynamic Bullet objects.
// Two pieces per level keeps the old Android live-entity budget conservative.
import {makeRng,massFor,type ObjectShape,type SpawnItem,type V3} from './Course';
export const NEW_SHAPES=['pyramid','triangle','banana','car','sofa','stool',
 'boot','glove','hat'] as const;
const PROGRESS=[25.5,44.5] as const;
export function noveltyStartItems(seed:number){
 const rng=makeRng((seed^0x77669121)>>>0);
 const start=Math.floor(rng()*NEW_SHAPES.length);
 return PROGRESS.map((progress,i)=>{
  const shape=NEW_SHAPES[(start+i*4)%NEW_SHAPES.length]! as ObjectShape;
  const size:V3=shape==='hat'?[3.3,1.8,3.3]:
   shape==='banana'?[3,1.8,1.1]:
   shape==='car'?[3.2,1.9,2.1]:
   shape==='sofa'?[3.15,2.35,2.0]:
   shape==='boot'?[2.1,3.2,2.5]:
   shape==='stool'?[1.7,2.8,1.6]:
   shape==='glove'?[2.4,2.9,1.2]:
   shape==='triangle'?[2.35,3.0,1.2]:[2.35,2.7,2.25];
  const item:SpawnItem={wave:-4,slot:i,kind:'rock',shape,
   lane:i===0?-1.55:1.55,delay:0,size,mass:massFor('rock',size),giant:false};
  return {item,progress:progress+(rng()-.5)*1.5};
 });
}
