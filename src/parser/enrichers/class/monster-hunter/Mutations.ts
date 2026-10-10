import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Devourer Guild: the mutation list a consumed monster portion grants. Only the mutations that roll
 * damage or healing get activities; the rest are conditions and senses described in the text.
 */
export default class Mutations extends DDBEnricherData {

  static damageMutation(name: string, number: number, denomination: number, types: string[], condition: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number, denomination, types })],
        activationOverride: { type: "special", value: 1, condition },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regeneration",
      targetType: "self",
      activationType: "special",
      activationCondition: "You consume a Beast, Giant or Monstrosity portion",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 8,
          bonus: "@classes.monster-hunter.levels",
          types: ["healing"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      Mutations.damageMutation("Acid Blood", 2, 6, ["acid"], "For 1 minute, a creature within 5 feet hits you with an attack"),
      Mutations.damageMutation("Might", 1, 6, [], "For 1 minute, you hit with a Strength-based attack (the attack's damage type)"),
    ];
  }

}
