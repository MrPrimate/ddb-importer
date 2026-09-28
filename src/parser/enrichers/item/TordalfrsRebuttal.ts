import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Tordalfr's Rebuttal, a levelled weapon DDB ships as one record per level ("(Lv. 13)") plus a
 * parent describing every level, which is built with all of them.
 *
 * - 13th level: once per short rest, a bonus action charges the next hit before the end of the
 *   turn: a Constitution save against 8 + Dexterity modifier + proficiency or Stunned until the
 *   start of the wielder's next turn.
 * - 17th level: once per dawn, on a hit, a bolt deals 8d8 lightning to the target and every
 *   creature within 15 feet of it, pushing those creatures 15 feet away. There is no save.
 */
export default class TordalfrsRebuttal extends DDBEnricherData {

  static CHARGED = "Charged Strike";

  /** The level the record is for; the parent record carries every level. */
  get level(): number {
    const match = (this.ddbParser?.originalName ?? this.name).match(/\(Lv\. (\d+)\)/);
    return match ? Number(match[1]) : 20;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.level >= 13) {
      activities.push(itemProperty(TordalfrsRebuttal.CHARGED, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], calculation: "dex" },
        activationType: "bonus",
        condition: "Charge your next attack; the next time you hit with the javelin before the end of your turn",
        range: { value: "30", units: "ft" },
        uses: { max: "1", period: "sr" },
      }));
    }
    if (this.level >= 17) {
      activities.push(itemProperty("Lightning Bolt", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 8, types: ["lightning"] })],
        condition: "When you hit with this weapon; the target and all creatures within 15 feet of it, pushed 15 feet away from the target",
        template: { type: "radius", size: "15" },
        range: { value: "30", units: "ft" },
        // the parser reads the once-per-dawn limit onto the item's own uses
        charges: "1",
        noeffect: true,
      }));
    }
    return activities;
  }

  // every level's record carries the 17th-level bolt's once-per-dawn limit as item uses
  override get override(): IDDBOverrideData {
    if (this.level >= 17) return {};
    return { uses: { spent: 0, max: "", recovery: [] } };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.level < 13) return [];
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
