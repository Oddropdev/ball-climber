// Real dynamic compound Bullet shapes: empty space under seats and tables
// remains traversable (unlike an invisible full-cube proxy collider).
import {AppBase,Entity,StandardMaterial,Vec3} from 'playcanvas';
import {SLOPE_DEGREES,type SpawnItem,type V3} from './Course';
type Part={name:string;offset:V3;size:V3};
export function furnitureParts(item:SpawnItem):Part[]{
 if(item.shape!=='table'&&item.shape!=='chair')throw Error('not furniture');
 const [w,h,d]=item.size;
 const foot=.24,top=.23,legH=h-top;
 const parts:Part[]=[];
 if(item.shape==='table'){
  parts.push({name:'open-top',offset:[0,h/2-top/2,0],size:[w,top,d]});
  for(const x of [-1,1])for(const z of [-1,1])
   parts.push({name:'support-'+x+'-'+z,
    offset:[x*(w/2-foot/2),-top/2,z*(d/2-foot/2)],
    size:[foot,legH,foot]});
 }else{
  const seatY=-.1,seatThickness=.23;
  parts.push({name:'open-chair-seat',offset:[0,seatY,0],
   size:[w,seatThickness,d]});
  const seatBottom=seatY-seatThickness/2;
  const legsHeight=seatBottom+h/2;
  for(const x of [-1,1])for(const z of [-1,1])
   parts.push({name:'chair-leg-'+x+'-'+z,
    offset:[x*(w/2-foot/2),-h/2+legsHeight/2,
      z*(d/2-foot/2)],size:[foot,legsHeight,foot]});
  const backHeight=h/2-seatY;
  parts.push({name:'chair-back',
   offset:[0,seatY+backHeight/2,-d/2+top/2],
   size:[w,backHeight,top]});
 }
 return parts;
}
export function furnitureOpening(item:SpawnItem){
 const [w,h,d]=item.size;
 const width=w-.48,depth=d-.48;
 const height=item.shape==='table'?h-.23:
  h/2-.1-.23/2;
 return {width,depth,height};
}
export function makeFurniture(app:AppBase,item:SpawnItem,
 position:V3,mat:StandardMaterial):Entity{
 const parent=new Entity('falling-rock-'+item.wave+'-'+item.slot+
  '-'+item.shape);
 parent.setPosition(...position);
 parent.setEulerAngles(SLOPE_DEGREES,0,0);
 parent.addComponent('collision',{type:'compound'});
 const parts=furnitureParts(item);
 for(const part of parts){
  const child=new Entity(item.shape+'-'+part.name);
  child.setLocalPosition(...part.offset);
  child.addComponent('collision',{type:'box',
   halfExtents:new Vec3(part.size[0]/2,part.size[1]/2,part.size[2]/2)});
  child.addComponent('render',{type:'box',material:mat,castShadows:true});
  child.setLocalScale(...part.size);
  parent.addChild(child);
 }
 parent.addComponent('rigidbody',{type:'dynamic',mass:item.mass,
  friction:.72,restitution:.08,linearDamping:.2,angularDamping:.26});
 app.root.addChild(parent);
 return parent;
}
