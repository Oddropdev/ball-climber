// C1.6 — protected 60°-to-flat rest camp and real hazard exclusion line.
// Only Infinite Mode instantiates this; C0.7 remains untouched.
// The platform/rails are STATIC Bullet bodies, not invisible no-fall hacks.
import {Entity,type StandardMaterial} from 'playcanvas';
import {PLAYER_RADIUS,SLOPE_DEGREES,SLAB_THICKNESS,
 onSlope,slopePosition,type V3} from './Course';
import type {Shape} from './Physics';
export const BASE_DECK_TOP=.9;
export const BASE_DECK_FRONT_Z=.1;
export const BASE_DECK_BACK_Z=7.4;
export const BASE_DECK_WIDTH=10.4;
export const BASE_GUARD_HEIGHT=3.4;
export const HAZARD_KILL_PROGRESS=1.25;
export const BASE_SPAWN_Z=4.0;
export function baseSpawn():V3{
 return [0,BASE_DECK_TOP+PLAYER_RADIUS+.055,BASE_SPAWN_Z];
}
export function shouldPurgeBaseHazard(pos:{x:number;y:number;z:number}){
 if(![pos.x,pos.y,pos.z].every(Number.isFinite))return true;
 return slopePosition(pos).progress<=HAZARD_KILL_PROGRESS;
}
export function isInsideBaseCamp(pos:{x:number;y:number;z:number}){
 return pos.z>=BASE_DECK_FRONT_Z-.2&&
  pos.z<=BASE_DECK_BACK_Z+.25&&
  pos.y>=BASE_DECK_TOP-1.4&&pos.y<=BASE_DECK_TOP+4.5;
}
export function needsBaseSafetyCatch(pos:{x:number;y:number;z:number}){
 // Extra insurance for extreme Bullet impulses over/behind the rail.
 // Leave the uphill opening unguarded once the ball is on the slope.
 const nearCamp=pos.z>BASE_DECK_FRONT_Z-1.1&&
  pos.z<BASE_DECK_BACK_Z+3.0;
 if(!nearCamp)return false;
 return Math.abs(pos.x)>BASE_DECK_WIDTH/2+.72||
  pos.z>BASE_DECK_BACK_Z+.65||pos.y<BASE_DECK_TOP-.85;
}

// Rest pose prevents the steep chase camera from clipping UNDER the
// horizontal deck. From slope progress 3m→6m the original C1.5 uphill
// camera is restored exactly, including its aim, pitch and follow.
export function baseCameraTransition(pos:{x:number;y:number;z:number}){
 const progress=slopePosition(pos).progress;
 const slopeBlend=Math.max(0,Math.min(1,(progress-3)/3));
 // Place the camera just ABOVE the rear rail so it can see the ball
 // without clipping the pad, looking back UP the 60-degree slope.
 const camera:V3=[pos.x*.78,BASE_DECK_TOP+5.4,
  pos.z+5.8];
 const focus:V3=[pos.x*.94,pos.y+.45,pos.z-1.5];
 return {slopeBlend,camera,focus};
}
export function buildBaseCamp(shape:Shape,
 mats:{road:StandardMaterial;trim:StandardMaterial;marker:StandardMaterial}){
 const nodes:Entity[]=[];
 const add=(e:Entity)=>{nodes.push(e);return e;};
 const depth=BASE_DECK_BACK_Z-BASE_DECK_FRONT_Z;
 const centerZ=(BASE_DECK_BACK_Z+BASE_DECK_FRONT_Z)/2;
 const thickness=.85;
 const deck=add(shape('safe-base-floor','box',
  [0,BASE_DECK_TOP-thickness/2,centerZ],
  [BASE_DECK_WIDTH,thickness,depth],mats.road,'static'));
 const sideX=BASE_DECK_WIDTH/2+.25;
 for(const side of [-1,1]){
  add(shape('safe-base-side-guard-'+side,'box',
   [side*sideX,BASE_DECK_TOP+BASE_GUARD_HEIGHT/2,centerZ],
   [.5,BASE_GUARD_HEIGHT,depth+.5],mats.trim,'static'));
  // Short shoulder wing connecting the guard to the slope, without
  // blocking the central (width 8.5m) path uphill.
  add(shape('safe-base-front-wing-'+side,'box',
   [side*4.77,BASE_DECK_TOP+BASE_GUARD_HEIGHT/2,BASE_DECK_FRONT_Z],
   [1.25,BASE_GUARD_HEIGHT,.58],mats.trim,'static'));
 }
 add(shape('safe-base-rear-guard','box',
  [0,BASE_DECK_TOP+BASE_GUARD_HEIGHT/2,BASE_DECK_BACK_Z+.24],
  [BASE_DECK_WIDTH+1.0,BASE_GUARD_HEIGHT,.55],mats.trim,'static'));
 // Fixed no-collision floor markings, not fake transparent guardrails.
 for(let i=0;i<3;i++){
  add(shape('safe-base-runway-'+i,'box',
   [0,BASE_DECK_TOP+.025,2+i*1.65],
   [BASE_DECK_WIDTH-1.5,.04,.17],mats.marker,false));
 }
 const strip=onSlope(HAZARD_KILL_PROGRESS,SLAB_THICKNESS/2+.065);
 add(shape('base-hazard-purge-warning','box',strip,
  [BASE_DECK_WIDTH-.6,.035,.25],mats.marker,false,SLOPE_DEGREES));
 return {
  deck, get entityCount(){return nodes.length;},
  get physicalCount(){return 6;},
  dispose(){for(const node of nodes)node.destroy();nodes.length=0;}
 };
}
export type BaseCamp=ReturnType<typeof buildBaseCamp>;
