import DDBEnricherData from "../../data/DDBEnricherData";

export default class NaturesVeil extends DDBEnricherData {


  override get effects(): IDDBEffectHint[] {
    return [
      {
        statuses: ["invisible"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
