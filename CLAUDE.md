# effect-api — guide d'architecture pour les agents IA

API REST en **Effect v4** (`effect@4`, `@effect/platform-node`, `@effect/sql-pg`) avec **Drizzle** sur Postgres, organisée en **architecture hexagonale** (ports & adapters), un dossier par module métier. Node 24 exécute le TypeScript directement (aucun build). Les commentaires et messages du code sont en français, les identifiants en anglais.

Avant d'écrire du code, lis un module existant de bout en bout (`src/posts/` est la référence) et **copie ses patterns**. Ne réinvente pas une structure.

## Commandes

```bash
pnpm dev                              # serveur avec watch (lit .env)
pnpm test                             # vitest (tests de use cases en mémoire)
pnpm typecheck                        # effect-tsgo tsc --noEmit
pnpm lint                             # oxlint (règles strictes, voir plus bas)
pnpm format                           # oxfmt src   (format:check pour vérifier)
pnpm db:generate --name <nom>         # drizzle-kit : génère une migration SQL
pnpm db:migrate                       # applique les migrations
docker compose up -d --wait           # Postgres local (user/pass/db = app)
```

Avant de considérer une tâche finie : `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` doivent passer.
Configuration : `.env` (voir `.env.example`) → `PORT` (défaut 3000), `DATABASE_URL`, et Logto : `LOGTO_ENDPOINT`, `API_AUDIENCE`, `LOGTO_M2M_CLIENT_ID`, `LOGTO_M2M_CLIENT_SECRET`. `docker compose up -d --wait` lance aussi Logto (OIDC sur :3001, console d'admin sur :3002).

## Structure

```
src/
  main.ts                 # point d'entrée : Layer.launch(AppLayer)
  migrate.ts              # applique les migrations Drizzle
  app.layer.ts            # composition finale : routes, serveur HTTP, base, config
  _shared/                # transverse, sans logique métier
    config/app.config.ts        # AppConfig (port, databaseUrl: Redacted)
    database/                   # Database (service), DatabaseLive, schema.ts, sql.errors.ts
    http/api.ts                 # Api : HttpApi racine, assemble les groupes de chaque module
  <module>/               # posts, users, auth... (un module = un sous-domaine métier)
    domain/                     # entités, schémas, erreurs métier (aucune dépendance technique)
    application/
      ports/                    # interfaces (Context.Service) que l'infra doit implémenter
      use-cases/                # un fichier par cas d'usage : <verbe>-<nom>.use-case.ts
    infrastructure/             # adapters : tout ce qui touche au monde extérieur
      database/                 # implémentation Drizzle des ports (+ table Drizzle)
      http/                     # <module>.api.ts (contrat) et <module>.handlers.ts (branchement)
      security/                 # ex. vérificateur de JWT (jose)
      logto/                    # client de la Management API Logto
    <module>.layer.ts           # composition du module : handlers + adapters
    <module>.test.ts            # tests des use cases avec adapters en mémoire
```

Modules actuels : `posts` (CRUD, écriture réservée à l'auteur), `users` (profil et `customData` lus/modifiés chez Logto via sa Management API, aucune table locale), `auth` (identité `UserId`/`AuthUser`, vérification du JWT Bearer émis par Logto, middleware `Authentication`, `CurrentUser`). L'inscription, le login et les mots de passe sont gérés par Logto, pas par l'API.

## Règle de dépendance (hexagonale)

Les flèches vont toujours vers l'intérieur :

```
infrastructure  →  application  →  domain
```

- `domain/` n'importe **rien** d'Effect-technique ni de Drizzle, ni d'`infrastructure/`/`application/`. Seulement `effect` (Schema) et le domain d'autres modules si une entité en référence une autre (ex. `Post.authorId: UserId`).
- `application/` (use cases + ports) importe le domain et les ports. **Jamais** Drizzle, HTTP, `jose`, ni `infrastructure/`.
- `infrastructure/` implémente les ports et expose l'HTTP. C'est le seul endroit qui connaît Drizzle, HTTP, jose, Logto.
- Un module ne dépend d'un autre qu'à travers son **domain** ou ses **ports** (ex. `users` et `posts` utilisent `UserId` et `CurrentUser` de `auth` ; `auth` ne dépend d'aucun autre module). Pas d'import des tables ou adapters d'un autre module, sauf pour la composition (`*.layer.ts`, `_shared/database/schema.ts`).
- Pas de cycles d'import (`import/no-cycle` est activé dans le lint).

Changer d'ORM ou de BDD = ne réécrire que `infrastructure/database/` et le layer. Si tu dois toucher `domain/` ou `application/` pour ça, la frontière est mal placée.

## Conventions de code

- Imports internes via l'alias **`#src/...` avec l'extension `.ts`** : `import { Post } from "#src/posts/domain/post.entity.ts"`. Jamais de chemins relatifs entre dossiers.
- Imports de types : `import type { X }` / `type X` inline (règle lint `consistent-type-imports`). Dans les ports, `Effect` et `Option` ne servent que de types → `type Effect`.
- Noms de fichiers en **kebab-case** (lint `filename-case`) avec suffixes : `*.entity.ts`, `*.errors.ts`, `*.repository.ts` (port) / `drizzle-*.repository.ts` (adapter), `*.use-case.ts`, `*.api.ts`, `*.handlers.ts`, `*.layer.ts`, `*.table.ts`, `*.test.ts`.
- Pas de `any`, pas de `console.*` (utiliser `Effect.log*`), `===` uniquement.
- Services : `class X extends Context.Service<X, Shape>()("module/X") {}`. La clé est `"<module>/<Nom>"`.
- Fonctions Effect : `Effect.fn("nomDuSpan")(function* (...) { ... })` pour les use cases et méthodes d'adapter (donne un span de tracing). `Effect.gen` pour les blocs sans paramètres (layers, composition).
- Secrets (mots de passe, hash, `DATABASE_URL`) : toujours `Redacted`. Ne jamais les logger ni les renvoyer.
- Commentaires : seulement le *pourquoi* non évident, en français, une ligne.

## Domain

Fichier `domain/<nom>.entity.ts` : schémas `effect/Schema`, types dérivés avec le même nom que la valeur.

```ts
export const PostId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("PostId"));
export type PostId = typeof PostId.Type;

export const PostInput = Schema.Struct({ title: PostTitle, content: PostContent }); // entrée client
export const PostPatch = Schema.Struct({ title: Schema.optional(PostTitle), ... });  // mise à jour partielle

export class Post extends Schema.Class<Post>("Post")({ id: PostId, authorId: UserId, ... }) {}
```

- Les identifiants sont des **types brandés** (`PostId`, `UserId`) : on ne mélange pas deux UUID.
- La validation (longueurs, regex, trim) vit dans le schéma du domain. Le client ne fournit jamais `id`, `authorId`, `createdAt`.
- Dates : `Schema.DateTimeUtc` côté domain ; l'adapter convertit avec `DateTime.fromDateUnsafe(row.createdAt)`.

Erreurs métier dans `domain/<nom>.errors.ts` : le statut HTTP est porté par l'erreur, c'est ce qui fait mapper automatiquement le contrat HTTP.

```ts
export class PostNotFoundError extends Schema.TaggedError<PostNotFoundError>()(
  "PostNotFoundError", { id: PostId }, { httpApiStatus: 404 },
) {}
```

Convention : suffixe `Error`, tag identique au nom de classe. Statuts utilisés : 401 `UnauthorizedError`, 403 `PostForbiddenError`, 404 `PostNotFoundError`/`UserNotFoundError`.

## Application : ports et use cases

**Port** = un `Context.Service` dont la forme est une interface d'`Effect`. Il ne contient que des types du domain.

```ts
export class PostRepository extends Context.Service<PostRepository, {
  readonly create: (data: NewPost) => Effect.Effect<Post>;
  readonly findById: (id: PostId) => Effect.Effect<Option.Option<Post>>;
  readonly list: Effect.Effect<ReadonlyArray<Post>>;          // pas d'argument → un Effect, pas une fonction
  readonly update: (id: PostId, data: PostPatch) => Effect.Effect<Option.Option<Post>>;
  readonly delete: (id: PostId) => Effect.Effect<boolean>;
}>()("posts/PostRepository") {}
```

Règles des ports :
- Retourner `Option` quand l'absence est normale (`findById`), `boolean` pour `delete`. **Le port ne produit pas d'erreur « not found »** : c'est le use case qui décide.
- Le canal d'erreur du port ne contient que des **erreurs métier récupérables** (ex. une erreur de doublon sur un `create`). Les pannes techniques ne remontent pas (voir Infrastructure).
- Une entrée enrichie par le serveur a son propre type (`NewPost extends PostInput { authorId }`) : l'auteur ne vient jamais du corps de la requête.

**Use case** = une fonction par fichier `application/use-cases/<verbe>-<nom>.use-case.ts`, qui récupère ses ports par `yield*` :

```ts
export const getPost = Effect.fn("getPost")(function* (id: PostId) {
  const postRepository = yield* PostRepository;
  const post = yield* postRepository.findById(id);
  return yield* Effect.fromOption(post, () => new PostNotFoundError({ id }));
});
```

- C'est ici que vivent les **règles métier** : propriété (`getOwnedPost` → `PostForbiddenError`), unicité, « même erreur pour mauvais mot de passe et utilisateur inconnu », etc.
- L'acteur est un paramètre explicite : `updatePost(actorId, id, patch)`. Le use case ne connaît ni HTTP ni `CurrentUser`.
- Réutiliser les use cases entre eux (`updatePost` appelle `getOwnedPost`) plutôt que de dupliquer une règle.
- Le type de retour d'un use case expose ses dépendances (`R` = ports requis) et ses erreurs (`E`) : le compilateur sert de vérificateur.

## Infrastructure

### Base de données (adapter Drizzle)

- Table : `infrastructure/posts.table.ts` (ou `database/<x>.table.ts`), `drizzle-orm/pg-core` (**pas** un autre dialecte), colonnes `snake_case` en base. Exporter aussi `type PostRow = typeof postsTable.$inferSelect`.
- **Toute nouvelle table doit être réexportée dans `src/_shared/database/schema.ts`** : c'est le seul fichier que lit drizzle-kit.
- Dates en `timestamp(..., { withTimezone: true })`.
- Adapter : `drizzle-<nom>.repository.ts` exporte `Drizzle<Nom>RepositoryLive = Layer.effect(Port, Effect.gen(...))`. Il récupère `Database` une fois, définit chaque méthode avec `Effect.fn("<Port>.<methode>")`, et retourne `Port.of({ ... })`.
- Une fonction `toX(row): X` convertit ligne → entité du domain avec `new X({...})` et les `Brand.make` des identifiants. Jamais d'objet littéral à la place d'une `Schema.Class`.
- **Erreurs** : les pannes SQL inattendues deviennent des défauts avec `Effect.orDie` (→ 500). Une erreur SQL qui a un sens métier est interceptée et traduite en erreur du domain, par ex. violation d'unicité :

  ```ts
  Effect.catchTag("EffectDrizzleQueryError", (e) =>
    isUniqueViolation(e, POSTS_TITLE_UNIQUE) ? Effect.fail(new PostTitleTakenError({...})) : Effect.die(e))
  ```
  Les contraintes ont un nom explicite exporté en constante (`POSTS_TITLE_UNIQUE`) ; l'helper est `_shared/database/sql.errors.ts`.
- Mise à jour : toujours renseigner `updatedAt: new Date()`.

### HTTP (contrat + handlers)

`<module>.api.ts` déclare le **contrat** (`HttpApiGroup` / `HttpApiEndpoint`) à partir des schémas du domain :

```ts
export class PostsApi extends HttpApiGroup.make("posts")
  .add(
    HttpApiEndpoint.post("create", "/", { payload: PostInput, success: Post.pipe(HttpApiSchema.status(201)) })
      .annotate(OpenApi.Summary, "Create Post"),
    // ... endpoints protégés ...
  )
  .middleware(Authentication)        // ⚠ ne s'applique qu'aux endpoints ajoutés AVANT cette ligne
  .add(/* endpoints publics (list, getById) */)
  .prefix("/posts") {}
```

- Chaque endpoint a un `OpenApi.Summary` (titre lisible dans la doc Scalar : « Create Post », « Delete Post »…).
- `error: [...]` liste les erreurs du domain que l'endpoint peut renvoyer ; `success: HttpApiSchema.NoContent` pour un 204 .
- **Ordre = sécurité** : écrire d'abord les endpoints protégés, puis `.middleware(Authentication)`, puis les publics. Vérifier avec `curl` qu'un appel sans token Bearer renvoie bien 401.
- Le groupe est ajouté à la racine dans `_shared/http/api.ts` (`.add(AuthApi).add(PostsApi)`).

`<module>.handlers.ts` branche le contrat sur les use cases et **ne contient aucune logique métier** :

```ts
export const PostsHandlersLive = HttpApiBuilder.group(Api, "posts", (handlers) =>
  Effect.gen(function* () {
    const ports = yield* Effect.context<PostRepository>();   // on capture les ports UNE fois
    const run = Effect.provideContext(ports);
    return handlers.handleAll({
      getById: ({ params }) => run(getPost(params.id)),
      create: Effect.fn(function* ({ payload }) {
        const user = yield* CurrentUser;                      // fourni par le middleware, par requête
        return yield* run(createPost(user.id, payload));
      }),
    });
  }),
);
```

Pourquoi `Effect.context` + `provideContext` : les handlers HttpApi ne peuvent pas réclamer des services de port par requête ; on les capture à la construction du layer, puis on les fournit aux use cases.

### Authentification

- Schéma : **Bearer JWT** émis par Logto (self-host). L'API est un *resource server* : elle ne gère ni inscription, ni login, ni mots de passe. `Authentication` (`HttpApiMiddleware.Service` avec `security: { bearer: HttpApiSecurity.bearer }`) fournit `CurrentUser` (un `AuthUser`, juste `id`) aux handlers.
- `UserId` (domain d'`auth`) est le `sub` du token : une chaîne opaque, **pas un UUID**. Aucune table `users` locale ; `posts.author_id` est un `text` sans clé étrangère.
- `AuthenticationLive` (`authentication.handler.ts`) appelle le port `TokenVerifier` puis `Effect.provideService(httpEffect, CurrentUser, user)`. L'adapter `JoseTokenVerifierLive` vérifie signature (JWKS de Logto), `iss` (`$LOGTO_ENDPOINT/oidc`) et `aud` (`API_AUDIENCE`). Token invalide → 401 ; Logto injoignable → défaut (500).
- Profil : le port `UserDirectory` (module `users`) est implémenté par `LogtoUserDirectoryLive`, qui appelle la Management API avec un token M2M mis en cache. Les `customData` sont typées par `UserCustomData` dans `users/domain/user.entity.ts` : pour ajouter un champ, ne toucher que ce schéma. Les routes `/users/me` n'ont pas d'`:id` : chacun ne voit et ne modifie que son profil.
- Pour protéger une nouvelle route : ajouter l'endpoint avant `.middleware(Authentication)` et lire `yield* CurrentUser` dans le handler. Passer `user.id` au use case.

### Layers (composition)

- `<module>.layer.ts` : `export const XLive = XHandlersLive.pipe(Layer.provide(DrizzleXRepositoryLive))` (handlers + adapters du module). Si un autre module a besoin de ton port, expose-le séparément (ex. `UsersLive` fournit les handlers `/users` avec `LogtoUserDirectoryLive` et `FetchHttpClient.layer`).
- `auth.layer.ts` exporte seulement `AuthMiddlewareLive` (middleware partagé par **tous** les modules protégés) ; `auth` n'a pas de routes.
- `app.layer.ts` assemble : `HttpApiBuilder.layer(Api)` ← `Layer.provide([PostsLive, UsersLive, ...])` ← `Layer.provide([AuthMiddlewareLive, layerProblemDetails])`, puis serveur HTTP, `DatabaseLive`, `AppConfig.layer`.
- `Layer.provide` : `A.pipe(Layer.provide(B))` fournit B **à** A ; B se place donc « en dessous ». Ce que A requiert et que B ne fournit pas reste dans le type de sortie. Un `R` non vide dans `AppLayer` = un layer oublié ; le typecheck le signale.

## Ajouter une feature (checklist)

Exemple : un module `comments` rattaché aux posts.

1. **Domain** : `domain/comment.entity.ts` (`CommentId`, `CommentInput`, `Comment` avec `postId: PostId`, `authorId: UserId`), `domain/comment.errors.ts` (erreurs taguées + `httpApiStatus`).
2. **Port** : `application/ports/comment.repository.ts` (`Context.Service`, `Option` pour l'absence, pas d'erreur « not found »).
3. **Use cases** : un fichier par action dans `application/use-cases/`, avec `Effect.fn`, l'acteur en paramètre, les règles métier (propriété, existence du post parent via le port `PostRepository`).
4. **Test d'abord** (`<module>.test.ts`) : adapter en mémoire (`Layer.effect(Port, Effect.sync(() => { const store = new Map(); return Port.of({...}) }))`) et `it.effect` de `@effect/vitest`. Tester les chemins nominaux **et** chaque erreur métier (`Effect.flip` puis `expect(error._tag)`).
5. **Table + adapter** : `infrastructure/comments.table.ts`, réexport dans `_shared/database/schema.ts`, `drizzle-comment.repository.ts`, puis `pnpm db:generate --name add_comments` et `pnpm db:migrate`. Relire le SQL généré avant de l'appliquer (colonne `NOT NULL` sans défaut sur une table non vide = migration qui échoue).
6. **HTTP** : `comments.api.ts` (contrat, `OpenApi.Summary`, erreurs, middleware) + `comments.handlers.ts` ; ajouter le groupe dans `_shared/http/api.ts`.
7. **Layer** : `comments.layer.ts`, puis ajout dans `Layer.provide([...])` de `app.layer.ts`.
8. **Vérifier** : `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`, puis lancer `pnpm dev` et rejouer les cas en `curl` : succès, 400 (validation), 401 (sans token Bearer), 403 (mauvais utilisateur), 404, 409 si applicable.

## À ne pas faire

- Logique métier dans un handler HTTP ou dans un adapter Drizzle.
- Importer Drizzle, `node:*`, `jose` ou HTTP depuis `domain/` ou `application/`.
- Lire `authorId` (ou tout champ d'identité) dans le corps de la requête ; il vient de `CurrentUser`.
- Renvoyer une erreur SQL brute au client ; utiliser `Effect.orDie` ou la traduire en erreur du domain.
- Ajouter un endpoint public après `.middleware(Authentication)` en croyant qu'il est protégé (et inversement).
- Oublier le réexport dans `schema.ts` : drizzle-kit ne verra pas la table.
- Modifier une migration déjà appliquée : en générer une nouvelle.
- Créer une `Schema.Class` à partir d'un objet littéral ; utiliser `new Classe({...})`.

## Production

`Dockerfile` à la racine (Node 24, dépendances de prod, migrations puis démarrage, healthcheck sur `/api/docs/openapi.json`). Avant la mise en prod : passer `includeDetails` à `false` dans `layerProblemDetails` (`app.layer.ts`), protéger ou retirer `/api/docs`, et placer l'API derrière un reverse proxy HTTPS (le Bearer token circule en clair sinon), et passer `LOGTO_ENDPOINT` en HTTPS.
