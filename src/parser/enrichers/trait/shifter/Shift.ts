import DDBEnricherData from "../../data/DDBEnricherData";

export default class Shift extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  // get type() {
  //   return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  // }

  // get activity() {
  //   return {
  //     name: "Shift",
  //     targetType: "self",
  //     activationType: "bonus",
  //     data: {
  //       healing: DDBEnricherData.basicDamagePart({
  //         customFormula: "max(1, @abilities.con.mod) + @detail.level",
  //         types: ["temphp"],
  //       }),
  //     },
  //   };
  // }

  // get effects() {
  //   return [
  //     {
  //       name: "Shifted",
  //       options: {
  //         durationSconds: 60,
  //       },
  //     },
  //   ];
  // }

}
