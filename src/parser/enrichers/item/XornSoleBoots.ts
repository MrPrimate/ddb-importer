import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Xorn-Sole Boots: a Bonus Action grants 30 foot tremorsense and a burrow speed equal to walking
 * speed, for up to 10 minutes in total per long rest.
 */
export default class XornSoleBoots extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Click Heels",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
    };
  }

  // DDB's tremorsense and burrow modifiers only apply while the property is active, so the
  // always-on effect generated from them is replaced by the activity effect
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Xorn-Sole Boots",
        options: {
          transfer: false,
          durationSeconds: 600,
          description: "Used in bursts of at least 1 minute, up to 10 minutes in total until you finish a Long Rest. Click your heels together again to end the effect.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(30, 20, "system.attributes.senses.ranges.tremorsense"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.burrow"),
        ],
      },
    ];
  }

}
