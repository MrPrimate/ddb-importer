import DDBEnricherData from "../data/DDBEnricherData";

export default class Crusher extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      noeffect: true,
    };
  }

  get effects(): IDDBEffectHint[] {
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
