import {furnitureOpening,furnitureParts} from '../src/Furniture';
import {blocksCameraSegment} from '../src/Visibility';
import {test,expect} from 'vitest';
import {SLOPE_DEGREES,SLOPE_LENGTH,SIN_SLOPE,COS_SLOPE,
 LEVEL_HEIGHT,UP,NORMAL,onSlope,slopePosition,nearestCheckpoint,
 shouldRecover,makeWave,PATTERNS,massFor,MAX_ROCKS,MAX_LOOT,ACTIVE_CAP
} from '../src/Course';
test('exact real 60 degree ramp, reversible XYZ projection and fall risk',()=>{
 expect(SLOPE_DEGREES).toBe(60);
 expect(SLOPE_LENGTH).toBe(48);
 expect(LEVEL_HEIGHT).toBeCloseTo(48*Math.sqrt(3)/2,8);
 expect(UP[1]).toBeCloseTo(Math.sqrt(3)/2,8);
 expect(NORMAL[2]).toBeCloseTo(Math.sqrt(3)/2,8);
 expect(SIN_SLOPE).toBeCloseTo(Math.sqrt(3)/2,8);
 expect(COS_SLOPE).toBeCloseTo(.5,8);
 for(const d of [0,2,10,20,40,48]){
  const [x,y,z]=onSlope(d);
  expect(slopePosition({x,y,z}).progress).toBeCloseTo(d,8);
  expect(shouldRecover({x,y,z})).toBe(false);
 }
 expect(shouldRecover({x:7,y:20,z:0})).toBe(true);
 expect(shouldRecover({x:0,y:NaN,z:0})).toBe(true);
 expect(nearestCheckpoint(27)).toBe(26);
});
test('12 genuinely distinct motifs in randomized, reproducible shuffled bags',()=>{
 const waves=Array.from({length:48},(_,i)=>makeWave(1719,i));
 for(let i=0;i<48;i++)expect(makeWave(1719,i)).toEqual(waves[i]);
 expect(new Set(waves.slice(0,12).map(w=>w.pattern)).size).toBe(12);
 expect(new Set(waves.slice(12,24).map(w=>w.pattern)).size).toBe(12);
 expect(waves.some((w,i)=>w.pattern!==makeWave(1720,i).pattern)).toBe(true);
 expect(PATTERNS).toHaveLength(12);
 for(const w of waves){
  expect(w.items.length).toBeGreaterThanOrEqual(3);
  expect(w.items.length).toBeLessThanOrEqual(12);
  expect(w.items.every(i=>Math.abs(i.lane)<=4.35)).toBe(true);
  expect(w.items.every(i=>i.mass>0)).toBe(true);
 }
 const train=waves.find(w=>w.pattern==='train')!;
 const lootTrain=waves.find(w=>w.pattern==='loot-train')!;
 expect(train.items[2]!.delay).toBeGreaterThan(train.items[0]!.delay+.3);
 expect(lootTrain.items.every(i=>i.kind==='loot')).toBe(true);
 expect(lootTrain.items[3]!.delay).toBeGreaterThan(lootTrain.items[0]!.delay+.5);
 const row=waves.find(w=>w.pattern==='row')!;
 expect(row.items.every(i=>i.delay<.08)).toBe(true);
 expect(row.items.at(-1)!.lane-row.items[0]!.lane).toBeGreaterThan(6);
});
test('mass scales with object volume; rare giant is genuinely heavy, 50+50 caps',()=>{
 const waves=Array.from({length:48},(_,i)=>makeWave(1719,i));
 const big=waves.flatMap(w=>w.items).filter(i=>i.giant);
 expect(big.length).toBeGreaterThan(0);
 expect(big.some(i=>i.size[0]>=2.5&&i.size[1]>=2)).toBe(true);
 expect(big.every(i=>i.kind==='rock')).toBe(true);
 expect(big.some(i=>i.mass>30)).toBe(true);
 expect(massFor('rock',[4,4,4],true)).toBeGreaterThan(massFor('rock',[1,1,1]));
 expect(massFor('rock',[8,8,8],true)).toBeLessThanOrEqual(260);
 expect(massFor('loot',[.5,.5,.5])).toBeLessThan(2);
 expect(MAX_ROCKS).toBe(50);
 expect(MAX_LOOT).toBe(50);
 expect(ACTIVE_CAP).toBe(100);
});

test('C0.4: furniture is physically hollow and real player fits under table/chair',()=>{
 const parts=Array.from({length:120},(_,i)=>makeWave(1719,i)).flatMap(w=>w.items);
 const furniture=parts.filter(p=>p.shape==='table'||p.shape==='chair');
 expect(furniture.length).toBeGreaterThan(10);
 for(const item of furniture){
  const colliders=furnitureParts(item);
  expect(colliders.length).toBe(item.shape==='table'?5:6);
  expect(colliders.filter(x=>x.name.includes('leg')||x.name.includes('support'))).toHaveLength(4);
  expect(furnitureOpening(item).height).toBeGreaterThan(1.16);
  expect(furnitureOpening(item).width).toBeGreaterThan(2);
 }
 const light=parts.filter(p=>p.shape==='light');
 expect(light.length).toBeGreaterThan(5);
 expect(light.every(x=>x.mass===.14)).toBe(true);
 expect(parts.some(x=>x.shape==='table')).toBe(true);
 expect(parts.some(x=>x.shape==='chair')).toBe(true);
});
test('C0.4: soft body density below 50+50 hard cap; reliable visual-only occlusion ray',async()=>{
 const {HAZARD_SOFT_TARGET,LOOT_SOFT_TARGET}=await import('../src/Course');
 expect(HAZARD_SOFT_TARGET).toBeLessThan(30);
 expect(LOOT_SOFT_TARGET).toBeLessThan(40);
 expect(blocksCameraSegment([0,3,12],[0,1,0],[0,2,6],1.2)).toBe(true);
 expect(blocksCameraSegment([0,3,12],[0,1,0],[4,2,6],1.2)).toBe(false);
 expect(blocksCameraSegment([0,3,12],[0,1,0],[0,2,-6],2)).toBe(false);
});
