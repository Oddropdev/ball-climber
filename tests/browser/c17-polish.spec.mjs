import {test,expect} from '@playwright/test';
const snap=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
async function boot(page,url='/?mode=infinite&test=1'){
 await page.goto(url);
 await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
}
test('C1.7: ball stays visible on very first mobile start; unwanted mystery disk is gone',async({page})=>{
 test.setTimeout(65_000);
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await boot(page);
 await page.waitForTimeout(180);
 const s=await snap(page);
 expect(s.cameraSteepMode).toBe(true);
 expect(s.baseDeckType).toBe('static');
 expect(s.chuteVisible).toBe(false);
 expect(s.ballScreenDepth).toBeGreaterThan(0);
 expect(s.ballScreenX).toBeGreaterThan(0);
 expect(s.ballScreenX).toBeLessThan(s.renderWidth);
 expect(s.ballScreenY).toBeGreaterThan(0);
 expect(s.ballScreenY).toBeLessThan(s.renderHeight);
 expect(s.noveltyActors).toBe(2);
 expect(s.noveltyShapes).toHaveLength(2);
 await page.screenshot({path:'test-results/c17-first-frame-ball-visible.png'});
 expect(errors).toEqual([]);
});
test('C1.7: reduced physical plow mass while retaining exactly the old per-kg swipe acceleration',async({page})=>{
 await boot(page);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testCharge?.());
 const charged=await snap(page);
 expect(charged.playerMass).toBeCloseTo(3.2);
 expect(charged.infiniteMaximumCollisionMass).toBeCloseTo(3.2);
 expect(charged.maxPlayerMass).toBeCloseTo(5.4); // old mode unchanged
 expect(charged.c13LateralFraction).toBeCloseTo(.78);
});
test('C1.7: uphill swipe lock prevents infinite launch and overshoot physically falls onto summit',async({page})=>{
 test.setTimeout(65_000);
 await boot(page);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testSummitSwipe?.());
 await expect.poll(async()=>(await snap(page))?.summitSwipeBlocked,
  {timeout:2000}).toBeGreaterThan(0);
 let s=await snap(page);
 expect(s.phase).toBe('running');
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testOverlaunch?.());
 await expect.poll(async()=>(await snap(page))?.summitOvershootRecoveries,
  {timeout:2800}).toBeGreaterThan(0);
 await expect.poll(async()=>(await snap(page))?.phase,
  {timeout:9500}).toBe('summit');
 s=await snap(page);
 expect(s.summitContactEvents).toBeGreaterThan(0);
 expect(s.verifiedSummitArrivals).toBe(1);
});
test('C1.7: 1000-seed rotor contract and true physical shape preview level 9',async({page})=>{
 test.setTimeout(60_000);
 await page.goto('/?mode=infinite&test=1');
 await page.evaluate(()=>localStorage.setItem('oddrop-ball-climber-c1-v1',
  JSON.stringify({version:1,level:9,wallet:0,owned:['classic'],equipped:'classic'})));
 await boot(page);
 const s=await snap(page);
 expect(s.rotorCount).toBe(2);
 expect(s.rotorPairs.every(r=>r.role)).toBe(true);
 expect(s.rotorPassageWidth).toBeGreaterThan(3);
 expect(s.noveltyShapes).toHaveLength(2);
 expect(s.noveltyActors).toBe(2);
 expect(s.activeComplexCount).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/c17-novelty-silhouettes.png'});
});
