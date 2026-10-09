// C1.2: narrow, physical summit landing assist. No invisible teleport,
// no global upward motor and no assistance before the final slope segment.
import type {V3} from './Course';
export const MAGNET_START_PROGRESS=43.5;
export const MAGNET_TARGET_Z=-28.3;
export const MAGNET_MAX_X=4.7;
export type MagnetBody={x:number;y:number;z:number};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function summitMagnetForce(
 progress:number,position:MagnetBody,velocity:MagnetBody,
 summitTop:number,playerRadius:number,mass:number
):V3|null{
 if(progress<MAGNET_START_PROGRESS||progress>58||
  Math.abs(position.x)>MAGNET_MAX_X||
  position.y<summitTop-8||position.y>summitTop+7||
  position.z<-37.3||position.z> -16.5||
  !Number.isFinite(mass)||mass<=0)return null;
 // A damped 3D spring, applied through Bullet to a real dynamic body.
 // Compensate world gravity locally, then brake its vertical launch and
 // sideways drift while pulling it onto the *solid* horizontal deck.
 const targetY=summitTop+playerRadius+.12;
 const ax=clamp(-position.x*9-velocity.x*5,-24,24);
 const ay=clamp((targetY-position.y)*13-velocity.y*5+22,-14,85);
 const az=clamp((MAGNET_TARGET_Z-position.z)*8-velocity.z*4.5,-32,32);
 return [ax*mass,ay*mass,az*mass];
}
