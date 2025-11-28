import * as fs from "fs";
import yaml from "js-yaml";
import path from "path";

console.log("Reforging Symlinks");

if (fs.existsSync("foundry-config.yaml")) {
  let fileRoot = "";
  let dndRoot = "";
  try {
    const fc = await fs.promises.readFile("foundry-config.yaml", "utf-8");

    const foundryConfig = yaml.load(fc);

    // As of 13.338, the Node install is *not* nested but electron installs *are*
    const nested = fs.existsSync(path.join(foundryConfig.foundryPath, "resources", "app"));

    if (nested) fileRoot = path.join(foundryConfig.foundryPath, "resources", "app");
    else fileRoot = foundryConfig.foundryPath;
    dndRoot = foundryConfig.dnd5ePath;
  } catch (err) {
    console.error(`Error reading foundry-config.yaml: ${err}`);
  }

  try {
    await fs.promises.mkdir("foundry");
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

  // Javascript files
  for (const p of ["client", "common", "tsconfig.json"]) {
    try {
      await fs.promises.symlink(path.join(fileRoot, p), path.join("foundry", p));
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  }

  // Language files
  try {
    await fs.promises.symlink(path.join(fileRoot, "public", "lang"), path.join("foundry", "lang"));
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

  // dnd5e system
  try {
    try {
      await fs.promises.symlink(dndRoot, path.join("foundry", "dnd5e"));
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

} else {
  console.log("Foundry config file did not exist.");
}
