/* eslint-disable */
const fs = require('fs');
const path = require('path');

const directory = process.argv[2]; // get directory path from first command line parameter

if (!directory) {
  console.error('Error: Directory path not provided');
  process.exit(1);
}
fs.readdir(directory, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const fileExtension = path.extname(file);

    if (['.js', '.mjs'].includes(fileExtension)) {
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          console.error(err);
          return;
        }

        const className = content.match(/class\s+([a-zA-Z_$][\w$]*)/);
        if (className) {
          console.log(`export { default as ${className[1]} } from "./${file}";`);
        }
      });
    }
  });
});
