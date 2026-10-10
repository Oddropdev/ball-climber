// C1.8 — thick, genuinely hollow edge-beam objects. Every visible beam
// owns exactly one matching Bullet box collider: NO invisible filled cube.
import {AppBase,Entity,Quat,StandardMaterial,Vec3} from 'playcanvas';
import {SLOPE_DEGREES,type SpawnItem,type V3} from './Course';
export const HOLLOW_SHAPES=['frame-cube','frame-rect','frame-pyramid',
 'frame-triangle'] as const;
export type HollowShape=typeof HOLLOW_SHAPES[number];
export function isHollowShape(x:string):x is HollowShape{
 return (HOLLOW_SHAPES as readonly string[]).includes(x);
}
export type Beam={a:V3;b:V3};
function edge(a:V3,b:V3):Beam{return {a,b};}
function cuboid(w:number,h:number,d:number):Beam[]{
 const x=w/2,y=h/2,z=d/2;
 const beams:Beam[]=[];
 for(const yy of [-y,y])for(const zz of [-z,z])
  beams.push(edge([-x,yy,zz],[x,yy,zz]));
 for(const xx of [-x,x])for(const zz of [-z,z])
  beams.push(edge([xx,-y,zz],[xx,y,zz]));
 for(const xx of [-x,x])for(const yy of [-y,y])
  beams.push(edge([xx,yy,-z],[xx,yy,z]));
 return beams;
}
export function hollowBeams(shape:HollowShape,size:V3):Beam[]{
 const [w,h,d]=size;
 if(shape==='frame-cube'||shape==='frame-rect')return cuboid(w,h,d);
 if(shape==='frame-pyramid'){
  const y=-h/2,x=w/2,z=d/2;
  const corners:V3[]=[[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]];
  const apex:V3=[0,h/2,0];
  return corners.map((p,i)=>edge(p,corners[(i+1)%4]!))
   .concat(corners.map(p=>edge(p,apex)));
 }
 // Triangular prism (A-frame), OPEN front and back. Ball fits inside.
 const y=-h/2,x=w/2,z=d/2;
 const front:V3[]=[[-x,y,-z],[x,y,-z],[0,h/2,-z]];
 const rear:V3[]=[[-x,y,z],[x,y,z],[0,h/2,z]];
 return front.map((p,i)=>edge(p,front[(i+1)%3]!))
  .concat(rear.map((p,i)=>edge(p,rear[(i+1)%3]!)))
  .concat(front.map((p,i)=>edge(p,rear[i]!)));
}
export function frameThickness(size:V3){
 return Math.max(.14,Math.min(.23,Math.min(...size)*.075));
}
export function frameOpening(shape:HollowShape,size:V3){
 const thick=frameThickness(size);
 return {width:size[0]-2*thick,
  height:shape==='frame-pyramid'||shape==='frame-triangle'?
   size[1]*.50-2*thick:size[1]-2*thick,
  depth:size[2]-2*thick};
}
export function makeHollowFrame(app:AppBase,item:SpawnItem,position:V3,
 primary:StandardMaterial,accent:StandardMaterial):Entity{
 if(!isHollowShape(item.shape))throw Error('Not a hollow-frame shape');
 const root=new Entity('falling-rock-'+item.wave+'-'+item.slot+'-'+item.shape);
 root.setPosition(...position);
 root.setEulerAngles(SLOPE_DEGREES,0,0);
 root.addComponent('collision',{type:'compound'});
 const thick=frameThickness(item.size);
 const up=new Vec3(0,1,0);
 for(const [i,beam] of hollowBeams(item.shape,item.size).entries()){
  const a=new Vec3(...beam.a),b=new Vec3(...beam.b);
  const axis=b.clone().sub(a);
  const length=axis.length();
  const part=new Entity('hollow-edge-'+i);
  part.setLocalPosition(a.add(b).mulScalar(.5));
  part.setLocalRotation(new Quat().setFromDirections(up,axis.normalize()));
  // No colliders in the empty center; each physical collider corresponds
  // exactly to its glowing visual beam.
  part.addComponent('collision',{type:'box',
   halfExtents:new Vec3(thick/2,length/2,thick/2)});
  part.addComponent('render',{type:'box',
   material:i%3===0?accent:primary,castShadows:true});
  part.setLocalScale(thick,length,thick);
  root.addChild(part);
 }
 root.addComponent('rigidbody',{type:'dynamic',mass:item.mass,
  friction:.71,restitution:.09,linearDamping:.22,angularDamping:.27});
 app.root.addChild(root);
 return root;
}
