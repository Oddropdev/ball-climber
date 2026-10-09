// Cheap conservative sphere proxy for camera-to-ball obstruction tests.
// Visual fade only: Bullet collision bodies are never disabled.
import {clamp,type V3} from './Course';
export function blocksCameraSegment(camera:V3,player:V3,center:V3,radius:number){
 const sx=player[0]-camera[0],sy=player[1]-camera[1],sz=player[2]-camera[2];
 const len2=sx*sx+sy*sy+sz*sz;
 if(len2<.001)return false;
 const fraction=((center[0]-camera[0])*sx+(center[1]-camera[1])*sy+
  (center[2]-camera[2])*sz)/len2;
 if(fraction<=.08||fraction>=.98)return false;
 const t=clamp(fraction,0,1);
 return (center[0]-camera[0]-sx*t)**2+
  (center[1]-camera[1]-sy*t)**2+
  (center[2]-camera[2]-sz*t)**2<radius*radius;
}

// C0.7: two levels of visual occlusion with the ORIGINAL physics intact.
// A giant close to the camera must become much more translucent than a
// small crate; never fade rewards that the player is trying to collect.
export type OcclusionTier=0|1|2;
export function visualOcclusionTier(camera:V3,player:V3,center:V3,
 radius:number,isLoot:boolean):OcclusionTier{
 if(isLoot||!blocksCameraSegment(camera,player,center,radius))return 0;
 const cameraDistance=Math.hypot(center[0]-camera[0],
  center[1]-camera[1],center[2]-camera[2]);
 return radius>=2.4||cameraDistance<Math.max(4,radius*1.6)?2:1;
}
