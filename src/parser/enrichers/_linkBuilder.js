/* eslint-disable */
const fs = require('fs');
const path = require('path');

const directories = [
  'trait/aasimar',
  'trait/dragonborn',
  'trait/generic',
  'trait/goliath',
  'trait/halfling',
  'trait/halfOrc',
  'trait/kalashtar',
  'trait/vedalken',
  'trait/shifter',
  'trait/dwarf',
  'trait/bugbear',
  'trait/leonin',
  'trait/goblin',
  'trait/hadozee',
  'trait/orc',
  'trait/human',
  'trait/tiefling',
  'trait/gnome',
  'generic',
  'feat',
  'spell',
  'item',
  'class/artificer',
  'class/barbarian',
  'class/bard',
  'class/cleric',
  'class/druid',
  'class/fighter',
  'class/monk',
  'class/paladin',
  'class/ranger',
  'class/rogue',
  'class/sorcerer',
  'class/warlock',
  'class/wizard',
  'class/shared',
  'class/monster-hunter',
  'background',
];

for (const directory of directories) {
  const contents = [];
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const fileExtension = path.extname(file);

    if (['.js', '.mjs'].includes(fileExtension)) {
      const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });

      const className = content.match(/class\s+([a-zA-Z_$][\w$]*)/);
      if (className) {
        if (className[1] === "Empty") {
          console.warn(`Error parsing ${filePath}: class name is Empty`);
        }
        if (!file.includes(className[1])) {
          console.warn(`Error parsing ${filePath}: class name is not included in file name`);
        }
        const exportLine = `export { default as ${className[1]} } from "./${file}";`
        contents.push(exportLine);
        // console.log(exportLine);
      }
    }
  });

  contents.push('\n')
  const outfilePath = path.join(directory, "_module.mjs");
  console.log(`Writing ${outfilePath}`);
  fs.writeFileSync(outfilePath, contents.join('\n'));
}
