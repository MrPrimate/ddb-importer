import DDBEnricherData from "../data/DDBEnricherData";

export default class PowerWordHeal extends DDBEnricherData {
  get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10000",
          types: ["healing"],
        }),
      },
    };
  }
}
