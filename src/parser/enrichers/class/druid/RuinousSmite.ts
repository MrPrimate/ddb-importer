import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Entropy: once per turn, a weapon or Unarmed Strike attack can spend a spell slot for 1d8
 * Necrotic plus 1d8 per slot level, and attacks against the target crit on 19-20 (midi grants the
 * threshold to every attacker; core dnd5e has no target-side threshold).
 */
export default class RuinousSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ruinous Smite",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, you make an attack with a weapon or an Unarmed Strike",
      data: {
        consumption: {
          targets: [
            { type: "spellSlots", value: "1", target: "1", scaling: { mode: "level", formula: "" } },
          ],
          scaling: { allowed: true, max: "9" },
          spellSlot: true,
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["necrotic"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ruinous Smite",
        activityMatch: "Ruinous Smite",
        options: {
          description: "Attacks against this creature score a Critical Hit on a roll of 19 or 20.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
        ],
      },
    ];
  }

}
