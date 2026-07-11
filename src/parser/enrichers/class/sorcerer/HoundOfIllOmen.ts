import DDBEnricherData from "../../data/DDBEnricherData";

export default class HoundOfIllOmen extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getHoundOfIllOmen;
  }

  get generateSummons() {
    return true;
  }

  get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [{ count: 1, name: "HoundOfIllOmen" }],
      summons: {
        bonuses: {
          hp: "floor(@classes.sorcerer.levels / 2)",
        },
      },
      data: {
        creatureSizes: ["med"],
        creatureTypes: ["monstrosity"],
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

}
