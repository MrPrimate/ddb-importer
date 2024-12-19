/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Piercer extends DDBEnricherData {

  get type() {
    return "none";
  }

  // get activity() {
  //   return {
  //     noeffect: true,
  //   };
  // }

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "piercer.js", document: this.data },
        ],
        onUseMacroChanges: [
          { macroPass: "postDamageRoll", macroType: "feat", macroName: "piercer.js", document: this.data },
        ],
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
        daeSpecialDurations: [],
      },
    ];

  }

  get itemMacro() {
    return {
      type: "feat",
      name: "piercer.js",
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
