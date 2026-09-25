import DDBEnricherData from "../data/DDBEnricherData";

export default class Sunbeam extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        options: { expiry: "sourceStart" },
      },
    ];
  }

}
