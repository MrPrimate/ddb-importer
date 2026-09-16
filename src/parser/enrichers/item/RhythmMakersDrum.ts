import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

export default class RhythmMakersDrum extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Bardic Inspiration",
      activationType: "action",
      addItemConsume: true,
      noTemplate: true,
      targetType: "self",
      rangeSelf: true,
      activationCondition: "While holding the drum; only when you have an expended use of Bardic Inspiration",
      additionalConsumptionTargets: [{ type: "itemUses", target: "feat:bardic-inspiration", value: "-1" }],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      ...itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]),
      descriptionSuffix:
        "<p>Recovery requires a Bardic Inspiration feature on your sheet. If its identifier differs, select " +
        "that feature in the activity’s second Item Uses consumption target. Use this activity only when at " +
        "least one Bardic Inspiration use is expended.</p>",
    };
  }

}
