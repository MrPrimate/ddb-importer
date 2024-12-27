/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Guidance extends DDBEnricherData {

  get activity() {
    return {
      targetType: "creature",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: "Guidance Roll",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: `Guidance`,
        options: {
          durationSeconds: 60,
        },
      },
      {
        noCreate: true,
        name: `Guidance`,
        midiOnly: true,
        midiOptionalChanges: [
          {
            name: "guidance",
            data: {
              label: "Guidance",
              "check.all": "1d4",
              "skill.all": "1d4",
              "iniy.bonus": "1d4",
            },
          },
        ],
        daeSpecialDurations: ["isInitiative"],
      },
    ];
  }

}
