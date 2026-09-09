import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class HandOfHarm extends DDBEnricherData<DDBClassFeatureEnricher> {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hand of Harm",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die.die + @abilities.wis.mod",
              type: "necrotic",
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const focusIdentifier = this.ddbEnricher.isParentClass2014 ? "ki" : "monks-focus";
    return [
      {
        name: "Hand of Harm (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage on an Unarmed Strike hit, expending 1 Focus Point.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=(@scale.monk.die + @abilities.wis.mod)[necrotic]; usesCount=Item.${focusIdentifier}; oncePerTurn; optin; item.name.includes('Unarmed')`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
