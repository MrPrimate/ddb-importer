/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SavageAttacker extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [
          {
            name: "savagAttacker",
            data: {
              label: "Savage Attacker - Weapon Damage Reroll?",
              count: "turn",
              "damage.mwak": "reroll-kh",
            },
          },
        ],
      },
    ];
  }

}
