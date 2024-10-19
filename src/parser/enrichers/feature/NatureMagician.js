/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class NatureMagician extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Nature Magician",
      type: "utility",
      noConsumeTargets: true,
      targetType: "self",
      rangeSelf: "self",
      addItemConsume: true,
      addScalingMode: "formula",
      addActivityConsume: true,
      additionalConsumptionTargets: [
        {
          type: "spellSlots",
          value: "-1",
          target: "2",
          scaling: {
            mode: "level",
            formula: "2",
          },
        },
      ],
      data: {
        uses: foundry.utils.mergeObject({ override: true }, this.data.system.uses),
        consumption: {
          scaling: {
            allowed: true,
            max: "@scale.druid.wild-shape-uses",
          },
          spellSlot: true,
        },
      },
    };
  }

}
