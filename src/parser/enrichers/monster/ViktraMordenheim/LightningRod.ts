import DDBEnricherData from "../../data/DDBEnricherData";

export default class LightningRod extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lightning Rod: No Reactions",
        options: {
          expiry: "targetStart",
          description: "Can't take Reactions until the start of its next turn.",
        },
      },
    ];
  }

}
