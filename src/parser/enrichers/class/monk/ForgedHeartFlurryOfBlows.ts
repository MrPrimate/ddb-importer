import DDBEnricherData from "../../data/DDBEnricherData";

export default class ForgedHeartFlurryOfBlows extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Forged Heart Flurry of Blows",
      targetType: "creature",
      activationType: "special",
      activationCondition: "You hit a creature with an Unarmed Strike granted by Flurry of Blows",
      noConsumeTargets: true,
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
          parts: [],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
