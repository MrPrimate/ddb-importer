import DDBEnricherData from "../../data/DDBEnricherData";

// 1d8 at 8th level, 2d8 at 14th. Only some domains ship a DDB scale value for this (Order and
// Twilight do, Forge does not), so the dice come from the cleric level instead.
const DIVINE_STRIKE_FORMULA = "(1 + floor(@classes.cleric.levels / 14))d8";

const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
  "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
];

/**
 * The 2014 domain Divine Strike. The 2024 Blessed Strikes option is BlessedStrikesDivineStrike.
 */
export default class DivineStrike extends DDBEnricherData {

  /**
   * Each domain names its own damage type in the feature text: "an extra 1d8 fire damage",
   * Nature's "cold, fire, or lightning damage (your choice)". War deals "the same type dealt by
   * the weapon", which names no type.
   */
  get textDamageTypes(): string[] {
    const text = (this.ddbParser.ddbDefinition?.description ?? "").replace(/<[^>]+>/g, " ");
    const phrase = text.match(/extra 1d8 ([a-z ,]+?) damage/i)?.[1]?.toLowerCase() ?? "";
    return DAMAGE_TYPES.filter((type) => new RegExp(`\\b${type}\\b`).test(phrase));
  }

  get damageTypes(): string[] {
    const types = this.textDamageTypes;
    return types.length > 0 ? types : ["bludgeoning", "piercing", "slashing"];
  }

  /** No roll flavor for War, so the extra damage takes the weapon's type. */
  get damageFlavor(): string {
    const types = this.textDamageTypes;
    return types.length > 0 ? `[${types.join(", ")}]` : "";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: DIVINE_STRIKE_FORMULA,
              types: this.damageTypes,
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": `${DIVINE_STRIKE_FORMULA}${this.damageFlavor}`,
          },
        }],
      },
      {
        name: "Divine Strike (Automation)",
        ac5eOnly: true,
        midiNever: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with a weapon attack.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=${DIVINE_STRIKE_FORMULA}${this.damageFlavor}; oncePerTurn; optin; actionType.mwak || actionType.rwak`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
