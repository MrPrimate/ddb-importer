import logger from "../../../lib/Logger";
import DDBCompanionMixin from "../DDBCompanionMixin";
import { SUMMONS_ACTOR_STUB } from "./_data";
import { illusoryDragonFeatureText } from "./IllusoryDragonText";

const DRAGON_ICON = "icons/creatures/abilities/dragon-breath-purple.webp";

/**
 * Builds the shadowy dragon as a summon actor. The stub already carries immunity to
 * every damage type and condition, which is the dragon's own rule. Its features run
 * through the monster feature parser so the IllusoryDragon monster enrichers shape
 * the two saves; the summon activity's "match saves" then links their DCs to the caster.
 */
export async function getIllusoryDragon({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
}: ICompanionData): Promise<ICompanionResult> {

  logger.verbose("getIllusoryDragon", {
    ddbParser,
    document,
    raw,
    text,
  });

  const version = ddbParser.is2014 ? "2014" : "2024";

  let stub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    "name": "Illusory Dragon",
    "img": DRAGON_ICON,
    "prototypeToken": {
      name: "Illusory Dragon",
      width: 3,
      height: 3,
      disposition: 1,
      texture: {
        src: DRAGON_ICON,
        scaleX: 1,
        scaleY: 1,
      },
    },
    system: {
      traits: {
        size: "huge",
      },
      details: {
        type: {
          value: null,
          custom: "Summon",
        },
      },
      attributes: {
        movement: {
          speeds: { fly: "60" },
        },
      },
      source: {
        rules: version,
      },
    },
  }) as I5eMonsterData;

  const { fear, breath, illusion } = illusoryDragonFeatureText(raw);
  const fearDescription = `<p><em><strong>Frightful Appearance.</strong></em> ${fear}</p>`;
  const breathDescription = `<p><em><strong>Breath Weapon.</strong></em> ${breath}</p>`;
  const illusionDescription = `<p><em><strong>Shadow Illusion.</strong></em> ${illusion}</p>`;

  const manager = new DDBCompanionMixin(fearDescription, { forceRulesVersion: version }, { addMonsterEffects: true });
  manager.npc = stub;
  const actions = await manager.getFeature(fearDescription, "action");
  const bonusActions = await manager.getFeature(breathDescription, "bonus");
  const traits = illusion === "" ? [] : await manager.getFeature(illusionDescription, "special");
  stub.items = [...actions, ...bonusActions, ...traits];
  stub = await DDBCompanionMixin.addEnrichedImageData(stub);
  const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

  const result: ICompanionResult = {
    [`IllusoryDragon${version}`]: {
      name: "Illusory Dragon",
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Illusory Dragon",
      data: stub,
    },
  };

  logger.verbose("Illusory Dragon result", result);
  return result;
}
