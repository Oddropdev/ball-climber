import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
for(const view of [{width:390,height:844},{width:360,height:800}]){
 test('C1.1: first-frame real obstacle/loot intercept, raised box and safe mobile HUD '+view.width,async({page})=>{
  test.setTimeout(55_000);
  await page.setViewportSize(view);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=infinite&test=1');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
  await page.locator('#start').click();
  const s=await state(page);
  expect(s.infiniteMode).toBe(true);
  expect(s.prewarmedActors).toBe(8);
  expect(s.prewarmedRocks).toBe(5);
  expect(s.prewarmedLoot).toBe(3);
  expect(s.spawnedTotal).toBeGreaterThanOrEqual(8);
  expect(s.liveFalling).toBeGreaterThanOrEqual(7);
  expect(s.barrelSpawned).toBeGreaterThan(0);
  expect(s.beamSpawned).toBeGreaterThan(0);
  expect(s.bouncerSpawned).toBeGreaterThan(0);
  expect(s.mysterySize).toBeGreaterThan(7);
  expect(s.mysteryPositionY-s.summitPlatformTop).toBeGreaterThan(14);
  expect(s.summitPlatformType).toBe('static');
  await page.screenshot({path:'test-results/c11-prewarmed-'+view.width+'.png'});
  await expect.poll(async()=>(await state(page))?.spawnWaves,
   {timeout:5500}).toBeGreaterThanOrEqual(1);
  const later=await state(page);
  expect(later.liveFalling).toBeLessThanOrEqual(later.activeCap);
  expect(later.spawnedTotal).toBeGreaterThan(s.spawnedTotal);
  expect(errors).toEqual([]);
 });
}
test('C1.1: plateau camera becomes level while physically landing; Shop and Next work',async({page})=>{
 test.setTimeout(55_000);
 await page.goto('/?mode=infinite&test=1');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachSummit?.());
 await expect.poll(async()=>(await state(page))?.phase,{timeout:9000}).toBe('summit');
 await expect.poll(async()=>(await state(page))?.arrivalCameraBlend,
  {timeout:6000}).toBeGreaterThan(.95);
 const s=await state(page);
 expect(s.summitContactEvents).toBeGreaterThan(0);
 expect(s.verifiedSummitArrivals).toBe(1);
 expect(s.cameraY).toBeGreaterThan(s.y+1);
 expect(s.cameraZ).toBeGreaterThan(s.z+9);
 await page.screenshot({path:'test-results/c11-level-summit-camera.png'});
 await page.locator('#shop-button').click();
 await expect(page.locator('.skin-item')).toHaveCount(4);
 await page.locator('#shop-back').click();
 await page.locator('#start').click();
 const two=await state(page);
 expect(two.levelIndex).toBe(2);
 expect(two.prewarmedActors).toBe(8);
 expect(two.summitPlatformType).toBe('static');
 expect(two.rigidbodyType).toBe('dynamic');
});
test('C1.1: original default C0.7 emitter remains intact',async({page})=>{
 await page.goto('/');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
 const s=await state(page);
 expect(s.infiniteMode).toBe(false);
 expect(s.prewarmedActors).toBe(0);
 expect(s.mysterySize).toBe(5.3);
 expect(s.barrelSpawned).toBe(0);
 expect(s.beamSpawned).toBe(0);
 expect(s.bouncerSpawned).toBe(0);
});
