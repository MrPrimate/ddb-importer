/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FoeSlayer extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : "enchant";
  }

  get activity() {
    return this.is2014
      ? {}
      : {
        targetType: "self",
        data: {
          restrictions: {
            type: "spell",
            allowMagical: true,
          },
        },
      };
  }

  get effects() {
    return this.is2014
      ? [{
        name: "Foe Slayer (Automation)",
        options: {
          transer: true,
        },
        midiOptionalChanges: [
          {
            name: "foeSlayer",
            data: {
              label: "Use Foe Slayer?",
              "damage.msak": "@abilities.wis.mod",
              "damage.mwak": "@abilities.wis.mod",
              "damage.rsak": "@abilities.wis.mod",
              "damage.rwak": "@abilities.wis.mod",
              count: "each-round",
            },
          },
        ],
      }]
      : [
        {
          name: "Foe Slayer",
          type: "enchant",
          ignoreTransfer: true,
          options: {
            transfer: true,
            disabled: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange(`{} [Foe Slayer]`, 10, "name"),
            DDBEnricherData.ChangeHelper.overrideChange(`{ denomination: 10 }`, 20, "system.damage.parts"),
          ],
        },
      ];
  }

}
