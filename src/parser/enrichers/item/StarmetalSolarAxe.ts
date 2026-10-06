import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty, itemText } from "./_ItemActivities";

/**
 * Starmetal Solar Axe: in its fused Greataxe state, flames on the axe shed Bright Light in a 20
 * foot radius and Dim Light for another 20 feet while it is held, and the light is sunlight. That
 * is a self-targeted utility applying a light effect, on the Greataxe record and the unsuffixed
 * one describing both states; the fissioned Battleaxes shed none. The parsed attacks stay.
 *
 * Fission (Greataxe to Battleaxes, 3d6 lightning) and Fusion (back, 3d6 fire) are each a bonus
 * action Dexterity save for the other creatures within 30 feet, usable once every 12 hours, which
 * is once per long rest here. The parser names a state record's save "Save" and leaves the
 * unsuffixed record's Fission without an area, so every save is named by its damage type, timed,
 * targeted and given its own use.
 */
export default class StarmetalSolarAxe extends DDBEnricherData {

  static LIGHT = "Stellar Flames";

  /** A state change by the damage its burst deals. */
  static STATE_CHANGES: Record<string, { name: string; condition: string }> = {
    lightning: { name: "Fission", condition: "While holding the fused Greataxe, speak its command word to split it into two Battleaxes" },
    fire: { name: "Fusion", condition: "While holding both fissioned Battleaxes, speak the other command word to recombine them into the Greataxe" },
  };

  get shedsLight(): boolean {
    return (/These flames shed Bright Light in a 20-foot radius/i).test(itemText(this));
  }

  override get keepParsedActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.shedsLight) return [];
    return [
      itemProperty(StarmetalSolarAxe.LIGHT, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "While holding the fused Greataxe; remove the effect when you let go of it or fission it",
        selfTarget: true,
        noeffect: false,
        // an applied effect with no expiry inherits the activity's duration; the light lasts while held
        data: { duration: { value: "", units: "spec", special: "While you hold the fused Greataxe" } },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const activities = (enricher.data.system as { activities?: Record<string, I5eActivity> }).activities ?? {};
        for (const activity of Object.values(activities)) {
          if (activity.type !== "save") continue;
          const type = [...(activity.damage?.parts?.[0]?.types ?? [])][0] ?? "";
          const change = StarmetalSolarAxe.STATE_CHANGES[type];
          if (!change) continue;
          activity.name = change.name;
          // fresh objects: the parser's activities share activation, range and target objects
          activity.activation = { type: "bonus", value: 1, condition: change.condition } as I5eActivity["activation"];
          activity.range = { override: true, value: null, units: "self", special: "" } as I5eActivity["range"];
          activity.target = {
            override: true,
            template: { count: "1", contiguous: false, type: "radius", size: "30", width: "", height: "", units: "ft" },
            affects: { count: "", type: "creature", choice: false, special: "Other creatures within 30 feet of you" },
            prompt: true,
          } as I5eActivity["target"];
          // "can't be used again for 12 hours", as once per long rest
          activity.uses = { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] } as I5eActivity["uses"];
          activity.consumption = {
            ...(activity.consumption ?? {}),
            targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
          } as I5eActivity["consumption"];
        }
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.shedsLight) return [];
    return [
      {
        name: "Starmetal Solar Axe: Stellar Flames",
        activityMatch: StarmetalSolarAxe.LIGHT,
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Flames erupt from the axe's edges, shedding Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. The light is sunlight.",
        },
        tokenChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(20, 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(40, 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#ffb347", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.4", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.intensity"),
        ],
      },
    ];
  }

}
