import DDBEnricherData from "../data/DDBEnricherData";

export default class DefensiveDuelist extends DDBEnricherData {

  // get type() {
  //   return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  // }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          // 2014: "add your proficiency bonus to your AC for that attack" - the current turn is
          // the ceiling and DAE ends it on the attack; 2024: the bonus lasts until the start of
          // your next turn and covers further melee attacks
          expiry: this.is2014 ? "turnEnd" : "sourceStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@system.attributes.prof", 20, "system.attributes.ac.bonus"),
        ],
        daeSpecialDurations: this.is2014 ? ["isAttacked"] : [],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }


  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  // future enhancement: add restriction to trigger reaction based on attack type

}
