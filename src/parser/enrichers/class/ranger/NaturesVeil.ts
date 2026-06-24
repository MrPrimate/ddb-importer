import DDBEnricherData from "../../data/DDBEnricherData";

export default class NaturesVeil extends DDBEnricherData {


  get effects(): IDDBEffectHint[] {
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
