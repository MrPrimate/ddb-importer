import DDBEnricherData from "../../data/DDBEnricherData";

export default class DangerSense extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        // advantage on Dexterity saving throws unless incapacitated
        name: "Danger Sense",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.addChange(
            "ability.dex && !rollingActor.statuses.incapacitated",
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
      },
    ];
  }

}
