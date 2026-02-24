import DDBEnricherData from "../../data/DDBEnricherData";

export default class WalkerInDreams extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        init: {
          name: "Dream",
          type: "cast",
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
          type: "cast",
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
          type: "cast",
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
