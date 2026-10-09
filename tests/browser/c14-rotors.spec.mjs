import {test,expect} from '@playwright/test';
const snap=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
const ready=async(page,path)=>{
 await page.goto(path);
 await expect.poll(async()=>(await snap(page))?.physicsLoaded,{timeout:23000}).toBe(true);
 await page.locator('#start').click();
};
test('C1.4: early steep rush is populated, physical edges clear, and camera is closer',async({page})=>{
 test.setTimeout(55_000);
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ready(page,'/?mode=infinite&test=1');
 const first=await snap(page);
 expect(first.levelIndex).toBe(1);
 expect(first.levelPhysicalObstacles).toBe(1);
 expect(first.rushActors).toBe(6);
 expect(first.rushChairs).toBeGreaterThanOrEqual(2);
 expect(first.prewarmedActors).toBe(8);
 expect(first.gauntletActors).toBe(8);
 expect(first.spawnedTotal).toBeGreaterThanOrEqual(22);
 expect(first.rotorCount).toBe(0);
 expect(first.cameraCloseMode).toBe(true);
 expect(first.cameraDrop).toBeLessThan(-3);
 await page.screenshot({path:'test-results/c14-ultralow-clutterfree.png'});
 await ready(page,'/?mode=infinite&camera=low&test=1');
 const previous=await snap(page);
 expect(previous.cameraCloseMode).toBe(false);
 expect(previous.cameraLowMode).toBe(true);
 expect(previous.cameraDrop).toBeCloseTo(-2.35,1);
 await page.screenshot({path:'test-results/c14-prior-low-camera.png'});
 await ready(page,'/?mode=infinite&camera=classic&test=1');
 const classic=await snap(page);
 expect(classic.cameraDrop).toBe(0);
 expect(classic.cameraCloseMode).toBe(false);
 expect(errors).toEqual([]);
});
test('C1.4: anchored rotating blades exist on later levels and spin as real kinematic bodies',async({page})=>{
 test.setTimeout(55_000);
 await page.goto('/?mode=infinite&test=1');
 await page.evaluate(()=>localStorage.setItem('oddrop-ball-climber-c1-v1',
  JSON.stringify({version:1,level:9,wallet:0,owned:['classic'],equipped:'classic'})));
 await ready(page,'/?mode=infinite&test=1');
 const s=await snap(page);
 expect(s.levelIndex).toBe(9);
 expect(s.rotorCount).toBe(2);
 expect(s.rotorTypes).toEqual(['kinematic','kinematic']);
 expect(s.rushActors).toBe(6);
 await expect.poll(async()=>(await snap(page))?.rotorTurns,
  {timeout:3500}).toBeGreaterThan(.03);
 expect((await snap(page)).rotorFrames).toBeGreaterThan(3);
 // A falling barrel is teleported ONTO the real spinning collider; the
 // test requires a Bullet contact, not simply a visually spinning mesh.
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testRotor?.());
 await expect.poll(async()=>(await snap(page))?.rotorFallingContacts,
  {timeout:7500}).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/c14-kinematic-rotors.png'});
});
test('C1.4: C1.2 physical summit still accepts a real deck contact',async({page})=>{
 await ready(page,'/?mode=infinite&test=1');
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachSummit?.());
 await expect.poll(async()=>(await snap(page))?.phase,{timeout:9000}).toBe('summit');
 expect((await snap(page)).summitContactEvents).toBeGreaterThan(0);
});
