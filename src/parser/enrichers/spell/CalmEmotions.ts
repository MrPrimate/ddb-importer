import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Calm Emotions: SRD applies either immunity to the Charmed and Frightened conditions or indifference toward chosen creatures; both are offered so the caster picks the one used.
 */
export default class CalmEmotions extends DDBEnricherData {

  // one of the two applies: Midi prompts rather than applying both
  override get activity(): IDDBActivityData {
    return {
      data: { midiProperties: { chooseEffects: true } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Calmed",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
        ],
        options: {
          description: "Immunity to the Charmed and Frightened conditions until the spell ends; any such effects already present are suppressed.",
        },
      },
      {
        name: "Indifference",
        options: {
          description: "Indifferent about creatures of your choice that it is Hostile toward, until it is attacked or harmed or sees its friends harmed.",
        },
      },
    ];
  }

}
