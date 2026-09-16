/**
 * Top-level tab navigation, mirrored from the legacy prototype's `#tabNav`
 * (`../../chor-app-docs/chor-app_v3.html`) but mapped onto the target
 * capability split from `../../chor-app-docs/capability-breakdown.md`:
 * Klavierspieler/Dirigenten/Verwaltung merge into one People tab
 * ("Personen verwalten" per glossary.md) and "Daten & Backup" is dropped
 * (persistence is the server's job now, see capability-breakdown.md's
 * "Open points"). Each `path` is relative to the authenticated layout
 * route ("/"). None of these capabilities are implemented on the server
 * yet (see capability-breakdown.md's implementation order) — until a
 * capability lands, its tab renders `PlaceholderPage`.
 */
export type NavItem = {
  path: string
  label: string
  description: string
}

export const navItems: NavItem[] = [
  {
    path: "vortrag",
    label: "Vortrag",
    description:
      "Im Vortrag gesungene Lieder eintragen und die zuletzt eingetragenen Einträge einsehen.",
  },
  {
    path: "chorprobe",
    label: "Chorprobe",
    description:
      "Proben anlegen, das Einsingen und die je Probe gesungenen Lieder erfassen.",
  },
  {
    path: "verlauf",
    label: "Verlauf",
    description:
      "Verlauf, wann welches Lied gesungen wurde, inklusive PDF-Export.",
  },
  {
    path: "auswertung",
    label: "Auswertung",
    description:
      "Rangliste der meistgesungenen Lieder sowie Auswertung je Klavierspieler und Dirigent.",
  },
  {
    path: "verwaltung",
    label: "Verwaltung",
    description:
      "Personen mit den Rollen Klavierspieler und/oder Dirigent verwalten.",
  },
  {
    path: "abwesenheiten",
    label: "Abwesenheiten",
    description: "Abwesenheitskalender für Urlaub und Fehlzeiten führen.",
  },
  {
    path: "themensuche",
    label: "Themensuche",
    description: "Lieder nach Thema oder Titel über alle Bücher durchsuchen.",
  },
  {
    path: "lieder",
    label: "Lieder verwalten",
    description:
      "Neue Lieder erfassen und bestehenden Liedern weitere Themen zuordnen.",
  },
]
