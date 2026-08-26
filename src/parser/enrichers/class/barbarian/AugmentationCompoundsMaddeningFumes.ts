import DDBEnricherData from "../../data/DDBEnricherData";

export default class AugmentationCompoundsMaddeningFumes extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: {
            type: "enemy",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: "8 + @abilities.con.mod + @prof",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            excludeSelf: true,
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Maddening Fumes: Aggression",
        // "until the start of its next turn" on the affected creature
        daeSpecialDurations: ["turnStart"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        options: {
          description: "Disadvantage on attack rolls against targets other than the barbarian until the start of its next turn (the exemption for attacks against the barbarian is manual).",
        },
      },
    ];
  }

}
