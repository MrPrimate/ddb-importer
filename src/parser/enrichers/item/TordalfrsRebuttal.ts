import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import type DDBItem from "../../item/DDBItem";
import { itemProperty, weaponDamageBonus, weaponDamageEnchantment } from "./_ItemActivities";

/**
 * Tordalfr's Rebuttal, a javelin that grows with the wielder's character level. DDB ships one
 * record per level ("(Lv. 13)") plus a parent describing every level, each carrying only its own
 * level's modifiers, so every record builds the same weapon from the text, gated by character
 * level, and a character import keeps one copy under the base name (STATE_COPIES in
 * parser/character/inventory.ts).
 *
 * - 9th: +1 to attack and damage rolls; thrown, an extra 1d6 lightning on a hit.
 * - 13th: +2 instead; once per short rest a bonus action charges the next hit before the end of
 *   the turn: a Constitution save (DC 8 + Dexterity modifier + proficiency) or Stunned until the
 *   start of the wielder's next turn.
 * - 17th: +3 instead; once per dawn, on a hit, a bolt deals 8d8 lightning to the target and every
 *   creature within 15 feet of it, pushing them 15 feet away. There is no save.
 *
 * The bonuses are rules on a transfer enchantment, scoped to this weapon and gated on the
 * character's level band, so they replace rather than stack; the activities are hidden below their
 * level (visibility.level.min) and spend their own uses.
 */
export default class TordalfrsRebuttal extends DDBEnricherData {

  static BASE_NAME = "Tordalfr's Rebuttal";

  static CHARGED = "Charged Strike";

  static BOLT = "Lightning Bolt";

  /** Character level `min` up to, but not including, `max`. */
  static levelBand(min: number, max?: number): IEffectChangeFilter[] {
    return [
      { k: "details.level", o: "gte", v: min },
      ...(max ? [{ k: "details.level", o: "lt", v: max } as IEffectChangeFilter] : []),
    ];
  }

  /** The weapon's attack and damage bonus at each level band. */
  static BONUSES: { bonus: number; min: number; max?: number }[] = [
    { bonus: 1, min: 9, max: 13 },
    { bonus: 2, min: 13, max: 17 },
    { bonus: 3, min: 17 },
  ];

  /** Hides an activity until the character reaches `level`. */
  static fromLevel(activity: IDDBAdditionalActivity, level: number): IDDBAdditionalActivity {
    return {
      ...activity,
      overrides: {
        ...activity.overrides,
        data: foundry.utils.mergeObject(activity.overrides?.data ?? {}, { visibility: { level: { min: level, max: null } } }, { inplace: false }),
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  // the thrown-only lightning and the bonuses are rules below, so they stay off the attack; one id
  // keeps every level's record the same weapon
  override get activity(): IDDBActivityData {
    return {
      id: utils.namedIDStub(TordalfrsRebuttal.BASE_NAME, { prefix: "attack" }),
      noeffect: true,
      data: { damage: { includeBase: true, parts: [] } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      TordalfrsRebuttal.fromLevel(itemProperty(TordalfrsRebuttal.CHARGED, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], calculation: "dex" },
        activationType: "bonus",
        condition: "Charge your next attack; the next time you hit with the javelin before the end of your turn (13th level)",
        range: { value: "30", units: "ft" },
        uses: { max: "1", period: "sr" },
      }), 13),
      TordalfrsRebuttal.fromLevel(itemProperty(TordalfrsRebuttal.BOLT, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 8, types: ["lightning"] })],
        condition: "When you hit with this weapon; the target and all creatures within 15 feet of it, pushed 15 feet away from the target (17th level)",
        template: { type: "radius", size: "15" },
        range: { value: "30", units: "ft" },
        uses: { max: "1", period: "dawn" },
        noeffect: true,
      }), 17),
    ];
  }

  override get override(): IDDBOverrideData {
    const parser = this.ddbParser as DDBItem | undefined;
    return {
      // the activities carry their own uses; DDB's records put the bolt's limit on the item
      uses: { spent: 0, max: "", recovery: [] },
      data: {
        ...(parser?.isMuncher ? {} : { name: TordalfrsRebuttal.BASE_NAME }),
      },
      func: ({ enricher }) => {
        // the level bonuses are rules, so the record's own magical bonus would add a second one
        if ("magicalBonus" in enricher.data.system) enricher.data.system.magicalBonus = null;
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    const attuned: IEffectChangeFilter[] = (this.ddbParser as DDBItem | undefined)?.ddbDefinition?.canAttune
      ? [{ k: "item.attuned", o: "exact", v: true }]
      : [];
    return [
      weaponDamageEnchantment(
        `${TordalfrsRebuttal.BASE_NAME}: Level Bonuses`,
        [
          ...TordalfrsRebuttal.BONUSES.flatMap(({ bonus, min, max }) => [
            helper.ruleBonusChange("attack", `${bonus}`, {
              conditions: [helper.WEAPON_ATTACK_FILTER, ...attuned, ...TordalfrsRebuttal.levelBand(min, max)],
            }),
            weaponDamageBonus(this, `${bonus}`, TordalfrsRebuttal.levelBand(min, max)),
          ]),
          weaponDamageBonus(this, "1d6[lightning]", [
            { k: "roll.attack.mode", o: "startswith", v: "thrown" },
            ...TordalfrsRebuttal.levelBand(9),
          ]),
        ],
        { description: "From 9th level a +1 bonus to attack and damage rolls (+2 from 13th, +3 from 17th), and when thrown the javelin deals an extra 1d6 lightning damage to any target it hits." },
      ),
      {
        name: "Charged Strike: Stunned",
        activityMatch: TordalfrsRebuttal.CHARGED,
        statuses: ["Stunned"],
        options: { transfer: false, expiry: "sourceStart" },
      },
    ];
  }

}
