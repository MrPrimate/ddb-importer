import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Whiskered Nakurina (OTFY): a Charisma (Performance) check sets the demon's Wisdom save DC (at most
 * 20), and a successful save hurts the player for 2d4 Psychic. The parser put that damage on a
 * save against the demon. An activity cannot read the check result as a DC, so the demon's save is
 * rolled from its own sheet and the backlash is a self-targeted damage activity.
 */
export default class WhiskeredNakurina extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Play Nakurina (Performance)",
      activationType: "action",
      targetType: "self",
      data: {
        check: {
          associated: ["prf"],
          ability: "cha",
          dc: { calculation: "", formula: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Backlash", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: { generateDamage: true, generateConsumption: false },
        overrides: {
          name: "Backlash",
          activationType: "special",
          activationCondition: "The demon succeeds on its save",
          targetType: "self",
          noConsumeTargets: true,
          data: {
            damage: {
              parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["psychic"] })],
            },
          },
        },
      },
    ];
  }

}
