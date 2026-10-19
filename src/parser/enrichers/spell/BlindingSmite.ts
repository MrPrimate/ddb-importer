import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The smite's damage is part of the hit, so it is never halved and can crit. In 2014 a failed
 * Constitution save blinds the target; in 2024 the hit blinds it outright and the save only comes
 * at the end of each of its turns, so the cast is a damage activity carrying Blinded, with a
 * slot-free end-of-turn save beside it.
 */
export default class BlindingSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      allowCritical: true,
      ...(this.is2014 ? { data: { damage: { onSave: "full" } } } : {}),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      {
        init: {
          name: "End of Turn Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateConsumption: false,
          noSpellslot: true,
          generateSave: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          generateDamage: false,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "End of each of the Blinded target's turns; a success ends the spell on it",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    // Both rulesets: the blinded target makes a Constitution saving throw at
    // the end of each of its turns, ending the spell on itself on a success.
    return [
      {
        // merge into the auto-generated Blinded effect rather than creating a
        // second one
        noCreate: true,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Blinding Smite (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
