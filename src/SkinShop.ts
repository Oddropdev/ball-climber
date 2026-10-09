// C1.0 cosmetics-only economy. All purchases change ONLY player material.
// No physics, movement, score, collision, crate or loot-rate advantages.
export type SkinId='classic'|'coral'|'mint'|'midnight';
export type Skin={id:SkinId;name:string;price:number;color:string;band:string};
export const SKINS:readonly Skin[]=[
 {id:'classic',name:'Classic Pearl',price:0,color:'#F9FAFE',band:'#43DCCF'},
 {id:'coral',name:'Coral Pop',price:12,color:'#FC8D9A',band:'#FFF1BC'},
 {id:'mint',name:'Mint Orbit',price:24,color:'#74E5CF',band:'#347BBB'},
 {id:'midnight',name:'Midnight',price:40,color:'#3E467A',band:'#E8B2F8'}
];
export type ClimbSave={
 version:1;level:number;wallet:number;owned:SkinId[];equipped:SkinId
};
export const INITIAL_SAVE:ClimbSave={
 version:1,level:1,wallet:0,owned:['classic'],equipped:'classic'
};
const isSkin=(v:unknown):v is SkinId=>
 typeof v==='string'&&SKINS.some(s=>s.id===v);
export function safeSave(raw:unknown):ClimbSave{
 if(!raw||typeof raw!=='object')return {...INITIAL_SAVE,owned:['classic']};
 const o=raw as Record<string,unknown>;
 const level=typeof o.level==='number'&&Number.isSafeInteger(o.level)?
  Math.max(1,Math.min(1_000_000,o.level)):1;
 const wallet=typeof o.wallet==='number'&&Number.isSafeInteger(o.wallet)?
  Math.max(0,Math.min(1_000_000,o.wallet)):0;
 const owned=Array.isArray(o.owned)?
  [...new Set(['classic',...o.owned.filter(isSkin)])] as SkinId[]:['classic'] as SkinId[];
 const equipped=isSkin(o.equipped)&&owned.includes(o.equipped)?o.equipped:'classic';
 return {version:1,level,wallet,owned,equipped};
}
export function purchaseSkin(save:ClimbSave,id:SkinId):ClimbSave{
 const skin=SKINS.find(s=>s.id===id);
 if(!skin)throw Error('Unknown cosmetic');
 if(save.owned.includes(id))return {...save,equipped:id};
 if(save.wallet<skin.price)return save;
 return {...save,wallet:save.wallet-skin.price,owned:[...save.owned,id],equipped:id};
}
export function bankSummitLoot(save:ClimbSave,loot:number):ClimbSave{
 if(!Number.isSafeInteger(loot)||loot<0)throw Error('invalid earned loot');
 return {...save,wallet:Math.min(1_000_000,save.wallet+loot)};
}
export function unlockNextLevel(save:ClimbSave):ClimbSave{
 return {...save,level:Math.min(1_000_000,save.level+1)};
}
