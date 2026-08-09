import DDBEnricherData from "../data/DDBEnricherData";

export default class ComprehendLanguages extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Comprehend Languages",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("ALL", 20, "system.traits.languages.value"),
        ],
      },
    ];
  }

}
