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
