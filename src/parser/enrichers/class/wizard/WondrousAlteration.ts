import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Transmuter (AU 2024) level 3: Alter Self is always prepared and can be cast once per Long Rest
 * without a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is
 * dropped by FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 *
 * Each Alter Self option carries its own benefit, and which option is in use is picked at each
 * casting, but DDB builds the feature as a choice with one option child. Every child therefore
 * carries all three riders in place of DDB's single option action: the Aquatic Adaptation Dash,
 * the Natural Weapons 2d6 damage, and disabled effects for Change Appearance (Advantage on
 * Deception checks) and Natural Weapons (Advantage on concentration saves) to switch on while
 * the matching option is active.
 */
export default class WondrousAlteration extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Alter Self",
      addSpellUuid: "Alter Self",
      addItemConsume: true,
      noSpellslot: true,
      activationType: "action",
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Aquatic Adaptation: Dash",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          activationOverride: { type: "bonus", value: null, condition: "While underwater under Alter Self's Aquatic Adaptation" },
        },
        overrides: {
          targetType: "self",
          noConsumeTargets: true,
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Natural Weapons: Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "A hit with Alter Self's Natural Weapons" },
        },
        overrides: {
          targetType: "self",
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            roll: {
              prompt: false,
              visible: true,
              name: "Natural Weapons Damage",
              formula: "2d6",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wondrous Alteration: Change Appearance",
        options: {
          transfer: true,
          disabled: true,
          description: "While Alter Self's Change Appearance is active: Advantage on Charisma (Deception) checks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("dec"),
        ],
      },
      {
        name: "Wondrous Alteration: Natural Weapons",
        options: {
          transfer: true,
          disabled: true,
          description: "While Alter Self's Natural Weapons are active: Advantage on saves to maintain Concentration.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.concentrationRollModeChange(1),
        ],
      },
    ];
  }

  // DDB's modifier effect covers only the chosen option; the two effects above replace it
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Wondrous Alteration",
        max: "1",
        period: "lr",
      }),
    };
  }

}
