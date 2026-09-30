import DDBEnricherData from "../../data/DDBEnricherData";
import { vengefulServantKey, vengefulServantsFor } from "../../../companions/types/_vengefulServants";

/**
 * Wretched Bloodline: spend 5 Sorcery Points to summon a servant of the curse-givers for 10
 * minutes. A character import offers the creatures its Blood Ties choice allows, the muncher all
 * of them; the stat blocks come from the companions code (companions/types/VengefulSummons), which
 * fetches them from D&D Beyond.
 */
export default class VengefulSummons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getVengefulSummons;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    const rules = this.is2014 ? "2014" : "2024";
    return {
      name: "Vengeful Summons",
      activationType: "action",
      noTemplate: true,
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: "Sorcery Points",
      itemConsumeValue: "5",
      profileKeys: vengefulServantsFor(this.ddbParser).map((servant) => ({ count: "1", name: vengefulServantKey(servant.name, rules) })),
      summons: {
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
        },
        bonuses: {
          ac: "",
          hp: "",
          attackDamage: "",
          saveDamage: "",
          healing: "",
        },
      },
      data: {
        range: {
          override: true,
          units: "ft",
          value: "60",
        },
        duration: {
          override: true,
          value: "10",
          units: "minute",
        },
        target: {
          affects: {
            count: "1",
            type: "space",
            special: "unoccupied",
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }

}
