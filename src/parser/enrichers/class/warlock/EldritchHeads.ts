import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchHeads extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eldritch Heads (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on an attack hit, expending one eldritch head from this feature's uses.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=(1 + @prof)[psychic]; usesCount=origin; oncePerTurn; optin; hasAttack",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
