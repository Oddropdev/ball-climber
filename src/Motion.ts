// C0.5 game-feel contract. Physical time remains 1:1; only hazards
// receive mass-proportional uphill drag while the real player uses impulses.
export const PLAYER_SWIPE_IMPULSE=10.7;
export const PLAYER_CHAIN_INCREMENT=.55;
export const PLAYER_MAX_FORWARD_SPEED=12.5;
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

// C0.6: swipe-to-weight is a REAL dynamic Bullet mass, not fake collision
// damage. Weight helps push medium physics objects without free speed.
export const BASE_PLAYER_MASS=1.4;
export const MASS_PER_CHARGE=1.0;
export const MAX_CHARGE=4;
export const MAX_PLAYER_MASS=BASE_PLAYER_MASS+MASS_PER_CHARGE*MAX_CHARGE;
export const CHARGE_CHAIN_WINDOW=1.05;
export const CHARGE_DECAY_DELAY=1.7;
export const CHARGE_DECAY_STEP=.75;
export function massForCharge(level:number){
 return BASE_PLAYER_MASS+MASS_PER_CHARGE*Math.max(0,Math.min(MAX_CHARGE,Math.floor(level)));
}
export function chargedBySwipe(previousLevel:number,secondsSincePrevious:number){
 return secondsSincePrevious<=CHARGE_CHAIN_WINDOW?
  Math.min(MAX_CHARGE,previousLevel+1):1;
}
export function chargeAfterIdle(peakLevel:number,secondsSinceSwipe:number){
 if(secondsSinceSwipe<CHARGE_DECAY_DELAY)return peakLevel;
 const reductions=1+Math.floor((secondsSinceSwipe-CHARGE_DECAY_DELAY)/CHARGE_DECAY_STEP);
 return Math.max(0,peakLevel-reductions);
}
export function scaleImpulseForMass(impulseAtBaseMass:number,mass:number){
 return impulseAtBaseMass*mass/BASE_PLAYER_MASS;
}
export function cappedForwardSpeed(speed:number,limit=PLAYER_MAX_FORWARD_SPEED){
 return Math.min(speed,limit);
}
