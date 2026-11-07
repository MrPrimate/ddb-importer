import DDBEnricherData from "../data/DDBEnricherData";
import { followUpDamage } from "./_FollowUpDamage";
import { ongoingClone } from "./_SpellRegions";

/**
 * World of Warcraft (Warlock): the 3d8 Fire save in the Cylinder; your spell attacks that hit a
 * creature inside deal an extra 1d6 Necrotic, which DDB lists as a second part of the save. The
 * region fires a free copy of the save when a creature enters the Cylinder, the Cylinder moves into
 * its space, or it ends its turn there (once per turn, the default gate).
 */
export default class RainOfFire extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbRainOfFireSv1",
      splitDamage: true,
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbRainOfFireZn1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingClone("ddbRainOfFireZn1", "Enters the Cylinder, the Cylinder moves into its space, or it ends its turn there"),
      followUpDamage({ name: "Hellfire: Extra Damage", parts: [1], condition: "Your spell attack hits a creature in the Cylinder" }),
    ];
  }

}
