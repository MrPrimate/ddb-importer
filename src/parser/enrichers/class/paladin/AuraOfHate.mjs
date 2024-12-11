/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AuraOfHate extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Aura of Hate (Self)",
        daeStackable: "none",
        data: {
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("+@abilities.cha.mod", 20, "system.bonuses.mwak.damage"),
          ],
        },
        statuses: ["Aura of Hate (Self)"],
        options: {
          transfer: true,
        },
      },
      {
        name: "Aura of Hate (Fiends and Undead)",
        activeAurasOnly: true,
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: "@scale.oathbreaker.aura-of-hate",
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
              type: "undead; fiend",
            },
          },
        },
        statuses: ["Aura of Hate (Fiends and Undead)"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+@abilities.cha.mod", 20, "system.bonuses.mwak.damage"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
