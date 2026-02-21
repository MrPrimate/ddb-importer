import DDBEnricherData from "../data/DDBEnricherData";

export default class MinorIllusion extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getIllusions;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionObject" },
        { count: 1, name: "IllusionSound" },
      ],
      data: {
        creatureSizes: ["sm", "med", "tiny"],
      },
    };
  }

}
