import DDBEnricherData from "../../data/DDBEnricherData";
import _Illrigger from "./_Illrigger";

/**
 * Up to three seals, 3d6 fire per seal; the consumption scaling adds 3d6 per extra seal. If the
 * explosion damages anyone the illrigger regains hit points equal to the total rolled, which
 * has to be applied by hand from the damage roll.
 */
export default class LastWord extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Last Word",
      ..._Illrigger.sealConsume(),
      addScalingMode: "amount",
      addConsumptionScalingMax: "3",
      activationType: "special",
      activationCondition: "When you are reduced to 0 hit points and have unplaced seals remaining. You regain hit points equal to the total rolled if the explosion damages at least one creature.",
      targetType: "creature",
      data: {
        range: {
          units: "self",
          value: "",
        },
        target: {
          override: true,
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: "",
            type: "creature",
            choice: true,
          },
        },
        save: {
          ability: ["dex"],
          dc: _Illrigger.INTERDICT_DC,
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              types: ["fire"],
              scalingMode: "whole",
              scalingNumber: 3,
            }),
          ],
        },
      },
    };
  }

}
