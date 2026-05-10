export interface ParsedQuery {
  query: string;
  filters: {
    in?: ("name" | "description" | "readme")[];
    language?: string[];
    stars_min?: number;
    stars_max?: number;
    forks_min?: number;
    forks_max?: number;
    pushed_after?: string;
    created_after?: string;
    license?: string[];
    topic?: string[];
    user?: string;
    org?: string;
  };
  sort?: "stars" | "forks" | "updated";
  order?: "desc" | "asc";
}

const FILTER_PATTERNS = {
  in: /in:(name|description|readme)/g,
  language: /language:([\w+#-]+)/g,
  stars: /stars:([<>]=?|=)?(\d+)/g,
  forks: /forks:([<>]=?|=)?(\d+)/g,
  pushed: /pushed:([<>]=?|=)?([\d-]+)/,
  created: /created:([<>]=?|=)?([\d-]+)/,
  license: /license:([\w-]+)/g,
  topic: /topic:([\w-]+)/g,
  user: /user:([\w-]+)/,
  org: /org:([\w-]+)/,
  sort: /sort:(stars|forks|updated)/,
  order: /order:(desc|asc)/,
};

export function parseSearchQuery(input: string): ParsedQuery {
  const filters: ParsedQuery["filters"] = {};
  let query = input;

  const inMatches = [...input.matchAll(FILTER_PATTERNS.in)];
  if (inMatches.length > 0) {
    filters.in = inMatches.map((m) => m[1] as "name" | "description" | "readme");
    query = query.replace(FILTER_PATTERNS.in, "");
  }

  const langMatches = [...input.matchAll(FILTER_PATTERNS.language)];
  if (langMatches.length > 0) {
    filters.language = langMatches.map((m) => m[1]);
    query = query.replace(FILTER_PATTERNS.language, "");
  }

  const starsMatch = input.match(/stars:([<>]=?|=)?(\d+)/);
  if (starsMatch) {
    const op = starsMatch[1];
    const val = Number(starsMatch[2]);
    if (op === ">" || op === ">=" || op === undefined) {
      filters.stars_min = val;
    }
    if (op === "<" || op === "<=") {
      filters.stars_max = val;
    }
    query = query.replace(/stars:([<>]=?|=)?\d+/, "");
  }

  const forksMatch = input.match(/forks:([<>]=?|=)?(\d+)/);
  if (forksMatch) {
    const op = forksMatch[1];
    const val = Number(forksMatch[2]);
    if (op === ">" || op === ">=" || op === undefined) {
      filters.forks_min = val;
    }
    if (op === "<" || op === "<=") {
      filters.forks_max = val;
    }
    query = query.replace(/forks:([<>]=?|=)?\d+/, "");
  }

  const pushedMatch = input.match(FILTER_PATTERNS.pushed);
  if (pushedMatch) {
    filters.pushed_after = pushedMatch[2];
    query = query.replace(FILTER_PATTERNS.pushed, "");
  }

  const createdMatch = input.match(FILTER_PATTERNS.created);
  if (createdMatch) {
    filters.created_after = createdMatch[2];
    query = query.replace(FILTER_PATTERNS.created, "");
  }

  const licenseMatches = [...input.matchAll(FILTER_PATTERNS.license)];
  if (licenseMatches.length > 0) {
    filters.license = licenseMatches.map((m) => m[1]);
    query = query.replace(FILTER_PATTERNS.license, "");
  }

  const topicMatches = [...input.matchAll(FILTER_PATTERNS.topic)];
  if (topicMatches.length > 0) {
    filters.topic = topicMatches.map((m) => m[1]);
    query = query.replace(FILTER_PATTERNS.topic, "");
  }

  const userMatch = input.match(FILTER_PATTERNS.user);
  if (userMatch) {
    filters.user = userMatch[1];
    query = query.replace(FILTER_PATTERNS.user, "");
  }

  const orgMatch = input.match(FILTER_PATTERNS.org);
  if (orgMatch) {
    filters.org = orgMatch[1];
    query = query.replace(FILTER_PATTERNS.org, "");
  }

  const sortMatch = input.match(FILTER_PATTERNS.sort);
  const orderMatch = input.match(FILTER_PATTERNS.order);
  query = query.replace(FILTER_PATTERNS.sort, "").replace(FILTER_PATTERNS.order, "");

  query = query.trim().replace(/\s+/g, " ");

  return {
    query,
    filters,
    sort: sortMatch ? (sortMatch[1] as "stars" | "forks" | "updated") : undefined,
    order: orderMatch ? (orderMatch[1] as "desc" | "asc") : undefined,
  };
}
