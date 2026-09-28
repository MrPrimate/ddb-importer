import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, textDC } from "./_ItemActivities";

/**
 * Headbanger Lute: two songs, each once per dawn. Panic! at the Tavern frightens creatures of your
 * choice within 15 feet (Wisdom save, psychic, half and no fear on a success); Mithrallica blasts a
 * cone (Strength save, thunder, pushed 20 feet, Prone and Deafened on a failure). The first target
 * hit each turn takes extra acid. DCs, dice and the cone are read per record.
 */
export default class HeadbangerLute extends WeaponProperties {

  get panic(): string {
    const parts = this.text.split(/Mithrallica\./)[0].split(/Panic! at the Tavern\./);
    return parts.length > 1 ? parts[1] : "";
  }

  get mithrallica(): string {
    return this.text.split(/Mithrallica\./)[1] ?? "";
  }

  static dice(text: string, type: string, fallback: [number, number]): { number: number; denomination: number } {
    const match = new RegExp(`(\\d+)d(\\d+) ${type}`, "i").exec(text);
    return match ? { number: Number(match[1]), denomination: Number(match[2]) } : { number: fallback[0], denomination: fallback[1] };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const acid = HeadbangerLute.dice(this.text, "acid", [1, 8]);
    const activities = [
      itemProperty("Corrosive Strike", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ ...acid, types: ["acid"] })],
        condition: "The first target the lute hits on a turn",
        noeffect: true,
      }),
    ];
    if (this.panic) {
      activities.push(itemProperty("Panic! at the Tavern", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: textDC(this.panic, /DC (\d+)/, "16") },
        damageParts: [DDBEnricherData.basicDamagePart({ ...HeadbangerLute.dice(this.panic, "psychic", [6, 6]), types: ["psychic"] })],
        onSave: "half",
        activationType: "action",
        condition: "Each creature of your choice within 15 feet that can hear you",
        template: { type: "radius", size: "15" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
      }));
    }
    if (this.mithrallica) {
      activities.push(itemProperty("Mithrallica", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: textDC(this.mithrallica, /DC (\d+)/, "16") },
        damageParts: [DDBEnricherData.basicDamagePart({ ...HeadbangerLute.dice(this.mithrallica, "thunder", [6, 6]), types: ["thunder"] })],
        onSave: "half",
        activationType: "action",
        condition: "Pushed 20 feet away, Prone and Deafened on a failure",
        template: { type: "cone", size: textDC(this.mithrallica, /(\d+)-foot cone/i, "25") },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
      }));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const panicDC = textDC(this.panic, /DC (\d+)/, "16");
    const mithDC = textDC(this.mithrallica, /DC (\d+)/, "16");
    const effects: IDDBEffectHint[] = [];
    if (this.panic) {
      effects.push({
        name: "Panicked",
        activityMatch: "Panic! at the Tavern",
        statuses: ["Frightened"],
        options: { transfer: false, durationSeconds: 60, description: "Frightened for 1 minute; repeat the save at the end of each turn." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=wis, saveDC=${panicDC}, label=Panic! at the Tavern`, 20, "flags.midi-qol.OverTime"),
        ],
      });
    }
    if (this.mithrallica) {
      effects.push({
        name: "Mithrallica",
        activityMatch: "Mithrallica",
        statuses: ["Prone", "Deafened"],
        options: { transfer: false, durationSeconds: 60, description: "Knocked prone and deafened for 1 minute; repeat the save at the end of each turn to end the deafness." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=str, saveDC=${mithDC}, label=Mithrallica`, 20, "flags.midi-qol.OverTime"),
        ],
      });
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
