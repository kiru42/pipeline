---
paths:
  - "src/data/**"
---

# Couche données

Périmètre : `src/data`.

## Règles

- Seule couche qui parle à la base : client/driver, connexion, schéma, migrations et variables d'environnement de connexion vivent ici et nulle part ailleurs.
- Expose des interfaces de repository (`XRepository`) et des types de domaine. Les lignes brutes du driver ne sortent jamais : le repository les convertit.
- Aucune règle métier. Une requête peut filtrer selon des critères reçus en paramètre (date, étape) ; décider de ce qui est « dû » ou « autorisé » appartient au service.
- N'importe ni `@/services`, ni `@/app`, ni `@/components`.
- Basculer de la base locale vers Turso ne modifie que ce dossier : les signatures des interfaces de repository restent stables.
- Secrets de connexion dans `.env.local`, jamais dans un fichier versionné.
- Chaque repository a un test colocalisé qui tourne sur une base locale ou en mémoire.

## Comment vérifier

1. `pnpm test src/data` passe.
2. Aucun accès base hors de `src/data` (résultat attendu : vide ; compléter la liste quand la base sera choisie) :
   ```bash
   grep -rnE "from ['\"](better-sqlite3|@libsql/client|drizzle-orm|kysely|prisma|@prisma/client)" src --include='*.ts' --include='*.tsx' | grep -v '^src/data/'
   grep -rnE "process\.env\.(DATABASE|TURSO|DB)_" src | grep -v '^src/data/'
   ```
3. Aucune dépendance remontante (résultat attendu : vide) :
   ```bash
   grep -rnE "from ['\"]@/(services|app|components)" src/data
   ```
4. Remplacer l'implémentation d'un repository (par ex. mémoire ↔ base) ne demande aucune modification hors de `src/data`.
