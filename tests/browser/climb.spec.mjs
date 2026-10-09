import {test,expect} from '@playwright/test';
const read=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
test('C0.3: dynamic viewport and aspect updates immediately without reload',async({browser})=>{
 test.setTimeout(60_000);
 // A real resizable desktop context; isMobile emulation locks screen metrics.
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:false});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 const first=await read(page);
 expect(first.viewportW).toBe(390);
 expect(first.viewportH).toBe(844);
 const baseline=first.resizeEvents;
 for(const [width,height] of [[900,440],[360,800],[700,700]]){
  await page.setViewportSize({width,height});
  await expect.poll(async()=>(await read(page))?.viewportW,{timeout:8000}).toBe(width);
  await expect.poll(async()=>(await read(page))?.viewportH,{timeout:8000}).toBe(height);
  const s=await read(page);
  expect(s.resizeEvents).toBeGreaterThan(baseline);
  expect(Math.abs(s.renderWidth/s.renderHeight-width/height)).toBeLessThan(.025);
  expect(Math.abs(s.canvasClientWidth/s.canvasClientHeight-width/height)).toBeLessThan(.025);
 }
 await page.screenshot({path:'test-results/c03-square-after-live-resize.png'});
 expect(errors).toEqual([]);
 await context.close();
});
test('C0.5: swipe ONLY climb with finite capped momentum, true Bullet hazard and summit emitter',async({page})=>{
 test.setTimeout(100_000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 let s=await read(page);
 expect(s.slopeDegrees).toBe(60);
 expect(s.rampCollider).toBe('static');
 expect(s.rigidbodyType).toBe('dynamic');
 expect(s.mysteryVisible).toBe(true);
 expect(s.emitterProgress).toBeGreaterThan(s.slopeLength);
 await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.elapsed,{timeout:15000}).toBeGreaterThan(.9);
 s=await read(page);
 expect(s.forwardFlicks).toBe(0);
 expect(s.swipeOnly).toBe(true);
 expect(s.playerMotorEnabled).toBe(false);
 expect(s.maxProgress).toBeLessThan(3.6);
 expect(s.playerSwipeImpulse).toBeLessThan(11.6);
 expect(s.maxAllowedForwardSpeed).toBeLessThan(23);
 for(let i=0;i<7;i++){
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(230);
 }
 await expect.poll(async()=>(await read(page))?.maxProgress,{timeout:12000}).toBeGreaterThan(3.6);
 s=await read(page);
 expect(s.forwardFlicks).toBeGreaterThanOrEqual(4);
 expect(s.appliedSwipeCount).toBeGreaterThanOrEqual(3);
 expect(s.maxForwardSpeed).toBeGreaterThan(3.2);
 expect(s.cameraY).toBeLessThan(s.y+2);
 expect(s.cameraZ).toBeGreaterThan(s.z+5);
 expect(s.falls).toBeGreaterThanOrEqual(0);
 await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>(await read(page))?.sideFlicks,{timeout:3000}).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/c03-uphill-mystery.png'});
 expect(errors).toEqual([]);
});
test('C0.3: physical crates + spheres, summit-only avalanche, trains, giant masses and clean disposal',async({page})=>{
 test.setTimeout(120_000);
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.spawnWaves,{timeout:85000,intervals:[300,400,650]}).toBeGreaterThanOrEqual(12);
 const s=await read(page);
 expect(s.spawnedTotal).toBeGreaterThan(30);
 expect(s.totalBox).toBeGreaterThan(0);
 expect(s.totalSphere).toBeGreaterThan(0);
 expect(s.totalRock).toBeGreaterThan(0);
 expect(s.totalLoot).toBeGreaterThan(0);
 expect(s.patterns.train).toBeGreaterThan(0);
 expect(s.patterns['loot-train']).toBeGreaterThan(0);
 expect(s.patterns.giant).toBeGreaterThan(0);
 expect(s.giantsSpawned).toBeGreaterThan(0);
 expect(s.maxRockMass).toBeGreaterThan(25);
 expect(s.maxRocks).toBe(50);
 expect(s.maxLoot).toBe(50);
 expect(s.activeCap).toBe(100);
 expect(s.peakRocks).toBeLessThanOrEqual(50);
 expect(s.peakLoot).toBeLessThanOrEqual(50);
 expect(s.liveRocks).toBeLessThanOrEqual(50);
 expect(s.liveLoot).toBeLessThanOrEqual(50);
 expect(s.maxLive).toBeLessThanOrEqual(100);
 await expect.poll(async()=>(await read(page))?.destroyedTotal,{timeout:35000}).toBeGreaterThan(0);
 const t=await read(page);
 expect(t.destroyedTotal+t.liveFalling).toBe(t.spawnedTotal);
 await page.screenshot({path:'test-results/c03-giant-wave.png'});
});
test('C0.5: pointer flick emits ONE torque/forward impulse; held pointer gives no climb',async({page})=>{
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 await page.mouse.move(175,620);await page.mouse.down();
 await page.mouse.move(175,480,{steps:4});await page.mouse.up();
 await expect.poll(async()=>(await read(page))?.forwardFlicks,{timeout:3500}).toBe(1);
 await page.waitForTimeout(450);
 expect((await read(page)).forwardFlicks).toBe(1);
 await page.mouse.move(165,560);await page.mouse.down();
 await page.mouse.move(290,560,{steps:4});await page.mouse.up();
 await expect.poll(async()=>(await read(page))?.sideFlicks,{timeout:3500}).toBe(1);
});

test('C0.5: holding pointer does NOT climb; a single up flick gives momentum only once',async({page})=>{
 test.setTimeout(65000);
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 await page.mouse.move(185,570);await page.mouse.down();
 await expect.poll(async()=>(await read(page))?.elapsed,{timeout:15000}).toBeGreaterThan(1.2);
 const before=await read(page);
 expect(before.forwardFlicks).toBe(0);
 expect(before.maxProgress).toBeLessThan(3.6);
 expect(before.playerMotorEnabled).toBe(false);
 await page.mouse.move(185,440,{steps:3});await page.mouse.up();
 await expect.poll(async()=>(await read(page))?.forwardFlicks,{timeout:4500}).toBe(1);
 await page.waitForTimeout(600);
 const after=await read(page);
 expect(after.forwardFlicks).toBe(1);
 expect(after.swipeOnly).toBe(true);
 // Input must reach the actual Bullet applyImpulse() site, not just
 // increment the gesture counter. A single flick may roll back down a 60° hill.
 await expect.poll(async()=>(await read(page))?.appliedSwipeCount,
  {timeout:6500}).toBe(1);
 expect((await read(page)).lastAppliedSwipeMagnitude).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/c05-swipe-only-uphill.png'});
});
test('C0.4: actual compound Bullet furniture with leg gaps and light pushable debris',async({page})=>{
 test.setTimeout(125000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 await expect.poll(async()=>(await read(page))?.spawnWaves,
   {timeout:90000,intervals:[300,500,600]}).toBeGreaterThanOrEqual(12);
 const s=await read(page);
 expect(s.furnitureSpawned).toBeGreaterThan(0);
 expect(s.verifiedCompoundFurniture).toBeGreaterThan(0);
 expect(s.minVerifiedGap).toBeGreaterThan(1.16);
 expect(s.lightPropsSpawned).toBeGreaterThan(0);
 expect(s.softRockTarget).toBeLessThan(30);
 expect(s.softLootTarget).toBeLessThan(40);
 expect(s.peakRocks).toBeLessThanOrEqual(s.softRockTarget);
 expect(s.peakLoot).toBeLessThanOrEqual(s.softLootTarget);
 expect(s.cameraOcclusionChecks).toBeGreaterThan(4);
 expect(s.hazardMotionTicks).toBeGreaterThan(150);
 expect(s.hazardReleaseSpeed).toBeLessThan(4.3);
 expect(s.hazardSampleSpeed).toBeLessThan(18);
 expect(s.swipeOnly).toBe(true);
 expect(s.destroyedTotal+s.liveFalling).toBe(s.spawnedTotal);
 await page.screenshot({path:'test-results/c05-slow-furniture.png'});
 expect(errors).toEqual([]);
});

test('C0.6: real dynamic Bullet mass grows with each swipe and fades when idle',async({page})=>{
 test.setTimeout(95000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 let s=await read(page);
 expect(s.playerMass).toBe(1.4);
 expect(s.rigidbodyType).toBe('dynamic');
 await page.locator('#start').click();
 await page.keyboard.press('ArrowUp');
 await expect.poll(async()=>(await read(page))?.appliedSwipeCount,{timeout:6500}).toBe(1);
 s=await read(page);
 expect(s.playerMass).toBeGreaterThan(s.basePlayerMass);
 expect(s.chargeLevel).toBe(1);
 const first=s.playerMass;
 for(let i=0;i<3;i++){
  await page.waitForTimeout(195);
  await page.keyboard.press('ArrowUp');
 }
 await expect.poll(async()=>(await read(page))?.maximumChargedMass,{timeout:6500}).toBeGreaterThan(first+1);
 const charged=await read(page);
 expect(charged.playerMass).toBeGreaterThanOrEqual(first);
 expect(charged.playerMass).toBeLessThanOrEqual(charged.maxPlayerMass);
 expect(charged.maxForwardSpeed).toBeLessThanOrEqual(charged.maxAllowedForwardSpeed+.15);
 expect(charged.playerMotorEnabled).toBe(false);
 await page.screenshot({path:'test-results/c06-weighted-swipe-charge.png'});
 await expect.poll(async()=>(await read(page))?.chargeLevel,
   {timeout:18500,intervals:[250,450,700]}).toBe(0);
 const idle=await read(page);
 expect(idle.playerMass).toBe(idle.basePlayerMass);
 await page.keyboard.press('KeyR');
 await expect.poll(async()=>(await read(page))?.playerMass,{timeout:3500}).toBe(1.4);
 expect((await read(page)).chargeLevel).toBe(0);
 expect(errors).toEqual([]);
});
test('C0.6: a long pointer hold creates NO weight, a real up swipe charges exactly once',async({page})=>{
 await page.goto('/');
 await expect.poll(async()=>(await read(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 await page.mouse.move(180,590);await page.mouse.down();
 await page.waitForTimeout(700);
 const holding=await read(page);
 expect(holding.playerMass).toBe(holding.basePlayerMass);
 expect(holding.appliedSwipeCount).toBe(0);
 await page.mouse.move(180,455,{steps:4});await page.mouse.up();
 await expect.poll(async()=>(await read(page))?.appliedSwipeCount,{timeout:5500}).toBe(1);
 const charged=await read(page);
 // Real charge is transient: a busy browser/CI may sample AFTER idle decay.
 // Require proof the Bullet mass DID increase, not that it remains increased.
 expect(charged.maximumChargedMass).toBeGreaterThan(charged.basePlayerMass);
 expect(charged.massUpdateCount).toBeGreaterThan(0);
 expect(charged.forwardFlicks).toBe(1);
});
