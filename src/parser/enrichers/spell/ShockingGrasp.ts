import DDBEnricherData from "../data/DDBEnricherData";

/** The 2024 printing only stops Opportunity Attacks, which are weapon attacks and not Reaction activities, so it gets no block. */
export default class ShockingGrasp extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Shocked: No Reactions" : "Shocked: No Opportunity Attacks",
        options: { expiry: "targetStart" },
        midiChanges: this.is2014 ? [DDBEnricherData.ChangeHelper.midiNoReactionsChange()] : [],
        ac5eChanges: this.is2014 ? [DDBEnricherData.ChangeHelper.ac5eNoReactionsChange()] : [],
      },
    ];
  }

}
