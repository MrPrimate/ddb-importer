import DDBEnricherData from "../../data/DDBEnricherData";

export default class VenomSpray extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      activationType: "action",
      data: {
        sort: 2,
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 4,
              denomination: 8,
              type: "poison",
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cut Self",
          type: "damage",
        },
        overrides: {
          type: "damage",
          targetType: "self",
          activationType: "special",
          noeffect: true,
          data: {
            sort: 1,
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  type: "slashing",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        statuses: ["Poisoned"],
        options: {
          durationSeconds: 60,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "turn=end, saveAbility=con, saveDC=@abilities.str.dc, label=Poisoned by Venom Spray",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
