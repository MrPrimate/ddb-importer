import DDBEnricherData from "../../data/DDBEnricherData";

export default class SchoolOfHardKnocks extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "School of Hard Knocks (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with an Unarmed Strike or Pugilist weapon; the damage type matches the strike. Forgo the damage and apply Endanger or Provoke manually instead.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d12; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
