import { test } from 'node:test';
import assert from 'node:assert/strict';
const memory = new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)},configurable:true});
Object.defineProperty(globalThis,'window',{value:{localStorage:globalThis.localStorage},configurable:true});
const {useGameStore:store,getPressureTier}=await import('../src/store');
const {SCENES}=await import('../src/gameData');
test('pressure thresholds remain bounded',()=>{assert.equal(getPressureTier(24),0);assert.equal(getPressureTier(25),1);assert.equal(getPressureTier(50),2);assert.equal(getPressureTier(75),3);});
test('invalid choices do not advance the expedition',()=>{store.getState().resetGame();store.getState().performChoice('missing');assert.equal(store.getState().turn,0);});
test('comfort actions cannot farm XP',()=>{store.getState().resetGame();store.getState().performChoice('archive_review_ledger');const xp=store.getState().xp;for(let i=0;i<10;i++)store.getState().performChoice('archive_steady_hands');assert.equal(store.getState().xp,xp);});
test('50 seeded expeditions preserve resource and save invariants',()=>{
 const original=Math.random;
 try{for(let seed=1;seed<=50;seed++){
  let value=seed;Math.random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
  store.getState().resetGame();
  for(let turn=0;turn<80;turn++){
   const state=store.getState();
   if(state.runStatus==='success'||state.runStatus==='failed'){assert.ok(state.runEndSnapshot);state.settleRun();}
   const choices=SCENES[store.getState().currentSceneId].choices;
   store.getState().performChoice(choices[Math.floor(Math.random()*choices.length)].id);
   const next=store.getState();
   for(const [v,max] of [[next.vitality,next.maxVitality],[next.focus,next.maxFocus],[next.lantern,next.maxLantern]])assert.ok(v>=0&&v<=max,`resource bounds seed ${seed}`);
   assert.ok(next.inventory.length<=6);assert.ok(next.veilPressure>=0&&next.veilPressure<=100);assert.ok(Number.isFinite(next.xp));
  }
  const saved=JSON.parse(memory.get('ashfaller-veil-between-save')!);assert.equal(saved.state.turn,store.getState().turn);assert.deepEqual(saved.state.inventory,store.getState().inventory);
 }}finally{Math.random=original;}
});
