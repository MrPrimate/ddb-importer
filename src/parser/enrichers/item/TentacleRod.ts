import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Tentacle Rod: three +9 tentacle attacks; a creature hit by all three makes a DC 15 Dexterity save or is Restrained with halved speed.
 */
export default class TentacleRod extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Tentacle Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: null, condition: "Up to three attacks per action" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 15,
          noeffect: true,
          data: { attack: { bonus: "9", ability: "none" }, damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["psychic"] })] } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Held by Tentacles",
        statuses: ["Restrained"],
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0.5", 20, "system.attributes.movement.walk"),
        ],
        options: {
          transfer: false,
          description: "Speed halved and Restrained; repeat the save at the end of each turn.",
        },
      },
    ];
  }

}
