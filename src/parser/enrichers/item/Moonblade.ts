import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, textDC } from "./_ItemActivities";

/**
 * Moonblade: its save is one entry of the random rune table, so it is built only as the
 * property a table may grant - a bonus action flash that blinds each other creature within 30
 * feet for 1 minute on a failed Constitution save (repeating at the end of its turns), once per
 * short or long rest.
 */
export default class Moonblade extends WeaponProperties {

  static FLASH = "Moonblade Flash";

  get flash(): string {
    return (/[^.]*\bflash[^.]*\.[^.]*saving throw[^.]*\./i).exec(this.text)?.[0] ?? "";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.flash) return [];
    return [
      itemProperty(Moonblade.FLASH, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: textDC(this.flash, /DC (\d+)/, "15") },
        activationType: "bonus",
        condition: "Only if the Moonblade has this rune. Each other creature within 30 feet not behind total cover",
        template: { type: "radius", size: "30" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "sr" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.flash) return [];
    const dc = textDC(this.flash, /DC (\d+)/, "15");
    return [
      {
        name: "Moonblade Flash",
        activityMatch: Moonblade.FLASH,
        statuses: ["Blinded"],
        options: { transfer: false, durationSeconds: 60, description: "Blinded for 1 minute; repeat the save at the end of each turn." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=con, saveDC=${dc}, label=Moonblade Flash`, 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
