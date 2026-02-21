import DDBEnricherData from "../data/DDBEnricherData";

export default class BanishingSmite extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      data: {
        damage: {
          critical: {
            allow: true,
          },
        },
      },
    };
  }

}
