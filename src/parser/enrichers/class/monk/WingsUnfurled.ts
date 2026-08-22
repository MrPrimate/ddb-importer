import Generic from "../Generic";

export default class WingsUnfurled extends Generic {

  /**
   * @returns {DDBEffectHint[]}
   */
  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        changes: [
          Generic.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
        ],
        daeSpecialDurations: ["turnEnd" as const],
      },
    ];
  }

}
