// use this to sort and clean data
// node "./"

// const fetch = require("node-fetch");
// const fs = require("fs");
// const path = require("path");
// const glob = require("glob");
// const { exit } = require("process");

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import glob from "glob";

const __dirname = path.resolve();

// v10 path corrections
async function getMaps() {
  const icons = await fetch("http://localhost:30000/systems/dnd5e/json/icon-migration.json");
  const spellIcons = await fetch("http://localhost:30000/systems/dnd5e/json/spell-icon-migration.json");
  const iconMap = {...await icons.json(), ...await spellIcons.json()};
  return iconMap;
}


function loadJSONFile(file) {
  const configPath = path.resolve(__dirname, file);
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath).toString());
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


getMaps().then((iconMap) => {
  glob.sync(jsonFiles).forEach((iconFile) => {
    console.log(`Loading ${iconFile}`);
    const iconFilePath = path.resolve(__dirname, iconFile);
    const data = loadJSONFile(iconFilePath);
    data.forEach((item) => {
      const iconMatch = iconMap[item.path];
      if (iconMatch) {
        item.path = iconMatch;
      }
      // delete item.type;
    });
    data.sort((a, b) => a.name.localeCompare(b.name));
    saveJSONFile(data, iconFilePath);

  });

});
