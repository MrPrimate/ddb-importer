import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Lash of Shadows: a hit can poison the target with a poison of the wielder's choice, one
 * Constitution save at DC 13 (dormant), 15 (awakened) or 17 (exalted). Serpent Venom is always
 * available; each other poison is once per dawn. Awakened adds Ghoul's Blood, exalted Cockatrice
 * Tears, whose failure only starts the petrification: a second save a turn later settles it.
 */
export default class LashOfShadows extends WeaponProperties {

  get dc(): string {
    return ["13", "15", "17"][this.stage];
  }

  poison(name: string, options: Partial<Parameters<typeof itemProperty>[2]> = {}): IDDBAdditionalActivity {
    return itemProperty(name, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["con"], formula: this.dc },
      condition: "A creature hit by the whip",
      range: { value: "10", units: "ft" },
      ...options,
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities = [
      this.poison("Serpent Venom", {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["poison"] })],
        onSave: "half",
        noeffect: true,
      }),
      this.poison("Dead Eyes", { uses: { max: "1", period: "dawn" } }),
    ];
    if (this.stage >= 1) activities.push(this.poison("Ghoul's Blood", { uses: { max: "1", period: "dawn" } }));
    if (this.stage >= 2) {
      activities.push(
        this.poison("Cockatrice Tears", { uses: { max: "1", period: "dawn" } }),
        this.poison("Cockatrice Tears: Second Save", { condition: "At the end of the restrained creature's next turn; a success ends the effect" }),
      );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Dead Eyes",
        activityMatch: "Dead Eyes",
        statuses: ["Poisoned", "Blinded"],
        options: { transfer: false, durationSeconds: 3600, description: "Poisoned for 1 hour, and blinded while poisoned this way." },
      },
    ];
    if (this.stage >= 1) {
      effects.push({
        name: "Ghoul's Blood",
        activityMatch: "Ghoul's Blood",
        statuses: ["Poisoned", "Paralyzed"],
        options: { transfer: false, durationSeconds: 60, description: "Poisoned and paralyzed for 1 minute; repeat the save at the end of each turn." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=con, saveDC=${this.dc}, label=Ghoul's Blood`, 20, "flags.midi-qol.OverTime"),
        ],
      });
    }
    if (this.stage >= 2) {
      effects.push(
        {
          name: "Cockatrice Tears",
          activityMatch: "Cockatrice Tears",
          statuses: ["Restrained"],
          options: { transfer: false, expiry: "targetEnd", durationSeconds: 12, durationRounds: 2, description: "Begins to turn to stone; repeat the save at the end of its next turn, becoming petrified for 24 hours on a failure." },
        },
        {
          name: "Cockatrice Tears: Petrified",
          activityMatch: "Cockatrice Tears: Second Save",
          statuses: ["Petrified"],
          options: { transfer: false, durationSeconds: 86400 },
        },
      );
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
