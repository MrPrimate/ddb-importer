/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CoordinatedAssault extends DDBEnricherData {
  get activity() {
    return {
      activationType: "legendary",
      activationCondition: "If the Headless Summoning trait is active",
    };
  }

  get override() {
    const value = `
${this.ddbParser.data.system.description.value.replace("it can use the options below as legendary actions", "it can use the following as a legendary action")}
`;
    return {
      data: {
        system: {
          description: {
            value,
          },
        },
      },
    };
  }
}
