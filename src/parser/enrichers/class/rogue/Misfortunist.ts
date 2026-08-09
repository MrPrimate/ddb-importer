import DDBEnricherData from "../../data/DDBEnricherData";

export default class Misfortunist extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "@classes.rogue.levels >= 13 ? 6 : 4",
        recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
      },
      descriptionSuffix: "<p><i>This feature tracks your Jinx Points. Misfortune activities consume points from this feature.</i></p>",
    };
  }

}
