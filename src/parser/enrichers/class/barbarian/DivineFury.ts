import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineFury extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "(floor(@classes.barbarian.levels / 2))",
              number: 1,
              denomination: 6,
              types: ["necrotic", "radiant"],
            }),
          ],
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [
          {
            "period": "turnStart",
            "type": "recoverAll",
          },
        ],
        "max": "1",
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Divine Fury (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on the first weapon attack hit while your Rage is active.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d6[necrotic, radiant] + floor(@classes.barbarian.levels / 2); oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
