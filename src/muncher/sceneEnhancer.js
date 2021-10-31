

// TODO: this will handle the scene enhancement/import
export function sceneEnhancer() {

}


// TODO: this will handle the scene enhancement export
export function exportScene(scene, inCompendium=true) {

  let templateData = {
    sceneName: scene.name,
    inCompendium: inCompendium,
    compendiums: [],
    compendium: {
      name: "",
      id: "",
    },
    flagName: "",
    useFlag: false,
    description: "",

  }

  // open dialog to select:
  // * scene to export

  const scenes = game.scenes.filter((scene) => !scene.data.flags.ddb?.ddbId);

  // flags": {
    // "core": {
    //   "sourceId"

  if (inCompendium) {
    const flagged = scene.data.flags.core?.sourceId;
    if (flagged && flagged.toLowerCase().startsWith("compendium")) {

      templateData.compendium.name =
    // compendium it belongs to
    // module it belongs to
  } else {
    // provide a download link for the image
  }

  // - scene name
  // use a flag not name to match the scene:
  // - bool useFlag
  // - string: flagName
  // - bool: export scenes
  // - bool: export walls
  // - bool: export actors
  // - bool: export config

  // description: e.g. does the user have to manually find the image?

}
