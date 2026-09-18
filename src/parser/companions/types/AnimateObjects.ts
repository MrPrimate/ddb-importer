import logger from "../../../lib/Logger";
import DDBCompanionMixin from "../DDBCompanionMixin";
import { SUMMONS_ACTOR_STUB } from "./_data";

interface IAnimatedObject2014 {
  size: TActorSizes;
  img: string;
  hp: number;
  ac: number;
  str: number;
  dex: number;
  toHit: number;
  dice: { number: number; faces: number; bonus: number };
}

/**
 * The 2014 spell's Animated Object Statistics table, one row per size. The 2024 spell carries a
 * single Animated Object stat block instead and is built by the companion parser.
 */
const ANIMATED_OBJECTS_2014: IAnimatedObject2014[] = [
  { size: "tiny", img: "icons/sundries/misc/key-short-glowing.webp", hp: 20, ac: 18, str: 4, dex: 18, toHit: 8, dice: { number: 1, faces: 4, bonus: 4 } },
  { size: "sm", img: "icons/sundries/books/book-clasp-spiral-green.webp", hp: 25, ac: 16, str: 6, dex: 14, toHit: 6, dice: { number: 1, faces: 8, bonus: 2 } },
  { size: "med", img: "icons/sundries/books/book-clasp-spiral-green.webp", hp: 40, ac: 13, str: 10, dex: 12, toHit: 5, dice: { number: 2, faces: 6, bonus: 1 } },
  { size: "lg", img: "icons/sundries/books/book-clasp-spiral-green.webp", hp: 50, ac: 10, str: 14, dex: 10, toHit: 6, dice: { number: 2, faces: 10, bonus: 2 } },
  { size: "huge", img: "icons/sundries/books/book-clasp-spiral-green.webp", hp: 80, ac: 10, str: 18, dex: 6, toHit: 8, dice: { number: 2, faces: 12, bonus: 4 } },
];

export async function getAnimateObjects2014({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
}: ICompanionData): Promise<ICompanionResult> {

  logger.verbose("getAnimateObjects2014", {
    ddbParser,
    document,
    raw,
    text,
  });

  const result: ICompanionResult = {};
  for (const data of ANIMATED_OBJECTS_2014) {

    const size = CONFIG.DND5E.actorSizes[data.size];

    let stub: I5eMonsterData = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
      "name": `Animated Object (${size.label})`,
      "prototypeToken": {
        name: `Animated Object (${size.label})`,
        width: size.token,
        height: size.token,
        disposition: 1,
        texture: {
          src: data.img,
          scaleX: 1,
          scaleY: 1,
        },
      },
      system: {
        traits: {
          size: data.size,
          ci: { value: ["poisoned", "charmed", "exhaustion", "frightened", "paralyzed"] },
          di: { value: ["poison", "psychic"] },
        },
        details: {
          type: {
            value: "construct",
            custom: "",
          },
        },
        source: {
          rules: "2014",
        },
        abilities: {
          str: { value: data.str },
          dex: { value: data.dex },
          con: { value: 10 },
          int: { value: 3 },
          wis: { value: 3 },
          cha: { value: 1 },
        },
        attributes: {
          // the fly-and-hover alternative for legless objects is left for the table to set
          movement: {
            speeds: { walk: 30 },
            hover: false,
          },
          senses: {
            ranges: { blindsight: 30 },
          },
          ac: {
            override: data.ac,
          },
          hp: {
            value: data.hp,
            max: data.hp,
          },
        },
      },
      img: data.img,
    }) as I5eMonsterData;

    const { number, faces, bonus } = data.dice;
    const average = Math.floor((number * (faces + 1)) / 2) + bonus;
    const action = `<p><em><strong>Slam.</strong></em> <em>Melee Weapon Attack:</em> +${data.toHit} to hit, reach 5 ft., one target. <em>Hit:</em> ${average} (${number}d${faces} + ${bonus}) bludgeoning damage.</p>`;

    const manager = new DDBCompanionMixin(action, { forceRulesVersion: "2014" }, { addMonsterEffects: true });
    manager.npc = stub;
    const features = await manager.getFeature(action, "action");
    stub.items = features;
    stub = await DDBCompanionMixin.addEnrichedImageData(stub);
    const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

    result[`AnimateObject${size.label}2014`] = {
      name: `Animated Object (${size.label})`,
      version: enriched ? "3" : "2",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Animate Objects`,
      data: stub,
    };

  }

  logger.verbose("Animate Objects result", result);
  return result;
}
