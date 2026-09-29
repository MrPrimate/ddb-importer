import DDBEnricherData from "../data/DDBEnricherData";
import _HandheldFlame from "./_HandheldFlame";

/** A lit torch can also be swung as an improvised melee attack for 1 Fire damage. */
export default class Torch extends _HandheldFlame {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          activationType: "action",
          targetType: "creature",
          data: {
            range: { override: true, units: "ft", value: "5" },
            attack: {
              ability: "str",
              type: {
                value: "melee",
                classification: "weapon",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "1",
                  types: ["fire"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Torch Light",
        activityMatch: "Light",
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#f8c377", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
        ],
      },
    ];
  }
}
