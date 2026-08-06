import DDBEnricherData from "../../data/DDBEnricherData";

export default class Misfortunes extends DDBEnricherData {

  // The chosen Misfortunes each parse as their own "Misfortunes: Curse of the X"
  // feature with pool consumption; suppress the duplicate raw DDB actions here.

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><i>Your chosen Misfortunes are separate features that consume Jinx Points from the Misfortunist feature.</i></p>",
    };
  }

}
