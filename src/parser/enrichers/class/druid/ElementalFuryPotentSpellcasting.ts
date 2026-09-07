import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalFuryPotentSpellcasting extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@abilities.wis.mod",
              types: ["cold", "fire", "lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbElementalFuryPotentSpellcasting">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer adds the Wisdom bonus to your druid cantrip damage when importing the character. The damage
activity is a manual claim for spells imported another way; using both double-counts the bonus.</p>
</section>`,
    };
  }
}
