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

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [{ count: 1, name: "HoundOfIllOmen" }],
      summons: {
        "creatureSizes": ["med"],
        "creatureTypes": ["monstrosity"],
        "bonuses.hp": "floor(@classes.sorcerer.levels / 2)",
      },
    };
  }

  get effects() {
    return [];
  }

}
