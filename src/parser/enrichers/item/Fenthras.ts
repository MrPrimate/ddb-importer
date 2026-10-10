import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Fenthras, a staged artifact (Dormant, Awakened, Exalted; the unsuffixed record carries the
 * exalted text). Its extra lightning on a hit (1d4 Awakened, 1d6 Exalted) is DDB's modifier, on the
 * attack. Two properties have their own limits, which DDB pools into one count of item uses:
 * - Oracle Shot: once per short or long rest, sense the area around the arrow for 10 minutes.
 * - Bramble Shot (Awakened+): declared on a hit, an extra 3d8 piercing and a Strength save (DC 15,
 *   17 Exalted) or restrained, repeating the save at the end of its turns; once between rests,
 *   twice Exalted. It replaces DDB's "Restriction:" attack and the parser's save, and spends its own use.
 */
export default class Fenthras extends WeaponProperties {

  static ORACLE = "Oracle Shot";

  static BRAMBLE = "Bramble Shot";

  get dc(): string {
    return this.stage >= 2 ? "17" : "15";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities = [
      itemProperty(Fenthras.ORACLE, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When you make an attack with Fenthras: you sense the area around the arrow for 10 minutes",
        selfTarget: true,
        uses: { max: "1", period: "sr" },
        noeffect: true,
      }),
    ];
    if (this.stage >= 1) {
      activities.push(itemProperty(Fenthras.BRAMBLE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: this.dc },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, types: ["piercing"] })],
        // the extra damage lands whether or not the target escapes the brambles
        onSave: "full",
        condition: "When you hit with an attack using Fenthras, declare it a bramble shot",
        range: weaponRange(this),
        uses: { max: this.stage >= 2 ? "2" : "1", period: "sr" },
      }));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.stage < 1) return [];
    return [
      {
        name: "Bramble Shot: Restrained",
        activityMatch: Fenthras.BRAMBLE,
        statuses: ["Restrained"],
        options: {
          transfer: false,
          durationSeconds: null,
          description: `Restrained by steely brambles; repeats the DC ${this.dc} Strength save at the end of each of its turns, ending the effect on a success.`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=str, saveDC=${this.dc}, saveRemove=true, label=Bramble Shot`, 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

  // each property carries its own uses, so the pooled item uses DDB reads from the text go
  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
