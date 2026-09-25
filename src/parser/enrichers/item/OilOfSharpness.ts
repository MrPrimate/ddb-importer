import DDBEnricherData from "../data/DDBEnricherData";

export default class OilOfSharpness extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      allowMagical: true,
      data: {
        // the description parser reads "Applying the oil takes 1 minute" as the duration; the
        // 2014 coating lasts an hour and the 2024 one is permanent
        duration: this.is2014
          ? { value: "1", units: "hour" }
          : { value: "", units: "perm" },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "3",
        },
        // dnd5e 5.x does not copy the activity duration onto the applied enchantment
        options: this.is2014 ? { durationSeconds: 3600 } : {},
      },
    ];
  }

}
