import DDBEnricherData from "../data/DDBEnricherData";

const EFFECT_NAME = "Aura of Evasion";

function changes(): IActiveEffectChangeData[] {
  return [DDBEnricherData.ChangeHelper.ruleAdvantageChange("save", { conditions: { k: "roll.ability", o: "exact", v: "dex" } })];
}

function midiChanges(): IActiveEffectChangeData[] {
  return [DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.superSaver.dex")];
}

/** Region arm for tables without auraeffects, embedded aura arm for tables with it. */
export default class AuraOfEvasion extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: EFFECT_NAME, auraeffectsNever: true }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: EFFECT_NAME,
        standalone: true,
        auraeffectsNever: true,
        changes: changes(),
        midiChanges: midiChanges(),
        options: { durationSeconds: 60 },
      },
      {
        name: EFFECT_NAME,
        auraeffectsOnly: true,
        daeStackable: "none",
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
        },
        changes: changes(),
        midiChanges: midiChanges(),
        options: { durationSeconds: 60 },
      },
    ];
  }

}
