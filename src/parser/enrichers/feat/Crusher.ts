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
          durationSeconds: undefined,
          durationRounds: undefined,
        },
        damageBonusMacroChanges: [
          { macroType: "feat", macroName: "crusher.js", document: this.data },
        ],
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: undefined,
          },
        },
        daeSpecialDurations: [],
      },
    ];

  }

  get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "crusher.js",
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
