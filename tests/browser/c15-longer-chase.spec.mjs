import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());
async function start(page,url='/?mode=infinite&test=1'){
 await page.goto(url);
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:24000}).toBe(true);
 await page.locator('#start').click();
}
test('C1.5: real 60m physics road and true low behind-ball camera on phone',async({page})=>{
 test.setTimeout(65_000);
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await start(page);
 await expect.poll(async()=>(await state(page))?.cameraSlopePitch,
  {timeout:3500}).toBeGreaterThan(58);
 const resting=await state(page);
 expect(resting.baseCampExists).toBe(true);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testGoSlope?.());
 await expect.poll(async()=>(await state(page))?.progress,{timeout:1500}).toBeGreaterThan(8);
 await expect.poll(async()=>(await state(page))?.cameraSlopePitch,{timeout:3500}).toBeGreaterThan(58);
 const s=await state(page);
 expect(s.slopeLength).toBe(60);
 expect(s.legacySlopeLength).toBe(48);
 expect(s.emitterProgress).toBeCloseTo(62.5);
 expect(s.summitPlatformTop).toBeGreaterThan(52);
 expect(s.cameraSteepMode).toBe(true);
 expect(s.cameraZ).toBeGreaterThan(s.z+3);
 expect(s.cameraY).toBeLessThan(s.y-3);
 expect(s.cameraDistance).toBeLessThan(6.5);
 expect(s.cameraSlopePitch).toBeLessThan(70);
 await page.screenshot({path:'test-results/c15-true-slope-camera-390.png'});
 await start(page,'/?mode=infinite&camera=close&test=1');
 const previous=await state(page);
 expect(previous.cameraSteepMode).toBe(false);
 expect(previous.cameraCloseMode).toBe(true);
 await page.screenshot({path:'test-results/c15-previous-close-camera-390.png'});
 expect(errors).toEqual([]);
});
test('C1.5: opposing real Bullet machines are paired on level 5 and spin',async({page})=>{
 test.setTimeout(60_000);
 await page.goto('/?mode=infinite&test=1');
 await page.evaluate(()=>localStorage.setItem('oddrop-ball-climber-c1-v1',
  JSON.stringify({version:1,level:5,wallet:0,owned:['classic'],equipped:'classic'})));
 await start(page);
 const initial=await state(page);
 expect(initial.levelIndex).toBe(5);
 expect(initial.slopeLength).toBe(60);
 expect(initial.rotorCount).toBe(2);
 expect(initial.rotorTypes).toEqual(['kinematic','kinematic']);
 expect(initial.rotorPairs.map(p=>p.role)).toEqual(['left','right']);
 expect(initial.rotorPairs.map(p=>p.direction)).toEqual([-1,1]);
 expect(initial.rotorPairs.map(p=>p.lane)).toEqual([-3.65,3.65]);
 await expect.poll(async()=>(await state(page))?.rotorTurns,
  {timeout:3500}).toBeGreaterThan(.04);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.testRotor?.());
 await expect.poll(async()=>(await state(page))?.rotorFallingContacts,
  {timeout:7000}).toBeGreaterThan(0);
 await page.screenshot({path:'test-results/c15-opposing-side-rotors.png'});
});
test('C1.5: actual summit still requires Bullet collision at 60m and next level advances',async({page})=>{
 test.setTimeout(60_000);
 await start(page);
 await page.evaluate(()=>window.__CLIMBER_TEST__?.approachMagnet?.());
 await expect.poll(async()=>(await state(page))?.magnetTicks,{timeout:6500}).toBeGreaterThan(3);
 await expect.poll(async()=>(await state(page))?.phase,{timeout:11000}).toBe('summit');
 const s=await state(page);
 expect(s.verifiedSummitArrivals).toBe(1);
 expect(s.lastSummitContactProgress).toBeGreaterThan(58);
 expect(s.summitContactEvents).toBeGreaterThan(0);
 await page.locator('#start').click();
 expect((await state(page)).levelIndex).toBe(2);
});
