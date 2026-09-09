import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverPredatorsHowl extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Predator's Howl", "Predator's Howl: Frightened Damage"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Howl",
      activationType: "bonus",
      targetType: "creature",
      targetCount: "2",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "con",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Frightened Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "psychic" }),
          ],
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "The frightened creature takes damage from a weapon attack",
          noConsumeTargets: true,
        },
      },
    ];
  }

}
