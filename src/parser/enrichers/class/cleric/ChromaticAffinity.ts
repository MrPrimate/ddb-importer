import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChromaticAffinity extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Chromatic Affinity (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          // the chosen element changes each long rest, so the bonus is left
          // untyped and inherits the triggering roll's damage type
          description: "Optional once per turn extra damage when you deal damage of your chosen type, spending one of this feature's uses. Only opt in on a qualifying damage roll.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@classes.cleric.levels; usesCount=origin; oncePerTurn; optin",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
