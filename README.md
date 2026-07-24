# CRM Contacts App

Application fullstack de gestion de contacts avec une grille de données dynamique façon tableur : édition en ligne, tri, filtrage, et colonnes définies par l'utilisateur (ajout/renommage/suppression/réorganisation par glisser-déposer).

**Stack :** NestJS + TypeORM + PostgreSQL (backend) · React + Vite + TypeScript, CSS classique (frontend) · Docker Compose pour le développement local.

---

## 1. Comment lancer l'application

L'ensemble de la stack (Postgres + backend + frontend) tourne via Docker Compose, avec rechargement à chaud.

### 1.1 Créer le fichier d'environnement

`backend/.env` n'est **pas versionné** (il est dans le `.gitignore`) et est requis par les services `postgres` et `backend` dans `docker-compose.yml`. Il faut le créer soi-même :

```env
# backend/.env

# Utilisé par l'image Docker officielle de postgres pour initialiser la base
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=contacts

# Utilisé par le backend NestJS pour se connecter à cette même base.
# DATABASE_HOST doit être le nom du service Docker Compose (postgres), pas localhost,
# car le backend communique avec Postgres via le réseau interne de Compose.
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=contacts

PORT=3000
```

Les valeurs `POSTGRES_*` et `DATABASE_*` doivent correspondre entre elles - ce sont deux conventions de nommage différentes qui pointent vers les mêmes identifiants.

### 1.2 Démarrer l'ensemble

```bash
docker compose up --build
```

- Frontend : http://localhost:5173
- API backend : http://localhost:3000
- Postgres : exposé sur le port 5432 de la machine hôte (pour inspecter la base directement si besoin)

Les dossiers sources (`backend/src`, `frontend/src`) sont montés en volume, donc les deux services rechargent à chaud à chaque sauvegarde - aucun rebuild n'est nécessaire au quotidien.

Pour arrêter : `docker compose down` (ajouter `-v` pour supprimer également le volume Postgres et repartir d'une base vide la prochaine fois).

---

## 2. Comment initialiser la base de données et les données de démonstration

- **Schéma** : créé automatiquement. `DatabaseModule` utilise `synchronize: true` (option réservée au développement), donc TypeORM crée toutes les tables à partir des entités dès le premier démarrage du backend - aucune migration manuelle n'est nécessaire.
- **Données de démonstration** : générées via un script, à lancer une fois les conteneurs démarrés :

```bash
docker compose exec backend npm run seed
```

Ce script insère les 5 colonnes principales (Nom, Entreprise, Téléphone, Date, Score) ainsi que 500 contacts générés aléatoirement, avec des numéros de téléphone français uniques.

⚠️ **Cette opération est destructive** - le script vide les tables `contacts` et `column_definitions` avant de les réinitialiser, à chaque exécution. Ne pas le lancer sur des données que vous souhaitez conserver.

---

## 3. Comment lancer les tests

### Backend (Jest - tests unitaires, repositories mockés, aucune base de données réelle requise)

```bash
cd backend
npm install
npm test
```

Couvre `ContactsService` (CRUD, conflit de téléphone en doublon, recherche/tri/pagination), `ColumnsService` (création/renommage/garde-fou de suppression/réorganisation), ainsi que la validation de `CreateContactDto` (y compris les bornes 0–5 du score).

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm install
npm test            # exécution unique
npm run test:watch  # mode watch
```

Couvre `SearchBar` (comportement du debounce), `EditableCell` (édition en ligne, validation, gestion des erreurs), et `ContactForm` (rendu dynamique des champs à partir de la liste de colonnes actuelle, validation/formatage du téléphone français, routage des champs personnalisés).

**Remarque :** ces fichiers de tests ont été écrits directement à partir du code source mais n'ont pas pu être exécutés dans l'environnement où ils ont été rédigés (pas d'accès réseau pour installer les dépendances à cet endroit) - à lancer une fois en local avant de s'y fier pleinement.

Il n'y a pas de suite de tests end-to-end automatisée contre une instance Postgres réelle ; la configuration Jest `test:e2e` fournie par défaut par le scaffold NestJS est présente mais inutilisée.

---

## 4. Principaux choix techniques

- **Colonnes dynamiques plutôt qu'un schéma figé.** Une table `ColumnDefinition` (clé, libellé, type, ordre, `isCore`, `isMandatory`) pilote la grille, le formulaire d'ajout/édition, et l'édition en ligne. Les 5 champs d'origine (nom, entreprise, téléphone, date, score) restent de vraies colonnes Postgres typées sur `Contact` (pour les contraintes `unique`/`not null`) ; tout ce que l'utilisateur ajoute via l'interface est stocké dans un champ JSONB `customFields`, indexé par une clé générée du type `custom_<timestamp>`.
- **Gestion d'état et récupération de données "faites main"**, plutôt que TanStack Query/Table. Les deux ont été envisagées ; le projet a été jugé assez petit pour que la dépendance supplémentaire ne soit pas justifiée. `useContacts`/`useColumns` sont de simples hooks encapsulant `fetch`.
- **@dnd-kit** pour le glisser-déposer des colonnes - une bibliothèque d'infrastructure explicitement autorisée par le sujet (contrairement à une grille pré-construite complète, explicitement interdite).
- **CSS classique**, un fichier `.css` par composant, sans CSS Modules ni framework, conformément aux contraintes du sujet.
- **class-validator/class-transformer** pour les DTOs côté backend, avec un `ValidationPipe` global (`{ whitelist: true, forbidNonWhitelisted: true, transform: true }`).
- **`localStorage`** utilisé uniquement pour persister l'état de la *vue* (champ/direction de tri, texte de recherche, filtre de plage de score) après un rafraîchissement de page - pas pour les contacts ni les colonnes, qui proviennent toujours directement de Postgres.
- **Docker Compose**, 3 services, dossiers `src/` montés en volume pour le rechargement à chaud.

---

## 5. Fonctionnalités terminées

- CRUD complet sur les contacts (API REST + interface), avec pagination par défilement infini.
- Tri sur n'importe quelle colonne principale ; recherche par nom (avec debounce, et recherche immédiate sur Entrée) ; filtre par plage de score.
- Système de colonnes dynamiques de bout en bout : récupération de `/columns`, rendu générique des en-têtes et cellules selon `column.type`.
- Édition en ligne directement dans la grille (clic → édition → sauvegarde au blur/Entrée/Échap), répondant à l'exigence « modifier les valeurs directement depuis la grille ».
- Ajout / renommage / changement de type / suppression de colonnes depuis l'en-tête de la grille, avec le garde-fou empêchant la suppression des colonnes obligatoires, appliqué côté client **et** côté serveur.
- Réorganisation des colonnes par glisser-déposer (`@dnd-kit`), persistée via `PATCH /columns/reorder`.
- Le formulaire d'ajout/édition de contact est entièrement dynamique - piloté par la même liste de colonnes que la grille, donc toujours synchronisé lorsque des colonnes sont ajoutées ou supprimées.
- Validation du score (0–5) appliquée côté serveur via `class-validator`, pas seulement bornée côté client.
- Recherche simplifiée au nom uniquement (le bouton de bascule nom/entreprise a été retiré une fois qu'Entreprise est devenue une colonne supprimable).
- L'état de la vue (tri/recherche/filtre) survit à un rafraîchissement de page grâce à `localStorage`.
- Tests unitaires backend et tests de composants frontend.

## 6. Fonctionnalités incomplètes / non traitées

- Aucun test E2E/d'intégration contre une base de données réelle.
- Aucun test pour l'interface propre de `ColumnHeaderMenu` (interactions de renommage/changement de type/suppression), ni pour les hooks `useContacts`/`useColumns` directement (nécessiterait de mocker `fetch`).
- Aucune bibliothèque de virtualisation/windowing - la grille repose sur le défilement infini (IntersectionObserver) sans limite sur le nombre de nœuds DOM, donc les très gros jeux de résultats restent non bornés en mémoire une fois chargés.

---

## 7. Limites connues

- **Supprimer une colonne principale non obligatoire (ex. Score) masque les données sans les supprimer.** La colonne Postgres sous-jacente et ses valeurs restent intactes ; elles deviennent simplement inaccessibles depuis l'interface. Recréer une colonne avec le même libellé ne se reconnecte **pas** à ces données - c'est toujours une nouvelle colonne personnalisée (`isCore: false`, clé nouvellement générée), vide pour chaque contact.
- **Vider un champ principal optionnel (ex. Entreprise) lors d'une édition ne persiste pas.** `ContactForm` omet les champs principaux optionnels laissés vides du corps de la requête PATCH (afin que la valeur par défaut du serveur / la valeur existante soit conservée à la *création*), ce qui a pour effet secondaire qu'un effacement volontaire lors d'une *édition* est silencieusement ignoré. Comportement préexistant, non introduit par ce travail.
- **Les colonnes personnalisées (non principales) n'ont aucune validation serveur spécifique à leur type.** `customFields` n'est validé qu'en tant qu'« objet » - une colonne personnalisée de type `number` acceptera une chaîne non numérique, une colonne personnalisée de type `phone` n'est pas vérifiée avec la même regex française que le champ `phone` principal.
- **La borne 0–5 du score est codée en dur sur la clé littérale `score`**, à la fois dans le DTO et côté frontend (`EditableCell`/`ContactForm`), et non dérivée d'une contrainte générique par colonne. Elle ne s'appliquerait pas à une éventuelle deuxième colonne numérique bornée.
- **Le `sortField` persisté dans `localStorage` peut référencer une colonne qui n'est plus visible dans la grille** (ex. tri par Score, puis suppression de cette colonne). Le backend continue de l'honorer silencieusement ; l'interface n'affiche simplement plus d'indicateur de tri sur aucun en-tête tant qu'un nouveau tri n'est pas choisi.
- **Échec silencieux lors de la réorganisation des colonnes.** Si `PATCH /columns/reorder` échoue, `useColumns` annule l'ordre optimiste appliqué, mais rien n'est affiché à l'utilisateur - pas de notification/bandeau.
- **Aucune authentification.** Toute personne ayant accès au réseau du backend peut lire/écrire tous les contacts et toutes les colonnes. Acceptable pour cet exercice, non prêt pour la production.
- Le `label` d'une colonne n'a aucune contrainte d'unicité (seule `key` est unique) - deux colonnes peuvent toutes deux s'appeler « Score » sans aucun avertissement.

---

## 8. Améliorations prioritaires

1. Généraliser le concept de « colonne numérique bornée » (actuellement codé en dur pour `score`) en véritables contraintes par colonne stockées sur `ColumnDefinition`, validées côté serveur pour les champs principaux comme personnalisés.
2. Corriger le problème d'effacement des champs optionnels non pris en compte lors de l'édition.
3. Ajouter une notification/bandeau léger pour les échecs en arrière-plan (réorganisation, sauvegarde de cellule) plutôt que des erreurs silencieuses.
4. Ajouter des tests E2E contre une véritable instance Postgres (de test), en s'appuyant sur la configuration Jest `test:e2e` déjà présente dans le scaffold.
5. Avertir lors de la suppression d'une colonne contenant encore des données, et/ou proposer de reconnecter une colonne recréée à une colonne supprimée correspondante.
6. Envisager `react-window` ou une autre solution de virtualisation si les jeux de données sont amenés à dépasser largement quelques milliers de lignes.
7. Passe d'accessibilité clavier pour le glisser-déposer des colonnes (`@dnd-kit` prend en charge un `KeyboardSensor` ; seul le `PointerSensor` est actuellement câblé).

---

## 9. Outils d'IA utilisés

Claude (Anthropic), via l'interface de chat claude.ai, a été utilisé comme assistant de programmation tout au long du projet, de bout en bout :

- **Backend initial** : scaffolding NestJS, configuration TypeORM/PostgreSQL via `@nestjs/config`, définition de l'entité `Contact` et de ses contraintes (champs obligatoires, valeurs par défaut, unicité du téléphone), DTOs et validation avec `class-validator`, endpoints CRUD REST, pagination par offset, tri et filtrage via `QueryBuilder`, script de seed avec génération de données aléatoires et de numéros de téléphone français uniques.
- **Frontend initial** : scaffolding React + Vite + TypeScript, structure des composants (table, ligne, barre de recherche, menu d'en-tête de colonne, formulaire modal), hooks personnalisés (`useContacts`, `useColumns`, `useOnClickOutside`), défilement infini via `IntersectionObserver`, debounce de la recherche, validation et formatage du numéro de téléphone français côté client.
- **Infrastructure Docker** : Dockerfiles backend/frontend, `docker-compose.yml` pour les 3 services, gestion des variables d'environnement et des secrets.
- **Fonctionnalité de colonnes dynamiques** : conception de l'architecture (`ColumnDefinition` + `customFields` JSONB), endpoints CRUD et réorganisation des colonnes, rendu générique des en-têtes et cellules côté frontend, édition en ligne (`EditableCell`), intégration de `@dnd-kit` pour le glisser-déposer, réécriture du formulaire d'ajout/édition pour qu'il soit piloté par la liste de colonnes.
- **Corrections de bugs** : condition de course sur le positionnement du menu déroulant d'en-tête de colonne, mise en page avec défilement horizontal indésirable, fuite de dépendance dans un `useCallback` causant des requêtes obsolètes après un défilement, mise en page à hauteur fixe provoquant un défilement de page indésirable, nettoyage du CSS inutilisé issu du template Vite par défaut.
- **Tests automatisés** : suites de tests unitaires backend (Jest) et de composants frontend (Vitest/React Testing Library).
- **Documentation** : rédaction de ce README.

## 10. Temps approximatif passé

J'ai consacré environ 8 heures à ce test. La durée estimée était de 4 heures, mais j'ai eu besoin d'un peu plus de temps pour me familiariser avec certaines technologies que je n'avais pas encore utilisées.
