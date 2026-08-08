import DDBEnricherData from "../../data/DDBEnricherData";

export default class MindlessRage extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        // options: {
        //   transfer: true,
        //   disabled: true,
        // },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
      },
    ];
  }

}
