import {test,expect} from 'vitest';
import {levelSpec,validateLevelSpec} from '../src/LevelSpec';
import {SLOPE_LENGTH,onSlope,slopePosition} from '../src/Course';
import {INFINITE_SLOPE_LENGTH,summitCenterZ,summitLandingZ,
 magnetCoordinates,steepSlopeCamera,cameraPitchDegrees} from '../src/InfiniteGeometry';
import {summitSurfaceY} from '../src/ClimbLevel';
import {rotorSpecs} from '../src/Rotors';

test('C1.5: all 1000 Infinite Mode levels use a real extended 60m 60-degree ramp',()=>{
 expect(SLOPE_LENGTH).toBe(48); // legacy mode unchanged
 expect(INFINITE_SLOPE_LENGTH).toBe(60);
 expect(INFINITE_SLOPE_LENGTH/SLOPE_LENGTH).toBe(1.25);
 expect(summitCenterZ()).toBeCloseTo(-36.5);
 expect(summitLandingZ()).toBeCloseTo(-34.3);
 expect(summitSurfaceY()).toBeGreaterThan(52);
 const magnet=magnetCoordinates();
 expect(magnet.startProgress).toBeCloseTo(55.5);
 expect(magnet.targetZ).toBeCloseTo(-34.3);
 for(let index=1;index<=1000;index++){
  const spec=levelSpec(index);
  expect(validateLevelSpec(spec)).toBe(true);
  expect(spec.slopeLength).toBe(60);
  const summit=onSlope(spec.slopeLength);
  expect(slopePosition({x:summit[0],y:summit[1],z:summit[2]}).progress)
   .toBeCloseTo(60);
 }
});

test('C1.5: the ball is followed CLOSE from below and BEHIND, looking 60 degrees uphill',()=>{
 for(const d of [2,11,29,50,58]){
  const ball=onSlope(d);
  const pose=steepSlopeCamera({x:ball[0],y:ball[1],z:ball[2]});
  const camera=pose.camera,target=pose.target;
  expect(camera[1]).toBeLessThan(ball[1]-3);
  expect(camera[2]).toBeGreaterThan(ball[2]+3);
  const distance=Math.hypot(camera[0]-ball[0],camera[1]-ball[1],
   camera[2]-ball[2]);
  expect(distance).toBeGreaterThan(4);
  expect(distance).toBeLessThan(5.7);
  expect(target[1]).toBeGreaterThan(ball[1]+7);
  expect(target[2]).toBeLessThan(ball[2]-2);
  expect(cameraPitchDegrees(camera,target)).toBeGreaterThan(58);
  expect(cameraPitchDegrees(camera,target)).toBeLessThan(70);
 }
});
test('C1.5: mirrored side machines sweep INWARD over center at top, never add unbounded rotors',()=>{
 let paired=0,central=0;
 for(let index=1;index<=1000;index++){
  const s=levelSpec(index);
  const r=rotorSpecs(index,s.decorSeed);
  expect(r).toEqual(rotorSpecs(index,s.decorSeed));
  expect(r.length).toBeLessThanOrEqual(2);
  if(index>=5&&index%4===1){
   paired++;
   expect(r).toHaveLength(2);
   expect(r.map(x=>x.pairRole)).toEqual(['left','right']);
   expect(r.map(x=>x.lane)).toEqual([-3.65,3.65]);
   expect(r.map(x=>x.direction)).toEqual([-1,1]);
   expect(r[0]!.progress).toBe(r[1]!.progress);
   expect(r[0]!.speed).toBe(r[1]!.speed);
   expect(r[0]!.radius).toBe(r[1]!.radius);
   expect(r[0]!.phase).toBeCloseTo(-r[1]!.phase);
   expect(r[0]!.kind).toBe('cross');
  }else if(r.length)central++;
 }
 expect(paired).toBeGreaterThan(200);
 expect(central).toBeGreaterThan(500);
});
