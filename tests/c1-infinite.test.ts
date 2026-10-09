import {test,expect} from 'vitest';
import {levelSpec,validateLevelSpec} from '../src/LevelSpec';
import {SKINS,INITIAL_SAVE,safeSave,purchaseSkin,
 bankSummitLoot,unlockNextLevel} from '../src/SkinShop';
import {SLOPE_LENGTH} from '../src/Course';
import {summitSurfaceY} from '../src/ClimbLevel';

test('C1.0: deterministic 1,000-level corpus is bounded and repeats exactly',()=>{
 const ids=new Set<number>(),seeds=new Set<number>(),biomes=new Set();
 for(let i=1;i<=1000;i++){
  const a=levelSpec(i),b=levelSpec(i);
  expect(a).toEqual(b);
  expect(validateLevelSpec(a)).toBe(true);
  expect(a.index).toBe(i);
  expect(a.slopeLength).toBe(SLOPE_LENGTH);
  expect(a.summitWidth).toBeGreaterThanOrEqual(9);
  expect(a.sideBoulders).toBe(0);
  ids.add(a.index);seeds.add(a.waveSeed);biomes.add(a.biome);
 }
 expect(ids.size).toBe(1000);
 expect(seeds.size).toBe(1000);
 expect(biomes.size).toBe(4);
 expect(levelSpec(1).waveSeed).toBe(1719);
 expect(levelSpec(2).biome).toBe('stormwall');
 expect(levelSpec(250).difficulty).toBeLessThanOrEqual(10);
 expect(()=>levelSpec(0)).toThrow();
 expect(()=>levelSpec(1.6)).toThrow();
 expect(()=>levelSpec(-1)).toThrow();
});
test('C1.0: summit is physically higher than original slope start',()=>{
 expect(summitSurfaceY()).toBeGreaterThan(40);
 expect(summitSurfaceY()).toBeLessThan(44);
});
test('C1.0: cosmetic purchases do not grant movement powers',()=>{
 expect(SKINS).toHaveLength(4);
 const baseline=safeSave(INITIAL_SAVE);
 expect(baseline.owned).toEqual(['classic']);
 expect(baseline.equipped).toBe('classic');
 const afterPoor=purchaseSkin(baseline,'midnight');
 expect(afterPoor).toEqual(baseline);
 const banked=bankSummitLoot(baseline,50);
 expect(banked.wallet).toBe(50);
 const purchased=purchaseSkin(banked,'midnight');
 expect(purchased.wallet).toBe(10);
 expect(purchased.equipped).toBe('midnight');
 expect(purchased.owned).toContain('midnight');
 const again=purchaseSkin(purchased,'midnight');
 expect(again.wallet).toBe(10);
 expect(unlockNextLevel(again).level).toBe(2);
 expect(unlockNextLevel(again).wallet).toBe(10);
 for(const skin of SKINS){
  expect('speed' in skin).toBe(false);
  expect('mass' in skin).toBe(false);
  expect('power' in skin).toBe(false);
 }
});
test('C1.0: localStorage data is strictly sanitized',()=>{
 const broken=safeSave({level:-99,wallet:1e99,owned:['crash','mint','mint'],
  equipped:'midnight',version:999});
 expect(broken.level).toBe(1);
 expect(broken.wallet).toBe(0);
 expect(broken.owned).toEqual(['classic','mint']);
 expect(broken.equipped).toBe('classic');
 expect(safeSave(null)).toEqual(INITIAL_SAVE);
 expect(()=>bankSummitLoot(INITIAL_SAVE,-1)).toThrow();
 expect(()=>bankSummitLoot(INITIAL_SAVE,2.5)).toThrow();
});
