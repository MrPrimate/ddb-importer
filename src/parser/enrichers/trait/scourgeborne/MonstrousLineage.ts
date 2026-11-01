import Lineage from "../generic/Lineage";
import DDBEnricherData from "../../data/DDBEnricherData";

type TMonstrousLineage = "Aranea" | "Belua" | "Cervus" | "Vespertilio";

/**
 * Scourgeborne's Monstrous Lineage: each lineage gives a passive benefit at level 1 and a limited
 * use benefit at level 3, usable once per rest until level 5 and then a number of times (or
 * minutes, for Aranea) equal to the Proficiency Bonus. DDB puts every lineage in one table on the
 * trait, so its text names conditions from other lineages (Cervus' Prone): the effects come from
 * here instead.
 */
/**
 * The lineage table's "1 minute" (Aranea's climb) is parsed as every effect's duration, so the
 * passive traits opt out of description durations and expiries.
 */
const PASSIVE: IDDBEffectOptions = { transfer: true, durationSeconds: null, expiry: null };

export default class MonstrousLineage extends Lineage {

  static LINEAGES: TMonstrousLineage[] = ["Aranea", "Belua", "Cervus", "Vespertilio"];

  /** Once per rest below level 5, Proficiency Bonus from level 5. */
  static USES_MAX = "1 + (@prof - 1) * min(1, floor(@details.level / 5))";

  static LEVEL_3 = { level: { min: 3, max: null } };

  // each activity sets its duration: parsed from the shared table, all of them read Aranea's "1 minute"

  get lineage(): TMonstrousLineage | null {
    const names = [
      ...(this.ddbParser._chosen ?? []).map((choice) => choice.label ?? ""),
      this.data.name,
    ];
    return MonstrousLineage.LINEAGES.find((lineage) => names.some((name) => name.includes(lineage))) ?? null;
  }

  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    switch (this.lineage) {
      case "Cervus": return DDBEnricherData.ACTIVITY_TYPES.SAVE;
      case "Aranea":
      case "Belua":
      case "Vespertilio": return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
      default: return DDBEnricherData.ACTIVITY_TYPES.NONE;
    }
  }

  override get activity(): IDDBActivityData | null {
    switch (this.lineage) {
      case "Aranea": return {
        name: "Climb Difficult Surfaces",
        targetType: "self",
        activationType: "special",
        activationCondition: "Climb difficult surfaces and ceilings without an ability check",
        addItemConsume: true,
        data: {
          visibility: MonstrousLineage.LEVEL_3,
          duration: { value: "1", units: "minute" },
        } as Partial<I5eActivity>,
      };
      case "Belua": return {
        name: "Feed",
        targetType: "creature",
        activationType: "bonus",
        activationCondition: "Unarmed Strike against a creature within reach; on a hit, regain Hit Points equal to the damage dealt",
        addItemConsume: true,
        data: {
          visibility: MonstrousLineage.LEVEL_3,
          duration: { value: "", units: "inst" },
        } as Partial<I5eActivity>,
      };
      case "Cervus": return {
        name: "Charge",
        targetType: "creature",
        activationType: "special",
        activationCondition: "Move at least 20 feet straight toward a creature, then hit it with a melee attack on the same turn",
        addItemConsume: true,
        data: {
          visibility: MonstrousLineage.LEVEL_3,
          duration: { value: "", units: "inst" },
          save: {
            ability: ["str"],
            dc: { calculation: "str", formula: "" },
          },
        } as Partial<I5eActivity>,
      };
      case "Vespertilio": return {
        name: "Take Flight",
        targetType: "self",
        activationType: "bonus",
        addItemConsume: true,
        data: {
          visibility: MonstrousLineage.LEVEL_3,
          duration: { value: "1", units: "turn" },
        } as Partial<I5eActivity>,
      };
      default: return null;
    }
  }

  override get effects(): IDDBEffectHint[] {
    switch (this.lineage) {
      case "Aranea": return [{
        name: "Aranea: Climb Speed",
        options: PASSIVE,
        changes: [DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.climb")],
      }];
      case "Cervus": return [
        {
          name: "Cervus: Speed",
          options: PASSIVE,
          changes: [DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "system.attributes.movement.walk")],
        },
        {
          name: "Charge: Prone",
          statuses: ["Prone"],
          activityMatch: "Charge",
        },
      ];
      case "Vespertilio": return [
        {
          name: "Vespertilio: Blindsight",
          options: PASSIVE,
          changes: [DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.blindsight")],
        },
        {
          name: "Take Flight",
          options: {
            expiry: "turnEnd",
            description: "You have a Fly Speed of 30 feet until the end of your turn. If nothing is holding you aloft then, you fall.",
          },
          changes: [DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.fly")],
          activityMatch: "Take Flight",
        },
      ];
      default: return [];
    }
  }

  override get override(): IDDBOverrideData | null {
    const lineage = this.lineage;
    const rename = super.override;
    if (!lineage) return rename;
    return {
      ...(rename ?? {}),
      uses: this._getUsesWithSpent({
        type: "race",
        name: this.ddbParser.originalName,
        max: MonstrousLineage.USES_MAX,
        // Vespertilio's flight comes back on a Short or Long Rest, the others on a Long Rest
        period: lineage === "Vespertilio" ? "sr" : "lr",
      }),
    };
  }

}
