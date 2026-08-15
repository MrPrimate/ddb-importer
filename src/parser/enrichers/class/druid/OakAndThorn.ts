import DDBEnricherData from "../../data/DDBEnricherData";

export default class OakAndThorn extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Oak and Thorn: Gnarled Thorns (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a melee weapon attack hit while your Wood Wose is active. AC5e cannot check the Wood Wose state.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d6[piercing]; oncePerTurn; optin; actionType.mwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
