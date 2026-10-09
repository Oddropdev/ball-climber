// C1.4 — clutter-free summit. The only fixed physical surface here is
// the real horizontal landing deck; rotating machines are owned separately.
import {Entity,type StandardMaterial} from 'playcanvas';
import {onSlope,SLOPE_LENGTH,SLAB_THICKNESS} from './Course';
import type {Shape} from './Physics';
import type {LevelSpec} from './LevelSpec';
export function summitSurfaceY(){
 return onSlope(SLOPE_LENGTH,SLAB_THICKNESS/2)[1];
}
export function buildClimbLevel(spec:LevelSpec,shape:Shape,
 palette:{road:StandardMaterial;trim:StandardMaterial;
  island:StandardMaterial;marker:StandardMaterial}){
 const nodes:Entity[]=[];
 const add=(e:Entity)=>{nodes.push(e);return e;};
 const summitTop=summitSurfaceY();
 const platform=add(shape('level-'+spec.index+'-summit-platform','box',
  [0,summitTop-.38,-30.5],[spec.summitWidth,.76,14],
  palette.road,'static'));
 for(let i=0;i<5;i++){
  const z=-25.2-i*2.65;
  add(shape('level-'+spec.index+'-summit-runout-'+i,'box',
   [0,summitTop+.032,z],[spec.summitWidth-.7,.055,.16],
   i%2?palette.marker:palette.trim,false));
 }
 for(const direction of [-1,1]){
  // Only narrow end posts. Previous large spheres and roadside physical
  // boulders obstructed both view and steering; neither is generated now.
  add(shape('level-'+spec.index+'-summit-post-'+direction,'cylinder',
   [direction*(spec.summitWidth/2-.55),summitTop+.75,-36.8],
   [.25,1.5,.25],palette.trim,false));
 }
 add(shape('level-'+spec.index+'-magnet-aura','cylinder',
  [0,summitTop+.04,-28.3],[4.8,.06,4.8],palette.trim,false));
 add(shape('level-'+spec.index+'-magnet-ring','cylinder',
  [0,summitTop+.085,-28.3],[3.75,.055,3.75],palette.marker,false));
 add(shape('level-'+spec.index+'-magnet-core','cylinder',
  [0,summitTop+.12,-28.3],[2.5,.055,2.5],palette.island,false));
 return {
  index:spec.index,summit:platform,summitTop,
  physicalSideObstacles:0,physicalEntities:1,
  get sceneEntities(){return nodes.length;},
  dispose(){for(const e of nodes)e.destroy();nodes.length=0;}
 };
}
export type ClimbLevel=ReturnType<typeof buildClimbLevel>;
