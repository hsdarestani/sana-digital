import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pages=[
  'public/vision/index.html',
  'public/vision/sichtbarkeit/index.html',
  'public/vision/hotline/index.html'
];
const styles=[
  'public/vision/showcase.css',
  'public/vision/sichtbarkeit/audit.css',
  'public/vision/hotline/hotline.css'
];
const dash=/[-\u2010\u2011\u2012\u2013\u2014]/;

test('SANA presentation pages contain no dash characters in displayed copy',()=>{
  for(const file of pages){
    const html=readFileSync(file,'utf8');
    const visible=html.replace(/<!--[^]*?-->/g,'').replace(/<[^>]*>/g,' ');
    assert.doesNotMatch(visible,dash,file+' visible text');
    for(const match of html.matchAll(/\b(?:aria-label|alt|placeholder|data-title)="([^"]*)"/g)){
      assert.doesNotMatch(match[1],dash,file+' accessibility text');
    }
    for(const match of html.matchAll(/<meta\b[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/g)){
      assert.doesNotMatch(match[1],dash,file+' metadata');
    }
  }
  for(const file of styles){
    const css=readFileSync(file,'utf8');
    for(const match of css.matchAll(/content\s*:\s*(["'])(.*?)\1/g)){
      assert.doesNotMatch(match[2],dash,file+' generated visible text');
    }
  }
});
