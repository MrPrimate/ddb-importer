/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HeadlessWail extends DDBEnricherData {
  get activity() {
    return {
      activationType: "legendary",
      activationCondition: "If the Headless Summoning trait is active",
    };
  }

  get override() {
    const value = `
<p>If the dullahan’s Headless Summoning trait is active, it can use the following as a legendary action.</p>
${this.ddbParser.data.system.description.value}
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
