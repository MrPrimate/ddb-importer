import DDBEnricherData from "../data/DDBEnricherData";

export default class ProgrammedIllusion extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getIllusions;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionObject" },
        { count: 1, name: "IllusionSound" },
        { count: 1, name: "IllusionCreature" },
      ],
      data: {
        creatureSizes: [
          "tiny",
          "sm",
          "med",
          "lg",
          "huge",
          "grg",
        ],
      },
    };
  }

}
