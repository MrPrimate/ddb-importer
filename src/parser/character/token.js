import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateToken = function _generateToken() {
  try {
    // Default to the most basic token setup.
    // everything else can be handled by the user / Token Mold
    const existingData = foundry.utils.deepClone(this.currentActor.prototypeToken);
    let tokenData = foundry.utils.mergeObject(existingData, {
      actorLink: true,
      name: this.source.ddb.character.name,
      sight: {
        enabled: true,
        range: 0,
        visionMode: "basic",
      },
      detectionModes: [],
    });
    const senses = this.getSenses();
    // darkvision: 0,
    // blindsight: 0,
    // tremorsense: 0,
    // truesight: 0,

    for (const [key, value] of Object.entries(senses)) {
      if (value > 0 && value > tokenData.sight.range && foundry.utils.hasProperty(DICTIONARY.senseMap(), key)) {
        const visionMode = DICTIONARY.senseMap()[key];
        foundry.utils.setProperty(tokenData, "sight.visionMode", visionMode);
        foundry.utils.setProperty(tokenData, "sight.range", value);
        tokenData.sight = foundry.utils.mergeObject(tokenData.sight, CONFIG.Canvas.visionModes[visionMode].vision.defaults);
      }
      if (!game.modules.get("vision-5e")?.active
        && value > 0
        && foundry.utils.hasProperty(DICTIONARY.detectionMap, key)
      ) {
        const detectionMode = {
          id: DICTIONARY.detectionMap[key],
          range: value,
          enabled: true,
        };

        // only add duplicate modes if they don't exist
        if (!tokenData.detectionModes.some((mode) => mode.id === detectionMode.id)) {
          tokenData.detectionModes.push(detectionMode);
        }
      }
    }

    // devilsight? we set the vision mode back to basic
    const devilSight = senses.special.includes("You can see normally in darkness");
    if (devilSight && game.modules.get("vision-5e")?.active) {
      foundry.utils.setProperty(tokenData, "sight.visionMode", "devilsSight");
      tokenData.sight = foundry.utils.mergeObject(tokenData.sight, CONFIG.Canvas.visionModes.devilsSight.vision.defaults);
    } else if (devilSight) {
      foundry.utils.setProperty(tokenData, "sight.visionMode", "basic");
      tokenData.sight = foundry.utils.mergeObject(tokenData.sight, CONFIG.Canvas.visionModes.basic.vision.defaults);
    }

    this.raw.character.prototypeToken = tokenData;
  } catch (err) {
    logger.error(err);
    logger.error(err.stack);
    throw new Error("Please update your D&D 5e system to a newer version");
  }
};
