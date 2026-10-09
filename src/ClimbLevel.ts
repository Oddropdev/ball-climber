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
  [0,summitTop-.38,-30.5],[spec.summitWidth,.76,14],
  palette.road,'static'));
 // Make the previously featureless summit read as a deliberate landing
 // deck. All trims/markers are decorative: only 'platform' is the static
 // Bullet landing collider. Neither the camera nor ball hits fake railings.
 for(let i=0;i<5;i++){
  const z=-25.2-i*2.65;
  add(shape('level-'+spec.index+'-summit-runout-'+i,'box',
   [0,summitTop+.032,z],[spec.summitWidth-.7,.055,.16],
   i%2?palette.marker:palette.trim,false));
 }
 for(const dir of [-1,1]){
  for(let i=0;i<3;i++){
   add(shape('level-'+spec.index+'-summit-edge-'+dir+'-'+i,'sphere',
    [dir*(spec.summitWidth/2-.25),summitTop+.17,-25.4-i*4.5],
    [.34,.34,.34],palette.marker,false));
  }
 }
 for(const direction of [-1,1]){
  add(shape('level-'+spec.index+'-summit-wing-'+direction,'sphere',
   [direction*(spec.summitWidth/2+1.8),summitTop-2,-29.7],
   [3.4,1.8,3.4],palette.island,false));
  add(shape('level-'+spec.index+'-summit-post-'+direction,'cylinder',
   [direction*(spec.summitWidth/2-.55),summitTop+.75,-36.8],
   [.25,1.5,.25],palette.trim,false));
 }
 // A visible capture target. These are NOT hidden collision barriers:
 // the existing horizontal platform remains the only landing collider.
 add(shape('level-'+spec.index+'-magnet-aura','cylinder',
  [0,summitTop+.04,-28.3],[4.8,.06,4.8],palette.trim,false));
 add(shape('level-'+spec.index+'-magnet-ring','cylinder',
  [0,summitTop+.085,-28.3],[3.75,.055,3.75],palette.marker,false));
 add(shape('level-'+spec.index+'-magnet-core','cylinder',
  [0,summitTop+.12,-28.3],[2.5,.055,2.5],palette.island,false));
 // Each biome has a distinctive uphill silhouette, not merely a tint.
 const decorRng=makeRng(spec.decorSeed^0xc7a95f);
 for(let i=0;i<9;i++){
  const distance=7+i*4.5;
  const x=(i%2===0?-1:1)*(7.9+decorRng()*1.9);
  const [px,py,pz]=onSlope(distance,-.55,x);
  const style=spec.biome;
  const type=style==='rocky'?'sphere':
   style==='stormwall'?'cylinder':
   style==='scrapfall'?'box':i%3===0?'cylinder':'sphere';
  const size:[number,number,number]=style==='rocky'?
   [2.1+decorRng(),2.6+decorRng(),2.0]:
   style==='stormwall'?[.45,4.4+decorRng()*3,.45]:
   style==='scrapfall'?[1.55+decorRng(),3.2+decorRng()*1.6,1.4]:
   [2.1+decorRng(),2.1+decorRng(),2.1+decorRng()];
  add(shape('level-'+spec.index+'-'+style+'-landmark-'+i,
   type,[px,py+size[1]/2,pz],size,
   i%3===0?palette.trim:palette.island,false));
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
