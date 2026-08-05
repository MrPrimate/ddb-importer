import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Crimson Rite: invoke a rite (taking hemocraft die damage that cannot be
 * reduced) and enchant a held weapon with the rite, adding the hemocraft die
 * to its damage while active.
 */
export default class CrimsonRite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Invoke Rite",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Take hemocraft die damage (cannot be reduced in any way)",
      allowCritical: false,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.blood-hunter.crimson-rite.die",
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Apply Rite",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crimson Rite",
        activityMatch: "Apply Rite",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Crimson Rite]`, 10, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.blood-hunter.crimson-rite.die", 10, "system.damage.base.bonus"),
        ],
      },
    ];
  }

}
