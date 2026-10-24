import fs from 'fs';
const dir = 'D:/ds.world.execute/src/';
const parts = ['00_head.html','10_core.js','20_sdk.js','30_scenes.js','32_scenes_b.js','34_scenes_c.js','36_scenes_d.js','38_scenes_e.js','39_scenes_f.js','41_finale.js','42_eye.js','43_cut.js','44_skin.js','45_lyrics.js','46_film.js','47_plates.js','48_plates2.js','49_love.js','50_engine2.js','51_scenes_new.js','52_scenes_new2.js','53_scenes_new3.js','54_boot_deep.js','55_calculus_deep.js','56_current_deep.js','57_sandbox_deep.js','58_ontology_deep.js','59_rework06_11.js','60_proto.js','40_ui.js'];
let s = parts.map(p => fs.readFileSync(dir + p, 'utf8')).join('\n');
s += '\n</script>\n</body>\n</html>\n';
fs.writeFileSync('D:/ds.world.execute/index.html', s);
fs.writeFileSync('D:/ds.world.execute/src/_check.js',
  parts.filter(p=>p.endsWith('.js')).map(p=>fs.readFileSync(dir+p,'utf8')).join('\n'));
console.log('built', (s.length/1024).toFixed(1)+'KB');
