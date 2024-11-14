/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ThunderStep extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        range: {
          override: true,
          value: "",
          units: "self",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };


  }

}
