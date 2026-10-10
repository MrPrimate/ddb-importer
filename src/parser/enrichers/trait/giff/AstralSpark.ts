import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Proficiency bonus force damage on a simple or martial weapon hit, once per turn, spending one of
 * the trait's uses. The uses are named by the item identifier, which is the same on every actor:
 * `usesCount=origin` finds nothing, because an imported transfer effect has no origin.
 */
export default class AstralSpark extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Astral Spark (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra force damage equal to your proficiency bonus when you hit with a simple or martial weapon, spending one use of Astral Spark.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@prof[force]; usesCount=Item.astral-spark; oncePerTurn; optin; description=When hitting with a simple or martial weapon; simpleM || simpleR || martialM || martialR",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
