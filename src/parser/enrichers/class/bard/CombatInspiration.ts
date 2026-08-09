import DDBEnricherData from "../../data/DDBEnricherData";

export default class CombatInspiration extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        name: "Defense",
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.inspiration",
          name: "Inspiration Roll",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration",
            }),
          ],
        },
      },
    ];
  }
}
