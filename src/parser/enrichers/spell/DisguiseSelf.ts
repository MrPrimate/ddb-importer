import DDBEnricherData from "../data/DDBEnricherData";

export default class DisguiseSelf extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: "Disguised",
      },
    ];
  }

}
