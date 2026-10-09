// C1.3 mobile game-feel tuning. Infinite mode only; original C0.7 is intact.
import {slopePosition} from './Course';

export const C13_SIDE_IMPULSE=6.2;
export const C13_LOW_CAMERA_DROP=2.35;
export const C13_FALL_DEPTH=8.0;
export const C13_MAX_COMPOUND_FURNITURE=9;

export function sidewaysControl(charge:number){
 const safe=Number.isFinite(charge)?Math.max(0,Math.min(4,charge)):0;
 return 1-.055*safe; // 78% at max charge vs previous 58%.
}
export function sideDodgeImpulse(direction:-1|1,charge:number,velocityX:number){
 const countersteer=velocityX*direction<-.5?
  Math.min(1.5,Math.abs(velocityX)*.27):0;
 return direction*(C13_SIDE_IMPULSE*sidewaysControl(charge)+countersteer);
}
export function shouldRecoverInfinite(pos:{x:number;y:number;z:number}){
 if(![pos.x,pos.y,pos.z].every(Number.isFinite))return true;
 const {normalDistance,progress}=slopePosition(pos);
 // The player may visibly tumble off the side instead of being teleported
 // at x=5.9. Recover only after dropping well below the slope plane.
 return pos.y<-10||progress< -8||normalDistance< -C13_FALL_DEPTH||
  (Math.abs(pos.x)>12&&normalDistance< -3);
}
export function lowCameraDrop(blend:number,enabled:boolean){
 if(!enabled)return 0;
 const t=Math.max(0,Math.min(1,blend));
 // The final platform retains its original high camera and legible UI.
 return -C13_LOW_CAMERA_DROP*(1-t*.4);
}

export function closeChaseOffset(blend:number,enabled:boolean){
 const t=Math.max(0,Math.min(1,blend));
 // C1.4 is lower and closer but eases back on the magnetic summit.
 return enabled?{vertical:-.95*(1-t*.42),
  behind:-2.25*(1-t*.48),fov:58}:
  {vertical:0,behind:0,fov:61};
}
