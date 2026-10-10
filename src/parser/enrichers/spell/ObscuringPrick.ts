import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class cantrip: on a failed save the target cannot see the caster, as if Blinded,
 * until the start of the caster's next turn. AC5e scopes both sides to the caster.
 */
export default class ObscuringPrick extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Obscured Sight",
        options: {
          expiry: "sourceStart",
          description: "This creature cannot see the caster, as if it had the Blinded condition, until the start of the caster's next turn.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("effectOriginTokenId === opponentId", 20, "flags.automated-conditions-5e.attack.disadvantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("effectOriginTokenId === tokenId", 20, "flags.automated-conditions-5e.grants.attack.advantage"),
        ],
      },
    ];
  }

}
