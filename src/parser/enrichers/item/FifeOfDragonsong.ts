import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Fife of Dragonsong: Dragonsong spends a use of Bardic Inspiration on a 15 foot cone. Enemies in
 * it make a Constitution save or take 2d6 thunder and are pushed 10 feet (half and no push on a
 * success); allies instead gain 2d6 temporary hit points and 10 feet of Speed.
 */
export default class FifeOfDragonsong extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const allies = itemProperty("Dragonsong: Allies", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      condition: "Part of the same Dragonsong: allies in the cone that can hear it; +10 feet of Speed until the end of their next turn",
      template: { type: "cone", size: "15" },
      range: { value: null, units: "self" },
      noeffect: true,
    });
    return [
      itemProperty("Dragonsong", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["thunder"] })],
        onSave: "half",
        activationType: "action",
        condition: "Expend one use of Bardic Inspiration; enemies in the cone are pushed 10 feet on a failure",
        template: { type: "cone", size: "15" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
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

}
