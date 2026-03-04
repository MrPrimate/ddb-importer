import DDBEnricherData from "../../data/DDBEnricherData";

export default class PactMagic extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    if (!this.isSubclass("Order of the Profane Soul")) return [];
    return [
      {
        name: "Pact Magic Level",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("@scale.profane-soul.pact-level", 20, "system.spells.pact.level"),
        ],
      },
    ];
  }

}
