import DDBEnricherData from "../data/DDBEnricherData";

export default class Charger extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      data: {
        name: "Charge Damage",
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // AC5e automates the bonus after 10+ ft of straight movement; the
        // damage activity above remains as the manual claim otherwise
        name: "Charger",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "bonus=1d8; actionType.mwak && movementLastSegment >= 10",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
