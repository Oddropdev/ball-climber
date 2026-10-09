// C1.0 actual per-level scene: one live summit collider and new physical
// slope-side obstacles. All disposable Bullet entities are owned and destroyed.
import {Entity,type StandardMaterial} from 'playcanvas';
import {makeRng,onSlope,SLOPE_LENGTH,SLAB_THICKNESS} from './Course';
import type {Shape} from './Physics';
import type {LevelSpec} from './LevelSpec';
export function summitSurfaceY(){
 return onSlope(SLOPE_LENGTH,SLAB_THICKNESS/2)[1];
}
export function buildClimbLevel(spec:LevelSpec,shape:Shape,
 palette:{road:StandardMaterial;trim:StandardMaterial;
  island:StandardMaterial;marker:StandardMaterial}){
 const nodes:Entity[]=[];
 let physicalSideObstacles=0;
 const add=(e:Entity)=>{nodes.push(e);return e;};
 const summitTop=summitSurfaceY();
 // A REAL horizontal Bullet platform, situated at the uphill edge.
 const platform=add(shape('level-'+spec.index+'-summit-platform','box',
  [0,summitTop-.38,-26.6],[spec.summitWidth,.76,5.8],
  palette.road,'static'));
 for(const direction of [-1,1]){
  add(shape('level-'+spec.index+'-summit-wing-'+direction,'sphere',
   [direction*(spec.summitWidth/2+1.8),summitTop-2,-27.6],
   [3.4,1.8,3.4],palette.island,false));
  add(shape('level-'+spec.index+'-summit-post-'+direction,'cylinder',
   [direction*(spec.summitWidth/2-.55),summitTop+.75,-28],
   [.25,1.5,.25],palette.trim,false));
 }
 // Physically solid side boulders are generated afresh per seed; the middle
 // lane stays open so 1,000 deterministic tracks cannot become blocked walls.
 const rng=makeRng(spec.decorSeed);
 for(let i=0;i<spec.sideBoulders;i++){
  const progress=11+i*(32/Math.max(1,spec.sideBoulders-1))+
   (rng()-.5)*1.4;
  const side=i%2===0?-1:1;
  const p=onSlope(progress,.82,side*(3.65+rng()*.32));
  const d=.75+rng()*.45;
  add(shape('level-'+spec.index+'-side-boulder-'+i,'sphere',p,
   [d,d,d],palette.island,'static'));
  physicalSideObstacles++;
 }
 // Per-level side accents contain no colliders: don't add obstacles to the
 // phone's physical budget that are merely scenic.
 for(let i=0;i<5;i++){
  const p=onSlope(9+i*8,-1.5,(i%2?1:-1)*(8.6+rng()*2));
  add(shape('level-'+spec.index+'-scenery-'+i,'sphere',p,
   [2.1+rng(),1.7+rng()*.6,2+rng()],palette.island,false));
 }
 return {
  index:spec.index,
  summit:platform,
  summitTop,
  physicalSideObstacles,
  physicalEntities:physicalSideObstacles+1,
  get sceneEntities(){return nodes.length;},
  dispose(){for(const e of nodes)e.destroy();nodes.length=0;}
 };
}
export type ClimbLevel=ReturnType<typeof buildClimbLevel>;
