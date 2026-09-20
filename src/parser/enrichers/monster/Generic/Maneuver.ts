import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Maneuver. */
export default class Maneuver extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    if (
      (/ally/i).test(this.text) &&
      (/reaction/i).test(this.text) &&
      (/move/i).test(this.text) &&
      (/without provoking/i).test(this.text)
    ) {
      return {
        name: "Maneuver",
        noTemplate: true,
        targetType: "ally",
        targetCount: "1",
        activationCondition: this.text,
      };
    }
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }

  override async cleanup(): Promise<void> {
    if (this.activity) {
      // Some third-party titles use lowercase /day, which the generic uses parser omits.
      const daily = (this.parser.fullName ?? "").match(/\((\d+)\s*\/\s*day\)/i);
      const activity = this.activities.find((a) => a.name === "Maneuver");
      if (daily && activity) {
        this.document.system.uses = {
          ...this.document.system.uses,
          max: daily[1],
          spent: this.document.system.uses?.spent ?? 0,
          recovery: [{ period: "day", type: "recoverAll" }],
        };
        activity.consumption = { targets: [{ type: "itemUses", target: "", value: "1" }], spellSlot: false };
      }
    }
  }
}
