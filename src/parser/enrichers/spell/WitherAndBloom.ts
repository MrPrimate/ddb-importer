import DDBEnricherData from "../data/DDBEnricherData";

export default class WitherAndBloom extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Wither",
      data: { damage: { onSave: "half" } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Bloom", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          noSpellslot: true,
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@mod", types: ["healing"] }),
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "One creature in the area rolls and expends a Hit Point Die and adds this",
          noTemplate: true,
        },
      },
    ];
  }

}
