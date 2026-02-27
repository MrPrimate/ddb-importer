import DDBEnricherData from "../data/DDBEnricherData";

export default class MageSlayer extends DDBEnricherData {

  get activity() {
    return {
      name: "Guarded Mind",
      type: "utility",
    };
  }

  get override() {
    return {
      retainResourceConsumption: true,
      data: {
        name: "Mage Slayer",
        "system.uses": {
          spent: null,
          max: "1",
          recovery: [{ period: "sr", type: 'recoverAll' }],
        },
      },
    };
  }

}
