import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Scion of the Three capstone. Cutthroat regains a Bloodthirst use on a short rest (Bloodthirst's
 * own recovery already models this, the activity is for restoring it by hand); Murderous Intent
 * treats 1s and 2s on Sneak Attack dice as 3s, offered as a second Sneak Attack roll beside the
 * transferred scale modifier.
 */
export default class DreadIncarnate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cutthroat: Regain Bloodthirst Use",
      activationType: "special",
      activationCondition: "When you finish a Short Rest",
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: "Bloodthirst",
      itemConsumeValue: "-1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sneak Attack (Murderous Intent)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: false,
          noeffect: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scale.rogue.sneak-attack.number)d6min3",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          noTemplate: true,
          noConsumeTargets: true,
          data: {
            range: {
              units: "spec",
            },
            damage: {
              critical: { allow: true },
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("min3", 20, "system.scale.rogue.sneak-attack.modifiers"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
