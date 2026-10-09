import {test,expect} from 'vitest';
import {chairGauntlet} from '../src/ChairGauntlet';
import {levelSpec} from '../src/LevelSpec';
import {furnitureOpening,furnitureParts} from '../src/Furniture';
import {sidewaysControl,sideDodgeImpulse,shouldRecoverInfinite,
 lowCameraDrop,C13_MAX_COMPOUND_FURNITURE} from '../src/ClimbFeel';
import {onSlope,slopePosition,shouldRecover} from '../src/Course';
test('C1.3: heavier ball still has useful lateral steering and countersteer',()=>{
 expect(sidewaysControl(0)).toBe(1);
 expect(sidewaysControl(4)).toBeCloseTo(.78);
 expect(sidewaysControl(4)).toBeGreaterThan(.58);
 expect(sideDodgeImpulse(-1,4,0)).toBeLessThan(-4.7);
 expect(sideDodgeImpulse(-1,4,3)).toBeLessThan(sideDodgeImpulse(-1,4,0));
 expect(sideDodgeImpulse(1,0,-2)).toBeGreaterThan(sideDodgeImpulse(1,0,0));
 expect(sidewaysControl(500)).toBe(sidewaysControl(4));
 expect(sidewaysControl(NaN)).toBe(sidewaysControl(0));
});
test('C1.3: falls have visible depth and are distinct from original C0.7 rules',()=>{
 const justOff=onSlope(25,-.55,7.6);
 expect(shouldRecover(justOff)).toBe(true);
 expect(shouldRecoverInfinite({x:justOff[0],y:justOff[1],z:justOff[2]})).toBe(false);
 const moreBelow=onSlope(25,-9,7.6);
 expect(shouldRecoverInfinite({x:moreBelow[0],y:moreBelow[1],z:moreBelow[2]})).toBe(true);
 expect(shouldRecoverInfinite({x:NaN,y:0,z:0})).toBe(true);
 expect(slopePosition({x:moreBelow[0],y:moreBelow[1],z:moreBelow[2]}).progress)
  .toBeCloseTo(25);
});
test('C1.3: new low camera mode always sits lower than classic baseline',()=>{
 expect(lowCameraDrop(0,false)).toBe(0);
 expect(lowCameraDrop(1,false)).toBe(0);
 expect(lowCameraDrop(0,true)).toBeCloseTo(-2.35);
 expect(lowCameraDrop(.5,true)).toBeLessThan(-1.5);
 expect(lowCameraDrop(1,true)).toBeLessThan(-1);
});
test('C1.3: 1000-level seeded furniture gauntlet is bounded and genuinely open',()=>{
 const sigs=new Set<string>();
 for(let i=1;i<=1000;i++){
  const spec=levelSpec(i);
  const a=chairGauntlet(spec.waveSeed,spec.biome);
  expect(a).toEqual(chairGauntlet(spec.waveSeed,spec.biome));
  expect(a).toHaveLength(8);
  expect(a.filter(x=>x.item.shape==='chair')).toHaveLength(5);
  expect(a.filter(x=>x.item.shape==='table')).toHaveLength(1);
  expect(a.filter(x=>x.item.kind==='loot')).toHaveLength(2);
  expect(a.every(x=>x.progress>=7&&x.progress<=43)).toBe(true);
  expect(a.every(x=>Math.abs(x.item.lane)<3)).toBe(true);
  for(const {item} of a.filter(x=>x.item.kind==='rock')){
   expect(item.mass).toBeGreaterThan(0);
   expect(furnitureParts(item)).toHaveLength(item.shape==='chair'?6:5);
   expect(furnitureOpening(item).width).toBeGreaterThan(1.3);
  }
  sigs.add(a.map(x=>x.item.lane).join('/'));
 }
 expect(sigs.size).toBeGreaterThan(950);
 expect(C13_MAX_COMPOUND_FURNITURE).toBeLessThanOrEqual(9);
});
