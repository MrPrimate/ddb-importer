import DDBEnricherData from "../data/DDBEnricherData";

export default class SpiritGuardians extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast and Save",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 3,
          denomination: 8,
          types: ["necrotic", "radiant"],
          scalingMode: "whole",
          scalingNumber: 1,
        }),
      ],
      data: {
        save: {
          ability: ["wis"],
          dc: {
            formula: "",
            calculation: "spellcasting",
          },
        },
        damage: {
          onSave: "half",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            template: {
              type: "radius",
            },
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Half Speed",
        onSave: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 20),
        ],
        data: {
          duration: {
            expiry: "turnStart",
          },
        },
      },
    ];
  }

}
