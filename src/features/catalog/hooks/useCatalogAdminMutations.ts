import { useMutation, useQueryClient } from "@tanstack/react-query"
import { catalogAdminApi } from "../api/catalogAdminApi"
import { catalogQueryKeys } from "./useCatalogQueries"
import type {
  ApplyImportInput,
  CreateBookInput,
  CreateSeriesInput,
  CreateSongInput,
  CreateThemeInput,
  PatchBookInput,
  PatchSeriesInput,
  PatchSongInput,
  PatchThemeInput,
  SetSongThemesInput,
} from "../types/catalog.types"

export const useCatalogAdminMutations = () => {
  const queryClient = useQueryClient()

  const invalidateCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all })
  }

  const invalidateSeriesAndBooks = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["catalog", "series"] }),
      queryClient.invalidateQueries({ queryKey: ["catalog", "books"] }),
    ])
  }

  const invalidateBooks = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["catalog", "books"] }),
      queryClient.invalidateQueries({ queryKey: ["catalog", "book"] }),
    ])
  }

  const invalidateThemes = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["catalog", "themes"] }),
      queryClient.invalidateQueries({ queryKey: ["catalog", "book"] }),
    ])
  }

  // --- Series Mutations ---
  const createSeries = useMutation({
    mutationFn: (input: CreateSeriesInput) =>
      catalogAdminApi.createSeries(input),
    onSuccess: invalidateSeriesAndBooks,
  })

  const renameSeries = useMutation({
    mutationFn: ({
      seriesId,
      input,
    }: {
      seriesId: string
      input: PatchSeriesInput
    }) => catalogAdminApi.renameSeries(seriesId, input),
    onSuccess: invalidateSeriesAndBooks,
  })

  const archiveSeries = useMutation({
    mutationFn: (seriesId: string) => catalogAdminApi.archiveSeries(seriesId),
    onSuccess: invalidateSeriesAndBooks,
  })

  const restoreSeries = useMutation({
    mutationFn: (seriesId: string) => catalogAdminApi.restoreSeries(seriesId),
    onSuccess: invalidateSeriesAndBooks,
  })

  // --- Book Mutations ---
  const createBook = useMutation({
    mutationFn: (input: CreateBookInput) => catalogAdminApi.createBook(input),
    onSuccess: invalidateSeriesAndBooks,
  })

  const patchBook = useMutation({
    mutationFn: ({
      bookId,
      input,
    }: {
      bookId: string
      input: PatchBookInput
    }) => catalogAdminApi.patchBook(bookId, input),
    onSuccess: invalidateBooks,
  })

  const archiveBook = useMutation({
    mutationFn: ({
      bookId,
      confirmInUse,
    }: {
      bookId: string
      confirmInUse?: boolean
    }) => catalogAdminApi.archiveBook(bookId, confirmInUse),
    onSuccess: invalidateBooks,
  })

  const restoreBook = useMutation({
    mutationFn: (bookId: string) => catalogAdminApi.restoreBook(bookId),
    onSuccess: invalidateBooks,
  })

  // --- Song Mutations ---
  const createSong = useMutation({
    mutationFn: ({
      bookId,
      input,
    }: {
      bookId: string
      input: CreateSongInput
    }) => catalogAdminApi.createSong(bookId, input),
    onSuccess: invalidateBooks,
  })

  const patchSong = useMutation({
    mutationFn: ({
      songId,
      input,
    }: {
      songId: string
      input: PatchSongInput
    }) => catalogAdminApi.patchSong(songId, input),
    onSuccess: invalidateBooks,
  })

  const setSongThemes = useMutation({
    mutationFn: ({
      songId,
      input,
    }: {
      songId: string
      input: SetSongThemesInput
    }) => catalogAdminApi.setSongThemes(songId, input),
    onSuccess: invalidateBooks,
  })

  const archiveSong = useMutation({
    mutationFn: ({
      songId,
      confirmInUse,
    }: {
      songId: string
      confirmInUse?: boolean
    }) => catalogAdminApi.archiveSong(songId, confirmInUse),
    onSuccess: invalidateBooks,
  })

  const restoreSong = useMutation({
    mutationFn: (songId: string) => catalogAdminApi.restoreSong(songId),
    onSuccess: invalidateBooks,
  })

  // --- Theme Mutations ---
  const createTheme = useMutation({
    mutationFn: (input: CreateThemeInput) => catalogAdminApi.createTheme(input),
    onSuccess: invalidateThemes,
  })

  const renameTheme = useMutation({
    mutationFn: ({
      themeId,
      input,
    }: {
      themeId: string
      input: PatchThemeInput
    }) => catalogAdminApi.renameTheme(themeId, input),
    onSuccess: invalidateThemes,
  })

  const archiveTheme = useMutation({
    mutationFn: ({
      themeId,
      confirmInUse,
    }: {
      themeId: string
      confirmInUse?: boolean
    }) => catalogAdminApi.archiveTheme(themeId, confirmInUse),
    onSuccess: invalidateThemes,
  })

  const restoreTheme = useMutation({
    mutationFn: (themeId: string) => catalogAdminApi.restoreTheme(themeId),
    onSuccess: invalidateThemes,
  })

  // --- Import Mutations ---
  const previewImport = useMutation({
    mutationFn: (file: File) => catalogAdminApi.previewImport(file),
  })

  const applyImport = useMutation({
    mutationFn: (input: ApplyImportInput) => catalogAdminApi.applyImport(input),
    onSuccess: invalidateCatalog,
  })

  return {
    createSeries,
    renameSeries,
    archiveSeries,
    restoreSeries,
    createBook,
    patchBook,
    archiveBook,
    restoreBook,
    createSong,
    patchSong,
    setSongThemes,
    archiveSong,
    restoreSong,
    createTheme,
    renameTheme,
    archiveTheme,
    restoreTheme,
    previewImport,
    applyImport,
  }
}
