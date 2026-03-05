import DDBEnricherData from "../data/DDBEnricherData";

export default class HuntersMark extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const damageTypes = this.is2014
      ? DDBEnricherData.allDamageTypes()
      : ["force"];

    const hasFoeSlayer = this.is2024 && this.hasClassFeature({ featureName: "Foe Slayer", className: "Ranger" });
    const denomination = hasFoeSlayer
      ? 10
      : 6;

    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          allowCritical: true,
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "special", condition: "When you hit creature with attack" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination, types: damageTypes, scalingFormula: "" })],
        },
      },
      {
        duplicate: true,
        overrides: {
          name: "Move Hunter's Mark",
          noConsumeTargets: true,
          removeSpellSlotConsume: true,
          data: {

          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hunter's Mark: Marked",
        daeChanges: [
          // DDBMacros.generateSourceUpdateMacroChange({
          //   macroType: "spell",
          //   macroName: "huntersMark.js",
          //   document: this.data,
          // }),
          DDBEnricherData.ChangeHelper.customChange("Hunter's Mark", 20, "flags.dae.onUpdateSource"),
        ],
        options: {
          durationSeconds: 3600,
        },
      },
      {
        daeOnly: true,
        midiOnly: true,
        name: "Hunter's Mark (Automation)",
        damageBonusMacroChanges: [
          { macroType: "spell", macroName: "huntersMark.js", document },
        ],
        daeChanges: this.is2014
          ? []
          : [
            DDBEnricherData.ChangeHelper.unsignedAddChange("force", 20, "flags.dae.huntersMark.damageType"),
          ],
        options: {
          transfer: true,
          // durationSeconds: null,
        },
        // force non expiry for midi automation effect
        data: {
          duration: {
            "seconds": null,
            "startTime": null,
            "rounds": null,
            "turns": null,
            "startRound": null,
            "startTurn": null,
          },
        },
        daeSpecialDurations: [],
      },
    ];
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "huntersMark.js",
      triggerPoints: ["preItemRoll"],
    };
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "huntersMark.js",
    };
  }


}
