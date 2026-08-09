import DDBEnricherData from "../../data/DDBEnricherData";

export default class CoordinatedAssault extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      activationType: "legendary",
      activationCondition: "If the Headless Summoning trait is active",
    };
  }

  override get override(): IDDBOverrideData {
    const value = `
${(this.ddbParser.data?.system?.description?.value ?? "").replace("it can use the options below as legendary actions", "it can use the following as a legendary action")}
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
