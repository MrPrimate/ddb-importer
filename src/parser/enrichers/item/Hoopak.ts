import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hoopak (and Forcebreaker Hoopak, Hoopak of Throne's Command): one stick that is a melee weapon
 * and, through its sling end, a ranged one. DDB ships each as two items, the melee weapon and a
 * "(Ranged)" copy, which is modelled here as the single melee weapon with a Sling attack.
 *
 * dnd5e picks ammunition per item rather than per activity, so a weapon with the Ammunition
 * property would spend a sling bullet on melee attacks too, which the hoopak's text rules out. The
 * weapon therefore stays the melee one and the Sling attack does not consume ammunition.
 *
 * The "(Ranged)" copy is reshaped into the same melee weapon, so either copy imports as the same
 * hoopak; on a character import it also takes the base name, and a character holding both copies
 * keeps only the melee one (STATE_COPIES in parser/character/inventory.ts). Munched copies keep
 * DDB's names, as the compendium matches items by name, type and ruleset.
 */
export default class Hoopak extends DDBEnricherData {

  get isRangedCopy(): boolean {
    return (this.name ?? "").endsWith("(Ranged)");
  }

  /** The DDB magic bonus (Forcebreaker +2, Throne's Command +1), for the Sling's damage. */
  get magicBonus(): number {
    const definition = this.ddbParser?.ddbDefinition;
    const modifiers = definition && "grantedModifiers" in definition ? definition.grantedModifiers ?? [] : [];
    // DDB modifier values can arrive as strings
    return Number(modifiers.find((m) => m.type === "bonus" && m.subType === "magic")?.value ?? 0) || 0;
  }

  // the "(Ranged)" copy's own attack was built as a ranged one before the reshape below
  override get activity(): IDDBActivityData | null {
    if (!this.isRangedCopy) return null;
    return {
      data: {
        attack: {
          type: { value: "melee", classification: "weapon" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // dnd5e adds the magical bonus to the attack roll of every attack on the weapon, but only to
    // the base damage part, so the Sling's own damage part carries it
    const bonus = this.magicBonus > 0 ? `@mod + ${this.magicBonus}` : "@mod";
    return [
      {
        init: {
          name: "Sling",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          // an activity range has no long range (that lives on the item, the melee weapon), so
          // the sling's 160 ft long range is only noted here
          activationOverride: { type: "action", value: 1, condition: "Long range 160 ft (Disadvantage beyond 40 ft)" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          data: {
            range: { override: true, value: "40", units: "ft" },
            attack: {
              type: { value: "ranged", classification: "weapon" },
            },
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, bonus, types: ["bludgeoning"] }),
              ],
            },
          },
        },
      },
    ];
  }

  // the Sling sits beside whatever the parser builds (Throne's Command's charges and effects)
  override get keepParsedActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData | null {
    if (!this.isRangedCopy) return null;
    const name = this.name.replace(/\s*\(Ranged\)$/, "");
    // the document override merges, which replaces arrays: keep the parsed properties bar Ammunition
    const parsed = (this.ddbParser?.data?.system as { properties?: Iterable<string> } | undefined)?.properties ?? [];
    const properties = Array.from(parsed).filter((property) => property !== "amm");
    return {
      data: {
        ...(this.ddbParser.isMuncher ? {} : { name }),
        system: {
          type: { value: "martialM", baseItem: "hoopak" },
          damage: {
            base: {
              number: 1,
              denomination: 6,
              bonus: "",
              types: ["piercing"],
              custom: { enabled: false, formula: "" },
            },
          },
          range: { value: 5, long: null, units: "ft", reach: null },
          ammunition: { type: "" },
          properties,
        },
      },
    };
  }

}
