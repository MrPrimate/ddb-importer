import DDBEnricherData from "../../data/DDBEnricherData";

export default class PersistentRage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        range: {
          units: "self",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Rage: Regain Expended Uses",
        max: "1",
        period: "lr",
      }),
      retainOriginalConsumption: true,
      retainChildUses: true,
      data: {
        flags: {
          ddbimporter: {
            consumptionValue: "-@scale.barbarian.rages",
          },
        },
      },
    };
  }

}
