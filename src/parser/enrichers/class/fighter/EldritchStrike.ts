import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchStrike extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Struck",
        options: {
          description: "",
        },
      },
    ];
  }

}
