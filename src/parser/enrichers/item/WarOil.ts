import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spilling the oil rolls nothing: it places a 10-foot-radius patch of difficult terrain, and the
 * slip save is rolled by hand against a creature that enters it or starts its turn there. The
 * fire damage only matters once something ignites the oil, so it is a roll of its own.
 */
export default class WarOil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spill War Oil",
      targetType: "creature",
      activationType: "action",
      activationCondition: "The coated area is difficult terrain",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "circle", size: "10" },
        },
        range: { override: true, value: null, units: "spec", special: "Where the alchemical ammunition lands (attack against AC 10)" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "War Oil Slip Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "10" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the coated area for the first time on a turn or starts its turn there",
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
      {
        init: { name: "Burning War Oil Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["fire"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "If ignited (burns for 2 rounds): touches the burning oil, and again if it ends its turn in contact",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "War Oil Slip Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "War Oil: Speed 0",
        activityMatch: "War Oil Slip Save",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 50, "system.attributes.movement.all"),
        ],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Speed 0 until the end of its turn.",
        },
      },
    ];
  }

}
