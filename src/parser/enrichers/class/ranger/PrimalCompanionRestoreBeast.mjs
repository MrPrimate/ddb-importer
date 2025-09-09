/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanionRestoreBeast extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Restore Beast With Spell Slot",
      activationType: "action",
      activationCondition: "Takes 1 minute to be restored to life",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "300",
          types: ["healing"],
        }),
        consumption: {
          targets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
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
    };
  }

  // get type() {
  //   return "forward";
  // }

  // get activity() {
  //   return {
  //     name: "Restore Beast With Spell Slot",
  //     activationType: "action",
  //     activationCondition: "Takes 1 minute to be restored to life",
  //     data: {
  //       activity: {
  //         id: "summonPriCSclNe1",
  //       },
  //       consumption: {
  //         targets: [
  //           {
  //             type: "spellSlots",
  //             value: "1",
  //             target: "1",
  //             scaling: {},
  //           },
  //         ],
  //         scaling: {
  //           allowed: true,
  //           max: "",
  //         },
  //         spellSlot: true,
  //       },
  //       uses: { spent: null, max: "" },
  //       midiProperties: {
  //         confirmTargets: "default",
  //       },
  //     },
  //   };
  // }
}
