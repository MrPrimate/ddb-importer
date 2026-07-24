import DDBEnricherData from "../data/DDBEnricherData";

export default class Piercer extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // get activity(): IDDBActivityData {
  //   return {
  //     noeffect: true,
  //   };
  // }

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
          { macroType: "feat", macroName: "piercer.js", document: this.data },
        ],
        onUseMacroChanges: [
          { macroPass: "postDamageRoll", macroType: "feat", macroName: "piercer.js", document: this.data },
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
      name: "piercer.js",
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

}
