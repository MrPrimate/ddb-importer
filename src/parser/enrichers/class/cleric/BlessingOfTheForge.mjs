/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlessingOfTheForge extends DDBEnricherData {

  get activity() {
    return {
      name: "Weapon Enchantment",
      type: "enchant",
      activationType: "special",
      noTemplate: true,
      targetType: "self",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Armor Enchantment",
          data: {
            restrictions: {
              type: "equipment",
              categories: ['heavy', 'light', 'medium'],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        type: "enchant",
        name: "Forged Weapon",
        activityMatch: "Weapon Enchantment",
        magicalBonus: {
          makeMagical: true,
          bonus: "1",
          nameAddition: " (Forged)",
        },
        // changes: [
        //   DDBEnricherData.ChangeHelper.addChange("1", 20, "activities[attack].attack.bonus"),
        //   DDBEnricherData.ChangeHelper.addChange("1", 20, "activities[attack].damage.bonus"),
        // ],
        options: {
          durationSeconds: 86400,
        },
      },
      {
        type: "enchant",
        name: "Forged Armor",
        activityMatch: "Armor Enchantment",
        magicalBonus: {
          makeMagical: true,
          nameAddition: " (Forged)",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          durationSeconds: 86400,
        },
      },
    ];
  }

}

