import DDBEnricherData from "../data/DDBEnricherData";

export default class Grappler extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
          description: "Advantage on attack rolls against grappled creatures. AC5e cannot check who is doing the grappling.",
        },
        name: "Grappler: Attack Advantage",
        ac5eOnly: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "opponentActor.statuses.grappled",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
