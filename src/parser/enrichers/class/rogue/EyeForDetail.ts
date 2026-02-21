import DDBEnricherData from "../../data/DDBEnricherData";

export default class EyeForDetail extends DDBEnricherData {

  get type() {
    return "check";
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
