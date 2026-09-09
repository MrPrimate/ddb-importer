import DDBEnricherData from "../data/DDBEnricherData";

export default class Dragonscarred extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Fearsome Power",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Frightened",
        options: { expiry: "sourceEnd" },
        statuses: ["Frightened"],
        activityMatch: "Fearsome Power",
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
          DDBEnricherData.ChangeHelper.damageResistanceChange(type),
        ],
      });
    });

    return effects;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }
}
