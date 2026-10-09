// C1.4 — deterministic, anchored, slope-aligned Ammo/Bullet machinery.
// Kinematic compound rigidbodies are rotated at a bounded speed; dynamic
// falling furniture and the player collide with the *real* rotating blades.
import {AppBase,Entity,Quat,StandardMaterial,Vec3} from 'playcanvas';
import {makeRng,onSlope,SLAB_THICKNESS} from './Course';
import type {LevelSpec} from './LevelSpec';
export type RotorKind='cross'|'hammer'|'platform';
export type RotorSpec={id:number;kind:RotorKind;progress:number;speed:number;
 direction:-1|1;radius:number;phase:number;lane?:number;pairRole?:'left'|'right'};
export function rotorSpecs(index:number,seed:number):RotorSpec[]{
 if(index<4)return [];
 const r=makeRng((seed^0x18b4ddc2)>>>0);
 // Alternate center rotor lanes with a proper synchronized opposing
 // shoulder pair: both upper blades sweep INWARDS toward the middle.
 // Hard max 2 motors per level, even in the 1,000-level generator.
 if(index>=5&&index%4===1){
  const progress=33+(r()-.5)*3;
  const phase=r()*Math.PI*2;
  const speed=(10+r()*5)*Math.PI*2/60;
  // Small paired rotors: leave >=3.1m unobstructed center corridor.
  const radius=1.65+r()*.18;
  return [
   {id:0,kind:'cross',progress,speed,direction:-1,lane:-3.65,
    radius,phase,pairRole:'left'},
   {id:1,kind:'cross',progress,speed,direction:1,lane:3.65,
    radius,phase:-phase,pairRole:'right'}
  ];
 }
 // Central rotor is an EARLY single set-piece, never repeated along
 // one linear run. Later obstacles come from debris and paired shoulders.
 const kinds:RotorKind[]=['cross','hammer','platform'];
 return [{
  id:0,
  kind:kinds[index%kinds.length]!,
  progress:17+(r()-.5)*3,
  speed:(10+r()*6)*Math.PI*2/60,
  direction:r()<.5?-1:1,
  radius:2.45+r()*.55,
  phase:r()*Math.PI*2,
  lane:0
 }];
}
// Conservative swept-collider bound includes 0.24m blade half-width.
// A full-diameter player ball needs only 1.16m plus steering clearance.
export function pairedRotorClearance(specs:readonly RotorSpec[]){
 if(specs.length!==2||specs[0]?.pairRole!=='left'||
  specs[1]?.pairRole!=='right')return null;
 const left=specs[0],right=specs[1];
 return (right.lane??0)-(right.radius+.24)-
  ((left.lane??0)+(left.radius+.24));
}
type ColliderPart={name:string;offset:[number,number,number];
 size:[number,number,number]};
export function rotorParts(s:RotorSpec):ColliderPart[]{
 const r=s.radius;
 if(s.kind==='cross')return [
  {name:'arm-horizontal',offset:[0,0,0],size:[r*2,.56,.48]},
  {name:'arm-up-slope',offset:[0,0,0],size:[.48,.56,r*2]}
 ];
 if(s.kind==='hammer')return [
  {name:'shaft',offset:[0,0,0],size:[r*1.6,.46,.32]},
  {name:'hammer-left',offset:[-r*.75,0,0],size:[.52,.72,1.7]},
  {name:'hammer-right',offset:[r*.75,0,0],size:[.52,.72,1.7]}
 ];
 return [
  {name:'paddle',offset:[0,0,0],size:[r*1.6,.43,1.15]},
  {name:'blade-a',offset:[0,0,r*.45],size:[1.5,.43,.53]},
  {name:'blade-b',offset:[0,0,-r*.45],size:[1.5,.43,.53]}
 ];
}
export function buildRotorField(app:AppBase,spec:LevelSpec,
 primary:StandardMaterial,accent:StandardMaterial){
 const plans=rotorSpecs(spec.index,spec.decorSeed);
 const incline=new Quat().setFromEulerAngles(60,0,0);
 const spinAxis=new Vec3(0,1,0);
 const nodes=plans.map(plan=>{
  const center=onSlope(plan.progress,SLAB_THICKNESS/2+1.00,plan.lane??0);
  const root=new Entity('rotor-'+spec.index+'-'+plan.id+'-'+plan.kind);
  root.setPosition(...center);
  const spin=new Quat().setFromAxisAngle(spinAxis,plan.phase*180/Math.PI);
  root.setRotation(incline.clone().mul(spin));
  root.addComponent('collision',{type:'compound'});
  for(const part of rotorParts(plan)){
   const child=new Entity(part.name);
   child.setLocalPosition(...part.offset);
   child.addComponent('collision',{type:'box',halfExtents:
    new Vec3(part.size[0]/2,part.size[1]/2,part.size[2]/2)});
   child.addComponent('render',{type:'box',
    material:part.name.includes('hammer')?accent:primary,castShadows:true});
   child.setLocalScale(...part.size);
   root.addChild(child);
  }
  // Decorative pivot, deliberately no additional collider.
  const pivot=new Entity('glowing-pivot');
  pivot.setLocalScale(.65,.82,.65);
  pivot.addComponent('render',{type:'cylinder',material:accent,castShadows:false});
  root.addChild(pivot);
  root.addComponent('rigidbody',{type:'kinematic',friction:.85,restitution:.18});
  app.root.addChild(root);
  return {plan,root,angle:plan.phase};
 });
 let contacts=0,contactsWithFalling=0,turns=0,updatedFrames=0;
 for(const node of nodes){
  node.root.collision!.on('collisionstart',(evt:{other:Entity})=>{
   contacts++;
   if(evt.other.name.startsWith('falling-'))contactsWithFalling++;
  });
 }
 return {
  get count(){return nodes.length;},
  get specs(){return plans;},
  get contacts(){return contacts;},
  get contactsWithFalling(){return contactsWithFalling;},
  get turns(){return turns;},
  get updatedFrames(){return updatedFrames;},
  get types(){return nodes.map(n=>n.root.rigidbody?.type);},
  update(dt:number){
   // Visual transform is also the kinematic collider transform. Moving
   // an entity, not calling teleport() on a kinematic Bullet body.
   const step=Math.max(0,Math.min(.04,dt));
   for(const n of nodes){
    const old=n.angle;
    n.angle+=n.plan.direction*n.plan.speed*step;
    const spin=new Quat().setFromAxisAngle(spinAxis,n.angle*180/Math.PI);
    n.root.setRotation(incline.clone().mul(spin));
    turns+=Math.abs(n.angle-old)/(Math.PI*2);
   }
   if(nodes.length)updatedFrames++;
  },
  dispose(){
   for(const n of nodes)n.root.destroy();
   nodes.length=0;
  }
 };
}
export type RotorField=ReturnType<typeof buildRotorField>;
