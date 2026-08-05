import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackAssassinate extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.rogue.levels",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // advantage on attack rolls against creatures that haven't taken a
        // turn in the first round of combat
        name: "Assassinate",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "combat.round === 1 && rollingActor.combatTurn < opponentActor.combatTurn",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
