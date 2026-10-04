import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Hearth: for 10 minutes the ignited melee weapon deals extra Fire damage equal to your
 * Charisma modifier (minimum 1). The bonus rides on a self effect for melee weapon damage, so it
 * applies to whichever melee weapon you swing, and the weapon's light rides on the token. DDB's action
 * keeps its Channel Divinity cost.
 */
export default class ChannelDivinityBurningWeapon extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Burning Weapon",
        activityMatch: "Channel Divinity: Burning Weapon",
        options: {
          durationSeconds: 600,
          description: "The ignited melee weapon deals extra Fire damage equal to your Charisma modifier (minimum 1), and can deal Fire instead of its normal damage type.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+max(1, @abilities.cha.mod)[fire]", 20, "system.bonuses.mwak.damage"),
        ],
        tokenChanges: [
          DDBEnricherData.ChangeHelper.tokenChange("token.light.bright", "upgrade", 20, 20),
          DDBEnricherData.ChangeHelper.tokenChange("token.light.dim", "upgrade", 40, 20),
        ],
      },
    ];
  }

}
