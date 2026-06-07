import DDBEnricherData from "../data/DDBEnricherData";

export default class CircletOfBlasting extends DDBEnricherData {

  async customFunction({ name, activity } : { name: string; activity: IDDBActivityData }) {
    if (name === "Scorching Ray") {
      let data = activity.data as I5eCastActivity;
      const update = {
        spell: {
          challenge: {
            attack: 5,
            override: true,
          },
        },
      } as Partial<I5eCastActivity>;
      data = foundry.utils.mergeObject(data, update) as I5eCastActivity;
      activity.data = data;
    }
  }

}
