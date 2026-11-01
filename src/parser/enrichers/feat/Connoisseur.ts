import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Connoisseur (OTFY): Gastronomic Bliss is a choice at the end of a rest that included a satisfying
 * meal, Temporary Hit Points (1d10 + character level) or Heroic Inspiration. DDB's action only rolls
 * the dice resolved at the character's level. Heroic Inspiration is a sheet toggle, so its
 * activity is the reminder (as Resourceful).
 */
export default class Connoisseur extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gastronomic Bliss: Temporary Hit Points",
      activationType: "shortRest",
      activationCondition: "You eat a satisfying meal as part of a Short or Long Rest",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@details.level",
          types: ["temphp"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Gastronomic Bliss: Heroic Inspiration",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
        },
        overrides: {
          name: "Gastronomic Bliss: Heroic Inspiration",
          activationType: "shortRest",
          activationCondition: "You eat a satisfying meal as part of a Short or Long Rest",
          targetType: "self",
          noConsumeTargets: true,
        },
      },
    ];
  }

}
