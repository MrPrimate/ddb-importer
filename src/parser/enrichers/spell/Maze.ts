import DDBEnricherData from "../data/DDBEnricherData";

export default class Maze extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
        },
        overrides: {
          data: {
            check: {
              ability: ["int"],
              dc: {
                formula: "20",
                calculation: "",
              },
            },
          },
        },
      },
    ];
  }

}
