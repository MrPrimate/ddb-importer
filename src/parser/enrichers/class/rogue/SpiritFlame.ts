import DDBEnricherData from "../../data/DDBEnricherData";

/** Waxwork Rogue: the lit specialty candle grants fire immunity for a minute; DDB's actions keep the use and the candle save. */
export default class SpiritFlame extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Specialty Candle",
        activityMatch: "Ignite Specialty Candle",
        options: {
          durationSeconds: 60,
          description: "Your enchantments cost 1 fewer Wick Point, you have Immunity to Fire damage, and Spirits have Disadvantage on attack rolls against you.",
        },
        changes: [DDBEnricherData.ChangeHelper.damageImmunityChange("fire")],
      },
    ];
  }

}
