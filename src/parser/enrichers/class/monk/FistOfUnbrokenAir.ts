import DDBEnricherData from "../../data/DDBEnricherData";

export default class FistOfUnbrokenAir extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      addScalingMode: "amount",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scaling +2)d10",
              type: "bludgeoning",
            }),
          ],
        },
      },
    };
  }

}
