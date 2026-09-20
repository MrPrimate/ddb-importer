import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import { itemActivity } from "./_ItemActivities";

/**
 * Flame Tongue: a bonus action command word sets the blade ablaze, adding fire damage on a hit and
 * shedding bright light for 40 feet and dim light for a further 40.
 *
 * "Engulf in Flames" is a self enchantment, which dnd5e toggles: using it again removes the
 * enchantment, matching the second command word, so the enchantment renames the activity
 * "Extinguish Flames" while it is applied. The light has to reach the token and an
 * enchantment only changes the weapon, so it rides along as a transferring effect that dnd5e
 * creates on the weapon with the enchantment and deletes with it.
 */
export default class FlameTongue extends DDBEnricherData {

  static ACTIVITY_NAME = "Engulf in Flames";

  /** What the toggle reads as while the weapon is ablaze. */
  static EXTINGUISH_NAME = "Extinguish Flames";

  static LIGHT_EFFECT_ID = utils.namedIDStub("Flame Tongue Light", { prefix: "ddb" });

  /** DDB's extra fire damage modifier; restricted ("While Flaming") on all but the legacy generic sword. */
  get flameModifier(): IDDBModifier | undefined {
    const definition = (this.ddbParser as DDBItem | null)?.ddbDefinition;
    return definition?.grantedModifiers?.find((mod) => mod.type === "damage" && mod.subType === "fire");
  }

  get flameDice(): string {
    // some DDB modifiers carry `die` instead of `dice`
    const mod = this.flameModifier as (IDDBModifier & { die?: any }) | undefined;
    return (mod?.dice ?? mod?.die)?.diceString ?? "2d6";
  }

  /**
   * The parser turns the restricted fire modifier into a "Restricted Attack" activity; the
   * enchantment supplies that damage now, and these weapons queue no other automatic activity.
   */
  get addAutoAdditionalActivities(): boolean {
    return false;
  }

  get activity(): IDDBActivityData {
    return {
      func: ({ activity }) => {
        // the legacy generic sword ships the fire modifier unrestricted, so the parser bakes it
        // into every attack
        if (this.flameModifier?.restriction || !activity.damage?.parts) return;
        activity.damage.parts = activity.damage.parts.filter((part: I5eDamagePart) =>
          !(part.types?.length === 1
            && part.types[0] === "fire"
            && `${part.number}d${part.denomination}` === this.flameDice),
        );
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity(FlameTongue.ACTIVITY_NAME, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "Speak the command word while holding the weapon",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          // the flames are open-ended
          duration: {
            value: "",
            units: "spec",
            special: "Until you speak the command again, or drop, stow or sheathe the weapon",
          },
        },
      }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ablaze",
        type: "enchant",
        activityMatch: FlameTongue.ACTIVITY_NAME,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Ablaze)", 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`[["${this.flameDice}", "fire"]]`, 20, "system.damage.parts"),
          // the weapon's only enchant activity is the toggle, and its next use removes this enchantment
          DDBEnricherData.ChangeHelper.overrideChange(FlameTongue.EXTINGUISH_NAME, 20, "activities[enchant].name"),
        ],
        options: {
          description: `The weapon deals an extra ${this.flameDice} Fire damage on a hit and sheds light.`,
        },
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: { min: null, max: null },
              activityRiders: [],
              effectRiders: [FlameTongue.LIGHT_EFFECT_ID],
            },
          },
        },
      },
      {
        // rider created alongside the enchantment; it must transfer to reach the token and so is
        // never linked to an activity of its own
        name: "Flame Tongue: Light",
        options: {
          transfer: true,
          durationSeconds: null,
          description: "Bright Light in a 40-foot radius and Dim Light for an additional 40 feet.",
        },
        data: {
          _id: FlameTongue.LIGHT_EFFECT_ID,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", 40, 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", 80, 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#f8c377", 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.4", 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation.type", "override", "torch", 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation.speed", "override", "2", 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation.intensity", "override", "2", 20),
        ],
      },
    ];
  }

}
