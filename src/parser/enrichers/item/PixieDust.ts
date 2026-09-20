import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Pixie Dust: the creature it is sprinkled on flies and hovers for 1 minute. DDB ships the speed
 * as a "set flying speed" modifier, and because the dust is a wondrous item and not a potion the
 * importer would make that a passive effect on whoever carries the packet. The automatic effect is
 * dropped and the speed is applied to the recipient by using the dust.
 */
export default class PixieDust extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sprinkle Dust",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: { count: "1", type: "creature", choice: false, special: "Yourself or a creature you can see" },
          template: {},
        },
        range: { override: true, value: "5", units: "ft" },
        duration: { value: "1", units: "minute", special: "" },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pixie Dust",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Fly Speed 30 feet and can hover for 1 minute. If airborne when this ends, the creature falls safely, taking no damage and landing on its feet.",
        },
      },
    ];
  }

}
