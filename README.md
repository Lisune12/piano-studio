# Piano Studio

Application statique mobile-first en français, sans dépendance ni compilation. Clavier tactile/souris de 24 touches (Do4–Si5), synthèse sonore locale et première gamme guidée (Do4–Do5).

## Publier sur GitHub Pages

1. Ouvrir https://github.com/Lisune12/piano-studio/settings/pages
2. Dans **Build and deployment**, choisir **Deploy from a branch**.
3. Sélectionner **main**, dossier **/(root)**, puis **Save**.
4. Attendre la réussite du déploiement dans l’onglet Actions. L’adresse attendue est https://lisune12.github.io/piano-studio/ ; elle devient disponible après publication réussie.
5. Vérifier **Enforce HTTPS** si proposé.

Documentation officielle : https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Jouer

Toucher ou cliquer les notes. Au clavier d’ordinateur : Tab pour choisir une touche, Espace ou Entrée pour la jouer. Sur téléphone, les deux octaves complètes sont empilées, sans défilement horizontal. Le son peut être désactivé. Suivre les notes pointillées de la gamme ; une erreur ne fait pas avancer. Recommencer remet la progression à zéro. Les ateliers réussis et les meilleurs résultats sont conservés localement sur ce navigateur, sans synchronisation entre appareils.

## MIDI et Chrome Android

Ouvrir le site HTTPS dans Chrome compatible. Brancher un clavier USB MIDI avec un câble de données et un adaptateur USB/OTG adapté au téléphone. Appuyer sur **Connecter mon piano MIDI**, accepter l’autorisation et choisir l’entrée. Aucun accès au chargement : `navigator.requestMIDIAccess({sysex:false})` est appelé uniquement par le bouton. Aucun message MIDI n’est envoyé au matériel.

Si l’accès est refusé, vérifier les autorisations du site puis réessayer. Si aucun appareil n’apparaît, vérifier alimentation, câble et adaptateur puis rebrancher. Si l’API est absente, utiliser un navigateur compatible ou le mode démo. HTTPS est requis hors localhost. La compatibilité dépend du téléphone, du navigateur et du clavier : **aucun test MIDI sur matériel physique n’a été réalisé**.

Note-on et note-off sur les 16 canaux, y compris note-on de vélocité zéro, sont pris en charge. Débranchements et changements d’entrée libèrent les notes. Les notes MIDI 0–127 sont affichées ; seules 60–83 illuminent le clavier visible. Pédale/sustain et autres messages sont ignorés. Son synthétique simple sans gestion de vélocité ni échantillons. Le tactile reste disponible avec MIDI.

Références : https://www.w3.org/TR/webmidi/ et https://developer.chrome.com/blog/web-midi-permission-prompt

## Développement et tests

Servir ce dossier avec un serveur HTTP statique, par exemple `python -m http.server 8000`, puis ouvrir http://localhost:8000. Éviter file:// car l’application utilise des modules JavaScript.

Avec Node.js : `npm test` sans installation. Tests du décodage MIDI et de la progression dans tests/music.test.js. Pour une recette manuelle : fausse note, gamme entière, recommencer, touches au clavier, plusieurs doigts, perte de focus, son coupé, permission refusée, choix et débranchement d’une entrée. Les tests simulés ne remplacent pas un essai Android/MIDI réel.

Fichiers : index.html (structure accessible), style.css, app.js (interface/audio/entrées), music.js (logique musicale), tests/music.test.js. Aucun compte, pisteur ou service externe.

## Studio 02 · apprentissage

Quatre espaces : Notes (touches blanches et dièses), Gammes (Do, Sol, Fa majeurs et La mineur naturelle, montée ou aller-retour avec doigtés main droite), Rythme (noires, blanches, croches, départ de quatre temps et évaluation des attaques), Mélodies (premières phrases de Ah ! vous dirai-je, maman et Ode à la joie). Démonstration sonore, guide désactivable, tempo 40–140 BPM, métronome et repères de pratique.

Les mélodies vérifient la hauteur dans l’ordre, sans évaluer les durées. Le rythme vérifie les attaques de Do4 dans une fenêtre de ±25 % du temps, plafonnée à 180 ms ; il ne mesure pas la durée tenue. Une attaque manquée demande de recommencer. La latence MIDI/audio peut influencer les résultats. Le métronome et les démonstrations ont leur propre son, indépendant de la case Son du clavier.

Une réussite signifie finir l’atelier. Le score dépend du nombre d’erreurs ; les résultats sont sauvés dans localStorage (clé piano-studio-progress-v2). Si le stockage est bloqué, la séance reste utilisable et un message le signale. Effacer les données du site efface les résultats. Aucun accès MIDI automatique.

Cette version constitue un parcours débutant, pas un cours exhaustif : pas encore de portée interactive, de coordination à deux mains, d’accords guidés ni d’évaluation de durée de note. Connexion matérielle rapportée fonctionnelle par l’utilisatrice ; les nouvelles fonctions restent à essayer sur son piano.

## Studio 03 · fiches et portée

Fiches de quatre gammes avec couleur personnalisable enregistrée localement, armure, intervalles, écoute individuelle et doigtés main droite/gauche. Les couleurs peuvent être modifiées sans changer l’identification textuelle. Deux ateliers supplémentaires sur les octaves. Le parcours « J’ai 5 minutes » enchaîne notes, Do majeur et première mélodie, sans chronomètre imposé.

Les deux mélodies intégrées sont affichées en clé de sol sur quatre mesures à 4/4, avec note attendue encadrée et notes réussies vertes. Les noms peuvent être masqués. La reconnaissance MIDI avance sur les hauteurs dans l’ordre ; la durée tenue n’est pas évaluée. Une mesure peut être isolée et répétée ; seule la partition entière valide l’atelier. Pas encore d’import MusicXML/PDF ni de lecture polyphonique. Le rendu de portée est limité aux extraits en Do majeur intégrés.

## Studio 04 · navigation, rythme et enregistrement

Menu déroulant regroupé par apprentissage et pratique. Deux ateliers d’accords majeurs/mineurs : validation de trois notes tenues ensemble, sans note supplémentaire ; la pédale sustain n’est pas interprétée. En rythme, le mode Découverte laisse finir l’essai et donne un bilan, avec bouton de frappe et repères visuels. Sa tolérance est de ±40 % du temps, plafonnée à 300 ms. Le mode Défi conserve le comportement strict.

Le panneau Mon enregistrement capture les notes et durées MIDI/tactiles, pas le son réel. Limites : 3 minutes et 1 000 notes ; la dernière prise est enregistrée localement et une nouvelle prise la remplace à l’arrêt. Réécoute par synthèse locale, sans validation d’exercice, et export MIDI format 0. Le téléchargement doit être conservé pour archiver plusieurs prises. Pas d’accès microphone. Les changements de focus arrêtent la lecture et la capture pour éviter des notes bloquées.

L’import automatique de PDF reste à développer : il nécessite la reconnaissance optique musicale puis la vérification du résultat avant suivi.
