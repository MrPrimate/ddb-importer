import DDBEnricherData from "../../data/DDBEnricherData";

export default class TelekineticMovement extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Telekinetic Movement",
      targetType: "creature",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
