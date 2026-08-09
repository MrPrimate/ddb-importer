import DDBEnricherData from "../data/DDBEnricherData";

export default class Invisibility extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        daeSpecialDurations: ["1Attack", "1Spell"],
      },
    ];
  }

}
