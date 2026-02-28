import DDBEnricherData from "../../data/DDBEnricherData";

export default class AnimatingPerformance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity() {
    return {
      id: "summonDanciItem1",
      name: "Summon Dancing Item",
      type: "summon",
      activationType: "action",
      addActivityConsume: true,
      data: {
        uses: {
          spent: null,
          max: "1",
          override: true,
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
        creatureSizes: ["med", "lg"],
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Restore Dancing Item With Spell Slot",
          type: "forward",
        },
        build: {
        },
        overrides: {
          activationType: "action",
          data: {
            activity: {
              id: "summonDanciItem1",
            },
            consumption: {
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "3",
                  scaling: {},
                },
              ],
              scaling: {
                allowed: true,
                max: "",
              },
              spellSlot: true,
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];
  }

  get parseAllChoiceFeatures() {
    return true;
  }

}
