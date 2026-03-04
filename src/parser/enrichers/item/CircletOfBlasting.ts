import DDBEnricherData from "../data/DDBEnricherData";

export default class CircletOfBlasting extends DDBEnricherData {

  async customFunction({ name, activity } : { name: string; activity: IDDBActivityData }) {
    if (name === "Scorching Ray") {
      activity.data = foundry.utils.mergeObject(activity.data, {
        spell: {
          challenge: {
            attack: "5",
            override: true,
          },
        },
      });
    }
  }

}
