// C1.0 Infinite Climb: deterministic finite work per level, not 1,000 scenes.
// Each new level is rebuilt from one bounded spec, with a guaranteed summit.
import {makeRng} from './Course';
import {INFINITE_SLOPE_LENGTH} from './InfiniteGeometry';
export type Biome='rocky'|'stormwall'|'scrapfall'|'candy';
export type LevelSpec={
 index:number;seed:number;biome:Biome;title:string;
 waveSeed:number;sky:string;road:string;stripe:string;island:string;
 danger:string;decorSeed:number;sideBoulders:number;
 summitWidth:number;slopeLength:number;difficulty:number;
};
const themes=[
 {biome:'rocky' as const,title:'ROCKY ASCENT',sky:'#BDD9F4',road:'#9A83D1',
  stripe:'#BEAFE4',island:'#88D4CD',danger:'#EA8793'},
 {biome:'stormwall' as const,title:'STORMWALL',sky:'#A4D8EE',road:'#75A9DC',
  stripe:'#D2F3FF',island:'#D9EEFC',danger:'#DB6D87'},
 {biome:'scrapfall' as const,title:'SCRAPFALL',sky:'#F4D0AD',road:'#B48698',
  stripe:'#F1C179',island:'#C1B0A3',danger:'#C96965'},
 {biome:'candy' as const,title:'CANDY CASCADE',sky:'#E8C5ED',road:'#E4A4CD',
  stripe:'#FFE5B9',island:'#C9AEDF',danger:'#E8799D'}
];
export function levelSpec(index:number):LevelSpec{
 if(!Number.isSafeInteger(index)||index<1||index>1_000_000)
  throw Error('level out of supported bounds');
 // Alternate silhouettes and hazard pools every level rather than
 // repeating one biome for twelve almost identical climbs.
 const biomeIndex=(index-1)%themes.length;
 const theme=themes[biomeIndex]!;
 const seed=(Math.imul(index,0x9e3779b9)^0xa51a1719)>>>0;
 const random=makeRng(seed);
 return {
  index,seed,biome:theme.biome,title:theme.title,
  waveSeed:index===1?1719:(seed^0x00171905)>>>0,
  decorSeed:Math.floor(random()*0xffffffff),
  sky:theme.sky,road:theme.road,stripe:theme.stripe,
  island:theme.island,danger:theme.danger,
  sideBoulders:0, // C1.4: remove old solid edge blockers
  summitWidth:9+Math.floor(random()*3),
  slopeLength:INFINITE_SLOPE_LENGTH,
  difficulty:Math.min(10,1+Math.floor((index-1)/15))
 };
}
export function validateLevelSpec(s:LevelSpec){
 return s.slopeLength===INFINITE_SLOPE_LENGTH&&
  s.summitWidth>=9&&s.summitWidth<=11&&
  s.sideBoulders===0&&
  s.difficulty>=1&&s.difficulty<=10&&
  s.waveSeed>=0&&s.index>0;
}
