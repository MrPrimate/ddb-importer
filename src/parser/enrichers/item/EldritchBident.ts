import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, itemProperty } from "./_ItemActivities";

/**
 * Eldritch Bident: an action releases two eldritch beams, a ranged spell attack each at a flat +7
 * against one or two targets within 60 feet, 1d8 force on a hit. A warlock may use their own spell
 * attack bonus instead, and their beams deal 1d12 + Charisma modifier; that is a second attack, as
 * the bonus and dice both change. For a warlock, a natural 20 with an eldritch beam shunts the target to a plane
 * of horrors on a failed Charisma save. It is Incapacitated there until the start of your next
 * turn, when it takes 2d12 psychic and returns - damage its return deals, not the save.
 */
export default class EldritchBident extends WeaponProperties {

  static SHUNT = "Eldritch Shunt";

  static BEAMS = "Eldritch Beams";

  /** One beam's ranged spell attack; the action makes one per beam. */
  static beamAttack(name: string, attack: IDDBActivityData, damage: I5eDamagePart): IDDBAdditionalActivity {
    return itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.ATTACK, {
      ...attack,
      noeffect: true,
      data: {
        ...attack.data,
        damage: { includeBase: false, parts: [damage] },
      },
    }, {
      activationOverride: { type: "action", value: 1, condition: "Two beams, one attack roll each, against one or two targets you can see" },
      rangeOverride: { override: true, value: "60", units: "ft", special: "" },
      targetOverride: { override: true, affects: { count: "2", type: "creature", choice: true }, template: { type: "" } } as IDDBActivityBuild["targetOverride"],
    });
  }

  // DDB writes the beams' fixed +7 spell attack bonus as two ranged spell attack bonus modifiers,
  // which would otherwise import as +14 to all of the wielder's ranged spell attacks
  override get clearAutoEffects(): boolean {
    return true;
  }

  // DDB's 1d8 force modifier is the beams' damage, not the bident's when it hits as a weapon
  override get activity(): IDDBActivityData {
    return { noeffect: true, data: { damage: { includeBase: true, parts: [] } } };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      EldritchBident.beamAttack(EldritchBident.BEAMS, {
        flatAttack: "7",
        data: { attack: { ability: "none", type: { value: "ranged", classification: "spell" } } },
      }, DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["force"] })),
      EldritchBident.beamAttack(`${EldritchBident.BEAMS} (Warlock)`, {
        data: { attack: { ability: "cha", type: { value: "ranged", classification: "spell" } } },
      }, DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, bonus: "@abilities.cha.mod", types: ["force"] })),
      itemProperty(EldritchBident.SHUNT, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "10" },
        condition: "A warlock rolls a 20 on an eldritch beam attack against a creature",
        range: { value: "60", units: "ft" },
      }),
      itemProperty("Eldritch Shunt: Return", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["psychic"] })],
        condition: "At the start of your next turn the shunted creature reappears",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shunted",
        activityMatch: EldritchBident.SHUNT,
        statuses: ["Incapacitated"],
        options: { transfer: false, expiry: "sourceStart", description: "Shunted to a plane of eldritch horrors until the start of the bident wielder's next turn." },
      },
    ];
  }

}
