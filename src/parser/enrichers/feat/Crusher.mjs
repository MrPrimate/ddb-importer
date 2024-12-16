/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Crusher extends DDBEnricherData {

  get activity() {
    return {
      noeffect: true,
    };
  }

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
          { macroType: "feat", macroName: "crusher.js", document: this.data },
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
      name: "crusher.js",
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
