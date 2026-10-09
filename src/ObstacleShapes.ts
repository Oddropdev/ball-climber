// C1.2: self-authored PlayCanvas/Ammo obstacle silhouettes.
// Visual parts AND corresponding collision primitives belong to one real
// dynamic compound rigidbody; no third-party paid meshes are bundled.
import {AppBase,Entity,StandardMaterial,Vec3} from 'playcanvas';
import {SLOPE_DEGREES,type ObjectShape,type SpawnItem,type V3} from './Course';
export const COMPLEX_SHAPES=[
 'hammer','cross','dumbbell','mace','gate','paddle'
] as const;
export type ComplexShape=typeof COMPLEX_SHAPES[number];
export const isComplexShape=(shape:ObjectShape):shape is ComplexShape=>
 (COMPLEX_SHAPES as readonly string[]).includes(shape);
export type ObstaclePart={name:string;type:'box'|'sphere';offset:V3;
 size:V3;accent?:boolean};
export function obstacleParts(item:SpawnItem):ObstaclePart[]{
 if(!isComplexShape(item.shape))throw Error('unknown compound obstacle');
 const [w,h,d]=item.size;
 const box=(name:string,offset:V3,size:V3,accent=false):ObstaclePart=>
  ({name,type:'box',offset,size,accent});
 const orb=(name:string,offset:V3,size:V3,accent=false):ObstaclePart=>
  ({name,type:'sphere',offset,size,accent});
 switch(item.shape){
  case 'hammer':return [
   box('shaft',[0,-h*.10,0],[w*.15,h*.82,d*.17],true),
   box('head',[0,h*.33,0],[w,h*.24,d*.8])
  ];
  case 'cross':return [
   box('axis-x',[0,0,0],[w,h*.25,d*.29]),
   box('axis-z',[0,0,0],[w*.29,h*.25,d],true),
   orb('hub',[0,0,0],[w*.30,h*.45,d*.30])
  ];
  case 'dumbbell':return [
   box('axle',[0,0,0],[w*.78,h*.14,d*.18],true),
   orb('weight-left',[-w*.37,0,0],[w*.25,h*.63,d*.7]),
   orb('weight-right',[w*.37,0,0],[w*.25,h*.63,d*.7])
  ];
  case 'mace':{
   const parts:ObstaclePart[]=[orb('core',[0,0,0],[w*.62,h*.62,d*.62])];
   for(const dir of [-1,1]){
    parts.push(box('spike-x-'+dir,[dir*w*.38,0,0],
     [w*.30,h*.15,d*.15],true));
    parts.push(box('spike-y-'+dir,[0,dir*h*.38,0],
     [w*.15,h*.30,d*.15],true));
    parts.push(box('spike-z-'+dir,[0,0,dir*d*.38],
     [w*.15,h*.15,d*.30],true));
   }
   return parts;
  }
  case 'gate':return [
   box('cap',[0,h*.40,0],[w,h*.20,d*.8]),
   box('left',[-w*.41,-h*.05,0],[w*.17,h*.72,d*.25],true),
   box('right',[w*.41,-h*.05,0],[w*.17,h*.72,d*.25],true)
  ];
  case 'paddle':return [
   box('main',[0,0,0],[w,h*.32,d*.34]),
   box('cross-brace',[0,0,0],[w*.22,h*.8,d*.2],true),
   orb('center',[0,0,d*.13],[w*.32,h*.38,d*.32],true)
  ];
 }
}
export function makeFallingObstacle(app:AppBase,item:SpawnItem,
 position:V3,primary:StandardMaterial,accent:StandardMaterial):Entity{
 const parent=new Entity('falling-rock-'+item.wave+'-'+item.slot+'-'+item.shape);
 parent.setPosition(...position);
 parent.setEulerAngles(SLOPE_DEGREES,0,0);
 parent.addComponent('collision',{type:'compound'});
 for(const part of obstacleParts(item)){
  const child=new Entity(item.shape+'-'+part.name);
  child.setLocalPosition(...part.offset);
  if(part.type==='sphere')
   child.addComponent('collision',{type:'sphere',
    radius:Math.max(...part.size)/2});
  else child.addComponent('collision',{type:'box',
   halfExtents:new Vec3(part.size[0]/2,part.size[1]/2,part.size[2]/2)});
  child.addComponent('render',{type:part.type,
   material:part.accent?accent:primary,castShadows:true});
  child.setLocalScale(...part.size);
  parent.addChild(child);
 }
 parent.addComponent('rigidbody',{type:'dynamic',mass:item.mass,
  friction:.73,restitution:item.shape==='mace'?.23:.12,
  linearDamping:.20,angularDamping:.24});
 app.root.addChild(parent);
 return parent;
}
