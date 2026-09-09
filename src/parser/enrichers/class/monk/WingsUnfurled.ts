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
          Generic.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        // "grant you a Flying Speed equal to your Speed until the end of your turn" - self
        options: { expiry: "sourceEnd" },
      },
    ];
  }

}
