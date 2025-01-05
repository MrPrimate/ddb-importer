/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ZephyrStrike extends DDBEnricherData {
  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
          description: this.ddbParser?.ddbDefinition?.description ?? "",
        },
      },
      {
        noCreate: true,
        midiOnly: true,
        optionalMacroChanges: [
          {
            optionPostfix: "ZephyrStrike.macroToCall",
            macroType: "spell",
            macroName: "zephyrStrike.js",
            document: this.data,
          },
        ],
        midiOptionalChanges: [
          {
            name: "ZephyrStrike",
            data: {
              count: "1",
              label: "Gain Zephyr Strike damage bonus?",
              "damage.mwak": "1d8",
              "damage.rwak": "1d8",
              criticalDamage: "1",
            },
          },
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get itemMacro() {
    return {
      name: "zephyrStrike.js",
      type: "spell",
    };
  }
}
