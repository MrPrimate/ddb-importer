import DDBEnricherData from "../data/DDBEnricherData";

export default class Piercer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // get activity(): IDDBActivityData {
  //   return {
  //     noeffect: true,
  //   };
  // }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
          durationSeconds: undefined,
          durationRounds: undefined,
          expiry: null,
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
      },
    ];

  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "piercer.js",
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
