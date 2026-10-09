import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
test('C1.3: extended physical fall starts next attempt at bottom, not checkpoint',async({page})=>{
 test.setTimeout(45_000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 const first=await state(page);
 expect(first.gauntletActors).toBe(8);
 expect(first.gauntletChairs).toBe(5);
 expect(first.gauntletLoot).toBe(2);
 expect(first.furnitureCompoundBodies).toBeGreaterThan(5);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testFall?.());
 await expect.poll(async()=>(await state(page))?.x,{timeout:1500}).toBeGreaterThan(7);
 await page.waitForTimeout(100);
 expect((await state(page)).falls).toBe(0); // do not rewind at edge
 await expect.poll(async()=>(await state(page))?.falls,{timeout:7000}).toBe(1);
 const s=await state(page);
 expect(s.checkpointS).toBe(2);
 expect(s.maxProgress).toBe(2);
 expect(s.progress).toBeLessThan(6);
 expect(Math.abs(s.x)).toBeLessThan(1);
 expect(s.phase).toBe('running');
 expect(errors).toEqual([]);
});
test('C1.3: heavy charge control retains old C0.7 but infinite sideways is useful',async({page})=>{
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 const before=await state(page);
 expect(before.lightweightLateralControl).toBe(1);
 expect(before.heavyweightLateralControl).toBeCloseTo(.58);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testSwipe?.('left'));
 await expect.poll(async()=>(await state(page))?.sideFlicks,{timeout:1200}).toBe(1);
 await expect.poll(async()=>(await state(page))?.ballVelocityX,
  {timeout:1300}).toBeLessThan(-1.9);
 expect((await state(page)).lastSideControlFraction).toBe(1);
});
test('C1.3: low camera default and reversible classic A/B, no device work',async({page})=>{
 test.setTimeout(45_000);
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 let a=await state(page);
 expect(a.cameraLowMode).toBe(true);
 expect(a.cameraDrop).toBeLessThan(-2);
 await page.screenshot({path:'test-results/c13-low-camera.png'});
 await page.goto('/?mode=infinite&camera=classic&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 a=await state(page);
 expect(a.cameraLowMode).toBe(false);
 expect(a.cameraDrop).toBe(0);
 await page.screenshot({path:'test-results/c13-classic-camera.png'});
});
test('C1.3: original level completion still needs real Bullet deck contact',async({page})=>{
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachSummit?.());
 await expect.poll(async()=>(await state(page))?.phase,{timeout:9000}).toBe('summit');
 expect((await state(page)).verifiedSummitArrivals).toBe(1);
});
