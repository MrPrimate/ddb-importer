import DDBEnricherData from "../data/DDBEnricherData";

export default class CrusadersMantle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.rolls.damage.rwak.bonus"),
        ],
        data: {
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "Allies",
              radius: "30",
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `30`,
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
      },
    ];
  }

}
