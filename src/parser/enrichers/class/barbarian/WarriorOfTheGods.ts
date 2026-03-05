import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarriorOfTheGods extends DDBEnricherData {
  get type() {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.NONE : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    if (this.is2014) return {};
    return {
      name: "Heal",
      targetType: "self",
      rangeSelf: true,
      itemConsumeValue: "1",
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(@scaling)d12",
          types: ["healing"],
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return this.is2014
      ? {}
      : {
        uses: this._getUsesWithSpent({
          type: "class",
          name: "Warrior of the Gods: Expend Dice",
          max: "@scale.zealot.warrior-of-the-gods.number",
          period: "lr",
        }),
      };
  }

}
