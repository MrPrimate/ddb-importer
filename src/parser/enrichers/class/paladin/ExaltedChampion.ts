import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExaltedChampion extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate Exalted Champion",
      type: "utility",
      addItemConsume: true,
      activationType: "action",
    };
  }


  get effects() {
    return [
      {
        name: "Exalted Champion",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.wis.check.roll.mode"),
        ],
        data: {
          "flags.ddbimporter.activitiesMatch": ["Activate Exalted Champion"],
        },
      },
      {
        name: "Exalted Champion: Aura",
        daeStackable: "noneNameOnly",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.attributes.death.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.wis.check.roll.mode"),
        ],
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: `30`,
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
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
