import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Diamond Staff: a +3 quarterstaff. DDB writes the +3 as a bonus to all of the wielder's melee
 * weapon attacks, so it is the staff's magical bonus instead and that modifier change is dropped.
 * While holding it you have advantage on Intelligence (Arcana) checks. Stunning Hit spends 2
 * charges on a melee hit for a DC 17 Constitution save or Stunned (the parser's save, named and
 * retimed). Dazzling Light spends a charge and a command word to shed bright light in a 40 foot
 * radius and dim light for another 40 feet, for 1 minute or until the staff is told to stop; it is
 * a self-targeted utility applying a light effect.
 */
export default class DiamondStaff extends DDBEnricherData {

  static LIGHT = "Dazzling Light";

  static STUNNING_HIT = "Stunning Hit";

  override get keepParsedActivities(): boolean {
    return true;
  }

  // the light's 1 minute is the text's only duration, which the parser would put on the attack
  override get activity(): IDDBActivityData {
    return { data: { duration: { value: "", units: "inst" } } };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(DiamondStaff.LIGHT, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        condition: "While holding the staff, speak the command word; another command word ends it early",
        selfTarget: true,
        charges: "1",
        noeffect: false,
        data: { duration: { value: "1", units: "minute" } },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        // DDB carries the bonus only as the modifier below, so the parser sets no magical bonus
        if (enricher.data.type === "weapon") foundry.utils.setProperty(enricher.data, "system.magicalBonus", 3);
        // DDB's +3 melee weapon attack modifier would apply to every melee weapon the wielder holds;
        // an effect left with nothing else to do goes with it
        enricher.data.effects = (enricher.data.effects ?? []).flatMap((effect: I5eEffectData) => {
          const changes = effect.system?.changes ?? [];
          if (!changes.some((change: IActiveEffectChangeData) => change.key === "system.bonuses.mwak.attack")) return [effect];
          const kept = changes.filter((change: IActiveEffectChangeData) => change.key !== "system.bonuses.mwak.attack");
          if (kept.length === 0 && [...(effect.statuses ?? [])].length === 0) return [];
          effect.system!.changes = kept;
          return [effect];
        });
        const activities = (enricher.data.system as { activities?: Record<string, I5eActivity> }).activities ?? {};
        for (const activity of Object.values(activities)) {
          if (activity.type !== "save" || !Array.from(activity.save?.ability ?? []).includes("con")) continue;
          activity.name = DiamondStaff.STUNNING_HIT;
          // fresh objects: the parser's activities share activation, range and target objects
          activity.activation = { type: "special", value: null, condition: "When you hit with a melee attack using the staff, expend 2 charges" } as I5eActivity["activation"];
          activity.range = { override: true, value: "5", units: "ft", special: "" } as I5eActivity["range"];
          activity.target = {
            override: true,
            template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
            affects: { count: "1", type: "creature", choice: false, special: "The creature you hit" },
            prompt: false,
          } as I5eActivity["target"];
          activity.duration = { value: "", units: "inst", special: "" } as I5eActivity["duration"];
        }
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Diamond Staff: Adept",
        changes: [DDBEnricherData.ChangeHelper.advantageSkillChange("arc")],
        options: {
          transfer: true,
          durationSeconds: null,
          // the text's turn wording belongs to Stunning Hit
          expiry: null,
          description: "While holding the staff, you have Advantage on Intelligence (Arcana) checks.",
        },
      },
      {
        name: "Diamond Staff: Dazzling Light",
        activityMatch: DiamondStaff.LIGHT,
        options: {
          transfer: false,
          durationSeconds: 60,
          // lasts the minute; the text's turn wording belongs to Stunning Hit
          expiry: null,
          description: "The staff emits Bright Light in a 40-foot radius and Dim Light for an additional 40 feet for 1 minute, or until you use a command word to deactivate it.",
        },
        tokenChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(40, 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(80, 20, "token.light.dim"),
        ],
      },
    ];
  }

}
