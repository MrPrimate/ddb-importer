import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import type DDBItem from "../../item/DDBItem";
import { conditionalWeaponDamage, itemProperty } from "./_ItemActivities";

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
 * dnd5e 5.x has no rule conditions, so the attack and damage bonus is the magical bonus of the
 * record DDB ships, and the thrown lightning is its own damage activity. The activities are hidden
 * below their level (visibility.level.min) and spend their own uses.
 */
export default class TordalfrsRebuttal extends DDBEnricherData {

  static BASE_NAME = "Tordalfr's Rebuttal";

  static CHARGED = "Charged Strike";

  static BOLT = "Lightning Bolt";

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

  // the thrown-only lightning is its own activity below, so it stays off the attack; one id keeps
  // every level's record the same weapon
  override get activity(): IDDBActivityData {
    return {
      id: utils.namedIDStub(TordalfrsRebuttal.BASE_NAME, { prefix: "attack" }),
      noeffect: true,
      data: { damage: { includeBase: true, parts: [] } },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      TordalfrsRebuttal.fromLevel(conditionalWeaponDamage(
        "Wreathed in Lightning",
        [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["lightning"] })],
        "When the thrown javelin hits (9th level)",
      ), 9),
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
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charged Strike: Stunned",
        activityMatch: TordalfrsRebuttal.CHARGED,
        statuses: ["Stunned"],
        options: { transfer: false, expiry: "sourceStart" },
      },
    ];
  }

}
