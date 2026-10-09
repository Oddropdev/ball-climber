// C1.5 independent extended Infinite Mode geometry. Preserve C0.7's 48m
// physical scene and course unit contract unchanged.
import {COS_SLOPE,NORMAL,SIN_SLOPE,UP,type V3} from './Course';
export const INFINITE_SLOPE_LENGTH=60; // +25% real uphill distance.
export function summitCenterZ(length=INFINITE_SLOPE_LENGTH){
 return -length*COS_SLOPE-6.5;
}
export function summitLandingZ(length=INFINITE_SLOPE_LENGTH){
 return summitCenterZ(length)+2.2;
}
export function magnetCoordinates(length=INFINITE_SLOPE_LENGTH){
 const diff=(length-48)*COS_SLOPE;
 return {
  startProgress:length-4.5,
  maxProgress:length+10,
  targetZ:-28.3-diff,
  leftLipZ:-22.7-diff,
  overDeckZ:-24.2-diff,
  minZ:-37.3-diff,
  maxZ:-16.5-diff
 };
}
export function steepSlopeCamera(ball:{x:number;y:number;z:number}){
 // A genuine third-person slope-tangent chase: camera down the 60° ramp
 // BEHIND the ball, looking toward 8.5m of climb above it, not at the sky.
 const down=4.8,camNormal=1.55,look=8.5,lookNormal=2.55;
 const camera:V3=[
  ball.x*.78,
  ball.y-UP[1]*down+NORMAL[1]*camNormal,
  ball.z-UP[2]*down+NORMAL[2]*camNormal
 ];
 const target:V3=[
  ball.x*.95,
  ball.y+SIN_SLOPE*look+NORMAL[1]*lookNormal,
  ball.z-COS_SLOPE*look+NORMAL[2]*lookNormal
 ];
 return {camera,target,fov:65};
}
export function cameraPitchDegrees(camera:V3,target:V3){
 const dy=target[1]-camera[1];
 const planar=Math.hypot(target[0]-camera[0],target[2]-camera[2]);
 return Math.atan2(dy,planar)*180/Math.PI;
}
