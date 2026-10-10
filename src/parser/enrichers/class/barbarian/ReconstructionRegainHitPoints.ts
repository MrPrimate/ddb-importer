import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the Experiment Reconstruction serum: on activation and at the start of each turn, spend a
 * Hit Point Die to heal its roll plus your Constitution modifier (minimum 1); healing beyond the
 * maximum becomes Temporary Hit Points, which the heal cannot split, so it is left to the table.
 */
export default class ReconstructionRegainHitPoints extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return ["Smallest", "Largest"].map((size) => ({
      init: {
        name: `Reconstruction: ${size} Hit Die`,
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      },
      build: {
        generateConsumption: true,
        generateTarget: false,
        targetSelf: true,
        generateRange: false,
        generateActivation: true,
        generateHealing: true,
        activationOverride: {
          type: "special",
          value: 1,
          condition: "When the serum activates, and at the start of each of your turns (not after taking Acid or Fire damage)",
        },
        healingPart: DDBEnricherData.basicDamagePart({
          customFormula: `max(1, @consumed.hd + @abilities.con.mod)`,
          types: ["healing"],
        }),
        consumptionOverride: {
          targets: [{ type: "hitDice", target: size.toLowerCase(), value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      },
    }));
  }

}
