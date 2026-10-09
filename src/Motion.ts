// C0.5 game-feel contract. Physical time remains 1:1; only hazards
// receive mass-proportional uphill drag while the real player uses impulses.
export const PLAYER_SWIPE_IMPULSE=11.0;
export const PLAYER_CHAIN_INCREMENT=.95;
export const PLAYER_MAX_FORWARD_SPEED=17.0;
export const PLAYER_ANTISLIDE_FORCE=6.5;
export const PLAYER_SWIPE_COOLDOWN=.13;
export const HAZARD_RELEASE_SPEED=2.8;
export const HAZARD_GRAVITY_RELIEF=.48;
export const HAZARD_AIR_DRAG=.65;
export const HAZARD_MAX_AGE_SECONDS=22;
export const GRAVITY=12;
export const SLOPE_SIN=Math.sqrt(3)/2;
export function swipeImpulse(chain:number){
 return PLAYER_SWIPE_IMPULSE+Math.min(4,Math.max(0,chain))*PLAYER_CHAIN_INCREMENT;
}
// Tangential (up-slope) counter-force, not a kinematic velocity override.
// Drag works on ACTUAL downhill speed and preserves mass-based collisions.
// At rest gravity wins: hazards still roll down and reach the player.
export function hazardBrakingForce(mass:number,downhillSpeed:number){
 if(!Number.isFinite(mass)||mass<=0)throw Error('hazard mass must be positive');
 return mass*(GRAVITY*SLOPE_SIN*HAZARD_GRAVITY_RELIEF+
   HAZARD_AIR_DRAG*Math.max(0,downhillSpeed));
}
export function integrateDownhillSpeed(v:number,dt:number,slow=true){
 const gravity=GRAVITY*SLOPE_SIN;
 const brake=slow?hazardBrakingForce(1,v):0;
 return Math.max(0,v+(gravity-brake)*dt);
}
