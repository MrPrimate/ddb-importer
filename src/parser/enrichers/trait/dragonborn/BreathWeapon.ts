import DDBEnricherData from "../../data/DDBEnricherData";

export default class BreathWeapon extends DDBEnricherData {

  get type() {
    if (!this.isAction) return "none";
    return "save";
  }

  get activity() {
    return {
      rangeSelf: true,
    };
  }


  // get override() {
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
