/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Shifting extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  // get type() {
  //   return "heal";
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
