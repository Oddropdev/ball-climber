// Adapted from verified Game Factory W9.4 PlayCanvas/Ammo initialization.
// Import no Ball Runner rules, camera ownership or game-specific systems.
import {
 AmmoPhysicsWorld,AppBase,AppOptions,CameraComponentSystem,
 CollisionComponentSystem,Color,Entity,FILLMODE_FILL_WINDOW,
 LightComponentSystem,RenderComponentSystem,RESOLUTION_AUTO,
 RigidBodyComponentSystem,StandardMaterial,Vec3,WasmModule,createGraphicsDevice
} from 'playcanvas';
export type Point=[number,number,number];
export type Shape=(name:string,type:'box'|'sphere'|'cylinder',pos:Point,
 size:Point,material:StandardMaterial,solid?:'static'|'dynamic'|false,pitch?:number)=>Entity;
export function material(color:string,gloss=.48){
 const m=new StandardMaterial();
 const v=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255) as Point;
 m.diffuse=new Color(...v);
 m.gloss=gloss;m.metalness=.06;m.update();return m;
}
export async function createPhysicsGame(canvas:HTMLCanvasElement){
 const ammo=new URL('ammo/',document.baseURI);
 WasmModule.setConfig('Ammo',{
   glueUrl:new URL('ammo.wasm.js',ammo).href,
   wasmUrl:new URL('ammo.wasm.wasm',ammo).href
 });
 await Promise.race([
   new Promise<void>(resolve=>WasmModule.getInstance('Ammo',()=>resolve())),
   new Promise<never>((_,reject)=>setTimeout(
     ()=>reject(new Error('Ammo physics load timeout')),15000))
 ]);
 const device=await createGraphicsDevice(canvas);
 device.maxPixelRatio=Math.min(window.devicePixelRatio||1,1.5);
 const options=new AppOptions();
 options.graphicsDevice=device;
 options.physicsWorld=new AmmoPhysicsWorld();
 options.componentSystems=[RenderComponentSystem,CameraComponentSystem,
   LightComponentSystem,CollisionComponentSystem,RigidBodyComponentSystem];
 const app=new AppBase(canvas);
 app.init(options);
 app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
 app.setCanvasResolution(RESOLUTION_AUTO);
 (app.systems.rigidbody as RigidBodyComponentSystem).gravity.set(0,-22,0);
 const camera=new Entity('chase-camera');
 camera.addComponent('camera',{fov:55,nearClip:.1,farClip:190,
   clearColor:new Color(.72,.83,.96)});
 camera.setPosition(0,7,19);camera.lookAt(0,5,0);app.root.addChild(camera);
 const light=new Entity('sun');
 light.addComponent('light',{type:'directional',intensity:1.7,castShadows:true,
   shadowResolution:768,shadowBias:.14,normalOffsetBias:.08});
 light.setEulerAngles(45,-28,0);app.root.addChild(light);
 app.scene.ambientLight=new Color(.65,.71,.84);
 const shape:Shape=(name,type,pos,size,surface,solid=false,pitch=0)=>{
   const entity=new Entity(name);entity.setPosition(...pos);
   if(pitch)entity.setEulerAngles(pitch,0,0);
   const visual=new Entity(name+'-visual');
   visual.setLocalScale(...size);
   visual.addComponent('render',{type,material:surface,castShadows:solid!==false});
   entity.addChild(visual);
   if(solid){
     if(type==='box')entity.addComponent('collision',{type:'box',
       halfExtents:new Vec3(size[0]/2,size[1]/2,size[2]/2)});
     else if(type==='sphere')entity.addComponent('collision',{type:'sphere',
       radius:Math.max(...size)/2});
     else entity.addComponent('collision',{type:'cylinder',
       radius:Math.max(size[0],size[2])/2,height:size[1]});
     entity.addComponent('rigidbody',{type:solid,
       mass:solid==='dynamic'?1.4:0,
       friction:solid==='dynamic'?.66:.92,restitution:.10,
       linearDamping:solid==='dynamic'?.24:0,
       angularDamping:solid==='dynamic'?.23:0});
   }
   app.root.addChild(entity);return entity;
 };
 return {app,camera,shape,device};
}
