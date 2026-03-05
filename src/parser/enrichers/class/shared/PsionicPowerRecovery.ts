import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicPowerRecovery extends DDBEnricherData {
  get activity(): IDDBActivityData {
    return {
      name: "Recovery",
      addActivityConsume: true,
      addItemConsume: true,
      itemConsumeValue: "-1",
      data: {
        uses: this._getUsesWithSpent({
          type: "class",
          name: "Psionic Power: Recovery",
          max: "1",
          period: "lr",
        }),
      },
    };
  }
}
