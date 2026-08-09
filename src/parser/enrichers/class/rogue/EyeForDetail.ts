import DDBEnricherData from "../../data/DDBEnricherData";

export default class EyeForDetail extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Perception",
      data: {
        check: {
          associated: ["per"],
          ability: [],
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Investigation",
          data: {
            check: {
              associated: ["inv"],
            },
          },
        },
      },
    ];
  }

}
