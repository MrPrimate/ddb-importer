import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Will of the Talon: Frightful Presence (bonus action, creatures of your choice within 30 feet,
 * once per dawn) and a breath weapon whose area and save follow the chosen damage type, each type
 * once per dawn. Both rise with the stage: DC 13/15/17 and 3d6/4d6/5d6. Awakened also grants
 * resistance to the five breath types while carried.
 */
export default class WillOfTheTalon extends WeaponProperties {

  static FRIGHT = "Frightful Presence";

  static BREATHS: { type: string; ability: string; area: I5eActivityTarget["template"] }[] = [
    { type: "acid", ability: "dex", area: { type: "line", size: "30", width: "5" } as I5eActivityTarget["template"] },
    { type: "cold", ability: "con", area: { type: "cone", size: "15" } as I5eActivityTarget["template"] },
    { type: "fire", ability: "dex", area: { type: "cone", size: "15" } as I5eActivityTarget["template"] },
    { type: "lightning", ability: "dex", area: { type: "line", size: "30", width: "5" } as I5eActivityTarget["template"] },
    { type: "poison", ability: "con", area: { type: "cone", size: "15" } as I5eActivityTarget["template"] },
  ];

  get dc(): string {
    return ["13", "15", "17"][this.stage];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(WillOfTheTalon.FRIGHT, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: this.dc },
        activationType: "bonus",
        condition: "Each creature of your choice within 30 feet that is aware of you",
        template: { type: "radius", size: "30" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
      }),
      ...WillOfTheTalon.BREATHS.map((breath) => itemProperty(`Breath Weapon: ${breath.type.charAt(0).toUpperCase()}${breath.type.slice(1)}`, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: [breath.ability], formula: this.dc },
        damageParts: [DDBEnricherData.basicDamagePart({ number: this.stage + 3, denomination: 6, types: [breath.type] })],
        onSave: "half",
        activationType: "action",
        condition: "Exhale destructive energy; this damage type can't be chosen again until the next dawn",
        template: breath.area,
        range: { value: null, units: "self" },
        uses: { max: "1", period: "dawn" },
        noeffect: true,
      })),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Frightful Presence",
        activityMatch: WillOfTheTalon.FRIGHT,
        statuses: ["Frightened"],
        options: { transfer: false, durationSeconds: 60, description: "Frightened for 1 minute; repeat the save at the end of each turn. A success makes it immune for 24 hours." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=wis, saveDC=${this.dc}, label=Frightful Presence`, 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
    if (this.stage >= 1) {
      effects.push({
        name: "Will of the Talon: Resistances",
        options: { transfer: true, durationSeconds: null },
        changes: WillOfTheTalon.BREATHS.map((breath) => DDBEnricherData.ChangeHelper.damageResistanceChange(breath.type)),
      });
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
