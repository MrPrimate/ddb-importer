import DDBEnricherData from "../../data/DDBEnricherData";

export default class ApexPredator extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Apex Predator: Evolved Attacks (Automation)",
        ac5eOnly: true,
        options: {
          // transfer: true,
          // disabled: true,
          description: "Optional once per turn extra damage on a hit with a Wild Shape form's attack. AC5e cannot check the Wild Shape state.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2d10[force]; oncePerTurn; optin",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
