import DDBEnricherData from "../data/DDBEnricherData";

export default class ChillTouch extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("healing", 30, "system.traits.di.value"),
        ],
      },
    ];
  }

}
