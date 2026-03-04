import DDBEnricherData from "../../data/DDBEnricherData";

export default class BreathWeapon extends DDBEnricherData {

  get type() {
    if (!this.isAction) return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
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

  get useDefaultAdditionalActivities() {
    return true;
  }

}
