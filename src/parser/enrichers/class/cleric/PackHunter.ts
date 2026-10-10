import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hunt Domain. The reaction is an attack rider, so the "Kill" half is a damage
 * activity dealing Mark Prey's extra damage; "Retreat" emboldens the creature
 * the marked target attacks.
 */
export default class PackHunter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Kill",
      activationType: "reaction",
      activationCondition: "A creature other than you hits the target of your Mark Prey",
      targetType: "creature",
      allowCritical: true,
      removeDamageParts: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.hunt.mark-prey-damage",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Retreat",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          activationType: "reaction",
          activationCondition: "The target of your Mark Prey attacks a creature you can see within 60 feet",
          targetType: "ally",
          targetCount: 1,
          addItemConsume: true,
          data: {
            range: {
              value: 60,
              units: "ft",
            },
          },
        },
      },
    ];
  }

}
