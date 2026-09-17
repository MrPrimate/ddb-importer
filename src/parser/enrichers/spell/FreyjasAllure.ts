import DDBEnricherData from "../data/DDBEnricherData";

export default class FreyjasAllure extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Freyja's Allure",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAttackChange(),
        ],
      },
    ];
  }

}
