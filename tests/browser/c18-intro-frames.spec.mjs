import {test,expect} from '@playwright/test';
const snap=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
async function loaded(page,url){
 await page.goto(url);
 await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:26000}).toBe(true);
}
test('C1.8: new level plays 3.8-second actual in-game flythrough, tapping skips instantly, retry omits tour',async({page})=>{
 test.setTimeout(70_000);
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await loaded(page,'/?mode=infinite&test=1&intro=1');
 await page.locator('#start').click();
 const intro=await snap(page);
 expect(intro.phase).toBe('intro');
 expect(intro.introCount).toBe(1);
 expect(intro.spawnedTotal).toBe(0); // nothing piles before player takes control
 await page.waitForTimeout(500);
 const moved=await snap(page);
 expect(moved.introElapsed).toBeGreaterThan(.25);
 expect(moved.introElapsed).toBeLessThan(3);
 await page.screenshot({path:'test-results/c18-cinematic-flythrough.png'});
 await page.mouse.click(150,320);
 await expect.poll(async()=>(await snap(page))?.phase,{timeout:1300}).toBe('running');
 const after=await snap(page);
 expect(after.introSkips).toBe(1);
 expect(after.spawnedTotal).toBeGreaterThanOrEqual(25);
 expect(after.frameActors).toBe(2);
 expect(after.starterPadType).toBe('static');
 expect(after.starterPadPhysicalCount).toBe(6);
 await page.keyboard.press('r');
 await expect.poll(async()=>(await snap(page))?.attempts).toBe(2);
 expect((await snap(page)).phase).toBe('running'); // no retry interruption
 expect((await snap(page)).introCount).toBe(1);
 expect(errors).toEqual([]);
});
test('C1.8: unskipped tour finishes by itself and starts with grounded ball on personal pad',async({page})=>{
 test.setTimeout(75_000);
 await page.setViewportSize({width:390,height:844});
 await loaded(page,'/?mode=infinite&test=1&intro=1');
 await page.locator('#start').click();
 await expect.poll(async()=>(await snap(page))?.phase,{timeout:10000}).toBe('running');
 const s=await snap(page);
 expect(s.introSkips).toBe(0);
 expect(s.introElapsed).toBeGreaterThanOrEqual(s.introDuration);
 expect(Math.abs(s.z-s.baseSpawnZ)).toBeLessThan(.5); // normal Bullet floor settlement
 expect(s.ballScreenDepth).toBeGreaterThan(0);
 expect(s.ballScreenX).toBeGreaterThan(0);
 expect(s.ballScreenX).toBeLessThan(s.renderWidth);
 expect(s.ballScreenY).toBeGreaterThan(0);
 expect(s.ballScreenY).toBeLessThan(s.renderHeight);
 expect(s.falls).toBe(0);
 await page.screenshot({path:'test-results/c18-personal-starting-platform.png'});
});
test('C1.8: four thick-edged hollow obstacles are real dynamic compound Bullet bodies with empty interiors',async({page})=>{
 test.setTimeout(65_000);
 await loaded(page,'/?mode=infinite&test=1');
 await page.locator('#start').click();
 const s=await snap(page);
 expect(s.phase).toBe('running');
 expect(s.frameActors).toBe(2);
 expect(s.activeHollowBodies).toBe(2);
 expect(s.frameOpenings.every(w=>w>1.16)).toBe(true);
 expect(s.activeHollowColliderCounts.every(n=>n>=8&&n<=12)).toBe(true);
 expect(s.activeHollowTypes.every(t=>t==='dynamic')).toBe(true);
 expect(s.sectionPlan).toHaveLength(6);
 await page.screenshot({path:'test-results/c18-physical-open-frames.png'});
});
test('C1.8: curated live pattern pacing separates waves while preserving real summit finish',async({page})=>{
 test.setTimeout(65_000);
 await loaded(page,'/?mode=infinite&test=1');
 await page.locator('#start').click();
 await expect.poll(async()=>(await snap(page))?.spawnWaves,{timeout:4000}).toBeGreaterThan(0);
 const s=await snap(page);
 expect(s.activeSectionRole).toBe('open');
 expect(s.waveSections.open).toBeGreaterThan(0);
 expect(s.waveSections.pile).toBe(0);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachSummit?.());
 await expect.poll(async()=>(await snap(page))?.phase,{timeout:9500}).toBe('summit');
 expect((await snap(page)).verifiedSummitArrivals).toBe(1);
});
