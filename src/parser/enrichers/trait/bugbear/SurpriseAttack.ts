import DDBEnricherData from "../../data/DDBEnricherData";

export default class SurpriseAttack extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        range: {
          units: "spec",
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // AC5e automates the first-round surprise damage; the damage activity
        // remains as the manual claim otherwise
        name: "Surprise Attack",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "bonus=2d6; hasAttack && combat.round === 1 && rollingActor.combatTurn < opponentActor.combatTurn",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData | null {
    return null;
  }

}
