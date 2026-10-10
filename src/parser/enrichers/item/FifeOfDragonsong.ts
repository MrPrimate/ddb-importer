import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Fife of Dragonsong: a hit deals an extra 1d6 thunder. Dragonsong spends a use of Bardic
 * Inspiration (`feat:bardic-inspiration`) on a 15 foot cone. Enemies in it make a Constitution
 * save or take 2d6 thunder and are pushed 10 feet (half and no push on a success); allies instead
 * gain 2d6 temporary hit points and 10 feet of Speed. The cone targets enemies for the save and allies for the healing, so each
 * activity affects only its own side.
 */
export default class FifeOfDragonsong extends WeaponProperties {

  // DDB carries the on-hit thunder only as a "Restriction:" attack, which this base does not build
  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["thunder"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const allies = itemProperty("Dragonsong: Allies", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      condition: "Part of the same Dragonsong: allies in the cone that can hear it; +10 feet of Speed until the end of their next turn",
      template: { type: "cone", size: "15" },
      range: { value: null, units: "self" },
      noeffect: false,
      data: { target: { affects: { type: "ally" } } },
    });
    const song = itemProperty("Dragonsong", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["con"], formula: "15" },
      damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["thunder"] })],
      onSave: "half",
      activationType: "action",
      condition: "Expend one use of Bardic Inspiration; enemies in the cone are pushed 10 feet on a failure",
      template: { type: "cone", size: "15" },
      range: { value: null, units: "self" },
      noeffect: true,
      data: { target: { affects: { type: "enemy" } } },
    });
    return [
      {
        ...song,
        // spends a use of the wielder's Bardic Inspiration feature, found by its identifier
        overrides: {
          ...song.overrides,
          additionalConsumptionTargets: [
            { type: "itemUses", target: "feat:bardic-inspiration", value: "1", scaling: { mode: "", formula: "" } },
          ],
        },
      },
      {
        ...allies,
        build: {
          ...allies.build,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["temphp"] }),
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dragonsong: Bolstered",
        activityMatch: "Dragonsong: Allies",
        options: {
          transfer: false,
          durationSeconds: 6,
          expiry: "turnEnd",
          description: "Speed increases by 10 feet until the end of your next turn.",
        },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("10")],
      },
    ];
  }

}
