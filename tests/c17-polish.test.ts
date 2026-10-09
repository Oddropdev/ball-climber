import {test,expect} from 'vitest';
import {levelSpec} from '../src/LevelSpec';
import {rotorSpecs,pairedRotorClearance} from '../src/Rotors';
import {NEW_SHAPES,noveltyStartItems} from '../src/NoveltyPack';
import {COMPLEX_SHAPES,obstacleParts} from '../src/ObstacleShapes';
import {refineInfiniteItem} from '../src/ClimbPacing';
import {makeWave,PLAYER_RADIUS} from '../src/Course';
import {climbMassForCharge,C17_MAX_MASS,shouldBlockFinalSwipe,
 isRunawaySummitLaunch} from '../src/C17Safety';
import {BASE_PLAYER_MASS,MAX_PLAYER_MASS,PLAYER_SWIPE_IMPULSE,
 scaleImpulseForMass} from '../src/Motion';
import {baseCameraTransition,baseSpawn,BASE_DECK_TOP} from '../src/BaseCamp';

test('C1.7: start pose has a visible ball and does not alter 60-degree uphill rig',()=>{
 const spawn=baseSpawn(),rest=baseCameraTransition({x:spawn[0],y:spawn[1],z:spawn[2]});
 expect(rest.slopeBlend).toBe(0);
 expect(rest.camera[1]).toBeGreaterThan(BASE_DECK_TOP+4);
 expect(rest.camera[2]).toBeGreaterThan(spawn[2]+5);
 expect(rest.focus[1]).toBeLessThan(spawn[1]+1);
 expect(rest.focus[2]).toBeLessThan(spawn[2]);
});
test('C1.7: heavy swipe accelerates exactly as before but bulldozing mass is reduced',()=>{
 expect(climbMassForCharge(0)).toBe(BASE_PLAYER_MASS);
 expect(climbMassForCharge(4)).toBe(C17_MAX_MASS);
 expect(C17_MAX_MASS).toBeLessThan(MAX_PLAYER_MASS*.65);
 for(let c=0;c<=4;c++){
  const mass=climbMassForCharge(c);
  const physicalImpulse=scaleImpulseForMass(PLAYER_SWIPE_IMPULSE,mass);
  expect(physicalImpulse/mass).toBeCloseTo(PLAYER_SWIPE_IMPULSE/BASE_PLAYER_MASS);
  if(c)expect(mass).toBeGreaterThan(climbMassForCharge(c-1));
 }
});
test('C1.7: summit blocks boosted swipes and bounds physical high overshoots',()=>{
 expect(shouldBlockFinalSwipe(55,60,'running')).toBe(false);
 expect(shouldBlockFinalSwipe(58,60,'running')).toBe(true);
 expect(shouldBlockFinalSwipe(0,60,'summit')).toBe(true);
 expect(isRunawaySummitLaunch(61,60,58,52.77)).toBe(true);
 expect(isRunawaySummitLaunch(61,60,54,52.77)).toBe(false);
 expect(isRunawaySummitLaunch(40,60,99,52.77)).toBe(false);
});
test('C1.7: exactly one early center rotor, or mirrored shoulder pair, never tandem in one lane',()=>{
 for(let i=1;i<=1000;i++){
  const s=levelSpec(i),rotors=rotorSpecs(i,s.decorSeed);
  expect(rotors).toEqual(rotorSpecs(i,s.decorSeed));
  if(rotors.length===2){
   expect(rotors.every(r=>!!r.pairRole)).toBe(true);
   expect(pairedRotorClearance(rotors)).toBeGreaterThan(3);
  }else if(rotors.length===1){
   expect(rotors[0]!.lane).toBe(0);
   expect(rotors[0]!.progress).toBeGreaterThan(15);
   expect(rotors[0]!.progress).toBeLessThan(19);
  }
 }
});
test('C1.7: all nine recognizable objects have real distinct compound collider parts',()=>{
 expect(NEW_SHAPES).toHaveLength(9);
 expect(new Set(NEW_SHAPES).size).toBe(9);
 expect(COMPLEX_SHAPES).toHaveLength(15);
 for(const shape of NEW_SHAPES){
  const item={wave:0,slot:0,kind:'rock',shape,delay:0,lane:0,
   size:[3,3,2] as [number,number,number],mass:20,giant:false} as const;
  const parts=obstacleParts(item);
  expect(parts.length).toBeGreaterThanOrEqual(3);
  expect(parts.length).toBeLessThanOrEqual(7);
  expect(new Set(parts.map(p=>p.name)).size).toBe(parts.length);
  expect(parts.every(p=>p.size.every(n=>n>0&&Number.isFinite(n)))).toBe(true);
  expect(parts.every(p=>['box','sphere','cone','cylinder'].includes(p.type))).toBe(true);
 }
});
test('C1.7: 1000 level seeds expose every silhouette in prewarm and avalanche with bounded actors',()=>{
 const seen=new Set<string>();
 for(let i=1;i<=1000;i++){
  const s=levelSpec(i),items=noveltyStartItems(s.waveSeed);
  expect(items).toEqual(noveltyStartItems(s.waveSeed));
  expect(items).toHaveLength(2);
  expect(items[0]!.item.shape).not.toBe(items[1]!.item.shape);
  for(const obj of items){
   seen.add(obj.item.shape);
   expect(obj.item.mass).toBeGreaterThan(0);
   expect(obj.progress).toBeGreaterThan(20);
   expect(obj.progress).toBeLessThan(50);
  }
  const wave=makeWave(s.waveSeed,3);
  for(const obj of wave.items){
   const item=refineInfiniteItem(obj,s.waveSeed,s.biome);
   seen.add(item.shape);
  }
 }
 for(const shape of NEW_SHAPES)expect(seen.has(shape)).toBe(true);
 expect(PLAYER_RADIUS).toBeGreaterThan(.5);
});
