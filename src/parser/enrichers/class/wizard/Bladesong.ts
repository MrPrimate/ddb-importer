import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bladesong extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        name: "Activate Bladesong",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Bladework (Int)",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Bladework]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`@abilities.int.mod`, 50, "activities[attack].attack.bonus"),
        ],
        options: {
          durationSeconds: 60,
        },
        data: {
          flags: {
            ddbimporter: {
              effectRiders: ["ddbBladeSongEff1"],
            },
          },
        },
      },
      {
        type: "enchant",
        name: "Bladework (Physical)",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Bladework]`, 20, "name"),
        ],
        options: {
          durationSeconds: 60,
        },
        data: {
          flags: {
            ddbimporter: {
              effectRiders: ["ddbBladeSongEff1"],
            },
          },
        },
      },
      {
        name: "Bladesong",
        options: {
          durationSeconds: 60,
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.concentration.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.acr.roll.mode"),
        ],
        activitiesMatch: ["Not real"],
        data: {
          _id: "ddbBladeSongEff1",
        },
      },
    ];
  }

}
