import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
test('C1.2: near-top physics magnet catches a genuine uphill approach',async({page})=>{
 test.setTimeout(60_000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 const before=await state(page);
 expect(before.magnetTicks).toBe(0);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachMagnet?.());
 await expect.poll(async()=>(await state(page))?.magnetTicks,{timeout:4500}).toBeGreaterThan(5);
 try{
  await expect.poll(async()=>(await state(page))?.phase,{timeout:8500}).toBe('summit');
 }catch(err){
  console.log('C12_UPHILL_MAGNET_DIAGNOSTIC',JSON.stringify(await state(page)));
  throw err;
 }
 const after=await state(page);
 expect(after.summitContactEvents).toBeGreaterThan(0);
 expect(after.verifiedSummitArrivals).toBe(1);
 expect(after.magnetEngagements).toBeGreaterThan(0);
 expect(after.rigidbodyType).toBe('kinematic');
 expect(errors).toEqual([]);
 await page.screenshot({path:'test-results/c12-magnetic-landing.png'});
});
test('C1.2: new compound hazards arrive immediately; Level 2 changes silhouettes',async({page})=>{
 test.setTimeout(65_000);
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 let a=await state(page);
 expect(a.complexSpawned).toBeGreaterThan(0);
 expect(a.activeComplexCount).toBeGreaterThanOrEqual(1);
 expect(a.activeComplexCount).toBeLessThanOrEqual(6);
 expect(a.activeShapes).toContain('hammer');
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachSummit?.());
 try{
  await expect.poll(async()=>(await state(page))?.phase,{timeout:7500}).toBe('summit');
 }catch(err){
  console.log('C12_DIRECT_PLATFORM_DIAGNOSTIC',JSON.stringify(await state(page)));
  throw err;
 }
 await page.locator('#start').click();
 a=await state(page);
 expect(a.levelIndex).toBe(2);
 expect(a.biome).toBe('stormwall');
 expect(a.activeShapes).toContain('cross');
 expect(a.activeShapes).toContain('paddle');
 expect(a.activeShapes).not.toContain('hammer');
 expect(a.activeComplexCount).toBeLessThanOrEqual(6);
});
