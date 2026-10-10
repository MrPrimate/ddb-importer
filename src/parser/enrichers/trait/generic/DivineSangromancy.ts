import DDBEnricherData from "../../data/DDBEnricherData";

/** Downcast: when an ally within 30 feet regains Hit Points, spend a Hit Die and add its roll to the healing. */
export default class DivineSangromancy extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Smallest", "Largest"].map((size) => ({
      init: {
        name: `Add Healing - ${size} Hit Die`,
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      },
      build: {
        generateConsumption: true,
        generateTarget: true,
        generateRange: true,
        generateActivation: true,
        generateHealing: true,
        activationOverride: { type: "special", value: 1, condition: "An allied creature within 30 feet regains Hit Points" },
        healingPart: DDBEnricherData.basicDamagePart({
          customFormula: `@consumed.hd`,
          types: ["healing"],
        }),
        consumptionOverride: {
          targets: [{ type: "hitDice", target: size.toLowerCase(), value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      },
      overrides: {
        targetType: "ally",
        data: { range: { override: true, value: "30", units: "ft" } },
      },
    }));
  }

}
