import DDBEnricherData from "../data/DDBEnricherData";

export default class BeaconOfHope extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("wis"),
          DDBEnricherData.ChangeHelper.advantageDeathSaveChange(),
        ],
      },
    ];
  }

}
