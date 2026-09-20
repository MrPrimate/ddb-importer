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
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#fff2c2", 20, "ATL.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "ATL.light.alpha"),
        ],
        options: { transfer: false },
      },
    ];
  }

}
