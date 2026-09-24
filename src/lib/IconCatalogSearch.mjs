/** Pure search shared by the icon picker and the catalogue tools; see "Icon catalogue" in CONTRIBUTING.md. */
const STOP = new Set(
  "a about above according across act action actions activitie activities activity addition additional after again against ago all allow allows almost already also although always among amount an and another any anyone anything are around as at available away back be because become becomes been before begin being below benefit besides between both but by called can cannot cause certain change chapter choose chosen class come comes condition conditions could creature creatures damage described different do does doing done during each effect effects either else end ends enough equal especially even ever every everything example expended extra feature features feet first five following foot for form four from further gain gained gains get given gives go greater had half has have having here hit how however if immediately in including increase instead into is it item items its just known last later least left less level like long longer made make many maximum may might more most much must name next no nor normal normally not nothing now number of off often on once one only option or other others otherwise our out own part per point points possible power previously provided range regain remaining require rest result right roll round rounds same second see several should shown since six some someone something sometimes source special specifically spell spells start still such take taken takes target targets than that the their them then there therefore these they thing things third this those three through time times to together total turn two under unless until up upon us use used uses using usually value various very want was way weapon weapons well were what whatever when whenever where whether which while who whom will with within without would yet you your yourself".split(
    " ",
  ),
);
const SYNONYMS = {
  lightning: ["electric", "electricity", "bolt"],
  cold: ["ice", "frost", "snow"],
  fire: ["flame", "burning"],
  necrotic: ["death", "skull"],
  radiant: ["holy", "light", "sun"],
  psychic: ["mind", "brain"],
  healing: ["heal", "health", "restoration"],
  teleport: ["portal", "teleportation"],
  invisible: ["invisibility", "stealth"],
  poison: ["venom", "toxic"],
  flying: ["flight", "wing"],
};

/** Lower-case ASCII with accents stripped, so "Épée" and "epee" compare equal. */
function fold(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** A light plural stem: "bodies" -> "body", "swords" -> "sword", but "glass" and "bonus" stay. */
function stem(word) {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.length > 4 && word.endsWith("s") && !(/(?:ss|us|is|ous)$/).test(word)) return word.slice(0, -1);
  return word;
}

/** Keywords from prose (names, descriptions, tags): drops short words, numbers and stop words. */
export function tokens(value) {
  const words = fold(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word) && !(/^\d+$/).test(word));
  return [...new Set(words.map(stem))];
}

/** Literal user vocabulary, including short prefixes and words excluded from prose analysis. */
export function queryTokens(value) {
  const words = fold(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return [...new Set(words.map(stem))];
}

export function expandTags(tags) {
  const result = new Set(tags);
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if ([key, ...values].some((word) => result.has(word))) [key, ...values].forEach((word) => result.add(word));
  }
  return [...result].sort();
}

/**
 * Every keyword an icon answers to: its derived tags and name, plus reviewed visual and manual
 * tags. `hints` carries the workshop's per-icon review; visual tags there only count while the
 * artwork hash still matches the one they were reviewed against.
 */
export function allTags(record, hints = {}) {
  const custom = hints[record.id];
  const supplied = [
    ...(record.inferred ?? []),
    ...(record.manual ?? []),
    ...(custom?.hash === record.hash ? (custom?.inferred ?? []) : []),
    ...(custom?.manual ?? []),
  ];
  const expanded = expandTags([...record.tags, ...supplied.flatMap((tag) => [tag, ...tokens(tag)])]);
  return [...new Set([...tokens(record.name), ...expanded])];
}

/** Precompute keywords once. Filters select indexed entries without rebuilding frequencies. */
export function createRanker(catalog, hints = {}) {
  const frequencies = [new Map(), new Map()];
  const icons = catalog.icons.map((icon) => {
    const derived = allTags(icon, hints);
    const direct = new Set(expandTags(queryTokens([icon.path, icon.name].join(" "))));
    const categories = new Set(expandTags(queryTokens(icon.path?.slice(0, icon.path.lastIndexOf("/")))));
    const keywords = [new Set(derived), new Set(expandTags(queryTokens([icon.path, icon.name, ...derived].join(" "))))];
    keywords.forEach((words, i) => words.forEach((tag) => frequencies[i].set(tag, (frequencies[i].get(tag) ?? 0) + 1)));
    return { icon, keywords, direct, categories };
  });
  return (record, limit = 6, query = "", accepts = (_icon) => true) => {
    const explicit = Boolean(query);
    const title = new Set(explicit ? queryTokens(query) : tokens(record.name));
    const tags = explicit ? expandTags([...title]) : allTags(record, hints);
    // the word still being typed, if the query does not end in a space or punctuation
    const ending = fold(query).match(/[a-z0-9]+$/)?.[0];
    const last = ending ? queryTokens(ending)[0] : null;
    const weights = frequencies[explicit ? 1 : 0];
    return icons
      .filter(({ icon }) => accepts(icon))
      .map(({ icon, keywords, direct, categories }) => {
        const words = keywords[explicit ? 1 : 0];
        const matched = tags.filter((tag) => words.has(tag));
        let score = matched.reduce(
          (sum, tag) => sum + (title.has(tag) ? 4 : 1) * Math.log(1 + icons.length / (weights.get(tag) ?? 1)),
          0,
        );
        // Break equal scores using names/categories without outweighing another matched query word.
        let directMatches = 0;
        let categoryMatches = 0;
        if (explicit) {
          for (const tag of title) {
            if (direct.has(tag)) directMatches++;
            if (categories.has(tag)) categoryMatches++;
          }
        }
        if (last && !words.has(last)) {
          let prefixScore = 0;
          let categoryPrefix = false;
          // Scan this icon's small keyword set, not every completion in the entire catalogue.
          for (const word of words) {
            if (!word.startsWith(last) || matched.includes(word)) continue;
            matched.push(word);
            prefixScore = Math.max(prefixScore, direct.has(word) ? 2 : 1);
            categoryPrefix ||= categories.has(word);
          }
          // Even a direct prefix stays below the smallest exact-word weight (4 * log(2)).
          score += prefixScore;
          if (prefixScore === 2) directMatches++;
          if (categoryPrefix) categoryMatches++;
        }
        return {
          directMatches,
          categoryMatches,
          result: {
            id: icon.id ?? icon.path,
            path: icon.path,
            name: icon.name,
            score: Math.round(score * 100) / 100,
            matched,
          },
        };
      })
      .filter(({ result }) => !query || result.score > 0)
      .sort(
        (a, b) =>
          b.result.score - a.result.score ||
          b.categoryMatches - a.categoryMatches ||
          b.directMatches - a.directMatches ||
          a.result.path.localeCompare(b.result.path),
      )
      .slice(0, limit)
      .map(({ result }) => result);
  };
}
