import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The crown is an emanation on the caster, 20 feet in the
 * legacy printing and 30 feet in the current one, that deals its damage with no save to a Fiend,
 * Fey or Undead that moves within it or begins its turn there, a free roll made by hand. The
 * crown also sheds light.
 */
export default class CrownOfRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "radius", size: this.is2014 ? "20" : "30", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Crown Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A Fiend, Fey or Undead moves within the crown's radius or begins its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // the light is the caster's own, gained with the cast
        name: "Crown of Radiance: Light",
        activityMatch: "Cast",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "60"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#fff2c2"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
        ],
        options: { transfer: false },
      },
    ];
  }

}
