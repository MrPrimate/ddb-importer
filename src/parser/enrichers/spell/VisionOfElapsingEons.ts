import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024. The Paralyzed target repeats the Intelligence save at the end of each of its turns: a
 * failure adds an Exhaustion level (which outlasts the spell), a success ends the spell.
 */
export default class VisionOfElapsingEons extends DDBEnricherData {

  static REPEAT_SAVE_ID = "ddbVisionEons002";

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return { data: { damage: { onSave: "none" } } };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        id: VisionOfElapsingEons.REPEAT_SAVE_ID,
        init: { name: "End of Turn Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: false,
          // the Exhaustion it applies must not inherit the spell's duration
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          noSpellslot: true,
          saveOverride: { ability: ["int"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: { type: "special", value: null, condition: "End of each of the Paralyzed target's turns (a success ends the spell)" },
        },
        overrides: {
          targetType: "creature",
          removeSpellSlotConsume: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vision of Elapsing Eons",
        statuses: ["Paralyzed"],
        activityIdsExclude: [VisionOfElapsingEons.REPEAT_SAVE_ID],
        options: { durationSeconds: 60, description: "Repeat the save at the end of each turn; a failure adds 1 Exhaustion level." },
      },
      {
        name: "Exhaustion (Vision of Elapsing Eons)",
        activityMatch: "End of Turn Save",
        statuses: ["Exhaustion"],
        options: { description: "One Exhaustion level per failed end of turn save; it remains after the spell ends." },
        // a spell effect inherits the spell's minute here, and dnd5e 5.x never stamps the save's
        // instantaneous duration over it, so the duration is cleared: the Exhaustion outlasts the spell
        data: { duration: { value: null, units: "seconds", expiry: null } },
      },
    ];
  }

}
