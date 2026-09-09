import DDBEnricherData from "../data/DDBEnricherData";

export default class AgentOfOrder extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Agent of Order: Stasis Strike (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage when you damage a creature you can see within 60 feet. Apply the Wisdom save rider manually.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d8[force]; oncePerTurn; optin",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
