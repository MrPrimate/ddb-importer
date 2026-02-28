import DDBEnricherData from "../data/DDBEnricherData";

export default class Mislead extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
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

  get effects() {
    return [
      {
        name: "Invisible",
        statuses: "Invisible",
      },
    ];
  }

}
