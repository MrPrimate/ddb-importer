import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Caltrops with an acid payload. Spreading the bag places a 5-foot square, and the save is its
 * own activity rolled by hand against a creature that enters; a failure also rolls on the item's
 * d4 table, which is its own activity so the result is rolled once and read from the description.
 * Only the first entry of that table deals damage, so it gets a roll of its own.
 */
export default class Caltrooze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spread Caltroozes",
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
        init: { name: "Caltrooze Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
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
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the area (Advantage when moving through at half speed)",
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
        init: { name: "Corrosive Chaos", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature fails the save; the caltroozes are then emptied of acid",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { roll: { prompt: false, visible: false, name: "Corrosive Chaos", formula: "1d4" } },
        },
      },
      {
        init: { name: "Corrosive Chaos: Acid Burst", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["acid"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Rolled a 1 on Corrosive Chaos",
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
        name: "Caltrooze: Speed Reduced",
        activityMatch: "Caltrooze Save",
        changes: [DDBEnricherData.ChangeHelper.addChange("-10", 20, "system.attributes.movement.walk")],
        options: {
          transfer: false,
          description: "Stops moving, and walking speed is reduced by 10 feet until the creature regains at least 1 Hit Point.",
        },
      },
    ];
  }

}
