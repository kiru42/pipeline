---
paths:
  - "src/services/**"
---

# Couche service (logique métier)

Périmètre : `src/services`.

## Règles

- Porte toutes les règles métier : création et validation d'un prospect, passage d'étape, calcul des relances du jour, etc. Une règle métier trouvée ailleurs est déplacée ici.
- Pure : repository injecté en paramètre (`createXService(repository)`). N'importe ni `react`, ni `next/*`, ni `@/app`, ni `@/components`, ni un client de base.
- N'importe que des types depuis `@/data` (`import type`). Seule exception : le point de composition `src/services/container.ts`, qui instancie les vrais repositories pour la présentation.
- Ce qui varie est injecté (date du jour pour les relances, générateur d'id) : pas de `new Date()` / `Date.now()` direct dans la logique.
- Réexporte les types dont la présentation a besoin.
- **Tests écrits avant le code** :
  1. écrire le test dans `*.service.test.ts` avec un faux repository en mémoire ;
  2. lancer `pnpm test <fichier>` et le voir échouer pour la bonne raison ;
  3. écrire le code minimal qui le fait passer ;
  4. refactorer, tests au vert.
  Aucune règle métier sans un test qui l'exige.

## Comment vérifier

1. `pnpm test` passe.
2. Chaque fonction exportée d'un `*.service.ts` a au moins un cas dans le `*.service.test.ts` colocalisé, cas limites compris (liste vide, relance égale à aujourd'hui, étape finale…).
3. Le test a été vu en échec avant l'implémentation ; dans l'historique, le test est commité avec ou avant le code, jamais après.
4. Aucune dépendance interdite (résultat attendu : vide) :
   ```bash
   grep -rnE "from ['\"](react|next|@/app|@/components)" src/services
   grep -rnE "^import \{" src/services | grep "@/data" | grep -v "container"
   grep -rnE "new Date\(\)|Date\.now\(\)" src/services --include='*.service.ts'
   ```
