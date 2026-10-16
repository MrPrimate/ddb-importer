import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Crystal Ball of Telepathy: Scrying at will, and Suggestion through the sensor once per dawn.
 * DDB ships both casts free, so the ball gets a dawn use that only the Suggestion cast spends.
 */
export default class CrystalBallOfTelepathy extends DDBEnricherData {

  // the parser's bare "Use" activity does nothing, and with the item's uses it would spend them
  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]);
  }

  override async customFunction({ name, activity }: ICustomFunctionOptions) {
    if (name !== "Suggestion" || !activity) return;
    activity.data = foundry.utils.mergeObject(activity.data as I5eCastActivity, {
      consumption: {
        targets: [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
      },
    } as Partial<I5eCastActivity>) as I5eCastActivity;
  }

}
