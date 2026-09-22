// Drop-in slot for generated illustrations: any file here matching a known key
// (see IllustrationKey) is picked up automatically — no code changes needed.
const files = import.meta.glob('./*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

export type IllustrationKey =
  | 'basics'
  | 'problem'
  | 'solution'
  | 'value'
  | 'security'
  | 'decision'
  | 'login';

const byKey = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const fileName = path.split('/').pop() ?? '';
  const key = fileName.replace(/\.[^.]+$/, '');
  byKey.set(key, url);
}

export function getIllustration(key: IllustrationKey): string | undefined {
  return byKey.get(key);
}
