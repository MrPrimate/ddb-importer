import DDBEnricherData from "../../data/DDBEnricherData";

export default class StunningStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    const spend = this.is2014 ? "Ki" : "Monk's Focus";
    const activity: IDDBActivityData = {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      itemConsumeTargetName: spend,
      additionalConsumptionTargets: this.is2014
        ? []
        :  [
          {
            type: "itemUses",
            target: "",
            value: "1",
            scaling: {
              mode: "",
              formula: "",
            },
          },
        ],
      data: {
        "range.units": "touch",
        save: {
          ability: ["con"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    };

    return activity;
  }

  get override(): IDDBOverrideData {
    return this.is2014
      ? {
        replaceActivityUses: true,
      }
      : {
        replaceActivityUses: true,
        data: {
          system: {
            uses: {
              max: 1,
              recovery: [
                { period: "turnStart", type: "recoverAll" },
              ],
              spent: 0,
            },
          },
        },
      };
  }

}
