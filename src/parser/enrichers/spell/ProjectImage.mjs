/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ProjectImage extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getIllusions;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionCreature" },
      ],
      data: {
        creatureSizes: [
          "tiny",
          "sm",
          "med",
          "lg",
        ],
      },
    };
  }

}
