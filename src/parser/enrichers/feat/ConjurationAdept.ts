import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Persistent Conjuration adds the modifier of the score the feat
 * raised to Constitution saves made to keep concentrating on a Conjuration spell. DDB does not
 * record which score was raised, and every caster picking this feat raises a spellcasting score,
 * so the transfer effect uses the spellcasting modifier; the concentration check has no roll-time
 * filter for the spell's school in dnd5e 6, so the effect applies to every concentration save.
 * The DDB reminder utility is kept.
 */
export default class ConjurationAdept extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Persistent Conjuration",
        options: {
          transfer: true,
          description: "Adds the spellcasting modifier to Constitution saves to maintain concentration; only Conjuration spells qualify.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @attributes.spell.mod)", 20, "system.attributes.concentration.roll.bonus"),
        ],
      },
    ];
  }

}
