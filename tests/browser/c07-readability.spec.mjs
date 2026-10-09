import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>window.__CLIMBER_TEST__?.snapshot());

for(const v of [{width:390,height:844},{width:360,height:800},
 {width:844,height:390}]){
 test('C0.7 compact HUD remains visible and clear on '+v.width+'x'+v.height,async({page})=>{
  test.setTimeout(60_000);
  await page.setViewportSize(v);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:25000}).toBe(true);
  await page.locator('#start').click();
  await expect(page.locator('#game')).toHaveClass(/playing/);
  await page.keyboard.press('ArrowUp');
  await expect.poll(async()=>(await state(page))?.forwardFlicks,{timeout:4500}).toBe(1);
  const rects=await page.evaluate(()=>{
   const get=id=>{
    const node=document.querySelector(id),r=node.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,
      bottom:r.bottom,right:r.right,font:getComputedStyle(node).fontSize};
   };
   return {status:get('#status'),toast:get('#toast'),
    header:get('header'),progress:get('.progress'),hint:get('.hint'),
    w:innerWidth,h:innerHeight};
  });
  expect(rects.status.x).toBeGreaterThanOrEqual(0);
  expect(rects.status.right).toBeLessThanOrEqual(v.width+1);
  expect(rects.status.bottom).toBeLessThanOrEqual(v.height+1);
  expect(rects.status.y).toBeGreaterThan(v.height*.63);
  expect(rects.toast.x).toBeGreaterThanOrEqual(0);
  expect(rects.toast.right).toBeLessThanOrEqual(v.width+1);
  expect(rects.toast.y).toBeLessThan(v.height*.3);
  expect(rects.toast.width).toBeLessThanOrEqual(230);
  const s=await state(page);
  expect(s.playerMass).toBeGreaterThan(1.4);
  expect(s.loot).toBeGreaterThanOrEqual(0);
  await page.screenshot({path:'test-results/c07-hud-'+v.width+'x'+v.height+'.png'});
  expect(errors).toEqual([]);
 });
}
test('C0.7 heavy real Bullet ball steers less sideways while speed cap is preserved',async({page})=>{
 test.setTimeout(65000);
 await page.goto('/');
 await expect.poll(async()=>(await state(page))?.physicsLoaded,{timeout:25000}).toBe(true);
 await page.locator('#start').click();
 const base=await state(page);
 expect(base.lightweightLateralControl).toBe(1);
 expect(base.heavyweightLateralControl).toBeGreaterThan(.5);
 expect(base.heavyweightLateralControl).toBeLessThan(.7);
 for(let i=0;i<4;i++){
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(190);
 }
 await expect.poll(async()=>(await state(page))?.chargeLevel,{timeout:3000}).toBeGreaterThanOrEqual(3);
 await page.keyboard.press('ArrowRight');
 await expect.poll(async()=>(await state(page))?.sideFlicks,{timeout:3500}).toBe(1);
 let s=await state(page);
 expect(s.lastSideControlFraction).toBeLessThan(.75);
 expect(s.lastSideControlFraction).toBeGreaterThan(.5);
 expect(s.playerMass).toBeGreaterThan(s.basePlayerMass);
 expect(s.maxForwardSpeed).toBeLessThanOrEqual(s.maxAllowedForwardSpeed+.15);
 expect(s.rigidbodyType).toBe('dynamic');
 await page.keyboard.press('KeyR');
 await expect.poll(async()=>(await state(page))?.chargeLevel,{timeout:3500}).toBe(0);
 s=await state(page);
 expect(s.playerMass).toBe(s.basePlayerMass);
 expect(s.lastSideControlFraction).toBe(1);
});
