import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeastsOfIllOmen extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Summon Beast",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: 3,
      data: {
        activation: {
          override: true,
        },
        spell: {
          spellbook: true,
          properties: ["material"],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          data: {
            activation: {
              override: true,
              type: "minute",
              value: 1,
            },
            spell: {
              spellbook: true,
              properties: ["concentration", "material"],
            },
          },
        },
      },
    ];
  }
}
