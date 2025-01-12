/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FoeSlayer extends DDBEnricherData {

  get effects() {
    return [{
      name: "Foe Slayer (Automation)",
      options: {
        transer: true,
      },
      midiOptionalChanges: [
        {
          name: "foeSlayer",
          data: {
            label: "Use Foe Slayer?",
            "damage.msak": "@abilities.wis.mod",
            "damage.mwak": "@abilities.wis.mod",
            "damage.rsak": "@abilities.wis.mod",
            "damage.rwak": "@abilities.wis.mod",
            count: "each-round",
          },
        },
      ],
    }];
  }

}
