import DDBEnricherData from "../../data/DDBEnricherData";

export default class HoundOfIllOmen extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getHoundOfIllOmen;
  }

  override get generateSummons() {
    return true;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
