import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Death's Master (Necromancer, AU 2024): explode an Undead that drops to 0 HP. The dice count
 * depends on the creature's unexpended Hit Dice, so the 1d6 here is the minimum and the user
 * scales it at roll time. ExtinguishUndeadSpellSlot covers the uncontrolled-Undead variant.
 */
export default class ExtinguishUndead extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Extinguish Undead",
      targetType: "creature",
      activationType: "special",
      activationCondition: "An Undead you can see drops to 0 HP; roll d6s equal to half its unexpended Hit Dice",
      data: {
        save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "necrotic", scalingMode: "none" }),
          ],
        },
        target: {
          affects: { type: "creature" },
          template: { type: "radius", size: "10", units: "ft" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Extinguished: No Reactions",
        activitiesMatch: ["Extinguish Undead", "Extinguish Uncontrolled Undead"],
        options: { expiry: "targetStart" },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.noReaction"),
        ],
      },
    ];
  }

}
