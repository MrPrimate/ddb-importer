import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneFirearm extends DDBEnricherData {

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
              number: 1,
              denomination: 8,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Firearm: Damage Bonus",
        options: {
          transfer: true,
          disabled: true,
          description: "Adds 1d8 to the damage of an artificer spell (assumes the firearm is the spellcasting focus; once per turn is not enforced). The damage activity is a manual fallback; using both rolls the die twice.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "1d8", {
            conditions: [
              DDBEnricherData.ChangeHelper.SPELL_FILTER,
              DDBEnricherData.ChangeHelper.classSpellFilter("artificer"),
            ],
          }),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        "spent": 0,
        "recovery": [],
        "max": "",
      },
    };
  }
}
