import DDBEnricherData from "../../data/DDBEnricherData";

export default class Moxie extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Brace Up",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        action: {
          name: "One-Two Punch",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        action: {
          name: "Stick and Move",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            max: "@scale.pugilist.moxie",
          },
        },
      },
    };
  }

}
