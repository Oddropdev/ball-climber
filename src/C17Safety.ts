// C1.7 — keep the successful swipe acceleration and 60° camera, but
// reduce heavy-ball bulldozing and close the summit launch exploit.
import {BASE_PLAYER_MASS,MAX_CHARGE} from './Motion';
export const C17_MASS_PER_CHARGE=.45; // old 1.0 kg/charge
export const C17_MAX_MASS=BASE_PLAYER_MASS+MAX_CHARGE*C17_MASS_PER_CHARGE;
export const SUMMIT_NO_FORWARD_MARGIN=2.6;
export const SUMMIT_RECOVERY_HEIGHT=3.8;
export function climbMassForCharge(charge:number){
 const c=Math.max(0,Math.min(MAX_CHARGE,Math.floor(Number.isFinite(charge)?charge:0)));
 return BASE_PLAYER_MASS+c*C17_MASS_PER_CHARGE;
}
export function shouldBlockFinalSwipe(
 progress:number,length:number,phase:string
){
 return phase!=='running'||progress>=length-SUMMIT_NO_FORWARD_MARGIN;
}
export function isRunawaySummitLaunch(progress:number,length:number,
 y:number,summitTop:number){
 return progress>=length-4.5&&y>summitTop+SUMMIT_RECOVERY_HEIGHT;
}
