import {test,expect} from 'vitest';
import {levelSpec} from '../src/LevelSpec';
import {PLAYER_RADIUS,type SpawnItem} from '../src/Course';
import {HOLLOW_SHAPES,isHollowShape,hollowBeams,frameOpening,
 frameThickness} from '../src/HollowFrames';
import {sectionPlan,sectionAt,directedWave,frameSetpieces}
 from '../src/ClimbDirector';
import {introPose,INTRO_SECONDS,shouldShowIntro} from '../src/IntroTour';
import {BASE_SPAWN_Z,START_PAD_WIDTH,START_PAD_BACK_Z,START_PAD_FRONT_Z}
 from '../src/BaseCamp';
import {makeWave} from '../src/Course';

test('C1.8: four distinctly hollow real-frame shapes have only edge segments',()=>{
 expect(HOLLOW_SHAPES).toEqual(['frame-cube','frame-rect','frame-pyramid','frame-triangle']);
 const dims:[number,number,number]=[4.0,4.5,3.3];
 for(const [i,kind] of HOLLOW_SHAPES.entries()){
  expect(isHollowShape(kind)).toBe(true);
  const segments=hollowBeams(kind,dims);
  expect(segments).toHaveLength(i<2?12:i===2?8:9);
  const set=new Set(segments.map(p=>JSON.stringify(p)));
  expect(set.size).toBe(segments.length);
  for(const p of segments){
   expect(p.a.every(Number.isFinite)).toBe(true);
   expect(p.b.every(Number.isFinite)).toBe(true);
   const n=Math.hypot(...p.b.map((v,j)=>v-p.a[j]!));
   expect(n).toBeGreaterThan(.2);
  }
  const o=frameOpening(kind,dims);
  expect(o.width).toBeGreaterThan(PLAYER_RADIUS*2+1.5);
  expect(o.height).toBeGreaterThan(PLAYER_RADIUS*2);
  expect(o.depth).toBeGreaterThan(PLAYER_RADIUS*2);
  expect(frameThickness(dims)).toBeGreaterThanOrEqual(.14);
  expect(frameThickness(dims)).toBeLessThanOrEqual(.23);
 }
});
test('C1.8: one planned pile per 1000 deterministic sectioned levels, with weaving, frames and recovery',()=>{
 for(let i=1;i<=1000;i++){
  const seed=levelSpec(i).waveSeed;
  const p=sectionPlan(seed);
  expect(p).toEqual(sectionPlan(seed));
  expect(p).toHaveLength(6);
  expect(p[0]!.start).toBe(0);
  expect(p[5]!.end).toBe(60);
  expect(p.filter(x=>x.role==='pile')).toHaveLength(1);
  expect(p.filter(x=>x.role==='frames')).toHaveLength(1);
  expect(p.filter(x=>x.role==='weave')).toHaveLength(1);
  expect(p.filter(x=>x.role==='open')).toHaveLength(1);
  expect(p.filter(x=>x.role==='recovery')).toHaveLength(1);
  expect(p.every((x,j)=>j===0||x.start===p[j-1]!.end)).toBe(true);
  for(let s=0;s<60;s++)expect(sectionAt(seed,s).end).toBeGreaterThan(s);
  const f=frameSetpieces(seed);
  expect(f).toHaveLength(2);
  expect(f.every(x=>isHollowShape(x.item.shape))).toBe(true);
  expect(f.every(x=>x.progress>20&&x.progress<40)).toBe(true);
 }
});
test('C1.8: live waves avoid opaque per-second piles, retain one deliberately denser sequence',()=>{
 for(let i=1;i<=1000;i+=4){
  const spec=levelSpec(i);
  for(const section of sectionPlan(spec.waveSeed)){
   const wave=makeWave(spec.waveSeed,i);
   const d=directedWave(wave,spec.waveSeed,section.start+1,spec.biome);
   expect(d).toEqual(directedWave(wave,spec.waveSeed,section.start+1,spec.biome));
   expect(d.role).toBe(section.role);
   expect(d.items.length).toBeGreaterThan(0);
   expect(d.items.length).toBeLessThanOrEqual(section.role==='pile'?4:3);
   expect(d.gap).toBeGreaterThanOrEqual(1.7);
   if(d.items.length>1)expect(d.items[1]!.delay).toBeGreaterThan(d.items[0]!.delay);
   expect(d.items.every(x=>Math.abs(x.lane)<3.5)).toBe(true);
   if(section.role==='open'||section.role==='recovery')
    expect(d.items.every(x=>x.kind==='loot')).toBe(true);
  }
 }
});
test('C1.8: the cinematic camera actually travels 60m course, ends on safe separated pad, and respects skip',()=>{
 const home:[number,number,number]=[0,1.54,BASE_SPAWN_Z];
 expect(INTRO_SECONDS).toBeGreaterThanOrEqual(3);
 expect(INTRO_SECONDS).toBeLessThanOrEqual(4.5);
 expect(START_PAD_WIDTH).toBeLessThan(5);
 expect(BASE_SPAWN_Z).toBeGreaterThan(START_PAD_FRONT_Z);
 expect(BASE_SPAWN_Z).toBeLessThan(START_PAD_BACK_Z);
 expect(shouldShowIntro(1,0,true)).toBe(true);
 expect(shouldShowIntro(1,1,true)).toBe(false);
 expect(shouldShowIntro(2,1,true)).toBe(true);
 expect(shouldShowIntro(2,1,false)).toBe(false);
 const poses=[0,.75,1.7,2.7,3.8].map(t=>introPose(t,home));
 expect(poses.every(p=>[...p.camera,...p.target,p.fov]
  .every(Number.isFinite))).toBe(true);
 expect(poses[0]!.camera[1]).toBeGreaterThan(poses[2]!.camera[1]);
 expect(poses[2]!.camera[1]).toBeGreaterThan(poses[4]!.camera[1]);
 expect(poses[4]!.camera[2]).toBeGreaterThan(BASE_SPAWN_Z+5);
 expect(introPose(100,home)).toEqual(introPose(INTRO_SECONDS,home));
});
