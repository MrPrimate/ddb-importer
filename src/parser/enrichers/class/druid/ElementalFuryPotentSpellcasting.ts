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
              customFormula: "@ability.wis.mod",
              types: ["cold", "fire", "lightning", "thunder"],
            }),
          ],
        },
      },
    };
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
            "bonus=rollingActor.abilities.wis.mod; item.classIdentifier === 'druid' && isCantrip;",
            2,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbElementalFuryPotentSpellcasting">
<p><strong>Implementation Details</strong></p>
<p>DDB Importer will automatically adjust cantrip damage on spells when importing a character.</p>
<p>If Automated Conditions 5e is installed the bonus is applied by the effect on this feature instead,
so it is not baked into the cantrip damage formula.</p>
</section>`,
    };
  }
}
