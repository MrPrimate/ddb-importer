import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built 2024 Conjure Elemental spirits. Using the element damage
 * from the spirit token places a 5-foot emanation attached to it; the region
 * fires the save when a creature enters or starts its turn inside. The rules
 * only allow the save while the spirit has nobody Restrained, and the
 * Restrained target's repeat save is its own turn logic - both stay with the GM.
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
      id: "ddbElemDamageSav",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Enters the spirit’s space or starts its turn within 5 feet of it, while the spirit has no creature Restrained",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "5",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            excludeSelf: true,
          }),
        ],
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
