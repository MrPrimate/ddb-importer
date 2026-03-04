import DDBEnricherData from "../../data/DDBEnricherData";

export default class WalkerInDreams extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Dream",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Dream",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        init: {
          name: "Scrying",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Scrying",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
      {
        init: {
          name: "Teleportation Circle",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Teleportation Circle",
          data: {
            spell: {
              spellbook: false,
            },
          },
        },
      },
    ];
  }

}
