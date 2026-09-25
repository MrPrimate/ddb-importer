import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** HP loss is a utility roll: damage resistance and immunity must not change the result. */
export default class InfernalWound extends _MonsterFeatureSupport {
  get wound(): { formula: string; check: I5eActivityCheck } | null {
    const loss = this.text.match(
      /loses (\d+)(?:\s*\((\d+d\d+(?:\s*[+-]\s*\d+)?)\))? Hit Points at the start of each of its turns/i,
    );
    const check = this.check();
    return (/infernal wound/i).test(this.text) && loss && check ? { formula: loss[2] ?? loss[1], check } : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const wound = this.wound;
    if (!wound) return [];
    return [
      this.extra("Infernal Wound: HP Loss", "ddbWoundHPLoss01", "utility", {
        generateRoll: true,
        rollOverride: { formula: wound.formula, name: "Hit Points Lost", visible: true, prompt: false },
        activationOverride: {
          type: "turnStart",
          value: null,
          condition:
            "At the start of the wounded target's turn. Subtract this roll from HP manually; it is HP loss, not damage. Wounds do not stack. Apply the wound duration and closure conditions in the feature description.",
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
}
