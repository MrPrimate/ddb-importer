import DDBEnricherData from "../../data/DDBEnricherData";

export default class BeguilingTwist extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Charmed",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Charmed"],
      },
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
        },
        statuses: ["Frightened"],
      },
    ];
  }

}
