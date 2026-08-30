import DDBEnricherData from "../data/DDBEnricherData";

export default class ChorusOfTheLost extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Chorus of the Lost: Short Fear",
        statuses: ["Frightened"],
        options: {
          expiry: "targetEnd",
        },
      },
    ];
  }

}
