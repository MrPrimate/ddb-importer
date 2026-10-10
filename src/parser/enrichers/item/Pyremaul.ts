import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCast, itemProperty, shippedItemSpellNames, weaponRange } from "./_ItemActivities";

/**
 * Pyremaul, a staged artifact (Dormant, Awakened, Exalted; the unsuffixed record carries the
 * exalted text). Every stage can shed bright light in 30 feet and dim light 30 feet beyond, a
 * self-applied light effect with no action. Per stage:
 * - Dormant: +1 to attack rolls (attack rolls only, so it is the attack's bonus rather than the
 *   item's magical bonus, which dnd5e adds to damage too) and an extra 1d6 fire on a hit.
 * - Awakened: +2, 2d6 fire, burning hands at 2nd level (DC 15) once per short or long rest, and a
 *   critical hit forces a DC 15 Strength save or the target is knocked prone.
 * - Exalted: +3, 3d6 fire, burning hands at 3rd level (DC 17), the prone save is DC 17, a critical
 *   hit rolls an extra 3d6 fire (the attack's critical bonus, which DDB carries as a
 *   "Restriction:" attack), and once per 7 days you can take 10d10 fire to immolate a creature you killed.
 * The unsuffixed record's fire modifier has no dice, so the stage's die is set on the attack.
 */
export default class Pyremaul extends WeaponProperties {

  static LIGHT = "Shed Light";

  static PRONE = "Critical Hit: Knocked Prone";

  static IMMOLATE = "Immolate Dead";

  get fireDice(): number {
    return this.stage + 1;
  }

  get dc(): string {
    return this.stage >= 2 ? "17" : "15";
  }

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        attack: { bonus: `${this.stage + 1}`, flat: false },
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: this.fireDice, denomination: 6, types: ["fire"] })],
          ...(this.stage >= 2 ? { critical: { bonus: "3d6[fire]" } } : {}),
        },
        // the parser reads the immolation's "7 days" as the attack's duration
        duration: { value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      itemProperty(Pyremaul.LIGHT, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "No action required: the maul sheds bright light in a 30-foot radius and dim light for an additional 30 feet; delete the effect to end it",
        selfTarget: true,
        noeffect: false,
        // an applied effect with no expiry inherits the activity's duration; the light is open-ended
        data: { duration: { value: "", units: "spec", special: "Until you choose to end it" } },
      }),
    ];
    if (this.stage < 1) return activities;

    if (!shippedItemSpellNames(this).includes("Burning Hands")) {
      const cast = itemCast("Burning Hands", { charges: 1, dc: Number(this.dc) });
      if (cast.build?.spellOverride) cast.build.spellOverride.level = this.stage >= 2 ? 3 : 2;
      activities.push(cast);
    }
    activities.push(itemProperty(Pyremaul.PRONE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["str"], formula: this.dc },
      condition: "When you score a critical hit with this weapon",
      range: weaponRange(this),
      noeffect: false,
      data: { duration: { value: "", units: "inst" } },
    }));

    if (this.stage >= 2) {
      const immolate = itemProperty(Pyremaul.IMMOLATE, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 10, types: ["fire"] })],
        condition: "When you kill a creature with an attack using this weapon: you take the damage, which can't be reduced in any way, and die if it reduces you to 0 hit points; the corpse is reduced to ash. Once per 7 days, reset the use manually.",
        selfTarget: true,
        noeffect: true,
        data: {
          uses: { spent: 0, max: "1", recovery: [] },
          duration: { value: "", units: "inst" },
        },
      });
      // spends its own use, which has no recovery period for 7 days
      activities.push({ ...immolate, overrides: { ...immolate.overrides, addActivityConsume: true, noConsumeTargets: false } });
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Pyremaul: Light",
        activityMatch: Pyremaul.LIGHT,
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "The maul sheds bright light in a 30-foot radius and dim light for an additional 30 feet.",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(30, 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(60, 20, "ATL.light.dim"),
        ],
      },
    ];
    if (this.stage >= 1) {
      effects.push({
        name: "Pyremaul: Prone",
        activityMatch: Pyremaul.PRONE,
        statuses: ["Prone"],
        options: { transfer: false, durationSeconds: null, expiry: null },
      });
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        // the stage's bonus is to attack rolls only, so it lives on the attack
        if ("magicalBonus" in enricher.data.system) enricher.data.system.magicalBonus = null;
      },
    };
  }

}
