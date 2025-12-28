/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Dragonscarred extends DDBEnricherData {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Fearsome Power",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Deal damage as part of an Attack or Magic Action",
          targetType: "creature",
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "wis",
                formula: "",
              },
            },
            range: {
              units: "ft",
              value: 30,
            },
          },
        },
      },
    ];
  }

  get effects() {
    const effects = [
      {
        name: "Frightened",
        daeSpecialDurations: ["turnEndSource"],
        statuses: ["Frightened"],
        activityMatch: "Fearsome Power",
        data: {
          duration: {
            rounds: 1,
          },
        },
      },
    ];

    const types = ["Acid", "Cold", "Fire", "Lightning", "Poison"];
    const activeType = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.find((a) => types.includes(a.label),
      )?.label ?? "");


    types.forEach((type) => {
      effects.push({
        name: `Dragonscarred Resistance: ${type}`,
        options: {
          transfer: true,
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(type.toLowerCase(), 20, "system.traits.dr.value"),
        ],
      });
    });

    return effects;
  }

  get clearAutoEffects() {
    return true;
  }
}
