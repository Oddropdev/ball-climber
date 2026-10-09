// Game-specific, deterministic data. No PlayCanvas dependency.
export const LEVEL_HEIGHT=42;
export const WALL_HALF_WIDTH=5;
export const PLAYER_RADIUS=.58;
export const PLAYER_FRONT_Z=1.005;
export const CHECKPOINT_GAP=10;
export type SpawnKind='rock'|'loot';
export type SpawnSpec={id:number;kind:SpawnKind;lane:number;radius:number;startHeight:number};
export function makeRng(seed:number){
  let s=seed>>>0;
  return ()=>{
    s+=0x6d2b79f5;
    let x=s;
    x=Math.imul(x^(x>>>15),x|1);
    x^=x+Math.imul(x^(x>>>7),x|61);
    return ((x^(x>>>14))>>>0)/4294967296;
  };
}
export function spawnPlan(seed:number):SpawnSpec[]{
  const r=makeRng(seed);
  return Array.from({length:18},(_,id)=>{
    const kind:SpawnKind=id%3===0?'loot':'rock';
    return {id,kind,lane:(r()-.5)*7,radius:kind==='loot'?.42:.55+r()*.35,
      startHeight:9+r()*21};
  });
}
export function nearestCheckpoint(y:number){
  return Math.max(1.8,Math.floor(Math.max(0,y-1.8)/CHECKPOINT_GAP)*CHECKPOINT_GAP+1.8);
}
export function shouldRecover(x:number,y:number,z:number){
  return ![x,y,z].every(Number.isFinite) || y<-.8 || x<-WALL_HALF_WIDTH-2 ||
    x>WALL_HALF_WIDTH+2 || z>4.0 || z<-.8;
}
export function clamp(x:number,lo:number,hi:number){return Math.min(hi,Math.max(lo,x));}
