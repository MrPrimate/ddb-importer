import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheTrickster extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        ],
      },
    ];
  }

}
