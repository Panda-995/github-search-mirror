const MIRROR_BASE = process.env.MIRROR_BASE_URL ?? "";

export function getRawFileUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `${MIRROR_BASE}/r/${owner}/${repo}/raw/${branch}/${path}`;
}

export function getCloneUrl(owner: string, repo: string): string {
  return `${MIRROR_BASE}/r/${owner}/${repo}.git`;
}

export function getReleaseDownloadUrl(
  owner: string,
  repo: string,
  tag: string,
  filename: string
): string {
  return `${MIRROR_BASE}/r/${owner}/${repo}/releases/download/${tag}/${filename}`;
}

export function getGitHubRawUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

export function getGitHubCloneUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}.git`;
}

export function getGitHubReleaseUrl(
  owner: string,
  repo: string,
  tag: string,
  filename: string
): string {
  return `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`;
}
