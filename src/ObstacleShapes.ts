// C1.2: self-authored PlayCanvas/Ammo obstacle silhouettes.
// Visual parts AND corresponding collision primitives belong to one real
// dynamic compound rigidbody; no third-party paid meshes are bundled.
import {AppBase,Entity,StandardMaterial,Vec3} from 'playcanvas';
import {SLOPE_DEGREES,type ObjectShape,type SpawnItem,type V3} from './Course';
export const COMPLEX_SHAPES=[
 'hammer','cross','dumbbell','mace','gate','paddle',
 'pyramid','triangle','banana','car','sofa','stool','boot','glove','hat'
] as const;
export type ComplexShape=typeof COMPLEX_SHAPES[number];
export const isComplexShape=(shape:ObjectShape):shape is ComplexShape=>
 (COMPLEX_SHAPES as readonly string[]).includes(shape);
export type ObstaclePart={name:string;type:'box'|'sphere'|'cylinder'|'cone';offset:V3;
 size:V3;accent?:boolean;tilt?:number};
export function obstacleParts(item:SpawnItem):ObstaclePart[]{
 if(!isComplexShape(item.shape))throw Error('unknown compound obstacle');
 const [w,h,d]=item.size;
 const box=(name:string,offset:V3,size:V3,accent=false):ObstaclePart=>
  ({name,type:'box',offset,size,accent});
 const orb=(name:string,offset:V3,size:V3,accent=false):ObstaclePart=>
  ({name,type:'sphere',offset,size,accent});
 const cyl=(name:string,offset:V3,size:V3,accent=false):ObstaclePart=>
  ({name,type:'cylinder',offset,size,accent});
 const cone=(name:string,offset:V3,size:V3):ObstaclePart=>
  ({name,type:'cone',offset,size});
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
  // C1.7: distinct self-authored silhouettes built of bounded compound
  // Bullet colliders. The visuals are intentionally modest on old phones.
  case 'pyramid':return [
   box('square-base',[0,-h*.38,0],[w,d*.13,d]),
   box('mid-tier',[0,-h*.15,0],[w*.74,h*.32,d*.74],true),
   box('upper-tier',[0,h*.14,0],[w*.46,h*.31,d*.46]),
   cone('sharp-apex',[0,h*.40,0],[w*.23,h*.23,d*.23])
  ];
  case 'triangle':return [
   box('triangle-foot',[0,-h*.43,0],[w,.14*h,d]),
   {...box('left-slope',[-w*.23,0,0],[w*.16,h*.94,d*.50],true),tilt:-28},
   {...box('right-slope',[w*.23,0,0],[w*.16,h*.94,d*.50]),tilt:28}
  ];
  case 'banana':return [
   orb('crescent-tip-a',[-w*.40,h*.20,0],[w*.22,h*.24,d*.55]),
   orb('crescent-middle-a',[-w*.24,-h*.05,0],[w*.33,h*.36,d*.58],true),
   orb('crescent-belly',[0,-h*.19,0],[w*.37,h*.40,d*.62]),
   orb('crescent-middle-b',[w*.24,-h*.05,0],[w*.33,h*.36,d*.58],true),
   orb('crescent-tip-b',[w*.40,h*.20,0],[w*.22,h*.24,d*.55])
  ];
  case 'car':return [
   box('chassis',[0,-h*.12,0],[w*.97,h*.42,d*.84]),
   box('cabin',[0,h*.23,-d*.06],[w*.60,h*.42,d*.61],true),
   cyl('wheel-l',[-w*.34,-h*.37,0],[w*.23,h*.20,d*.25]),
   cyl('wheel-r',[w*.34,-h*.37,0],[w*.23,h*.20,d*.25])
  ];
  case 'sofa':return [
   box('seat',[0,-h*.21,0],[w*.95,h*.34,d*.86]),
   box('cushion',[0,-h*.06,-d*.04],[w*.80,h*.20,d*.60],true),
   box('back',[0,h*.27,-d*.36],[w*.95,h*.52,d*.19]),
   box('arm-left',[-w*.43,h*.06,0],[w*.14,h*.42,d*.83],true),
   box('arm-right',[w*.43,h*.06,0],[w*.14,h*.42,d*.83],true)
  ];
  case 'stool':return [
   cyl('seat',[0,h*.31,0],[w*.85,h*.17,d*.83]),
   box('leg-left',[-w*.29,-h*.13,-d*.25],[w*.14,h*.73,d*.14],true),
   box('leg-right',[w*.29,-h*.13,-d*.25],[w*.14,h*.73,d*.14],true),
   box('leg-rear',[0,-h*.13,d*.29],[w*.14,h*.73,d*.14],true),
   box('foot-bar',[0,-h*.23,0],[w*.64,h*.09,d*.10])
  ];
  case 'boot':return [
   box('tall-shaft',[0,h*.15,-d*.22],[w*.62,h*.73,d*.60]),
   box('toe',[0,-h*.34,d*.23],[w*.87,h*.25,d*.72],true),
   box('heel',[0,-h*.37,-d*.34],[w*.65,h*.19,d*.36])
  ];
  case 'glove':return [
   box('palm',[0,-h*.12,0],[w*.73,h*.49,d*.69]),
   box('cuff',[0,-h*.40,0],[w*.76,h*.23,d*.75],true),
   box('thumb',[-w*.44,h*.05,0],[w*.26,h*.37,d*.34]),
   box('finger-1',[-w*.25,h*.34,0],[w*.17,h*.40,d*.31],true),
   box('finger-2',[-w*.08,h*.39,0],[w*.17,h*.45,d*.31]),
   box('finger-3',[w*.09,h*.36,0],[w*.17,h*.43,d*.31],true),
   box('finger-4',[w*.26,h*.28,0],[w*.17,h*.35,d*.31])
  ];
  case 'hat':return [
   cyl('wide-brim',[0,-h*.32,0],[w,h*.14,d]),
   cyl('round-crown',[0,h*.04,0],[w*.51,h*.66,d*.51],true),
   cyl('hat-band',[0,-h*.16,0],[w*.54,h*.11,d*.54])
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
  if(part.tilt)child.setLocalEulerAngles(0,0,part.tilt);
  if(part.type==='sphere')
   child.addComponent('collision',{type:'sphere',
    radius:Math.max(...part.size)/2});
  else if(part.type==='cylinder'||part.type==='cone')
   child.addComponent('collision',{type:'cylinder',
    radius:Math.max(part.size[0],part.size[2])/2,height:part.size[1]});
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
