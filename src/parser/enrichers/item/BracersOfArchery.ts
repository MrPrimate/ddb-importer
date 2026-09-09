import DDBEnricherData from "../data/DDBEnricherData";

export default class BracersOfArchery extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.bonuses.rwak.damage"),
        ],
      },
    ];
  }

}
