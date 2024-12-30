export const SENSES = {
  // CONFIG.Canvas.visionModes
  senseMapDefault: {
    blindsight: "basic",
    darkvision: "darkvision",
    // tremorsense: "tremorsense",
    truesight: "basic",
    unknown: "basic",
  },
  senseMapVision5e: {
    blindsight: "blindsight",
    darkvision: "darkvision",
    // tremorsense: "tremorsense",
    truesight: "truesight",
    unknown: "basic",
    devilsSight: "devilsSight",
    etherealness: "etherealness",
  },
  senseMap: () => {
    if (game.modules.get("vision-5e")?.active) return SENSES.senseMapVision5e;
    return SENSES.senseMapDefault;
  },
  // CONFIG.Canvas.detectionModes
  detectionMap: {
    blindsight: "senseAll",
    truesight: "seeAll",
    tremorsense: "feelTremor",
  },
};
