import {test,expect} from 'vitest';
import {LEVEL_HEIGHT,spawnPlan,nearestCheckpoint,shouldRecover,
 makeRng} from '../src/Course';
test('short vertical course and authentic hazard/loot mix',()=>{
 expect(LEVEL_HEIGHT).toBe(42);
 const a=spawnPlan(1719),b=spawnPlan(1719),c=spawnPlan(1720);
 expect(a).toEqual(b);expect(a).not.toEqual(c);
 expect(a).toHaveLength(18);
 expect(a.filter(x=>x.kind==='rock')).toHaveLength(12);
 expect(a.filter(x=>x.kind==='loot')).toHaveLength(6);
 expect(a.every(x=>x.lane>=-3.5&&x.lane<=3.5)).toBe(true);
});
test('checkpoint and fall boundaries preserve honest physics',()=>{
 expect(nearestCheckpoint(1.8)).toBe(1.8);
 expect(nearestCheckpoint(25)).toBe(21.8);
 expect(shouldRecover(0,20,1.0)).toBe(false);
 expect(shouldRecover(0,20,4.1)).toBe(true);
 expect(shouldRecover(8.1,20,1)).toBe(true);
 expect(shouldRecover(0,NaN,1)).toBe(true);
 expect(makeRng(3)()).toBe(makeRng(3)());
});
