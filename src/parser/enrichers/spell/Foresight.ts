import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Foresight: advantage on attack rolls, ability checks and saving throws, and attackers have disadvantage. The grant half needs a module; the description carries it.
 */
export default class Foresight extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Foresight",
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
          ...["str", "dex", "con", "int", "wis", "cha"].flatMap((ability) => [
            DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.abilities.${ability}.save.roll.mode`),
            DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, `system.abilities.${ability}.check.roll.mode`),
          ]),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        options: {
          description: "Advantage on attack rolls, ability checks and saving throws; other creatures have Disadvantage on attack rolls against you; you can't be surprised.",
        },
      },
    ];
  }

}
