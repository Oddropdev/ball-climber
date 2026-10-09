import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
async function boot(page,url='/?mode=infinite&test=1'){
 await page.goto(url);
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:24000}).toBe(true);
 await page.locator('#start').click();
}
test('C1.6: real guarded rest camp holds a dynamic ball even after side collision',async({page})=>{
 test.setTimeout(65_000);
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page);
 const a=await state(page);
 expect(a.baseCampExists).toBe(true);
 expect(a.baseDeckType).toBe('static');
 expect(a.baseCampPhysicalCount).toBe(6);
 expect(a.baseDeckTop).toBeCloseTo(.9);
 expect(a.z).toBeCloseTo(a.baseSpawnZ,1);
 expect(a.y).toBeGreaterThan(a.baseDeckTop+.45);
 expect(a.cameraSteepMode).toBe(true);
 expect(a.cameraY).toBeGreaterThan(a.baseDeckTop+.2);
 await page.screenshot({path:'test-results/c16-safe-base-start.png'});
 await page.waitForTimeout(850);
 let b=await state(page);
 expect(b.falls).toBe(0);
 expect(b.z).toBeGreaterThan(1);
 expect(b.y).toBeGreaterThan(.8);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testBaseEdge?.());
 await page.waitForTimeout(1300);
 b=await state(page);
 expect(b.phase).toBe('running');
 expect(b.falls).toBe(0);
 expect(b.y).toBeGreaterThan(.5);
 expect(Math.abs(b.x)).toBeLessThan(5.7);
 expect(errors).toEqual([]);
});
test('C1.6: falling physics actors die before touching camp, no fake player hazard',async({page})=>{
 test.setTimeout(50_000);
 await boot(page);
 let s=await state(page);
 expect(s.hazardKillProgress).toBeCloseTo(1.25);
 expect(s.hazardPurged).toBe(0);
 const destroyedBefore=s.destroyedTotal;
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testPurge?.());
 await expect.poll(async()=>(await state(page))?.hazardPurged,
  {timeout:3000}).toBeGreaterThan(0);
 s=await state(page);
 expect(s.destroyedTotal).toBeGreaterThan(destroyedBefore);
 expect(s.hazardPurged).toBeGreaterThan(0);
 expect(s.falls).toBe(0);
 expect(s.rigidbodyType).toBe('dynamic');
});
test('C1.6: paired real spinning colliders leave a continuously passable center line',async({page})=>{
 test.setTimeout(65_000);
 await page.goto('/?mode=infinite&test=1');
 await page.evaluate(()=>localStorage.setItem('oddrop-ball-climber-c1-v1',
  JSON.stringify({version:1,level:5,wallet:0,owned:['classic'],equipped:'classic'})));
 await boot(page);
 const s=await state(page);
 expect(s.levelIndex).toBe(5);
 expect(s.rotorCount).toBe(2);
 expect(s.rotorPassageWidth).toBeGreaterThan(3);
 expect(s.rotorPairs.every(p=>p.radius<1.84)).toBe(true);
 expect(s.rotorPairs.map(p=>p.direction)).toEqual([-1,1]);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testPairPass?.());
 await expect.poll(async()=>(await state(page))?.maxProgress,{timeout:7000})
  .toBeGreaterThan(s.rotorPairs[0].progress+.1);
 const end=await state(page);
 expect(end.falls).toBe(0);
 expect(Math.abs(end.x)).toBeLessThan(1.3);
 await page.screenshot({path:'test-results/c16-smaller-paired-rotors.png'});
});
test('C1.6: true slope camera and contact-gated summit still work after safe-base start',async({page})=>{
 test.setTimeout(65_000);
 await boot(page);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testGoSlope?.());
 await expect.poll(async()=>(await state(page))?.cameraSlopePitch,
  {timeout:4500}).toBeGreaterThan(58);
 let s=await state(page);
 expect(s.cameraSteepMode).toBe(true);
 expect(s.cameraY).toBeLessThan(s.y-3);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachMagnet?.());
 await expect.poll(async()=>(await state(page))?.phase,{timeout:10000}).toBe('summit');
 s=await state(page);
 expect(s.summitContactEvents).toBeGreaterThan(0);
 expect(s.verifiedSummitArrivals).toBe(1);
});
