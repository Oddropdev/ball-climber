import {test,expect} from 'vitest';
import {levelSpec} from '../src/LevelSpec';
import {PLAYER_RADIUS,onSlope,slopePosition} from '../src/Course';
import {BASE_DECK_TOP,BASE_DECK_FRONT_Z,BASE_DECK_BACK_Z,
 BASE_DECK_WIDTH,BASE_GUARD_HEIGHT,HAZARD_KILL_PROGRESS,
 START_PAD_BACK_Z,START_PAD_WIDTH,
 baseSpawn,shouldPurgeBaseHazard,isInsideBaseCamp,needsBaseSafetyCatch,
 baseCameraTransition} from '../src/BaseCamp';
import {rotorSpecs,pairedRotorClearance,rotorParts} from '../src/Rotors';
import {steepSlopeCamera} from '../src/InfiniteGeometry';
test('C1.6: base resting floor has slope join, guards and no hazard crossing',()=>{
 expect(BASE_DECK_TOP).toBeCloseTo(.9);
 expect(BASE_DECK_FRONT_Z).toBeGreaterThanOrEqual(0);
 expect(BASE_DECK_BACK_Z).toBeGreaterThan(7);
 expect(BASE_DECK_WIDTH).toBeGreaterThanOrEqual(10);
 expect(BASE_GUARD_HEIGHT).toBeGreaterThan(3);
 const spawn=baseSpawn();
 expect(spawn[1]).toBeGreaterThan(BASE_DECK_TOP+PLAYER_RADIUS);
 expect(spawn[2]).toBeGreaterThan(3);
 expect(spawn[2]).toBeGreaterThan(BASE_DECK_BACK_Z);
 expect(spawn[2]).toBeLessThan(START_PAD_BACK_Z);
 expect(START_PAD_WIDTH).toBeLessThan(BASE_DECK_WIDTH);
 expect(isInsideBaseCamp({x:spawn[0],y:spawn[1],z:spawn[2]})).toBe(true);
 expect(needsBaseSafetyCatch({x:0,y:spawn[1],z:spawn[2]})).toBe(false);
 expect(needsBaseSafetyCatch({x:6,y:spawn[1],z:spawn[2]})).toBe(true);
 // A true threshold along the 60 degree slope, not a fixed world Y.
 expect(HAZARD_KILL_PROGRESS).toBeCloseTo(1.25);
 for(const p of [1.20,1.25,0,-3]){
  const q=onSlope(p);
  expect(shouldPurgeBaseHazard({x:q[0],y:q[1],z:q[2]})).toBe(true);
 }
 for(const p of [1.4,3,10,56]){
  const q=onSlope(p);
  expect(shouldPurgeBaseHazard({x:q[0],y:q[1],z:q[2]})).toBe(false);
 }
 expect(shouldPurgeBaseHazard({x:NaN,y:0,z:0})).toBe(true);
});
test('C1.6: short special pad camera never tunnels below real floor',()=>{
 const resting=baseSpawn();
 const t=baseCameraTransition({x:0,y:resting[1],z:resting[2]});
 expect(t.slopeBlend).toBe(0);
 expect(t.camera[1]).toBeGreaterThan(BASE_DECK_TOP+1);
 expect(t.camera[2]).toBeGreaterThan(BASE_DECK_BACK_Z); // new unobscured C1.7 camera above rear guard
 const mid=onSlope(4.5);
 expect(baseCameraTransition({x:mid[0],y:mid[1],z:mid[2]}).slopeBlend).toBeCloseTo(.5);
 const uphill=onSlope(8);
 expect(baseCameraTransition({x:uphill[0],y:uphill[1],z:uphill[2]}).slopeBlend).toBe(1);
 // Past 6m original user-approved C1.5 pitch/camera calculations still apply.
 expect(steepSlopeCamera({x:uphill[0],y:uphill[1],z:uphill[2]}).fov).toBe(65);
});
test('C1.6: 1000 seeded opposing rotor pairs have a permanent 3m+ safe crossing corridor',()=>{
 let pairs=0;
 for(let i=1;i<=1000;i++){
  const spec=levelSpec(i),rotors=rotorSpecs(i,spec.decorSeed);
  const width=pairedRotorClearance(rotors);
  expect(rotors).toEqual(rotorSpecs(i,spec.decorSeed));
  if(rotors[0]?.pairRole==='left'){
   pairs++;
   expect(width).not.toBeNull();
   expect(width!).toBeGreaterThan(3.0);
   expect(width!).toBeGreaterThan(2*PLAYER_RADIUS+1.8);
   expect(rotors).toHaveLength(2);
   expect(rotors[0]!.radius).toBeGreaterThanOrEqual(1.65);
   expect(rotors[0]!.radius).toBeLessThan(1.84);
   expect(rotors[1]!.radius).toBe(rotors[0]!.radius);
   expect(rotors[0]!.direction).toBe(-rotors[1]!.direction);
   for(const rotor of rotors)expect(rotorParts(rotor)).toHaveLength(2);
  }else{
   expect(width).toBeNull();
  }
 }
 expect(pairs).toBeGreaterThan(200);
});
