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
  expect(w.items.length).toBeGreaterThanOrEqual(2);
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

import {PLAYER_SWIPE_IMPULSE,PLAYER_CHAIN_INCREMENT,PLAYER_MAX_FORWARD_SPEED,
 HAZARD_RELEASE_SPEED,HAZARD_GRAVITY_RELIEF,HAZARD_AIR_DRAG,
 hazardBrakingForce,integrateDownhillSpeed,swipeImpulse} from '../src/Motion';
test('C0.5: finite swipe-only pulses are smaller than C0.4 turbo',()=>{
 expect(PLAYER_SWIPE_IMPULSE).toBeLessThan(11.6);
 expect(PLAYER_MAX_FORWARD_SPEED).toBeLessThan(23);
 expect(swipeImpulse(0)).toBe(PLAYER_SWIPE_IMPULSE);
 expect(swipeImpulse(1)).toBeCloseTo(PLAYER_SWIPE_IMPULSE+PLAYER_CHAIN_INCREMENT);
 expect(swipeImpulse(5)).toBeCloseTo(swipeImpulse(4));
 expect(HAZARD_RELEASE_SPEED).toBeLessThan(4.3);
});
test('C0.5: per-hazard mass-scaled slow descent without changing physics clock',()=>{
 expect(HAZARD_GRAVITY_RELIEF).toBeGreaterThan(.2);
 expect(HAZARD_GRAVITY_RELIEF).toBeLessThan(.8);
 expect(HAZARD_AIR_DRAG).toBeGreaterThan(0);
 expect(hazardBrakingForce(20,5)).toBeCloseTo(hazardBrakingForce(1,5)*20);
 const slow=Array.from({length:150}).reduce((v)=>integrateDownhillSpeed(v,.03),0);
 const classic=Array.from({length:150}).reduce((v)=>integrateDownhillSpeed(v,.03,false),0);
 expect(slow).toBeGreaterThan(1);
 expect(slow).toBeLessThan(classic*.65);
 expect(hazardBrakingForce(.14,4)).toBeLessThan(hazardBrakingForce(100,4));
});

import {BASE_PLAYER_MASS,MAX_PLAYER_MASS,MAX_CHARGE,
 CHARGE_CHAIN_WINDOW,CHARGE_DECAY_DELAY,CHARGE_DECAY_STEP,
 massForCharge,chargedBySwipe,chargeAfterIdle,
 scaleImpulseForMass,cappedForwardSpeed} from '../src/Motion';
test('C0.6: swipe weight is a bounded genuine mass multiplier, never a speed multiplier',()=>{
 expect(BASE_PLAYER_MASS).toBe(1.4);
 expect(MAX_PLAYER_MASS).toBeGreaterThan(5);
 expect(massForCharge(0)).toBe(BASE_PLAYER_MASS);
 expect(massForCharge(MAX_CHARGE)).toBe(MAX_PLAYER_MASS);
 expect(massForCharge(999)).toBe(MAX_PLAYER_MASS);
 expect(chargedBySwipe(0,100)).toBe(1);
 expect(chargedBySwipe(1,.25)).toBe(2);
 expect(chargedBySwipe(4,.25)).toBe(MAX_CHARGE);
 expect(chargedBySwipe(4,CHARGE_CHAIN_WINDOW+.1)).toBe(1);
 // A heavier Bullet ball must receive proportionally more impulse just
 // to preserve its previous velocity gain. Charge increases collision mass.
 const impulse=10;
 expect(scaleImpulseForMass(impulse,MAX_PLAYER_MASS)/MAX_PLAYER_MASS)
  .toBeCloseTo(impulse/BASE_PLAYER_MASS);
 expect(cappedForwardSpeed(50)).toBe(PLAYER_MAX_FORWARD_SPEED);
 expect(PLAYER_MAX_FORWARD_SPEED).toBeLessThan(17);
});
test('C0.6: charge expires without swipes and never survives loss of streak',()=>{
 expect(CHARGE_DECAY_DELAY).toBeGreaterThan(1);
 expect(CHARGE_DECAY_STEP).toBeGreaterThan(0);
 expect(chargeAfterIdle(4,0)).toBe(4);
 expect(chargeAfterIdle(4,CHARGE_DECAY_DELAY-.01)).toBe(4);
 expect(chargeAfterIdle(4,CHARGE_DECAY_DELAY+.01)).toBe(3);
 expect(chargeAfterIdle(4,CHARGE_DECAY_DELAY+CHARGE_DECAY_STEP+.01)).toBe(2);
 expect(chargeAfterIdle(4,CHARGE_DECAY_DELAY+CHARGE_DECAY_STEP*4)).toBe(0);
});


import {visualOcclusionTier} from '../src/Visibility';
import {lateralControlFraction} from '../src/Motion';
test('C0.7: a giant or close camera blocker fades harder but loot never fades',()=>{
 const eye:[number,number,number]=[0,0,10],ball:[number,number,number]=[0,0,0];
 expect(visualOcclusionTier(eye,ball,[0,0,5],1.2,false)).toBe(1);
 expect(visualOcclusionTier(eye,ball,[0,0,5],3.3,false)).toBe(2);
 expect(visualOcclusionTier(eye,ball,[0,0,8],1.2,false)).toBe(2);
 expect(visualOcclusionTier(eye,ball,[0,0,5],3.3,true)).toBe(0);
 expect(visualOcclusionTier(eye,ball,[7,0,5],1.2,false)).toBe(0);
 expect(visualOcclusionTier(eye,ball,[0,0,-5],1.2,false)).toBe(0);
});
test('C0.7: a heavy charged ball trades away lateral steering, not forward physics',()=>{
 expect(lateralControlFraction(0)).toBe(1);
 expect(lateralControlFraction(1)).toBeCloseTo(.895);
 expect(lateralControlFraction(MAX_CHARGE)).toBeCloseTo(.58);
 expect(lateralControlFraction(99)).toBeCloseTo(.58);
 expect(lateralControlFraction(NaN)).toBe(1);
 expect(lateralControlFraction(-50)).toBe(1);
 expect(lateralControlFraction(1)).toBeGreaterThan(lateralControlFraction(3));
 expect(lateralControlFraction(4)).toBeGreaterThan(.5);
});

import {warmStartItems,refineInfiniteItem,smoothSummitBlend,
 summitCameraOffsets,MYSTERY_BOX_HEIGHT,MYSTERY_BOX_SIZE} from '../src/ClimbPacing';
test('C1.1 first-frame hazard stream is real, deterministic and mixed',()=>{
 const items=warmStartItems(1719);
 expect(items).toHaveLength(8);
 expect(warmStartItems(1719)).toEqual(items);
 expect(warmStartItems(1720)).not.toEqual(items);
 expect(items.every(p=>p.progress>=12&&p.progress<=58)).toBe(true);
 expect(items.every(p=>p.item.mass>0)).toBe(true);
 expect(items.filter(p=>p.item.kind==='rock').length).toBe(5);
 expect(items.filter(p=>p.item.kind==='loot').length).toBe(3);
 expect(items.some(p=>p.item.shape==='barrel')).toBe(true);
 expect(items.some(p=>p.item.shape==='beam')).toBe(true);
 expect(items.some(p=>p.item.shape==='bouncer')).toBe(true);
 expect(items.some(p=>p.item.shape==='table')).toBe(true);
 expect(items.some(p=>p.item.shape==='chair')).toBe(true);
 expect(items.every(p=>Math.abs(p.item.lane)<4)).toBe(true);
});
test('C1.1 each of the first 1000 levels uses narrow tall real furniture and distinct hazards',()=>{
 const shapes=new Set<string>();
 for(let i=1;i<=1000;i++){
  const seed=makeWave(i*719,0);
  for(const item of seed.items){
   const p=refineInfiniteItem(item,i*719);
   expect(refineInfiniteItem(item,i*719)).toEqual(p);
   expect(p.mass).toBeGreaterThan(0);
   shapes.add(p.shape);
   if(p.shape==='table'||p.shape==='chair'){
    expect(p.size[0]).toBeLessThan(3);
    expect(p.size[1]).toBeGreaterThan(3.6);
    expect(furnitureOpening(p).height).toBeGreaterThan(1.16);
   }
  }
 }
 // Furniture and cylinder/plank/spring bodies in addition to legacy debris.
 for(const shape of ['barrel','beam','bouncer','table','chair'])
  expect(shapes.has(shape)).toBe(true);
});
test('C1.1 summit camera smoothly levels with distance and raised mystery source',()=>{
 expect(smoothSummitBlend(45,false)).toBe(0);
 expect(smoothSummitBlend(56,false)).toBeCloseTo(.5);
 expect(smoothSummitBlend(60,false)).toBe(1);
 expect(smoothSummitBlend(1,true)).toBe(1);
 for(let i=0;i<=100;i++){
  const t=i/100;
  const p=summitCameraOffsets(t);
  expect(p.focusHeight).toBeLessThanOrEqual(4.34);
  expect(p.focusHeight).toBeGreaterThanOrEqual(.8);
  expect(p.behind).toBeGreaterThanOrEqual(11.8);
 }
 expect(MYSTERY_BOX_HEIGHT).toBeGreaterThan(12);
 expect(MYSTERY_BOX_SIZE).toBeGreaterThan(7);
});
