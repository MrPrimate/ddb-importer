var fs = require('fs');

var mod = JSON.parse(fs.readFileSync('module-alpha.json', 'utf8'));

const alphaSite = process.env.ALPHA_SITE;
const alphaPath = process.env.ALPHA_PATH;

mod.download = `https://${alphaSite}/${alphaPath}/ddb-importer.zip`;
mod.manifest = `https://${alphaSite}/${alphaPath}/module.json`;

console.log(JSON.stringify(mod));
