import DDBEnricherData from "../../data/DDBEnricherData";

export default class BreathWeapon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (!this.isAction) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      rangeSelf: true,
    };
  }


  // get override(): IDDBOverrideData {
  //   console.warn(this);
  //   const uses = this._getUsesWithSpent({
  //     type: "race",
  //     name: this.data.name,
  //   });
  //   return {
  //     data: {
  //       system: {
  //         uses,
  //       },
  //     },
  //   };
  // }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
