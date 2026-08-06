import DDBEnricherData from "../../data/DDBEnricherData";

export default class InfamyStrength extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Infamy: Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
          description: "Frightened of the fighter. Repeat the saving throw at the end of each of your turns, ending the effect on a success.",
        },
      },
    ];
  }

}
