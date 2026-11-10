import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('normal check aggregates render the picture fixture once before verifying decks',()=>{
  const cwd=fileURLToPath(new URL('..',import.meta.url));
  for(const target of ['check','compat-check']){
    const result=spawnSync('just',['--dry-run',target],{cwd,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const commands=result.stdout+result.stderr,render='quarto run scripts/htmpres.ts render decks/pictures/index.qmd',verify='quarto run scripts/htmpres.ts verify';
    assert.equal(commands.split(render).length-1,1,`${target} renders pictures once`);
    assert.ok(commands.indexOf(render)<commands.indexOf(verify),`${target} prepares pictures before verify`);
  }
});
