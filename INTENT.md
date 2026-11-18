# Intention · Pipeline

## Produit
Un petit outil de suivi commercial, pensé pour un usage strictement personnel.
J'y enregistre mes prospects, je fais progresser chacun dans les étapes du pipeline, et l'app me dit chaque jour qui je dois recontacter.

## Architecture
Trois couches bien séparées : l'interface, la logique métier, l'accès aux données.
L'accès à la base est réservé à la couche données ; les autres couches n'y touchent jamais directement.
Stockage dans une base légère, choisie pour pouvoir basculer sans douleur vers une offre hébergée comme Turso.
La logique métier est couverte par des tests unitaires.

## Contraintes
- Next.js avec les composants shadcn.
- Hébergement sur Vercel.
- Un unique utilisateur.

## Hors périmètre
- Aucune authentification.
- Aucune gestion de rôles ou de permissions.
- Aucun support multi-comptes.

## Critères d'acceptation
- Un contact que je crée s'affiche immédiatement dans la liste.
- Mes contacts sont conservés quand je relance l'application.
- Migrer vers une base hébergée n'oblige à modifier que la couche données.
