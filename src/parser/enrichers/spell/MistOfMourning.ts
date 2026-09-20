import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellRegions";

/**
 * The mist rolls its save as it appears, then again for a creature that moves in or ends its turn
 * there. DDB records the 1d8 the melancholy takes off damage rolls as damage the spell deals, so
 * that part is removed and lives on the effect.
 */
export default class MistOfMourning extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbMistMournSpSv",
      removeDamageParts: true,
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbMistMournZon1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingClone("ddbMistMournZon1", "Moves into the mist for the first time on a turn or ends its turn there"),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // unmatched, so both the cast and its ongoing copy carry it
        name: "Deep Melancholy",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50),
          DDBEnricherData.ChangeHelper.disadvantageAttackChange(),
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "-1d8"),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Speed halved, Disadvantage on attack rolls, and 1d8 subtracted from all damage rolls until the end of its next turn.",
        },
      },
    ];
  }

}
