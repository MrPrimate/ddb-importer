import DDBEnricherData from "../../data/DDBEnricherData";

export default class NamedEffect extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
      },
    ];
  }

}
