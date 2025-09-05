/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArcaneShotOption extends DDBEnricherData {

  get type() {
    return this.isAction ? null : "none";
  }

  get activity() {
    return {
      data: {
        damage: {
          onSave: "full",
          critical: { allow: true },
        },
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return false;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get builtFeaturesFromActionFilters() {
    return [this.name];
  }

  // get overrides() {
  //   return {
  //     data: {
  //       name: this.name,
  //     },
  //   };
  // }

}
