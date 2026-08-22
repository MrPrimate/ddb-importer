import DDBEnricherData from "../data/DDBEnricherData";

export default class Fly extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
    ];
  }

}
