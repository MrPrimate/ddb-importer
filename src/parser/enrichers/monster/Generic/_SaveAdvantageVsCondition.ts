import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shared base for traits granting save advantage against specific conditions
 * (Fey Ancestry, Brave, Dwarven Resilience and friends). AC5e's riderStatuses
 * sandbox map is populated from the effects the triggering activity applies, so
 * this automates the initial save; repeat saves to end an existing condition
 * have no activity context and stay manual.
 */
export default class _SaveAdvantageVsCondition extends DDBEnricherData {

  /** dnd5e status ids the trait grants save advantage against */
  get saveAdvantageStatuses(): string[] {
    return [];
  }

  /** extra AC5e condition clauses OR'd alongside the status checks */
  get saveAdvantageExtraConditions(): string[] {
    return [];
  }

  override get effects(): IDDBEffectHint[] {
    const conditions = [
      ...this.saveAdvantageStatuses.map((status) => `riderStatuses.${status}`),
      ...this.saveAdvantageExtraConditions,
    ];
    if (conditions.length === 0) return [];
    return [
      {
        options: {
          transfer: true,
          description: `Advantage on saving throws against: ${this.saveAdvantageStatuses.join(", ")}. Automated for the initial save only; repeat saves to end a condition are not detected.`,
        },
        name: this.name,
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            conditions.join(" || "),
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
      },
    ];
  }

}
