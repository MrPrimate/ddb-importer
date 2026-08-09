import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchStrike extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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
