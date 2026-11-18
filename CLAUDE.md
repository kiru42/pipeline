# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Lis INTENT.md avant tout travail.

## Projet

Outil personnel de suivi commercial (prospects, étapes du pipeline, relances du jour). Mono-utilisateur, sans authentification. La spécification produit et les critères d'acceptation sont dans `INTENT.md`.

État actuel : squelette `create-next-app` + shadcn. Ni base de données, ni couche métier, ni runner de tests ne sont encore en place.

## Commandes

Node 24 (`.nvmrc`), pnpm 10.

```bash
pnpm dev      # serveur de dev (Turbopack)
pnpm build
pnpm lint     # ESLint 9 flat config (eslint-config-next core-web-vitals + typescript)
pnpm shadcn add <composant>   # ajoute un composant dans src/components/ui
```

Aucun script de test pour l'instant : en ajouter un (et documenter ici la commande pour lancer un test unique) lors de l'introduction de la couche métier.

## Architecture visée (INTENT.md)

Trois couches strictement séparées :
- **Interface** : `src/app` (App Router) + composants shadcn.
- **Logique métier** : pure, couverte par des tests unitaires.
- **Accès aux données** : seule couche autorisée à toucher la base. Base légère (non encore choisie) pour pouvoir migrer vers Turso en ne modifiant que cette couche.

Déploiement : Vercel.

## Points non évidents

- **Next.js 16.4** : `cacheComponents` et `partialPrefetching` sont activés dans `next.config.ts`, ce qui change le modèle de rendu/cache. Consulter `node_modules/next/dist/docs/` plutôt que ses connaissances.
- Types globaux générés par Next (`LayoutProps<"/">`, `PageProps<...>`) utilisés pour typer les routes.
- **Tailwind v4** sans `tailwind.config` : thème défini en CSS dans `src/app/globals.css` (`@theme inline`, variables CSS), chargé via le loader `@tailwindcss/turbopack`.
- **shadcn** style `base-nova`, icônes lucide, alias `@/components`, `@/components/ui`, `@/lib`, `@/hooks` (`@/*` → `src/*`).
- `cn` est réexporté depuis le paquet `cn` (`src/lib/utils.ts`), pas depuis `clsx`/`tailwind-merge`.
- `.env*` est ignoré par git : les secrets vont dans `.env.local`.
