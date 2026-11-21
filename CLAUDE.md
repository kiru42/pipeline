# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Lis INTENT.md avant tout travail.

## Projet

Outil personnel de suivi commercial (prospects, étapes du pipeline, relances du jour). Mono-utilisateur, sans authentification. La spécification produit et les critères d'acceptation sont dans `INTENT.md`.

État actuel : squelette `create-next-app` + shadcn, structure 3 couches avec un module `example` vide, Vitest en place. Aucune base de données ni fonctionnalité métier.

## Commandes

Node 24 (`.nvmrc`), pnpm 10.

```bash
pnpm dev      # serveur de dev (Turbopack)
pnpm build
pnpm lint     # ESLint 9 flat config (eslint-config-next core-web-vitals + typescript)
pnpm shadcn add <composant>   # ajoute un composant dans src/components/ui
```

Tests (Vitest, fichiers `*.test.ts(x)` colocalisés sous `src/`) :

```bash
pnpm test                                        # exécution unique
pnpm test:watch                                  # mode watch
pnpm test src/services/example.service.test.ts   # un seul fichier
pnpm test -t "<nom du test>"                     # un seul test par nom
```

Environnement par défaut `node` ; un test de composant déclare `// @vitest-environment jsdom` en première ligne.

## Architecture visée (INTENT.md)

Trois couches strictement séparées, dépendances dans un seul sens : présentation → services → données.
- **Présentation** : `src/app` (App Router) + `src/components` (shadcn). N'importe jamais `src/data` (règle `no-restricted-imports` dans `eslint.config.mjs`) ; les types nécessaires sont réexportés par `src/services`.
- **Services (logique métier)** : `src/services`, pure, repository injecté en paramètre (`createXService(repository)`), couverte par des tests unitaires avec un faux repository.
- **Données** : `src/data`, seule couche autorisée à toucher la base. Base légère (non encore choisie) pour pouvoir migrer vers Turso en ne modifiant que cette couche.

Le module `example` dans chaque couche est un gabarit vide à dupliquer.

Déploiement : Vercel.

## Points non évidents

- **Next.js 16.4** : `cacheComponents` et `partialPrefetching` sont activés dans `next.config.ts`, ce qui change le modèle de rendu/cache. Consulter `node_modules/next/dist/docs/` plutôt que ses connaissances.
- Types globaux générés par Next (`LayoutProps<"/">`, `PageProps<...>`) utilisés pour typer les routes.
- **Tailwind v4** sans `tailwind.config` : thème défini en CSS dans `src/app/globals.css` (`@theme inline`, variables CSS), chargé via le loader `@tailwindcss/turbopack`.
- **shadcn** style `base-nova`, icônes lucide, alias `@/components`, `@/components/ui`, `@/lib`, `@/hooks` (`@/*` → `src/*`).
- `cn` est réexporté depuis le paquet `cn` (`src/lib/utils.ts`), pas depuis `clsx`/`tailwind-merge`.
- `.env*` est ignoré par git : les secrets vont dans `.env.local`.
