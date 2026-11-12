import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Helm of Domination (Icecrown Citadel): attuning calls for a DC 18 Charisma save; a success deals
 * 10d6 Psychic and a failure hands the character to the Lich King. DDB's parse reads the damage as
 * 0d6 on an action save that spent a charge.
 */
export default class HelmOfDomination extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attunement Save",
      activationType: "special",
      activationCondition: "When you attune to the helm: a success deals the damage, a failure gives the Lich King your body",
      targetType: "self",
      noConsumeTargets: true,
      data: {
        save: { ability: ["cha"], dc: { calculation: "", formula: "18" } },
        damage: {
          onSave: "full",
          parts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 6, types: ["psychic"] })],
        },
      },
    };
  }

}
