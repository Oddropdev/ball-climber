// C1.8 cinematic preview uses the EXISTING renderer/camera; no heavy video
// decode or new download. 3.8 seconds, one tap immediately skips.
import {onSlope,UP,NORMAL,type V3} from './Course';
import {INFINITE_SLOPE_LENGTH,steepSlopeCamera} from './InfiniteGeometry';
export const INTRO_SECONDS=3.8;
export type IntroPose={camera:V3;target:V3;fov:number;label:string};
function ease(t:number){return t*t*(3-2*t);}
function mix(a:number,b:number,t:number){return a+(b-a)*t;}
function pointsAt(progress:number):IntroPose{
 const [x,y,z]=onSlope(progress);
 // Elevated side offset reveals frames and weaving furniture in advance.
 const camera:V3=[7.2,y-UP[1]*7+NORMAL[1]*7,
  z-UP[2]*7+NORMAL[2]*7];
 const look=onSlope(Math.min(60,progress+8),3);
 return {camera,target:[look[0],look[1],look[2]],
  fov:62,label:'COURSE PREVIEW'};
}
export function introPose(seconds:number,home:V3):IntroPose{
 const t=Math.max(0,Math.min(1,seconds/INTRO_SECONDS));
 const waypoints=[
  {...pointsAt(INFINITE_SLOPE_LENGTH-5),time:0},
  {...pointsAt(38),time:.30},
  {...pointsAt(17),time:.63},
  {...pointsAt(5),time:.86},
  {camera:[home[0],home[1]+5.4,home[2]+5.8] as V3,
   target:[home[0],home[1]+.45,home[2]-1.5] as V3,
   fov:65,label:'READY · SWIPE UP',time:1}
 ];
 const next=waypoints.findIndex((p,i)=>i>0&&t<=p.time);
 const end=Math.max(1,next);
 const a=waypoints[end-1]!,b=waypoints[end]!;
 const lerp=ease((t-a.time)/(b.time-a.time));
 const blend=(q:V3,r:V3):V3=>[
  mix(q[0],r[0],lerp),mix(q[1],r[1],lerp),mix(q[2],r[2],lerp)
 ];
 return {camera:blend(a.camera,b.camera),target:blend(a.target,b.target),
  fov:mix(a.fov,b.fov,lerp),label:a.label};
}
export function shouldShowIntro(level:number,shown:number,
 enabled:boolean){return enabled&&level!==shown;}
