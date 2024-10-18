/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class LivingLegend extends DDBEnricherMixin {

  activity() {
    return {
      type: "none",
    };
  }

  additionalActivities() {
    return [
      { action: { name: "Embody Legend", type: "class", rename: ["Activate Living Legend"] } },
      // these don't always show up
      // { action: { name: "Saving Throw Reroll", type: "class" } },
      // { action: { name: "Unerring Strike", type: "class" } },

      // todo: embody legend restore use/spell slot use
      // aditional actions
    ];
  }

  override() {
    return {
      data: {
        name: "Living Legend",
      },
    };
  }

}
