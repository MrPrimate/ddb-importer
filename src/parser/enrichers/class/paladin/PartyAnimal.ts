import DDBEnricherData from "../../data/DDBEnricherData";

export default class PartyAnimal extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Imbue Aura of Protection",
      targetType: "self",
      addItemConsume: true,
      activationType: "bonus",
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Aura of Fraternity: Party Animal",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateConsumption: false,
          generateRange: false,
          generateRoll: true,
          generateTarget: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "On a hit with a Melee weapon or an Unarmed Strike, while in your aura",
          },
          rollOverride: {
            prompt: false,
            visible: true,
            formula: "1d8",
            name: "Roll",
          },
        },
      },
      {
        init: {
          name: "Grant Heroic Inspiration",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateUtility: true,
          chatFlavor: "Give Heroic Inspiration to one ally within the aura.",
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the start of each of your turns",
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Party Animal",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
