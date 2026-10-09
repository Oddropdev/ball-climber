import {expect,test} from 'vitest';
import {summitMagnetForce,MAGNET_START_PROGRESS} from '../src/SummitMagnet';
import {COMPLEX_SHAPES,obstacleParts} from '../src/ObstacleShapes';
import {levelSpec} from '../src/LevelSpec';
import {warmStartItems,refineInfiniteItem} from '../src/ClimbPacing';
import {makeWave} from '../src/Course';

test('C1.2: magnet never acts below final ascent, off the track or on invalid mass',()=>{
 const p={x:0,y:41,z:-22},v={x:0,y:2,z:-4};
 expect(summitMagnetForce(20,p,v,42,.58,1.4)).toBe(null);
 expect(summitMagnetForce(MAGNET_START_PROGRESS-.1,p,v,42,.58,1.4)).toBe(null);
 expect(summitMagnetForce(46,{...p,x:7},v,42,.58,1.4)).toBe(null);
 expect(summitMagnetForce(46,{...p,y:28},v,42,.58,1.4)).toBe(null);
 expect(summitMagnetForce(46,p,v,42,.58,0)).toBe(null);
});
test('C1.2: magnetic capture physically pulls toward center and damps launch',()=>{
 const p={x:2,y:40,z:-23},v={x:1,y:9,z:-7};
 const m=summitMagnetForce(46,p,v,42,.58,1.4)!;
 expect(m).not.toBe(null);
 expect(m[0]).toBeLessThan(0);
 expect(m[2]).toBeGreaterThan(0); // brake at the vertical lip
 const landing=summitMagnetForce(49,{x:2,y:43.5,z:-25},
  {x:0,y:0,z:-1},42,.58,1.4)!;
 expect(landing[2]).toBeLessThan(0); // pull across once above the lip
 const overPad=summitMagnetForce(52,{x:0,y:45,z:-30.5},
  {x:0,y:-1,z:0},42,.58,1.4)!;
 expect(overPad[1]).toBe(0); // gravity must allow physical deck contact
 const faster=summitMagnetForce(46,p,{...v,y:16},42,.58,1.4)!;
 expect(faster[1]).toBeLessThan(m[1]);
 const double=summitMagnetForce(46,p,v,42,.58,2.8)!;
 expect(double[0]).toBeCloseTo(m[0]*2);
 expect(double[1]).toBeCloseTo(m[1]*2);
 expect(double[2]).toBeCloseTo(m[2]*2);
});
test('C1.2: six self-authored models have bounded real compound collider parts',()=>{
 expect(COMPLEX_SHAPES).toHaveLength(6);
 for(const shape of COMPLEX_SHAPES){
  const pieces=obstacleParts({wave:0,slot:0,kind:'rock',shape,delay:0,
   lane:0,size:[3,3,2],mass:12,giant:false});
  expect(pieces.length).toBeGreaterThanOrEqual(2);
  expect(pieces.length).toBeLessThanOrEqual(7);
  expect(pieces.every(p=>p.size.every(n=>n>0&&Number.isFinite(n)))).toBe(true);
  expect(new Set(pieces.map(p=>p.name)).size).toBe(pieces.length);
 }
});
test('C1.2: 1000 deterministic seeds produce biome-specific falling silhouettes',()=>{
 const signatures=new Set<string>();
 const families=new Set<string>();
 for(let index=1;index<=1000;index++){
  const spec=levelSpec(index);
  const pre=warmStartItems(spec.waveSeed,spec.biome);
  expect(pre).toEqual(warmStartItems(spec.waveSeed,spec.biome));
  expect(pre).toHaveLength(8);
  signatures.add(pre.map(p=>p.item.shape).join('/'));
  for(const p of pre)families.add(p.item.shape);
  const wave=makeWave(spec.waveSeed,3);
  for(const entry of wave.items){
   const item=refineInfiniteItem(entry,spec.waveSeed,spec.biome);
   expect(item).toEqual(refineInfiniteItem(entry,spec.waveSeed,spec.biome));
   expect(item.mass).toBeGreaterThan(0);
   families.add(item.shape);
  }
 }
 expect(signatures.size).toBeGreaterThanOrEqual(4);
 for(const shape of COMPLEX_SHAPES)expect(families.has(shape)).toBe(true);
 expect(warmStartItems(1719,'rocky')[0]!.item.shape).toBe('hammer');
 expect(warmStartItems(1719,'stormwall')[0]!.item.shape).toBe('cross');
});
