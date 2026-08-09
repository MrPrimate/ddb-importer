import DDBEnricherData from "../../data/DDBEnricherData";

export default class FortifyingSoul extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Healing",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.ranger.levels",
          types: ["healing"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: `${this.name}: Advantage vs saves against Frightened`,
      options: {
        description: "You have advantage on saving throws against Frightened.",
      },
    }];
  }

}
