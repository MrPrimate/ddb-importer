import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Intellect Fortress: resistance to psychic damage and advantage on Intelligence, Wisdom and Charisma saving throws for the duration.
 */
export default class IntellectFortress extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fortified Intellect",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
          ...["int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.abilities.${ability}.save.roll.mode`),
          ),
        ],
      },
    ];
  }

}
