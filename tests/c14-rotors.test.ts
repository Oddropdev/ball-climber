import {test,expect} from 'vitest';
import {levelSpec} from '../src/LevelSpec';
import {rotorSpecs,rotorParts} from '../src/Rotors';
import {rushPack} from '../src/RushPack';
import {closeChaseOffset} from '../src/ClimbFeel';
import {furnitureParts} from '../src/Furniture';

test('C1.4: physical rotor layouts are deterministic, bounded and delayed to later levels',()=>{
 expect(rotorSpecs(1,1719)).toHaveLength(0);
 expect(rotorSpecs(3,1719)).toHaveLength(0);
 expect(rotorSpecs(4,1719)).toHaveLength(1);
 expect(rotorSpecs(9,1719)).toHaveLength(2);
 const kinds=new Set();
 for(let i=1;i<=1000;i++){
  const s=levelSpec(i),a=rotorSpecs(i,s.decorSeed);
  expect(a).toEqual(rotorSpecs(i,s.decorSeed));
  expect(a.length).toBeLessThanOrEqual(2);
  for(const r of a){
   expect(r.progress).toBeGreaterThan(13);
   expect(r.progress).toBeLessThan(53);
   expect(r.radius).toBeGreaterThanOrEqual(2.45);
   expect(r.radius).toBeLessThan(3.01);
   expect(r.speed*60/(Math.PI*2)).toBeGreaterThanOrEqual(10);
   expect(r.speed*60/(Math.PI*2)).toBeLessThanOrEqual(16);
   const p=rotorParts(r);
   expect(p.length).toBeGreaterThanOrEqual(2);
   expect(p.length).toBeLessThanOrEqual(3);
   expect(p.every(x=>x.size.every(n=>n>0))).toBe(true);
   kinds.add(r.kind);
  }
 }
 expect(kinds).toEqual(new Set(['cross','hammer','platform']));
});
test('C1.4: six real pre-start actors per seed create first-22m obstacle pressure',()=>{
 const signatures=new Set();
 for(let i=1;i<=1000;i++){
  const s=levelSpec(i),a=rushPack(s.waveSeed,s.biome);
  expect(a).toEqual(rushPack(s.waveSeed,s.biome));
  expect(a).toHaveLength(6);
  expect(a.filter(x=>x.item.kind==='loot')).toHaveLength(1);
  expect(a.filter(x=>x.item.shape==='chair').length).toBeGreaterThanOrEqual(2);
  expect(a.every(x=>x.progress>=4&&x.progress<=23)).toBe(true);
  expect(a.every(x=>Math.abs(x.item.lane)<2.5)).toBe(true);
  expect(a.every(x=>x.item.mass>0)).toBe(true);
  for(const x of a.filter(x=>x.item.shape==='chair'))
   expect(furnitureParts(x.item)).toHaveLength(6);
  signatures.add(a.map(x=>x.item.lane).join('/'));
 }
 expect(signatures.size).toBeGreaterThan(950);
});
test('C1.4: ultralow follow has bounded offsets and camera A/B stays available',()=>{
 expect(closeChaseOffset(0,false)).toEqual({vertical:0,behind:0,fov:61});
 const a=closeChaseOffset(0,true);
 expect(a.vertical).toBeCloseTo(-.95);
 expect(a.behind).toBeCloseTo(-2.25);
 expect(a.fov).toBe(58);
 const b=closeChaseOffset(1,true);
 expect(b.vertical).toBeGreaterThan(a.vertical);
 expect(b.behind).toBeGreaterThan(a.behind);
 expect(b.vertical).toBeLessThan(0);
});
