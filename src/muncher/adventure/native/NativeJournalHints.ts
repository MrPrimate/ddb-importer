// JournalHint is declared globally in ./types.d.ts.

/**
 * Journal reparenting hints, bundled from ddb-meta-data's
 * `journal_info/<bookCode>.json` (the same files the standalone muncher loads
 * from its meta directory). Only these books ship hints; the data is tiny and
 * changes rarely, so it is inlined rather than fetched.
 *
 * Each hint reparents rows whose title appears in `childNames` under the
 * chapter row titled `parentName`, with `levelHint` as the page heading level.
 */
const JOURNAL_HINTS: Record<string, JournalHint[]> = {
  dmg: [
    {
      parentName: "Chapter 1: A World of Your Own",
      childNames: ["Creating a Campaign"],
      levelHint: 2,
    },
    {
      parentName: "Chapter 7: Treasure",
      childNames: [
        "Magic Items A–D",
        "Magic Items A-D",
        "Magic Items E-N",
        "Magic Items E–N",
        "Magic Items O-P",
        "Magic Items O–P",
        "Magic Items Q–R",
        "Magic Items Q-R",
        "Magic Items S–T",
        "Magic Items S-T",
        "Magic Items U–Z",
        "Magic Items U-Z",
        "Sentient Magic Items",
        "Other Rewards",
      ],
      levelHint: 2,
    },
  ],
  paitm: [
    {
      parentName: "Morte’s Planar Parade",
      childNames: [
        "Introduction: Multiversal Menagerie",
        "Bestiary A to Z",
        "Credits",
      ],
      levelHint: 1,
    },
    {
      parentName: "Sigil and the Outlands",
      childNames: [
        "Introduction: Infinite Doors to Adventure",
        "Chapter 1: Character Options",
        "Chapter 2: Sigil, the City of Doors",
        "Chapter 3: The Outlands",
        "Credits",
      ],
      levelHint: 1,
    },
    {
      parentName: "Turn of Fortune’s Wheel",
      childNames: [
        "Introduction: Beginning of the End",
        "Part 1: Schemes in Sigil",
        "Part 2: The Mosaic Mimir",
        "Part 3: Secret Realities",
        "Credits",
      ],
      levelHint: 1,
    },
  ],
  phb: [
    {
      parentName: "Chapter 3: Classes",
      childNames: [
        "Artificer",
        "Barbarian",
        "Bard",
        "Cleric",
        "Druid",
        "Fighter",
        "Monk",
        "Paladin",
        "Ranger",
        "Rogue",
        "Sorcerer",
        "Warlock",
        "Wizard",
      ],
      levelHint: 2,
    },
    {
      parentName: "Chapter 11: Spells",
      childNames: [
        "Spell Descriptions A-B",
        "Spell Descriptions C",
        "Spell Descriptions D-F",
        "Spell Descriptions G-K",
        "Spell Descriptions L-O",
        "Spell Descriptions P-R",
        "Spell Descriptions S",
        "Spell Descriptions T-Z",
      ],
      levelHint: 2,
    },
  ],
};

export function getJournalHints(bookCode: string): JournalHint[] {
  return JOURNAL_HINTS[bookCode.toLowerCase()] ?? [];
}
