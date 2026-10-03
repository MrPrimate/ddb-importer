import DDBEnricherData from "../../data/DDBEnricherData";

export default class PactMagic extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    if (!this.isSubclass("Order of the Profane Soul")) return [];
    return [
      {
        name: "Pact Magic Level",
        changes: [
          // the subclass is renamed to "Order of the Profane Soul" on import, which sets its scale identifier
          DDBEnricherData.ChangeHelper.overrideChange("@scale.order-of-the-profane-soul.pact-level", 20, "system.spells.pact.level"),
        ],
      },
    ];
  }

}
