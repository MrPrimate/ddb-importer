import DDBEnricherData from "../../data/DDBEnricherData";

export default class DiscipleOfLife extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        consumption: {
          scaling: {
            allowed: true,
            max: "9",
          },
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // AC5e automates the bonus on healing spells; the heal activity above
        // remains as the manual claim for users without the module
        name: "Disciple of Life",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "bonus=2 + castingLevel; isSpell && defaultDamageType.healing",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
