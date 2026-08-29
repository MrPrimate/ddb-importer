import DDBEnricherData from "../data/DDBEnricherData";

export default class ShockingGrasp extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Shocked: No Reactions" : "Shocked: No Opportunity Attacks",
        daeSpecialDurations: ["turnStart" as const],
      },
    ];
  }

}
