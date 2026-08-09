import DDBEnricherData from "../data/DDBEnricherData";

export default class FreyjasAllure extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Freyja's Allure",
        ac5eOnly: true,
        options: {
          durationSeconds: 60,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
