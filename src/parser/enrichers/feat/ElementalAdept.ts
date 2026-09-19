import DDBDataUtils from "../../lib/DDBDataUtils";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Elemental Adept: spells ignore resistance to the chosen damage type, and a 1 on a damage die of
 * that type counts as a 2.
 *
 * dnd5e 6 rule changes cannot alter a die result, so the `min2` die modifier has two homes. AC5e
 * applies it at roll time from the damage type actually rolled. Without AC5e,
 * CharacterSpellFactory bakes it onto the damage parts of the character's spells that deal only a
 * chosen type, and stands down when AC5e is installed so the two never stack.
 *
 * Ignoring resistance has no native home and is left to the table.
 */
export default class ElementalAdept extends DDBEnricherData {

  /**
   * The damage type this copy of the feat was taken for. The feat is repeatable, so prefer the
   * choice on this document; the character wide list is only a fallback.
   * @returns {string[]} lowercase dnd5e damage types
   */
  get adeptTypes(): string[] {
    const known = DDBDataUtils.ELEMENTAL_ADEPT_TYPES;
    const chosen = (this.ddbParser?._chosen ?? [])
      .map((choice) => (choice.label ?? "").toLowerCase())
      .filter((label) => known.includes(label));
    if (chosen.length > 0) return [...new Set(chosen)];

    const named = (this.ddbParser?.originalName ?? this.name ?? "").match(/\((\w+)\)/)?.[1]?.toLowerCase();
    if (named && known.includes(named)) return [named];

    const ddbData = this.ddbParser?.ddbData;
    return ddbData ? DDBDataUtils.getElementalAdeptTypes(ddbData) : [];
  }

  // both benefits are passive riders on spell damage, nothing to activate
  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const types = this.adeptTypes;
    if (types.length === 0) return [];
    return [
      {
        name: "Elemental Adept",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: types.map((type) =>
          DDBEnricherData.ChangeHelper.ac5eChange(
            `modifier=min2;isSpell && damageTypes.${type}`,
            20,
            "flags.automated-conditions-5e.damage.modifier",
          ),
        ),
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const types = this.adeptTypes;
    const label = types.length === 1 ? `${types[0].charAt(0).toUpperCase()}${types[0].slice(1)}` : null;
    const baseName = this.ddbParser?.data?.name ?? "";

    const override: IDDBOverrideData = {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbElementalAdept">
<p><strong>Implementation Details</strong></p>
<p>With Automated Conditions 5e installed, the feature's effect applies <code>min2</code> to spell damage dice of the chosen type. Without it, DDB Importer adds the modifier to the damage dice of your spells that deal only that type when the character is imported; a spell that lets you pick the damage type when you roll is left alone. Ignoring Resistance is not automated.</p>
</section>`,
    };

    if (this.is2024 && label && !baseName.includes(`(${label})`)) {
      override.data = { name: `${baseName} (${label})` };
    }
    return override;
  }
}
