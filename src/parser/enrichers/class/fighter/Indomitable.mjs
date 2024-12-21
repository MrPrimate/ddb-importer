/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Indomitable extends DDBEnricherData {

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
            name: "Indomitable",
            data: {
              label: "Use Indomitable to Succeed?",
              count: "ItemUses.Indomitable",
              "save.fail": "reroll",
            },
          },
        ],
      },
    ];
  }

}
