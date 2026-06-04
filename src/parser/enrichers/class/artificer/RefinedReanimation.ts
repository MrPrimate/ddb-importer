import DDBEnricherData from "../../data/DDBEnricherData";

export default class RefinedReanimation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Raise Dead",
      addItemConsume: true,
      itemConsumeValue: 1,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return[
      {
        init: {
          name: "Life Transfer: Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateRange: false,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "reaction",
          targetType: "self",
          noConsumeTargets: true,
          activationCondition: "When you or your companion take damage",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scaling",
              types: ["healing"],
            }),
            consumption: {
              scaling: {
                allowed: true,
                max: "@classes.artificer.levels * 5",
              },
              spellSlot: true,
              targets: [],
            },
          },
        },
      },
    ];
  }

}
