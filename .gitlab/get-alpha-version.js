var fs = require('fs');
console.log(JSON.parse(fs.readFileSync('module-alpha.json', 'utf8')).version);
