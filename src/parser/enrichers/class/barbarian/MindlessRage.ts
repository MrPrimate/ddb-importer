import DDBEnricherData from "../../data/DDBEnricherData";

export default class MindlessRage extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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
