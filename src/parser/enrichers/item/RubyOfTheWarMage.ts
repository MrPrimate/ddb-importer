import DDBEnricherData from "../data/DDBEnricherData";

/**
 * As the official DMG item: pressing the ruby against a Simple or Martial weapon for a minute is an
 * enchantment that makes the weapon a spellcasting focus and names it "of the War Mage".
 */
export default class RubyOfTheWarMage extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attach Ruby",
      activationType: "minute",
      activationValue: 1,
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "object",
      targetCount: "1",
      data: {
        // the ruby stays attached until it is removed; DDB's text otherwise gives the enchantment a duration
        duration: { value: "", units: "inst", override: true },
        restrictions: {
          type: "weapon",
          allowMagical: false,
          categories: ["simpleM", "simpleR", "martialM", "martialR"],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Attached Ruby",
        type: "enchant",
        activityMatch: "Attach Ruby",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("foc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("{} of the War Mage", 20, "name"),
        ],
      },
    ];
  }

}
