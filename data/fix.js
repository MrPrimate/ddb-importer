// use this to sort and clean data
// node "./"

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { exit } = require("process");

function loadJSONFile(file) {
  const configPath = path.resolve(__dirname, file);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(JSON.stringify(require(configPath)));
    return config;
  } else {
    return {};
  }
}

function saveJSONFile(content, filePath) {
  try{
    const data = JSON.stringify(content, null, 2);
    fs.writeFileSync(filePath, data);
    console.log(`JSON file saved to ${filePath}`);
  } catch (error) {
    console.error(error);
  }
}

const filePath = path.resolve(__dirname, process.argv[2]);
const jsonFiles = path.join(filePath, "*.json");

glob.sync(jsonFiles).forEach((iconFile) => {
  console.log(`Loading ${iconFile}`);
  const iconFilePath = path.resolve(__dirname, iconFile);
  const data = loadJSONFile(iconFilePath);
  data.forEach((item) => {
    delete item.type;
  });
  data.sort((a, b) => a.name.localeCompare(b.name));
  saveJSONFile(data, iconFilePath);

});
