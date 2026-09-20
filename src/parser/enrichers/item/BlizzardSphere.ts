import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Shattering the sphere rolls nothing: it places a 20-foot-radius blizzard for 1d4 rounds that is
 * icy difficult terrain. The save is its own activity, rolled by hand against a creature that
 * enters the blizzard or starts its turn there.
 */
export default class BlizzardSphere extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw",
      targetType: "creature",
      activationType: "action",
      activationCondition: "The area is difficult terrain",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "sphere", size: "20" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, units: "spec", special: "1d4 rounds" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Blizzard Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["cold"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the blizzard for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "half" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blizzard: Speed Halved",
        activityMatch: "Blizzard Save",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("/2", 50, "system.attributes.movement.all"),
        ],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Speed halved until the start of its next turn.",
        },
      },
    ];
  }

}
