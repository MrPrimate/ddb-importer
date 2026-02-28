import DDBEnricherData from "../../data/DDBEnricherData";

export default class NatureMagician extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Nature Magician",
      noConsumeTargets: true,
      targetType: "self",
      rangeSelf: true,
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
