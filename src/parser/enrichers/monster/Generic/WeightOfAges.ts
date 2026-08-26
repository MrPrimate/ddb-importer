import DDBEnricherData from "../../data/DDBEnricherData";

/**
 *The elf / shadar-kai exemption is manual.
 */
export default class WeightOfAges extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Aura",
      activationType: "special",
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "5",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: "Weight of Ages",
            types: ["beast", "humanoid"],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weight of Ages",
        standalone: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("-20", 20),
        ],
        options: {
          description: "Speed reduced by 20 feet while within 5 feet of the soul monger. Elves and shadar-kai are unaffected - remove from them manually.",
        },
      },
    ];
  }

}
