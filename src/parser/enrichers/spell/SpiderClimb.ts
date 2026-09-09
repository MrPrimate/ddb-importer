import DDBEnricherData from "../data/DDBEnricherData";

export default class SpiderClimb extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [{
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
      ],
    }];
  }

}
