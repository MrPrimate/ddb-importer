import logger from "../../../lib/Logger.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";
import DDBEffectHelper from "../../../effects/DDBEffectHelper.mjs";

export async function getFaithfulHound({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getFaithfulHound", {
    ddbParser,
    document,
    raw,
    text,
  });

  const version = ddbParser.is2014 ? "2014" : "2024";
  const condition = DDBEffectHelper.findCondition({ conditionName: "Invisible" });

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Faithful Hound",
    "prototypeToken": {
      name: "Faithful Hound",
      width: 2,
      height: 2,
      disposition: 1,
      texture: {
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      traits: {
        size: "lg",
      },
      details: {
        type: {
          value: null,
          custom: "Summon",
        },
      },
      source: {
        rules: version,
      },
    },
    "effects": [
      (await ActiveEffect.implementation.fromStatusEffect(condition.id)).toObject(),
    ],
  });

  const actionText = raw.split("<p>At the start").pop();
  const biteDamage = `<p><em><strong>Bite.</strong></em> <p>At the start${actionText}`;
  const manager = new DDBCompanionMixin(biteDamage, { forceRulesVersion: version }, { addMonsterEffects: true });
  manager.npc = stub;
  const features = await manager.getFeature(biteDamage, "special");
  stub.items = features;
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  const result = {
    [`FaithfulHound${version}`]: {
      name: "Faithful Hound",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Faithful Hound`,
      data: stub,
    },
  };

  logger.verbose("Faithful Hound result", result);
  return result;
}
