/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HeroesFeast extends DDBEnricherData {

  get _healActivity() {
    return {
      name: "Consume Feast",
      noConsumeTargets: true,
      addItemConsume: !this.useMidiAutomations,
      targetType: "creature",
      overrideTarget: true,
      overrideTemplate: true,
      noSpellslot: true,
      noTemplate: true,
      data: {
        target: {
          prompt: false,
        },
        duration: {
          value: 1,
          units: "day",
          override: true,
        },
      },
    };
  }

  get _utilityActivity() {
    return {
      name: "Create Feast",
      noConsumeTargets: true,
      addItemConsume: !this.useMidiAutomations,
      itemConsumeValue: "-12",
      noEffect: true,
    };
  }

  get activity() {
    return this.ddbEnricher?._originalActivity?.type === "heal"
      ? this._healActivity
      : this._utilityActivity;
  }

  get override() {
    return {
      data: {
        // flags: {
        //   "midi-qol": {
        //     removeAttackDamageButtons: false,
        //   },
        // },
        "system.uses": this.useMidiAutomations
          ? {
            spent: null,
            max: "",
            recovery: [],
          }
          : {
            spent: "12",
            max: "12",
            recovery: [{ period: "sr", type: "loseAll", formula: "" }],
          },
      },
      descriptionSuffix: this.useMidiAutomations
        ? `
<section class="secret" id="secret-ddbHeroesFeast">
<p><strong>Implementation Details</strong></p>
<p>The MidiQoL automation will apply the temp hp bonus and any rolled hit points to characters targeted when Consume Feast is used.</p>
</section>`
        : "",
    };
  }

  get effects() {

    const extraChanges = this.is2014
      ? [
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.wis.save.roll.mode`),
      ]
      : [];

    return [
      {
        activityMatch: "Consume Feast",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("0", 20, "system.attributes.hp.tempmax"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("frightened", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("poisoned", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("poison", 20, "system.traits.di.value"),
        ].concat(extraChanges),
        options: {
          durationSeconds: 86400,
        },
      },
    ];
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "heroesFeast.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "heroesFeast.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
