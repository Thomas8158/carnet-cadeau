# Le carnet — mode d'emploi

Un site 100 % statique : `index.html` + `styles.css` + quelques fichiers `.js` + **`content.json`**.
Rien à installer, ni pour toi ni pour la personne qui ouvre le lien (GSAP et les polices se chargent depuis un CDN).

## 1. Mettre le carnet en ligne (5 minutes)

Choisis un hébergeur gratuit, puis envoie **tout le dossier** :

| Hébergeur | Comment |
|---|---|
| **Netlify Drop** | va sur app.netlify.com/drop, glisse le dossier → tu obtiens un lien. |
| **GitHub Pages** | crée un dépôt, dépose les fichiers, Settings → Pages → « Deploy from branch ». |
| **Cloudflare Pages / Vercel** | « New project » → import du dépôt ou upload du dossier. |

> Le site doit être servi en `http(s)://`. Si tu double-cliques sur `index.html`, le navigateur bloque la lecture de `content.json`.
> Pour tester sur ton ordinateur : dans le dossier, lance `python3 -m http.server 8000` puis ouvre `http://localhost:8000`.

## 2. Modifier le contenu à distance

Tout le contenu est dans **`content.json`**. Le site relit ce fichier à chaque ouverture (jamais mis en cache) :
dès que tu remplaces le fichier en ligne, la personne voit les nouveautés en rouvrant le lien.

- **GitHub Pages** : ouvre `content.json` sur github.com → crayon ✏️ → modifie → « Commit ». En ~1 minute, c'est en ligne.
- **Netlify** : re-dépose le dossier (ou connecte un dépôt Git).
- **Sans toucher au site** : héberge `content.json` ailleurs (fichier « raw » GitHub, etc.) et change `contentUrl` tout en haut de `app.js`. L'adresse doit autoriser les requêtes depuis ton site (CORS) — GitHub raw le fait.

**Effet « surprise »** : quand tu ajoutes un souvenir ou une lettre, la personne qui revient voit un badge *nouveau* sur l'élément, un point sur le menu et un petit mot en bas de l'écran.

## 3. Structure de `content.json`

```
site       → titre, sous-titre, intro, phrase d'indication, pied de page, date de mise à jour
sections   → titres et chapôs des pages « Lettres » et « Pellicule »
objects    → les 7 objets de la table : type + étiquette + souvenir associé
notes      → jusqu'à 3 petits papiers sur la table (avec ou sans lien vers un souvenir)
letters    → la page « Mots & Lettres »
memories   → les souvenirs (photo, vidéo, texte) — ouverts par les objets, les notes, les liens ou la pellicule
```

**Types d'objets** : `book`, `letter`, `mirror`, `jewel`, `plush`, `drawer`, `flowers`.
Le champ `memory` d'un objet contient l'`id` d'un souvenir de la liste `memories`.

### Mise en forme dans les textes
- `*mot*` → italique  ·  `==mot==` → surligné jaune
- `[[id-du-souvenir|texte cliquable]]` → petite référence qui ouvre ce souvenir
- ligne vide → nouveau paragraphe

### Photos et vidéos
Dans un souvenir :

```json
"photo": "media/notre-photo.jpg",
"video": "media/notre-video.mp4",
"poster": "media/image-de-couverture.jpg"
```

- **Fichiers dans le dossier** : crée un dossier `media/` à côté de `index.html` et mets-y tes fichiers (photos < 500 Ko, vidéos .mp4 H.264 de préférence).
- **Liens externes** : n'importe quelle adresse d'image directe. Les liens de partage **Google Drive** (fichier public) et **Dropbox** sont convertis automatiquement.
- **Vidéos** : fichier `.mp4`/`.webm` (lecteur personnalisé aux couleurs du carnet), ou lien **YouTube**, **Vimeo**, **Google Drive** (intégrés proprement).
- Photo **et** vidéo renseignées : deux petits onglets apparaissent. Sans photo, une image pastel prend la place — jamais d'icône cassée.

## 4. Personnaliser le design

- **Couleurs et polices** : variables en tête de `styles.css` (`--rose`, `--yellow`, `--paper`, `--serif`, `--hand`…).
- **Illustrations** : `art.js` (un SVG par objet). **Animations des objets** : `reactions.js`.
- **Ajouter un objet** : un SVG dans `art.js`, une réaction du même nom dans `reactions.js`, sa place dans `styles.css` (règles `.obj[data-type=…]`), puis son `type` dans `content.json`.

## 5. Bon à savoir

- Responsive : ordinateur (composition « à plat » en 12 colonnes), tablette (3 colonnes), mobile (2 colonnes + balayage pour passer d'un souvenir à l'autre).
- Accessible : navigation clavier, `Échap` pour fermer, flèches ← → entre souvenirs, respect de « réduire les animations ».
- Les textes de `content.json` sont échappés : aucun code ne peut s'y glisser.
