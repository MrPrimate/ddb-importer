import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Ruin's Wake, a staged artifact (Dormant, Awakened, Exalted; the unsuffixed record carries the
 * exalted text). Exalted adds a battle cry: a bonus action, once per dawn, giving each creature of
 * your choice within 30 feet advantage on attack rolls until the start of your next turn. It is an
 * area on the wielder that targets chosen allies, applying a native advantage rule. The parser's
 * activities (the attack and the Awakened lightning line) stay beside it.
 */
export default class RuinsWake extends DDBEnricherData {

  static BATTLE_CRY = "Battle Cry";

  /** 0 dormant, 1 awakened, 2 exalted; the unsuffixed record reads as exalted. */
  get stage(): number {
    const match = (/\((Dormant|Awakened|Exalted)\)\s*$/i).exec(this.ddbParser?.originalName ?? this.name);
    return match ? ["dormant", "awakened", "exalted"].indexOf(match[1].toLowerCase()) : 2;
  }

  override get keepParsedActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.stage < 2) return [];
    return [
      itemProperty(RuinsWake.BATTLE_CRY, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        condition: "While holding the spear: each creature you choose within 30 feet",
        template: { type: "radius", size: "30" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
        data: { target: { affects: { type: "ally", choice: true } } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.stage < 2) return [];
    return [
      {
        name: "Battle Cry",
        activityMatch: RuinsWake.BATTLE_CRY,
        changes: [DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack")],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Advantage on attack rolls until the start of the battle crier's next turn.",
        },
      },
    ];
  }

}
