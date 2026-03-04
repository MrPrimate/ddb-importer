import DDBEnricherData from "../data/DDBEnricherData";

export default class TashasCausticBrew extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Covered in Acid",
        options: {
          description: "You are covered in acid. Take 2d4 &Reference[acid] damage at start of each of your turns until you use an action to scrape it off.",
        },
      },
    ];
  }

}
