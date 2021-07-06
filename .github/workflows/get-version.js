var fs = require('fs');
console.log(JSON.parse(fs.readFileSync('package.json', 'utf8')).version);
