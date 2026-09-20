import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spreading the caltrops rolls nothing: it places a 5-foot square, and the save is its own
 * activity rolled by hand against a creature that enters. A failure spends the caltrops in a
 * burst that lifts the creature into the air, so the save carries both damage parts and the
 * levitation rider.
 */
export default class AstralCaltrops extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spread Caltrops",
      targetType: "creature",
      activationType: "action",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "square", size: "5" },
        },
        range: { override: true, value: "5", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Astral Caltrops Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ bonus: "1", types: ["piercing"] }),
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["force"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the area; the caltrops are destroyed on a failed save",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Astral Caltrops: Suspended",
        activityMatch: "Astral Caltrops Save",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 50, "system.attributes.movement.all"),
        ],
        daeSpecialDurations: ["isDamaged"],
        options: {
          transfer: false,
          durationSeconds: 24,
          description: "Stops moving, then rises up to 20 feet and hangs there with a Speed of 0 for 1d4 rounds. The effect ends early if the creature takes any damage.",
        },
      },
    ];
  }

}
