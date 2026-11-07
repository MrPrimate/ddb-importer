import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Empowered Strikes (2024, Monk 6): Unarmed Strikes can deal Force damage. Ki-Empowered Strikes
 * (2014, Monk 6) routes here too: Unarmed Strikes count as magical.
 *
 * Both are an enchantment on Unarmed Strike applied by a Modify Item advancement, as the SRD Monk
 * does, so a monk levelled from the compendium gets it. A character import already sets the force
 * type or the magical property on its Unarmed Strike in the parser, so the advancement only matters
 * on later level-ups and drops. The 2024 feature keeps its own force attack for a monk without an
 * Unarmed Strike item; the 2014 one has nothing to roll.
 */
export default class EmpoweredStrikes extends DDBEnricherData {

  static EFFECT_ID = "ddbEmpStrikesEf1";

  static ADVANCEMENT_ID = "ddbEmpStrikesAd1";

  override get type(): IDDBActivityType | null {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@scale.${this.classIdentifier("Monk")}.die.die + @mod`,
              types: ["bludgeoning", "force"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Ki-Empowered Strikes" : "Empowered Strikes",
        type: "enchant",
        changes: [
          this.is2014
            ? DDBEnricherData.ChangeHelper.addChange("mgc", 20, "system.properties")
            : DDBEnricherData.ChangeHelper.addChange("force", 20, "system.damage.types"),
        ],
        options: {
          description: this.is2014
            ? "Your Unarmed Strikes count as magical."
            : "Your Unarmed Strikes can deal Force damage.",
        },
        data: {
          _id: EmpoweredStrikes.EFFECT_ID,
          flags: DDBEnricherData.modifyItemEffectFlags(),
        },
      },
    ];
  }

  override get additionalAdvancements(): I5eAdvancement[] {
    return [
      this.modifyItemAdvancement({
        id: EmpoweredStrikes.ADVANCEMENT_ID,
        name: this.is2014 ? "Magical Unarmed Strikes" : "Force Unarmed Strikes",
        level: this.featureLevel(6),
        effectId: EmpoweredStrikes.EFFECT_ID,
        identifiers: ["weapon:unarmed-strike"],
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }
}
