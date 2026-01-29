/* eslint-disable no-sync */
/* eslint-disable no-console */
/* eslint-disable no-process-exit */
import fs from "fs";
import path from "path";
import process from "process";
import prompts from "prompts";

const windowsInstructions = process.platform === "win32" ? ' Start with a drive letter ("C:\\").' : "";
const enteredPath
    = (
      await prompts({
        type: "text",
        name: "value",
        format: (v) => v.replace(/\W*$/, "").trim(),
        message: `Enter the full path to your Foundry data folder.${windowsInstructions}`,
      })
    ).value ?? "";
if (!enteredPath) {
  console.error("No path entered.");
  process.exit(1);
}

const dataPath = (/\bData$/).test(enteredPath) ? enteredPath : path.join(enteredPath, "Data");
const dataPathStats = fs.lstatSync(dataPath, { throwIfNoEntry: false });
if (!dataPathStats?.isDirectory()) {
  console.error(`No folder found at "${dataPath}"`);
  process.exit(1);
}

const moduleId = "ddb-importer";

const symlinkPath = path.resolve(dataPath, "modules", moduleId);
const symlinkStats = fs.lstatSync(symlinkPath, { throwIfNoEntry: false });
if (symlinkStats) {
  const atPath = symlinkStats.isDirectory() ? "folder" : symlinkStats.isSymbolicLink() ? "symlink" : "file";
  const proceed = (
    await prompts({
      type: "confirm",
      name: "value",
      initial: false,
      message: `A "${moduleId}" ${atPath} already exists in the "modules" subfolder. Replace with new symlink?`,
    })
  ).value;
  if (!proceed) {
    console.log("Aborting.");
    process.exit();
  }
}

const moduleFile = path.resolve(process.cwd(), "module.json");

// if module file does not exist, copy the module-dev.json to module.json
if (!fs.existsSync(moduleFile)) {
  const devModuleFile = path.resolve(process.cwd(), "module-dev.json");
  if (fs.existsSync(devModuleFile)) {
    fs.copyFileSync(devModuleFile, moduleFile);
    console.log("Created module.json from module-dev.json");
  } else {
    console.error("No module.json or module-dev.json file found in current working directory.");
    process.exit(1);
  }
}

try {
  if (symlinkStats?.isDirectory()) {
    fs.rmSync(symlinkPath, { recursive: true, force: true });
  } else if (symlinkStats) {
    fs.unlinkSync(symlinkPath);
  }
  fs.symlinkSync(process.cwd(), symlinkPath);
} catch (error) {
  if (error instanceof Error) {
    console.error(`An error was encountered trying to create a symlink: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Symlink created at "${symlinkPath}"`);

