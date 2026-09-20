import DDBEnricherData from "../data/DDBEnricherData";

/**
 * 2014: no damage, a Constitution save against crippling pain; AU 2024: 6d8 Force and the
 * pain rider only if the target has 100 HP or fewer.
 */
export default class PowerWordPain extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SAVE : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    if (this.is2014) {
      return {
        targetType: "creature",
        data: {
          save: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          damage: { parts: [] },
        },
      };
    }
    return {
      targetType: "creature",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 6, denomination: 8, type: "force", scalingMode: "none" })],
        },
      },
    };
  }

  /** The Constitution save the Charmed target makes to cast a spell and at the end of each turn. */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Constitution Save (Cast a Spell / End of Turn)", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: false,
          noSpellslot: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: { type: "special", value: null, condition: "When the affected target tries to cast a spell, or at the end of its turn (a success ends the spell)" },
        },
        overrides: {
          targetType: "creature",
          removeSpellSlotConsume: true,
          noTemplate: true,
          // the repeat save ends the pain rider; it must not re-apply it
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Crippling Pain" : "Pained",
        statuses: this.is2014 ? [] : ["Charmed"],
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("10", 20, "system.attributes.movement.walk"),
          ...["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(ability),
          ),
          // every saving throw except Constitution
          ...["str", "dex", "int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(ability),
          ),
        ],
        options: {
          durationSeconds: 60,
          description: this.is2014
            ? "Speed 10 feet; Disadvantage on attack rolls, ability checks and saves except Constitution; must succeed on a Constitution save to cast a spell."
            : "Applies only if the target had 100 HP or fewer. Speed no more than 10 feet; Disadvantage on D20 Tests except Constitution saves; a Constitution save is needed to cast a spell.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.overTimeSaveChange({
            document: this.data,
            turn: "end",
            saveAbility: "con",
            saveRemove: true,
            dc: "@attributes.spell.dc",
          }),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
