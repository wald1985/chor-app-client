import type { CommunitySongView } from "../types/repertoire.types"

export type ThemeOption = {
  /** Normalized theme name: library and Community themes of one name merge. */
  key: string
  name: string
  songCount: number
}

export type SongFilters = {
  search: string
  containerId: string
  themeKey: string
}

export const normalizeThemeName = (name: string): string =>
  name.trim().toLocaleLowerCase("de")

const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" })

/** Sorted by container title, then by song number ("2" < "10", "22" < "22a"). */
export const sortSongs = (songs: CommunitySongView[]): CommunitySongView[] =>
  [...songs].sort(
    (a, b) =>
      collator.compare(a.container.title, b.container.title) ||
      collator.compare(a.number, b.number),
  )

export const getThemeOptions = (songs: CommunitySongView[]): ThemeOption[] => {
  const options = new Map<string, ThemeOption>()
  for (const song of songs) {
    const keysOfSong = new Set<string>()
    for (const theme of song.themes) {
      const key = normalizeThemeName(theme.name)
      if (keysOfSong.has(key)) continue
      keysOfSong.add(key)
      const option = options.get(key)
      if (option) {
        option.songCount += 1
      } else {
        options.set(key, { key, name: theme.name.trim(), songCount: 1 })
      }
    }
  }
  return [...options.values()].sort((a, b) => collator.compare(a.name, b.name))
}

export const filterSongs = (
  songs: CommunitySongView[],
  filters: SongFilters,
): CommunitySongView[] => {
  const query = filters.search.trim().toLocaleLowerCase("de")

  return songs.filter(song => {
    if (song.archived) return false
    if (filters.containerId && song.container.id !== filters.containerId) {
      return false
    }
    if (
      filters.themeKey &&
      !song.themes.some(t => normalizeThemeName(t.name) === filters.themeKey)
    ) {
      return false
    }
    if (query) {
      const haystack = [song.title, song.number, song.author, song.arranger]
        .filter((v): v is string => Boolean(v))
        .map(v => v.toLocaleLowerCase("de"))
      if (!haystack.some(v => v.includes(query))) return false
    }
    return true
  })
}
