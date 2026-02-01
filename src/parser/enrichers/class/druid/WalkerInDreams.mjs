/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WalkerInDreams extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        constructor: {
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
        constructor: {
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
        constructor: {
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
