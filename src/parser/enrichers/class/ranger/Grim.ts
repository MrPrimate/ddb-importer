import DDBEnricherData from "../../data/DDBEnricherData";

export default class Grim extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity(): IDDBActivityData {
    return {
      id: "summonGrimComp01",
      name: "Summon As Part of Omen of Doom",
      activationType: "special",
      noConsumeTargets: true,
      data: {
        bonuses: {
          attackDamage: "@abilities.wis.mod",
        },
        summons: {
          "match": {
            "proficiency": true,
            "attacks": true,
            "saves": true,
          },
        },
        // creatureSizes: ["sm", "med", "tiny"],
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "",
        recovery: [],
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

}
