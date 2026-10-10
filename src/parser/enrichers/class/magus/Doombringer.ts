import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Knights Stygian level 3. Unnatural Vitality spends a spell slot (level picked as the scaling) for
 * twice its level in Hit Dice. Reaper's Reward spends and rolls a Hit Die once per turn on a hit:
 * the roll is extra Necrotic damage and the same amount of healing for the magus, one activity
 * per die size (the healing is not rolled separately). Deathsight is text only.
 */
export default class Doombringer extends DDBEnricherData {

  static reapersReward(size: "smallest" | "largest"): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Once per turn when you hit a creature with a weapon or Unarmed Strike; you also regain Hit Points equal to the roll",
      targetType: "creature",
      targetCount: 1,
      noConsumeTargets: true,
      noTemplate: true,
      additionalConsumptionTargets: [
        { type: "hitDice", target: size, value: "1", scaling: { mode: "", formula: "" } },
      ],
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd",
          types: ["necrotic"],
          scalingMode: "none",
        }),
      ],
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unnatural Vitality",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
      additionalConsumptionTargets: [
        // regain two Hit Dice per slot level
        { type: "hitDice", target: "smallest", value: "-2", scaling: { mode: "amount", formula: "-2" } },
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return (["smallest", "largest"] as const).map((size) => ({
      init: {
        name: `Reaper's Reward (${size === "smallest" ? "Smallest" : "Largest"} Hit Die)`,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateTarget: true,
        generateDamage: true,
      },
      overrides: Doombringer.reapersReward(size),
    }));
  }

}
