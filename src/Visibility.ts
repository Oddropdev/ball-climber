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
