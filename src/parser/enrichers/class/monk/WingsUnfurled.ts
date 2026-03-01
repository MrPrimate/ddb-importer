import Generic from "../Generic";

export default class WingsUnfurled extends Generic {

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    if (!this.isAction) return [];
    return [
      {
        changes: [
          Generic.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        daeSpecialDurations: ["turnEnd" as const],
      },
    ];
  }

}
