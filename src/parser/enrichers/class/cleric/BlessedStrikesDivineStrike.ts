import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedStrikesDivineStrike extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.cleric.divine-strike",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": "@scale.cleric.divine-strike",
          },
        }],
      },
      {
        name: "Divine Strike (Automation)",
        ac5eOnly: true,
        midiNever: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on a hit with a weapon attack.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=@scale.cleric.divine-strike[necrotic, radiant]; oncePerTurn; optin; actionType.mwak || actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
