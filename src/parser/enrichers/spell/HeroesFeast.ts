import DDBEnricherData from "../data/DDBEnricherData";

export default class HeroesFeast extends DDBEnricherData {

  get _healActivity(): IDDBActivityData {
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
          value: "1",
          units: "day",
          override: true,
        },
      },
    };
  }

  get _utilityActivity(): IDDBActivityData {
    return {
      name: "Create Feast",
      noConsumeTargets: true,
      addItemConsume: !this.useMidiAutomations,
      itemConsumeValue: "-12",
      noeffect: true,
    };
  }

  get activity(): IDDBActivityData {
    return this.ddbEnricher?._originalActivity?.type === "heal"
      ? this._healActivity
      : this._utilityActivity;
  }

  get override(): IDDBOverrideData {
    return {
      uses: this.useMidiAutomations
        ? {
          spent: null,
          max: "",
          recovery: [],
        }
        : {
          spent: 12,
          max: "12",
          recovery: [{ period: "sr", type: "loseAll", formula: "" }],
        },
      descriptionSuffix: this.useMidiAutomations
        ? `
<section class="secret ddbSecret" id="secret-ddbHeroesFeast">
<p><strong>Implementation Details</strong></p>
<p>The MidiQoL automation will apply the temp hp bonus and any rolled hit points to characters targeted when Consume Feast is used.</p>
</section>`
        : "",
    };
  }

  get effects(): IDDBEffectHint[] {

    const extraChanges = this.is2014
      ? [
        DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("wis"),
      ]
      : [];

    return [
      {
        activityMatch: "Consume Feast",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("0", 20, "system.attributes.hp.tempmax"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
          DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
        ].concat(extraChanges),
        options: {
          durationSeconds: 86400,
        },
      },
    ];
  }

  get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "heroesFeast.js",
    };
  }

  get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "spell",
      name: "heroesFeast.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
