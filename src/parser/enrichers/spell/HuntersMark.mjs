/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HuntersMark extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  get additionalActivities() {
    const damageTypes = this.is2014
      ? DDBEnricherData.allDamageTypes()
      : ["force"];

    const hasFoeSlayer = this.is2024 && this.hasClassFeature({ featureName: "Foe Slayer", className: "Ranger" });
    const denomination = hasFoeSlayer
      ? 10
      : 6;

    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          allowCritical: true,
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
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

  get effects() {
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
          // durationSeconds: 3600,
        },
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
