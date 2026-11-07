import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";

/**
 * World of Warcraft (Druid): the 2d8 Radiant save; a target that fails sheds Dim Light and cannot
 * benefit from Invisible until the end of its next turn, when it takes another 1d8 Radiant.
 */
export default class Moonfire extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      splitDamage: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      followUpDamage({ name: "Lingering Moonfire", parts: [1], condition: "At the end of the target's next turn, after a failed save" }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Moonfire",
        options: {
          expiry: "targetEnd",
          description: "You shed Dim Light in a 10-foot radius and can't benefit from the Invisible condition.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
        ],
      },
    ];
  }

}
