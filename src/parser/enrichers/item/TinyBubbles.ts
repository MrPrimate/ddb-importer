import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Drinking the potion rolls nothing: it fills a 20-foot cube with bubbles for 1 hour, and the
 * save is rolled by hand against a creature that enters. A failure bursts the bubbles on everyone
 * inside the cube, not only the creature that saved, so the other targets are added by hand.
 */
export default class TinyBubbles extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "cube", size: "20" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "1", units: "hour" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Bubbles Burst Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["thunder"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters a space of bubbles for the first time on a turn; a failure damages every creature inside the cube",
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

}
