import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Path of the Elements (World of Warcraft) and the WoW Shaman's Elemental Specialization: Resistance
 * to Cold, Fire and Lightning damage while Rage is active, as a transferred effect toggled with Rage.
 */
export default class PrimordialBond extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      name: "Activate",
      activationType: "special",
      activationCondition: "While your Rage is active",
      data: {
        duration: { units: "minute", value: "10" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Primordial Bond",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: 600,
        },
        activityMatch: "Activate",
        changes: ["cold", "fire", "lightning"].map((damage) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(damage),
        ),
      },
    ];
  }

}
