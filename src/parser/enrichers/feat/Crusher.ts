import DDBEnricherData from "../data/DDBEnricherData";

export default class Crusher extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
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

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "crusher.js",
    };
  }

  override get useDefaultAdditionalActivities() {
    return true;
  }

}
