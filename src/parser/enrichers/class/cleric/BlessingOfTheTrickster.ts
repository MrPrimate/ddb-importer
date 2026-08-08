import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheTrickster extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        ],
      },
    ];
  }

}
