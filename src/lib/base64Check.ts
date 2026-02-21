import { logger } from "./_module";

function occurrences(string: string, subString: string, allowOverlapping = false) {
  string += "";
  subString += "";
  if (subString.length <= 0) return (string.length + 1);

  let n = 0,
    pos = 0;
  const step = allowOverlapping ? 1 : subString.length;


  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else break;
  }
  return n;
}

function checkBase64(string: string) {
  const count = occurrences(JSON.stringify(string), "base64");

  return count > 0;
}

export function checkScenes() {
  const fixedScenes = [];
  const badScenes = [];
  game.scenes.forEach((scene) => {
    if (checkBase64(scene.thumb)) {
      logger.warn(`Scene ${scene.name} has base 64 thumb data - fixing!`);
      scene.createThumbnail().then((data) => {
        scene.update({ thumb: data.thumb }, { diff: false });
        ui.notifications.info(`Regenerated thumbnail image for ${scene.name} background image`);
      });
      fixedScenes.push(scene.name);
    }
    if (checkBase64(scene.img)) {
      logger.warn(`Scene ${scene.name} has base 64 Image data!`);
      ui.notifications.warn(`${scene.name} has a base64 encoded scene image - please fix`);
      badScenes.push(scene.name);
    } else if (checkBase64(scene) && !checkBase64(scene.thumb)) {
      logger.warn(`Scene ${scene.name} has unknown location base 64 data!`);
      logger.warn(scene);
      badScenes.push(scene.name);
    }
  });
  if (badScenes.length > 0) logger.warn("Please fix the following scenes with base64 data:", badScenes);
  return {
    fixedScenes,
    badScenes,
  };
}

export function base64Check() {
  return checkScenes();
}
