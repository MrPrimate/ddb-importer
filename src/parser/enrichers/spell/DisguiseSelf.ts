import DDBEnricherData from "../data/DDBEnricherData";

export default class DisguiseSelf extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["Disguised"],
      },
    ];
  }

}
