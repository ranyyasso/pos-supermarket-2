const sharp=require('C:/Users/Rani/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path=require('node:path');
(async()=>{
 for(const width of [1280,1366,1920]) {
  const file=path.resolve(`qa/pos-${width}.png`);
  const normalized=await sharp(file).png().toBuffer();
  require('node:fs').writeFileSync(path.resolve(`qa/desktop-${width}.png`),normalized);
 }
 await sharp({create:{width:960,height:1620,channels:3,background:'#20252e'}}).composite(await Promise.all([1280,1366,1920].map(async(width,i)=>({input:await sharp(`qa/pos-${width}.png`).resize({width:960,height:540,fit:'contain'}).png().toBuffer(),left:0,top:i*540})))).png().toFile('qa/viewport-review.png');
 const reference='C:/Users/Rani/.codex/codex-remote-attachments/01a09e78-65dd-7633-aa3f-2d72a6c8f834/680C3D6A-7BD5-4932-9249-A5DA17CF83B7/1-Photo-1.jpg';
 const app=path.resolve('qa/pos-1366.png');
 const left=await sharp(reference).resize({width:729}).png().toBuffer();
 const right=await sharp(app).resize({width:1024}).png().toBuffer();
 await sharp({create:{width:1777,height:580,channels:3,background:'#20252e'}}).composite([{input:left,left:0,top:36},{input:right,left:753,top:0}]).png().toFile('qa/reference-comparison.png');
 const detail=await sharp(app).extract({left:375,top:204,width:805,height:257}).png().toBuffer();
 await sharp({create:{width:1200,height:280,channels:3,background:'#20252e'}}).composite([{input:await sharp(reference).extract({left:142,top:45,width:384,height:166}).png().toBuffer(),left:0,top:0},{input:detail,left:395,top:0}]).png().toFile('qa/tile-comparison.png');
 console.log(await sharp(app).metadata());
})();
