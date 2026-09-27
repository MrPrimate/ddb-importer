import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/**
 * The wound ticks on the wounded target's turn, not the devil's, so the untyped damage roll uses a
 * special activation: a turnStart activation would post dnd5e's combat reminder on the owner's turn.
 * A failed wound save places a plain tracker effect on the target so the wound can be followed.
 */
export default class InfernalWound extends _MonsterFeatureSupport {
  get wound(): { formula: string; check: I5eActivityCheck; escalates: boolean; seconds: number | null } | null {
    const loss = this.text.match(
      /loses? (\d+)(?:\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\))? Hit Points at the start of each of its turns/i,
    );
    const check = this.check();
    if (!(/infernal wound/i).test(this.text) || !loss || !check) return null;
    const minutes = this.text.match(/closes after (\d+) minutes?/i);
    return {
      formula: loss[2] ?? loss[1],
      check,
      escalates: (/damage dealt by the wound increases/i).test(this.text),
      seconds: minutes ? Number(minutes[1]) * 60 : null,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const wound = this.wound;
    if (!wound) return [];
    const escalation = wound.escalates ? ` Each further hit adds another ${wound.formula}; add it manually.` : "";
    return [
      this.extra("Infernal Wound", "ddbWoundDamage01", "damage", {
        generateDamage: true,
        damageParts: [this.damage(wound.formula, "")],
        activationOverride: {
          type: "special",
          value: null,
          condition:
            "At the start of each of the wounded target's turns. Hit Point loss: untyped, so only resistance or immunity to all damage applies. Wounds do not stack; closes per the description."
            + escalation,
        },
      }),
      this.extra("Stanch Wound", "ddbStanchWound01", "check", {
        generateCheck: true,
        checkOverride: wound.check,
        activationOverride: {
          type: "action",
          value: 1,
          condition: "The target or a creature within 5 feet uses its action. A successful check closes the wound.",
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const wound = this.wound;
    if (!wound) return [];
    const timer = wound.seconds ? ` or after ${wound.seconds / 60} minute${wound.seconds === 60 ? "" : "s"}` : "";
    return [
      {
        name: "Infernal Wound",
        // the wound save, whatever the stat block names it; the attack only when no save was parsed
        activityTypesMatch: ["save", "attack"],
        options: {
          expiry: null,
          durationSeconds: wound.seconds,
          description:
            `Loses ${wound.formula} Hit Points at the start of each of its turns: roll the devil's Infernal Wound damage activity. `
            + `The wound closes on a successful Stanch Wound check, when the target regains Hit Points from magic${timer}. `
            + "Wounds do not stack; remove any duplicate tracker.",
        },
      },
    ];
  }
}
