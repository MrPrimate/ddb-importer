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
    const lightAnimation = "{type: \"torch\", speed: 2, intensity: 2}";
    return [
      {
        name: "Torch Light",
        atlOnly: true,
        activityMatch: "Light",
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "40"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "#f8c377"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "0.4"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.UPGRADE, lightAnimation),
        ],
      },
    ];
  }
}
