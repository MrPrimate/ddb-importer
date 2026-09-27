import DDBEnricherData from "../data/DDBEnricherData";

const ABILITIES: [string, string][] = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"],
];

/**
 * Bestow Curse: four curse options, one save each, with the six ability curses as separate effects
 * on the first option so the caster applies the chosen ability. The Resilience curse deals its
 * extra 1d8 necrotic whenever the caster later damages the target, not when the curse lands, so the
 * die is a free "Curse Damage" roll (and an AC5e damage bonus) rather than part of the save.
 */
export default class BestowCurse extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Curse Ability",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "curseAttacks0001",
        overrides: {
          name: "Curse Attacks",
        },
      },
      {
        duplicate: true,
        id: "curseActions0001",
        overrides: {
          name: "Curse Actions",
        },
      },
      {
        duplicate: true,
        id: "curseResilien001",
        overrides: {
          name: "Curse Resilience",
        },
      },
      {
        init: {
          name: "Curse Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
          noSpellslot: true,
          noConcentration: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["necrotic"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: this.is2014
              ? "Your attack or spell deals damage to the target cursed with Curse Resilience"
              : "You deal damage to the target cursed with Curse Resilience with an attack roll or a spell",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          noeffect: true,
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      ...ABILITIES.map(([ability, label]) => ({
        name: `Cursed ${label}`,
        activityMatch: "Curse Ability",
        statuses: ["Cursed"],
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(ability),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(ability),
        ],
      })),
      {
        name: "Cursed Attacks",
        activityMatch: "Curse Attacks",
        statuses: ["Cursed"],
        ac5eChanges: [
          // only attacks against the caster, who is the origin of this effect
          DDBEnricherData.ChangeHelper.ac5eChange(
            "effectOriginTokenId === opponentId",
            20,
            "flags.automated-conditions-5e.attack.disadvantage",
          ),
        ],
        options: {
          description: "Disadvantage on attack rolls against the caster.",
        },
      },
      {
        name: "Cursed Actions",
        activityMatch: "Curse Actions",
        statuses: ["Cursed"],
        options: {
          description: this.is2014
            ? "In combat, the target must succeed on a Wisdom saving throw at the start of each of its turns or waste its action doing nothing."
            : "In combat, the target must succeed on a Wisdom saving throw at the start of each of its turns or take the Dodge action on that turn.",
        },
      },
      {
        name: "Cursed Resilience",
        activityMatch: "Curse Resilience",
        statuses: ["Cursed"],
        ac5eChanges: [
          // the cursed target grants the caster the extra die on attacks and spells that hit it
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d8[necrotic]; effectOriginTokenId === tokenId && (hasAttack || isSpell);",
            20,
            "flags.automated-conditions-5e.grants.damage.bonus",
          ),
        ],
        options: {
          description: "Attacks and spells from the caster that deal damage to the target deal an extra 1d8 necrotic damage. Use Curse Damage to roll it.",
        },
      },
    ];
  }

}
