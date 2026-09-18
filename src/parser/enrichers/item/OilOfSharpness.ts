import DDBEnricherData from "../data/DDBEnricherData";

export default class OilOfSharpness extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      allowMagical: true,
      data: {
        // the description parser reads "Applying the oil takes 1 minute" as the duration; the
        // 2014 coating lasts an hour and the 2024 one is permanent, and dnd5e 6.0 stamps the
        // enchant activity's duration onto the applied enchantment
        duration: this.is2014
          ? { value: "1", units: "hour" }
          : { value: "", units: "perm" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "3",
        },
      },
    ];
  }

}
