import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedStrikesPotentSpellcasting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return "none";
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Potent Spellcasting (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=rollingActor.abilities.wis.mod; item.classIdentifier === 'cleric' && isCantrip;",
            2,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
