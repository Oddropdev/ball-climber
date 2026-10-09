import {test,expect} from 'vitest';
import {SLOPE_DEGREES,SLOPE_LENGTH,SIN_SLOPE,COS_SLOPE,PLAYER_RADIUS,
 SLAB_THICKNESS,LEVEL_HEIGHT,NORMAL,UP,onSlope,slopePosition,
 makeWave,nearestCheckpoint,shouldRecover,ACTIVE_CAP} from '../src/Course';
test('exact 60° in real XYZ coordinates, stable roll direction and 48m short course',()=>{
 expect(SLOPE_DEGREES).toBe(60);
 expect(SLOPE_LENGTH).toBe(48);
 expect(LEVEL_HEIGHT).toBeCloseTo(48*Math.sqrt(3)/2,8);
 expect(UP[1]).toBeCloseTo(Math.sqrt(3)/2,8);
 expect(UP[2]).toBeCloseTo(-.5,8);
 expect(NORMAL[1]).toBeCloseTo(.5,8);
 expect(NORMAL[2]).toBeCloseTo(Math.sqrt(3)/2,8);
 expect(COS_SLOPE).toBeCloseTo(.5,8);
 expect(SIN_SLOPE).toBeCloseTo(Math.sqrt(3)/2,8);
 for(const progress of [0,2,10,18,33,48]){
  const [x,y,z]=onSlope(progress);
  expect(x).toBe(0);
  expect(slopePosition({x,y,z}).progress).toBeCloseTo(progress,8);
  expect(slopePosition({x,y,z}).normalDistance).toBeCloseTo(SLAB_THICKNESS/2+PLAYER_RADIUS+.025,8);
 }
});
test('real failure boundaries and checkpoints do not erase fall risk',()=>{
 expect(nearestCheckpoint(2)).toBe(2);
 expect(nearestCheckpoint(27)).toBe(26);
 expect(shouldRecover({x:0,y:onSlope(10)[1],z:onSlope(10)[2]})).toBe(false);
 expect(shouldRecover({x:8,y:onSlope(10)[1],z:onSlope(10)[2]})).toBe(true);
 expect(shouldRecover({x:0,y:NaN,z:0})).toBe(true);
 expect(shouldRecover({x:0,y:-10,z:0})).toBe(true);
});
test('unlimited deterministic waves include true rectangles, spheres, rows and trains',()=>{
 for(const id of [0,1,2,3,4,5,100,999999]){
  const a=makeWave(1719,id),b=makeWave(1719,id),other=makeWave(999,id);
  expect(a).toEqual(b);
  expect(a).not.toEqual(other);
  expect(a.items.length).toBeGreaterThanOrEqual(2);
  expect(a.items.length).toBeLessThanOrEqual(5);
  expect(a.items.every(x=>x.kind==='loot'||x.kind==='rock')).toBe(true);
  expect(a.items.every(x=>Math.abs(x.lane)<=3.7)).toBe(true);
 }
 const waves=Array.from({length:50},(_,i)=>makeWave(1719,i));
 expect(new Set(waves.map(x=>x.pattern)).size).toBe(6);
 expect(waves.some(w=>w.items.some(x=>x.kind==='rock'&&x.shape==='box'))).toBe(true);
 expect(waves.some(w=>w.items.some(x=>x.kind==='loot'&&x.shape==='box'))).toBe(true);
 expect(waves.some(w=>w.pattern==='row'&&w.items.every(x=>Math.abs(x.distanceOffset)<.15))).toBe(true);
 expect(waves.some(w=>w.pattern==='train'&&w.items[1]!.distanceOffset>w.items[0]!.distanceOffset)).toBe(true);
 expect(ACTIVE_CAP).toBeLessThanOrEqual(48);
});
