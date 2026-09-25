import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The parser's save is the bonus-action gravity wave, which strikes one creature and places
 * nothing. The gravity field itself is a 20-foot emanation held with concentration for up to 10
 * minutes, once per dusk: difficult terrain for enemies, while friendly creatures move at half
 * cost. Both stay a note on the activity.
 */
export default class RingOfLunarMight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gravity Wave",
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "A creature you can see inside the gravity field",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        save: { ability: ["str"], dc: { calculation: "", formula: "16" } },
        damage: { onSave: "none" },
        range: { override: true, value: "20", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Gravity Field", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Difficult terrain for enemies; friendly creatures other than you spend 1 foot of movement for every 2 feet moved inside",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "radius", size: "20" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "10", units: "minute", concentration: true },
        },
        overrides: {
          noeffect: true,
          data: {
            uses: { spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] },
            consumption: {
              targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
              scaling: { allowed: false, max: "" },
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Gravity Wave",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
