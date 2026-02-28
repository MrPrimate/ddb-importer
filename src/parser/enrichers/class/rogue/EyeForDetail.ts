import DDBEnricherData from "../../data/DDBEnricherData";

export default class EyeForDetail extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  get activity() {
    return {
      name: "Perception",
      data: {
        check: {
          associated: ["per"],
          ability: "",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

  get additionalActivities() {
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
