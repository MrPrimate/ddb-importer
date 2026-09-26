import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

const ELEMENT_SAVE_ID = "ddbElemDamageSav";

/**
 * The importer-built 2024 Conjure Elemental spirits. "Place Aura" puts a 5-foot emanation on the
 * spirit token and rolls nothing; the region fires the element damage save when a creature enters
 * the spirit's space or starts its turn within 5 feet (the spirit appearing is neither). The rules
 * only allow the save while the spirit has nobody Restrained, and the Restrained target's repeat
 * save is its own turn logic - both stay with the GM.
 */
export default class ElementDamage extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  static elementals = [
    {
      name: "Air",
      type: "lightning",
    },
    {
      name: "Earth",
      type: "thunder",
    },
    {
      name: "Fire",
      type: "fire",
    },
    {
      name: "Water",
      type: "cold",
    },
  ];

  override get activity(): IDDBActivityData {
    const damageType = ElementDamage.elementals.find((d) => d.name === this.data.name.split("Element")[0].trim())?.type;
    return {
      id: ELEMENT_SAVE_ID,
      targetType: "creature",
      targetCount: "1",
      noTemplate: true,
      activationType: "special",
      activationCondition: "Enters the spirit’s space or starts its turn within 5 feet of it, while the spirit has no creature Restrained",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 8,
              denomination: 8,
              types: damageType ? [damageType] : [],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [regionPlacer("Place Aura", {
      template: { type: "radius", size: "5" },
      activationType: "special",
      activationCondition: "When the spirit appears",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          enterOn: "movement",
          excludeSelf: true,
          activityId: ELEMENT_SAVE_ID,
        }),
      ],
    })];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        data: {
          img: "systems/dnd5e/icons/svg/statuses/restrained.svg",
        },
      },
    ];
  }

}
