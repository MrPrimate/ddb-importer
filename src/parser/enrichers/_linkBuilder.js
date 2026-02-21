/* eslint-disable */
const fs = require('fs');
const { get } = require('http');
const path = require('path');

function getContentsOfDirectory(directoryPath) {
  const contents = [];
  const files = fs.readdirSync(directoryPath);

  // Track which base names we've already processed (prefer .ts over .mjs/.js)
  const seen = new Set();

  // Sort so .ts files come first, ensuring they take priority
  const sortedFiles = [...files].sort((a, b) => {
    const extA = path.extname(a);
    const extB = path.extname(b);
    if (extA === '.ts' && extB !== '.ts') return -1;
    if (extA !== '.ts' && extB === '.ts') return 1;
    return a.localeCompare(b);
  });

  sortedFiles.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const fileExtension = path.extname(file);
    const baseName = path.basename(file, fileExtension);

    if (seen.has(baseName)) return;

    if (['.js', '.mjs', '.ts'].includes(fileExtension)) {
      const content = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });

      const className = content.match(/class\s+([a-zA-Z_$][\w$]*)/);
      if (className) {
        if (className[1] === "Empty") {
          console.warn(`Error parsing ${filePath}: class name is Empty`);
        }
        if (!file.includes(className[1])) {
          console.warn(`Error parsing ${filePath}: class name is not included in file name`);
        }
        const baseName2 = path.basename(file, path.extname(file));
        const exportLine = `export { default as ${className[1]} } from "./${baseName2}";`
        contents.push(exportLine);
        seen.add(baseName);
        // console.log(exportLine);
      }
    }
  });

  return contents;
}

const flatDirectories = [
  'generic',
  'feat',
  'spell',
  'item',
  'background',
];

for (const directory of flatDirectories) {
  const contents = getContentsOfDirectory(directory);
  contents.push('\n')
  const outfilePath = path.join(directory, "_module.ts");
  // console.log(`Writing ${outfilePath}`);
  fs.writeFileSync(outfilePath, contents.join('\n'));
}

function capitalize(s) {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const nestedDirs = [
  'monster',
  'class',
  'trait',
];

for (const directory of nestedDirs) {
  const nestedBasePath = directory;
  const nestedDirectories = fs.readdirSync(nestedBasePath);

  for (const topLevelFolder of nestedDirs) {
    const basePath = topLevelFolder;
    const directories = fs.readdirSync(basePath);

    const contents = [];

    for (const directory of directories) {
      const fullDirPath = path.join(basePath, directory);
      if (fs.lstatSync(fullDirPath).isDirectory()) {
        //capitalise the directory name and remove spaces/hyphens for the export
        const exportLine = `export * as ${capitalize(directory.replace(/[\s-]/g, ''))} from "./${directory}/_module";`
        contents.push(exportLine);
      }
    }

    contents.push(...getContentsOfDirectory(basePath));

    contents.push('\n')
    const outfilePath = path.join(basePath, "_module.ts");
    // console.log(`Writing ${outfilePath}`);
    fs.writeFileSync(outfilePath, contents.join('\n'));
  }


  for (const directory of nestedDirectories) {
    const fullDirPath = path.join(nestedBasePath, directory);
    if (fs.lstatSync(fullDirPath).isDirectory()) {
      const contents = getContentsOfDirectory(fullDirPath);

      contents.push('\n')
      const outfilePath = path.join(fullDirPath, "_module.ts");
      // console.log(`Writing ${outfilePath}`);
      fs.writeFileSync(outfilePath, contents.join('\n'));
    }
  }
}
