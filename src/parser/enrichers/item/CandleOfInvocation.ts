import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * The candle burns for 4 hours in all, lit an hour at a time here (the text counts minutes).
 * Lighting it for the first time can cast Gate instead, which spends all 4 (so only a full candle
 * can). As dnd5e equipment it cannot destroy itself when spent. 2014 limits the advantage to
 * creatures of the candle's alignment.
 */
export default class CandleOfInvocation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Light Candle",
      activationType: "action",
      addItemConsume: true,
      data: {
        duration: { override: true, value: "1", units: "hour" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Cast Gate", type: DDBEnricherData.ACTIVITY_TYPES.CAST },
        build: { generateSpell: true, generateConsumption: false },
        overrides: {
          addSpellUuid: "Gate",
          noSpellslot: true,
          noTemplate: true,
          activationType: "action",
          activationCondition: "When you light the candle for the first time; destroys the candle",
          addItemConsume: true,
          itemConsumeValue: "@item.uses.max",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: this.is2014 ? "Candle of Invocation (Matching Alignment)" : "Candle of Invocation",
        activityMatch: "Light Candle",
        options: {
          transfer: false,
          // one lighting; the text's 4 hours is the whole burn budget
          durationSeconds: 3600,
          description: "While you are within the candle's light. A Cleric or Druid there can cast prepared level 1 spells without expending spell slots.",
        },
        // both printings give advantage on attack rolls, saving throws and ability checks
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.advantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.check.advantage"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "4");
  }

}
