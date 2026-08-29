import DDBEnricherData from "../data/DDBEnricherData";

/**
 * "Spikes. Your unarmed strikes deal N additional piercing damage on a hit." Extra damage of a
 * stated type rather than a change to the strike itself, so this is a rule change gated on the
 * attack classification rather than an enchantment. The item's acid activities are left to the
 * parser.
 */
export default class Broodslinger extends DDBEnricherData {

  static RARITY_DAMAGE: Record<string, string> = {
    uncommon: "1",
    rare: "1d4",
    "very rare": "2d4",
  };

  get spikeDamage(): string {
    const rarity = this.name.match(/\((Uncommon|Rare|Very Rare)\)/i)?.[1]?.toLowerCase();
    // the unsuffixed item carries the uncommon values
    return (rarity ? Broodslinger.RARITY_DAMAGE[rarity] : undefined) ?? Broodslinger.RARITY_DAMAGE["uncommon"];
  }

  override get effects(): IDDBEffectHint[] {
    const damage = this.spikeDamage;
    return [
      {
        name: "Broodslinger: Spikes",
        options: {
          transfer: true,
          description: `Spikes: your unarmed strikes deal ${damage} additional piercing damage on a hit.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", `${damage}[piercing]`, {
            conditions: DDBEnricherData.ChangeHelper.UNARMED_FILTER,
          }),
        ],
      },
    ];
  }

}
