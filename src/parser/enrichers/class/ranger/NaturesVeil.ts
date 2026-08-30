import DDBEnricherData from "../../data/DDBEnricherData";

export default class NaturesVeil extends DDBEnricherData {


  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["invisible"],
        options: {
          expiry: "sourceEnd",
        },
      },
    ];
  }

}
