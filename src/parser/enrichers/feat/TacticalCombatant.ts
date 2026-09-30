import DDBEnricherData from "../data/DDBEnricherData";

/** Buffering Strike and Honed Instincts each come back when you roll Initiative or finish a Short or Long Rest. */
export default class TacticalCombatant extends DDBEnricherData {

  static benefit(name: string): IDDBAdditionalActivity {
    return {
      action: { name, type: "feat" },
      overrides: {
        noConsumeTargets: true,
        addActivityConsume: true,
        data: {
          uses: {
            spent: 0,
            max: "1",
            recovery: [
              { period: "initiative", type: "recoverAll" },
              { period: "sr", type: "recoverAll" },
            ],
          },
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      TacticalCombatant.benefit("Buffering Strike"),
      TacticalCombatant.benefit("Honed Instincts"),
    ];
  }

}
