// C1.8 — six deterministic dramatic segments in each 60m climb.
// Woven furniture and edge-only frames provide intentional bypass routes;
// one crowded section per course is retained for comic physics chaos.
import {makeRng,massFor,type SpawnItem,type SpawnWave,type ObjectShape,
 type V3} from './Course';
import {HOLLOW_SHAPES,type HollowShape} from './HollowFrames';
import type {Biome} from './LevelSpec';
export type SectionRole='open'|'weave'|'setpiece'|'frames'|'pile'|'recovery';
export type Section={start:number;end:number;role:SectionRole};
export const SECTION_EDGES=[0,9,18,27,37,47,60] as const;
export function sectionPlan(seed:number):Section[]{
 const r=makeRng((seed^0x18cc1188)>>>0);
 const mid:SectionRole[]=r()<.5?
  ['weave','setpiece','frames','pile']:['setpiece','weave','frames','pile'];
 return ['open',...mid,'recovery'].map((role,i)=>({
  role:role as SectionRole,start:SECTION_EDGES[i]!,
  end:SECTION_EDGES[i+1]!
 }));
}
export function sectionAt(seed:number,progress:number):Section{
 return sectionPlan(seed).find(x=>progress>=x.start&&progress<x.end)!
  ??sectionPlan(seed)[5]!;
}
export type DirectedWave={items:SpawnItem[];gap:number;role:SectionRole};
export function directedWave(wave:SpawnWave,seed:number,progress:number,
 biome:Biome):DirectedWave{
 const section=sectionAt(seed,progress),role=section.role;
 const r=makeRng((seed^Math.imul(wave.id+5,0x5c83d9))>>>0);
 const quota:Record<SectionRole,number>={
  open:1,weave:3,setpiece:2,frames:2,pile:4,recovery:1};
 const gap:Record<SectionRole,number>={
  open:2.7,weave:1.75,setpiece:2.1,frames:1.95,pile:2.45,recovery:2.8};
 const count=Math.min(quota[role],wave.items.length);
 const items=wave.items.slice(0,count).map((item,i)=>{
  const next={...item,size:[...item.size] as V3};
  // Alternate corridors; don't build opaque width-spanning walls.
  const side=(wave.id+i)%2===0?1:-1;
  next.lane=role==='weave'||role==='frames'?
   side*(1.5+(i%2)*1.2):
   role==='pile'?(i===0?0:side*(.6+r()*1.4)):
   side*(2.5+r()*.65);
  next.delay=i*(role==='pile'?.13:.36)+r()*.07;
  next.giant=role==='pile'&&i===0&&item.kind==='rock';
  if(role==='weave'&&item.kind==='rock'){
   next.shape=(i%2?'table':'chair');
   next.size=i%2?[2.55,4.15,1.75]:[2.05,3.9,1.8];
  }else if(role==='frames'&&item.kind==='rock'){
   next.shape=HOLLOW_SHAPES[(wave.id+i)%HOLLOW_SHAPES.length]!;
   next.size=next.shape==='frame-rect'?
    [3.75,3.35,2.65]:next.shape==='frame-triangle'?
    [3.6,4.5,2.7]:[3.6,3.85,3.1];
  }
  // A genuine, dynamically falling reward still exists in quiet segments.
  if(role==='open'||role==='recovery'){
   next.kind='loot';next.shape='sphere';next.size=[.72,.72,.72];
  }
  next.mass=massFor(next.kind,next.size,next.giant);
  return next;
 });
 return {items,gap:gap[role],role};
}
export function frameSetpieces(seed:number){
 const r=makeRng((seed^0x29f0de5f)>>>0);
 const frames=sectionPlan(seed).filter(s=>s.role==='frames')[0]!;
 const gaps=[frames.start+2.1,frames.end-2.3];
 return gaps.map((progress,i)=>{
  const shape:HollowShape=HOLLOW_SHAPES[(Math.floor(r()*4)+i)%4]!;
  const size:V3=shape==='frame-triangle'?[3.65,4.6,2.8]:
   shape==='frame-pyramid'?[4.1,4.85,3.4]:
   shape==='frame-rect'?[3.65,4.45,3.2]:[3.7,3.7,3.7];
  const item:SpawnItem={kind:'rock',shape,
   wave:-5,slot:i,delay:0,giant:false,lane:i?1.9:-1.9,
   size,mass:massFor('rock',size)};
  return {item,progress};
 });
}
