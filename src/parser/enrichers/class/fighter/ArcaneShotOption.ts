import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneShotOption extends DDBEnricherData {

  get type(): IDDBActivityType {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
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
