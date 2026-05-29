/* French Quest
   Une démo de jeu éducatif en JavaScript pur avec sauvegarde des données, progression sur la carte,
plusieurs modes de grammaire, mini-jeux, boutique, inventaire et retours d'information animés. */

(() => {
  "use strict";

  const STORAGE_KEY = "frenchQuestSaveV1";
  const TOTAL_NORMAL_LEVELS = 25;
  const TOTAL_NODES_PER_WORLD = 29;
  const app = document.querySelector("#app");
  const intro = document.querySelector("#intro");
  const introSkip = document.querySelector("#introSkip");
  const modalRoot = document.querySelector("#modalRoot");
  const toastRoot = document.querySelector("#toastRoot");
  const confettiRoot = document.querySelector("#confettiRoot");
  const particlesRoot = document.querySelector("#particles");

  const grammarModes = ["fillBlank", "multipleChoice", "sentenceBuilder", "matchPairs", "conjugation"];
  const miniGameTypes = ["speed", "memory", "puzzle", "survival"];

  const worlds = [
    {
      id: "galaxie",
      name: "Galaxie",
      icon: "G",
      emoji: "🌌",
      gradient: "linear-gradient(150deg, #101c57, #51147d 58%, #0fa5c8)",
      description: "Un voyage spatial néon à travers les articles, les verbes et l'ordre des phrases.",
      flavor: "Étoiles sombres, chemins lumineux et portes de la grammaire cosmique."
    },
    {
      id: "magique",
      name: "Magique",
      icon: "M",
      emoji: "🪄",
      gradient: "linear-gradient(150deg, #3b0b65, #8b3ccd 56%, #35d8e5)",
      description: "Un monde où les sorts circulent et où chaque réponse génère un peu de magie.",
      flavor: "Paillettes, potions, livres flottants et grammaire enchantée."
    },
    {
      id: "sports",
      name: "Sports",
      icon: "S",
      emoji: "⚽",
      gradient: "linear-gradient(150deg, #064f40, #0e80b0 54%, #b6dc3f)",
      description: "Une série d'exercices dans un stade, avec des décisions rapides, des tableaux d'affichage et des mises en situation.",
      flavor: "L'énergie de la foule, la pression du tableau d'affichage et des réflexes grammaticaux rapides."
    },
    {
      id: "sucre",
      name: "Sucre",
      icon: "C",
      emoji: "🍭",
      gradient: "linear-gradient(150deg, #ff78bf, #8f6dff 52%, #52e8ff)",
      description: "Un parcours gourmand aux teintes pastel, rempli de jeux de mots et d'énigmes.",
      flavor: "Des couleurs vives, des bonbons et des récompenses explosives et satisfaisantes."
    }
  ];

  /* Placeholder question data. Replace or extend these arrays when your French
     grammar documents are ready. Each world can have its own unique content. */
  const questionBank = {
    galaxie: createWorldQuestions("galaxie"),
    magique: createWorldQuestions("magique"),
    sports: createWorldQuestions("sports"),
    sucre: createWorldQuestions("sucre")
  };

  const storeItems = [
    { id: "skin-etoile", type: "skin", name: "Skin étoile", icon: "E", price: 18, description: "Un skin de personnage brillant, inspiré des voyages interstellaires.", skinClass: "skin-etoile" },
    { id: "skin-mage", type: "skin", name: "Skin mage", icon: "M", price: 22, description: "Un skin de lanceur de sorts bleu-violet pour l'avatar du menu.", skinClass: "skin-mage" },
    { id: "skin-champion", type: "skin", name: "Skin champion", icon: "S", price: 22, description: "Une peau vert-bleu sportive pour les courses à haute intensité.", skinClass: "skin-champion" },
    { id: "skin-bonbon", type: "skin", name: "Skin bonbon", icon: "C", price: 24, description: "Une peau aux couleurs acidulées, au teint éclatant.", skinClass: "skin-bonbon" },
    { id: "theme-neon", type: "theme", name: "Brillance néon", icon: "*", price: 16, description: "Ajoute un éclat cosmétique plus lumineux à l'interface utilisateur de vos quêtes." },
    { id: "booster-hints", type: "booster", name: "3 jetons d'indice", icon: "?", price: 8, description: "Utilisez les indices pendant les niveaux normaux pour révéler de l'aide.", amount: 3, key: "hints" },
    { id: "booster-time", type: "booster", name: "Temps bonus", icon: "+", price: 10, description: "Ajoute 10 secondes lors des défis chronométrés.", amount: 1, key: "extraTime" },
    { id: "booster-shield", type: "booster", name: "Bouclier de réponse", icon: "!", price: 12, description: "Empêche une mauvaise réponse de retirer un cœur.", amount: 1, key: "shields" }
  ];

  const state = {
    save: null,
    currentScreen: "menu",
    selectedWorld: "galaxie",
    activeNode: null,
    activeQuestionSet: [],
    activeQuestionIndex: 0,
    levelSession: null,
    timerId: null,
    miniSession: null
  };

  function createWorldQuestions(worldId) {
    const themeWord = {
      galaxie: "planète",
      magique: "baguette",
      sports: "ballon",
      sucre: "bonbon"
    }[worldId];

    return {
      fillBlank: [
        { prompt: "Je ___ français avec mes amis.", answer: "parle", hint: "Le verbe parler à la 1re personne du singulier." },
        { prompt: "Nous ___ une histoire intéressante.", answer: "lisons", hint: "Le verbe lire à la 1re personne du pluriel." },
        { prompt: "Elle ___ au collège chaque matin.", answer: "va", hint: "Le verbe aller à la 3e personne du singulier." },
        { prompt: "Tu ___ un stylo bleu.", answer: "as", hint: "Le verbe avoir à la 2e personne du singulier." },
        { prompt: `Le ${themeWord} ___ très amusant.`, answer: "est", hint: "Le verbe être au singulier." },
        { prompt: "Ils ___ leurs devoirs après le dîner.", answer: "font", hint: "Le verbe faire à la 3e personne du pluriel." }
      ],
      multipleChoice: [
        { prompt: "Choisissez le bon article : ___ maison", options: ["la", "le", "les", "un"], answer: "la", hint: "Maison est au féminin." },
        { prompt: "Choisissez la forme adjectivale correcte : une robe ___", options: ["rouge", "rouges", "roux", "rougees"], answer: "rouge", hint: "L’adjectif reste au masculin singulier ici." },
        { prompt: "Que signifie « nous sommes » ?", options: ["nous sommes", "ils sont", "je suis", "vous êtes"], answer: "nous sommes", hint: "Nous renvoie au groupe qui parle." },
        { prompt: "Choisissez la phrase négative correcte.", options: ["Je ne parle pas.", "Je pas parle ne.", "Ne je parle pas.", "Je parle ne pas."], answer: "Je ne parle pas.", hint: "La négation se construit avec ne + verbe + pas." },
        { prompt: "Choisissez le bon pluriel : le livre", options: ["les livres", "la livres", "le livres", "des livre"], answer: "les livres", hint: "Le nom prend l’article et la terminaison du pluriel." },
        { prompt: "Quel pronom correspond à « Marie et moi » ?", options: ["nous", "vous", "elles", "ils"], answer: "nous", hint: "Marie et moi = nous." }
      ],
      sentenceBuilder: [
        { prompt: "Construisez : J’aime le français.", words: ["J'", "aime", "le", "français"], answer: ["J'", "aime", "le", "français"], hint: "Commencez par J’." },
        { prompt: "Construisez : Nous jouons après l’école.", words: ["Nous", "jouons", "après", "l'école"], answer: ["Nous", "jouons", "après", "l'école"], hint: "Sujet, verbe puis indication du temps." },
        { prompt: "Construisez : Elle est très contente.", words: ["Elle", "est", "très", "contente"], answer: ["Elle", "est", "très", "contente"], hint: "Le verbe être suit le sujet elle." },
        { prompt: "Construisez : Ils ont trois livres.", words: ["Ils", "ont", "trois", "livres"], answer: ["Ils", "ont", "trois", "livres"], hint: "Avoir au pluriel : ont." },
        { prompt: "Construisez : Tu parles vite.", words: ["Tu", "parles", "vite"], answer: ["Tu", "parles", "vite"], hint: "Le verbe parles se termine par -es à la 2e personne du singulier." }
      ],
      matchPairs: [
        {
          prompt: "Associez les mots français à leurs traductions anglaises.",
          pairs: [
            ["bonjour", "hello"],
            ["chat", "cat"],
            ["rouge", "red"],
            ["livre", "book"],
            ["ecole", "school"]
          ],
          hint: "Commencez par les mots les plus faciles à reconnaître."
        },
        {
          prompt: "Associez les sujets au verbe être.",
          pairs: [
            ["je", "suis"],
            ["tu", "es"],
            ["il", "est"],
            ["nous", "sommes"],
            ["vous", "etes"]
          ],
          hint: "Le verbe être est irrégulier."
        },
        {
          prompt: "Associez les sujets au verbe avoir.",
          pairs: [
            ["j'", "ai"],
            ["tu", "as"],
            ["elle", "a"],
            ["nous", "avons"],
            ["ils", "ont"]
          ],
          hint: "Le verbe avoir est également irrégulier."
        }
      ],
      conjugation: [
        { prompt: "Conjuguez parler à la 1re personne du singulier.", answer: "parle", hint: "Je parle." },
        { prompt: "Conjuguez finir à la 1re personne du pluriel.", answer: "finissons", hint: "Nous finissons." },
        { prompt: "Conjuguez aller à la 3e personne du pluriel.", answer: "vont", hint: "Ils vont." },
        { prompt: "Conjuguez avoir à la 2e personne du pluriel.", answer: "avez", hint: "Vous avez." },
        { prompt: "Conjuguez être à la 3e personne du pluriel.", answer: "sont", hint: "Elles sont." },
        { prompt: "Conjuguez faire à la 1re personne du singulier.", answer: "fais", hint: "Je fais." }
      ]
    };
  }

  function defaultSave() {
    const worldProgress = {};
    worlds.forEach((world, index) => {
      worldProgress[world.id] = {
        unlocked: index === 0,
        highestUnlocked: 1,
        nodes: {}
      };
    });

    return {
      stars: 0,
      etoiles: 0,
      totalEarnedStars: 0,
      xp: 0,
      completedLevels: 0,
      completedMiniGames: 0,
      currentWorld: "galaxie",
      inventory: {
        skins: ["default"],
        activeSkin: "default",
        themes: ["default"],
        boosters: { hints: 2, extraTime: 1, shields: 1 }
      },
      settings: {
        sound: true,
        reducedMotion: false
      },
      worlds: worldProgress
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      return mergeSave(defaultSave(), JSON.parse(raw));
    } catch (error) {
      console.warn("Save data could not be loaded. A fresh save was created.", error);
      return defaultSave();
    }
  }

  function mergeSave(base, incoming) {
    const merged = { ...base, ...incoming };
    merged.inventory = { ...base.inventory, ...(incoming.inventory || {}) };
    merged.inventory.boosters = { ...base.inventory.boosters, ...((incoming.inventory || {}).boosters || {}) };
    merged.settings = { ...base.settings, ...(incoming.settings || {}) };
    merged.worlds = { ...base.worlds, ...(incoming.worlds || {}) };
    merged.stars = Number.isFinite(Number(merged.stars)) ? Number(merged.stars) : Number(merged.etoiles) || 0;
    merged.etoiles = merged.stars;
    worlds.forEach((world, index) => {
      merged.worlds[world.id] = {
        ...base.worlds[world.id],
        ...(merged.worlds[world.id] || {}),
        unlocked: index === 0 || Boolean((merged.worlds[world.id] || {}).unlocked),
        nodes: { ...((merged.worlds[world.id] || {}).nodes || {}) }
      };
    });
    return merged;
  }

  function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
    updateBodyFlags();
  }

  function resetSave() {
    localStorage.removeItem(STORAGE_KEY);
    state.save = defaultSave();
    saveGame();
    toast("Progression réinitialisée.");
    renderScreen("menu");
  }

  function updateBodyFlags() {
    document.body.dataset.world = state.selectedWorld || state.save.currentWorld || "galaxie";
    document.body.dataset.screen = state.currentScreen;
    document.body.classList.toggle("reduce-motion", state.save.settings.reducedMotion);
  }

  function init() {
    state.save = loadSave();
    state.selectedWorld = state.save.currentWorld || "galaxie";
    updateBodyFlags();
    createParticles();
    bindGlobalEvents();
    renderScreen("menu");
    setTimeout(() => hideIntro(), 2200);
  }

  function bindGlobalEvents() {
    introSkip.addEventListener("click", () => {
      sound.play("click");
      hideIntro();
    });

    document.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]");
      if (!actionTarget) return;
      handleAction(actionTarget.dataset.action, actionTarget);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalRoot.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  function hideIntro() {
    if (!intro.classList.contains("is-visible")) return;
    intro.classList.remove("is-visible");
    document.body.dataset.screen = state.currentScreen;
  }

  function handleAction(action, target) {
    sound.play("click");
    const { world, node, item, screen, skin } = target.dataset;

    switch (action) {
      case "screen":
        renderScreen(screen);
        break;
      case "world":
        selectWorld(world);
        break;
      case "node":
        startNode(world, Number(node));
        break;
      case "back-map":
        renderScreen("worlds");
        break;
      case "submit-answer":
        submitCurrentAnswer();
        break;
      case "hint":
        useHint();
        break;
      case "extra-time":
        useExtraTime();
        break;
      case "quit-level":
        quitLevel();
        break;
      case "buy":
        buyItem(item);
        break;
      case "equip-skin":
        equipSkin(skin);
        break;
      case "settings":
        openSettings();
        break;
      case "reset-save":
        resetSave();
        break;
      case "modal-close":
        closeModal();
        break;
      case "next-node":
        closeModal();
        openNextNode();
        break;
      case "retry-node":
        closeModal();
        if (state.activeNode) startNode(state.activeNode.worldId, state.activeNode.nodeIndex);
        break;
      case "return-map":
        closeModal();
        renderScreen("map");
        break;
      default:
        break;
    }
  }

  function renderScreen(screenName) {
    state.currentScreen = screenName;
    clearTimer();
    updateBodyFlags();

    const screens = {
      menu: renderMainMenu,
      worlds: renderWorldSelection,
      map: renderMap,
      game: renderGameShell,
      store: renderStore,
      inventory: renderInventory,
      profile: renderProfile
    };

    app.innerHTML = screens[screenName]();
    requestAnimationFrame(() => {
      const screen = app.querySelector(".screen");
      if (screen) screen.classList.add("is-active");
    });

    if (screenName === "map") {
      setTimeout(scrollMapToCurrentNode, 80);
    }
  }

  function renderTopBar(subtitle = "Une aventure grammaticale soignée") {
    const skinClass = getActiveSkinClass();
    return `
      <header class="top-bar">
        <div class="brand-cluster">
          <div class="avatar ${skinClass}" title="Skin actif">${getActiveSkinIcon()}</div>
          <div>
            <h1 class="brand-title">French Quest</h1>
            <p class="brand-subtitle">${subtitle}</p>
          </div>
        </div>
        <nav class="hud" aria-label="Navigation du jeu">
          <span class="pill" title="Étoiles">★ ${state.save.stars}</span>
          <span class="pill" title="XP">XP ${state.save.xp}</span>
          <button class="hud-button" type="button" data-action="screen" data-screen="store" title="Boutique">Boutique</button>
          <button class="hud-button" type="button" data-action="screen" data-screen="inventory" title="Inventaire">Inventaire</button>
          <button class="hud-button" type="button" data-action="screen" data-screen="profile" title="Profil">Profil</button>
          <button class="icon-button" type="button" data-action="settings" title="Paramètres">⚙</button>
        </nav>
      </header>
    `;
  }

  function renderMainMenu() {
    const progress = getOverallProgress();
    return `
      <section class="screen shell-pad">
        ${renderTopBar("Prêt pour la session de grammaire d'aujourd'hui")}
        <div class="hero-menu">
          <div class="hero-copy">
            <p class="eyebrow">Démo de présentation scolaire</p>
            <h2>Jouez. Apprenez. Débloquez.</h2>
            <p>Explorez quatre mondes thématiques, relevez des défis de grammaire, gagnez des étoiles, achetez des objets et améliorez vos compétences en français grâce à des mini-jeux animés et rapides.</p>
            <div class="menu-actions">
              <button class="primary-button large-button" type="button" data-action="screen" data-screen="worlds">Commencer la quête</button>
              <button class="secondary-button large-button" type="button" data-action="screen" data-screen="map">Continuer</button>
              <button class="secondary-button large-button" type="button" data-action="screen" data-screen="store">Ouvrir la boutique</button>
            </div>
          </div>
          <aside class="progress-panel">
            <div class="panel-title-row">
              <h3>Progression de la quête</h3>
              <span class="pill">${progress.percent}%</span>
            </div>
            <div class="progress-track" aria-label="Progression globale">
              <div class="progress-fill" style="--value:${progress.percent}%"></div>
            </div>
            <div class="stat-grid">
              <div class="stat-tile"><strong>${state.save.completedLevels}</strong><span>Niveaux</span></div>
              <div class="stat-tile"><strong>${state.save.completedMiniGames}</strong><span>Mini-jeux</span></div>
              <div class="stat-tile"><strong>${state.save.totalEarnedStars}</strong><span>Étoiles totales</span></div>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderWorldSelection() {
    return `
      <section class="screen">
        ${renderTopBar("Choisissez un monde")}
        <div class="screen-heading">
          <div>
            <h2>Mondes</h2>
            <p>Chaque monde contient 25 niveaux normaux et 4 mini-jeux. Terminez un monde pour débloquer le suivant.</p>
          </div>
          <button class="secondary-button" type="button" data-action="screen" data-screen="menu">Menu principal</button>
        </div>
        <div class="world-grid">
          ${worlds.map(renderWorldCard).join("")}
        </div>
      </section>
    `;
  }

  function renderWorldCard(world) {
    const progress = getWorldProgress(world.id);
    const worldSave = state.save.worlds[world.id];
    const locked = !worldSave.unlocked;
    return `
      <button class="world-card ${locked ? "is-locked" : ""}" type="button" data-action="world" data-world="${world.id}" style="--world-gradient:${world.gradient}" ${locked ? "aria-disabled='true'" : ""}>
        <div class="world-icon" aria-hidden="true">${world.emoji}</div>
        <h3>${world.name}</h3>
        <p>${world.description}</p>
        <div class="world-meta">
          <div class="panel-title-row">
            <span>${locked ? "Verrouillé" : `${progress.completed}/${TOTAL_NODES_PER_WORLD} réussis`}</span>
            <strong>${progress.stars} ★</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="--value:${progress.percent}%"></div>
          </div>
        </div>
      </button>
    `;
  }

  function selectWorld(worldId) {
    const worldSave = state.save.worlds[worldId];
    if (!worldSave.unlocked) {
      toast("Terminez le monde précédent pour débloquer celui-ci..");
      pulseWrong();
      return;
    }
    state.selectedWorld = worldId;
    state.save.currentWorld = worldId;
    saveGame();
    renderScreen("map");
  }

  function renderMap() {
    const world = getWorld(state.selectedWorld);
    const progress = getWorldProgress(world.id);
    return `
      <section class="screen">
        ${renderTopBar(`${world.name} — carte`)}
        <div class="map-layout">
          <aside class="map-sidebar glass-panel">
            <p class="eyebrow">${world.flavor}</p>
            <h2 class="world-title">${world.emoji} ${world.name}</h2>
            <p>Suivez le chemin, débloquez chaque nœud et rejouez les niveaux terminés pour améliorer votre score.</p>
            <div class="stat-grid">
              <div class="stat-tile"><strong>${progress.completed}</strong><span>Validés</span></div>
              <div class="stat-tile"><strong>${progress.stars}</strong><span>Étoiles</span></div>
              <div class="stat-tile"><strong>${state.save.worlds[world.id].highestUnlocked}</strong><span>Débloqués</span></div>
            </div>
            <div class="game-actions">
              <button class="secondary-button" type="button" data-action="back-map">Mondes</button>
              <button class="primary-button" type="button" data-action="node" data-world="${world.id}" data-node="${state.save.worlds[world.id].highestUnlocked}">Jouer le niveau</button>
            </div>
          </aside>
          <div class="map-camera glass-panel">
            <div class="map-scroll" id="mapScroll">
              <div class="map-stage">
                ${renderMapPath()}
                ${getMapNodes().map(node => renderLevelNode(world.id, node)).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderMapPath() {
    const nodes = getMapNodes();
    const d = nodes.map((node, index) => `${index === 0 ? "M" : "L"} ${node.x} ${node.y}`).join(" ");
    return `
      <svg class="map-path" viewBox="0 0 920 2580" preserveAspectRatio="none" aria-hidden="true">
        <path d="${d}"></path>
        <path class="path-glow" d="${d}"></path>
      </svg>
    `;
  }

  function renderLevelNode(worldId, node) {
    const worldSave = state.save.worlds[worldId];
    const savedNode = worldSave.nodes[node.index] || {};
    const locked = node.index > worldSave.highestUnlocked;
    const complete = Boolean(savedNode.complete);
    const current = node.index === worldSave.highestUnlocked;
    const stars = savedNode.stars || 0;
    const label = node.type === "mini" ? miniLabel(node.miniType) : node.levelNumber;

    return `
      <button
        class="level-node ${node.type === "mini" ? "is-mini" : ""} ${locked ? "is-locked" : ""} ${complete ? "is-complete" : ""} ${current ? "is-current" : ""}"
        type="button"
        data-action="node"
        data-world="${worldId}"
        data-node="${node.index}"
        style="--x:${node.x / 9.2}%; --y:${node.y}px"
        title="${locked ? "Verrouillé" : nodeTitle(node)}">
        ${current && !complete ? `<span class="current-marker">Actuel</span>` : ""}
        <span>${locked ? "🔒" : label}</span>
        <span class="node-stars" aria-hidden="true">
          ${[1, 2, 3].map(value => `<i class="level-star ${stars >= value ? "is-earned" : ""}"></i>`).join("")}
        </span>
      </button>
    `;
  }

  function getMapNodes() {
    const nodes = [];
    let normalLevel = 1;
    const miniSlots = { 6: "speed", 13: "memory", 20: "puzzle", 27: "survival" };

    for (let index = 1; index <= TOTAL_NODES_PER_WORLD; index += 1) {
      const row = index - 1;
      const wave = Math.sin(row * 0.72);
      const x = 460 + wave * 270;
      const y = 120 + row * 84;
      if (miniSlots[index]) {
        nodes.push({ index, type: "mini", miniType: miniSlots[index], x, y });
      } else {
        nodes.push({ index, type: "normal", levelNumber: normalLevel, x, y });
        normalLevel += 1;
      }
    }

    return nodes;
  }

  function scrollMapToCurrentNode() {
    const scroll = document.querySelector("#mapScroll");
    const current = document.querySelector(".level-node.is-current") || document.querySelector(".level-node:not(.is-locked)");
    if (!scroll || !current) return;
    const target = Math.max(0, current.offsetTop - scroll.clientHeight * 0.45);
    scroll.scrollTo({ top: target, behavior: "smooth" });
  }

  function startNode(worldId, nodeIndex) {
    const worldSave = state.save.worlds[worldId];
    if (!worldSave.unlocked || nodeIndex > worldSave.highestUnlocked) {
      toast("Ce niveau est encore verrouillé.");
      pulseWrong();
      return;
    }

    const node = getMapNodes().find(item => item.index === nodeIndex);
    state.selectedWorld = worldId;
    state.save.currentWorld = worldId;
    state.activeNode = { worldId, nodeIndex, node };
    saveGame();

    if (node.type === "mini") {
      startMiniGame(node.miniType);
      return;
    }

    startNormalLevel(node);
  }

  function startNormalLevel(node) {
    const mode = grammarModes[(node.levelNumber - 1) % grammarModes.length];
    const questions = shuffle(questionBank[state.selectedWorld][mode]).slice(0, mode === "matchPairs" ? 3 : 5);
    state.activeQuestionSet = questions;
    state.activeQuestionIndex = 0;
    state.levelSession = {
      type: "normal",
      mode,
      correct: 0,
      hearts: 3,
      total: questions.length,
      timeLeft: mode === "conjugation" ? 60 : 0,
      hintUsedOnQuestion: false,
      shieldReady: state.save.inventory.boosters.shields > 0
    };

    renderScreen("game");
    if (state.levelSession.timeLeft > 0) startTimer();
    renderQuestion();
  }

  function renderGameShell() {
    const node = state.activeNode?.node;
    const title = node?.type === "mini" ? miniGameName(node.miniType) : `Niveau ${node?.levelNumber || ""}`;
    return `
      <section class="screen">
        ${renderTopBar(`${getWorld(state.selectedWorld).name} — défi`)}
        <div class="game-shell">
          <div class="game-card glass-panel" id="gameCard">
            <p class="eyebrow" id="modeLabel">${node?.type === "mini" ? "Mini-jeu" : modeName(state.levelSession?.mode)}</p>
            <h2>${title}</h2>
            <div id="questionArea"></div>
          </div>
          <aside class="side-panel glass-panel">
            <div class="game-meter" id="gameMeter">${renderGameMeter()}</div>
            <div class="game-actions">
              <button class="secondary-button" type="button" data-action="hint">Indice (${state.save.inventory.boosters.hints})</button>
              <button class="secondary-button" type="button" data-action="extra-time">+10 s (${state.save.inventory.boosters.extraTime})</button>
              <button class="secondary-button" type="button" data-action="quit-level">Carte</button>
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  function renderGameMeter() {
    const session = state.levelSession || state.miniSession || {};
    const timer = session.timeLeft ? `<div class="meter-row"><span>Chrono</span><strong>${session.timeLeft}s</strong></div>` : "";
    const score = `<div class="meter-row"><span>Score</span><strong>${session.correct || 0}</strong></div>`;
    const total = session.total ? `<div class="meter-row"><span>Objectif</span><strong>${session.total}</strong></div>` : "";
    const hearts = `<div class="meter-row"><span>Vies</span><strong class="hearts">${"♥".repeat(session.hearts || 0)}</strong></div>`;
    return `${score}${total}${timer}${hearts}`;
  }

  function updateGameMeter() {
    const meter = document.querySelector("#gameMeter");
    if (meter) meter.innerHTML = renderGameMeter();
  }

  function renderQuestion() {
    const questionArea = document.querySelector("#questionArea");
    if (!questionArea) return;
    const session = state.levelSession;
    const question = state.activeQuestionSet[state.activeQuestionIndex];
    session.hintUsedOnQuestion = false;

    const renderers = {
      fillBlank: renderFillBlankQuestion,
      multipleChoice: renderMultipleChoiceQuestion,
      sentenceBuilder: renderSentenceBuilderQuestion,
      matchPairs: renderMatchPairsQuestion,
      conjugation: renderConjugationQuestion
    };

    questionArea.innerHTML = renderers[session.mode](question);
    attachQuestionEvents(session.mode, question);
    updateGameMeter();
  }

  function renderFillBlankQuestion(question) {
    return `
      <div class="game-prompt">${question.prompt}</div>
      <input id="answerInput" class="answer-input" type="text" autocomplete="off" placeholder="Tapez le mot manquant">
      <div class="game-actions">
        <button class="primary-button" type="button" data-action="submit-answer">Valider</button>
      </div>
    `;
  }

  function renderConjugationQuestion(question) {
    return `
      <div class="game-prompt">${question.prompt}</div>
      <input id="answerInput" class="answer-input" type="text" autocomplete="off" placeholder="Tapez le verbe conjugué">
      <div class="game-actions">
        <button class="primary-button" type="button" data-action="submit-answer">Valider</button>
      </div>
    `;
  }

  function renderMultipleChoiceQuestion(question) {
    return `
      <div class="game-prompt">${question.prompt}</div>
      <div class="choice-grid">
        ${shuffle(question.options).map(option => `<button class="choice-button" type="button" data-choice="${escapeAttr(option)}">${option}</button>`).join("")}
      </div>
    `;
  }

  function renderSentenceBuilderQuestion(question) {
    const shuffledWords = shuffle(question.words);
    return `
      <div class="game-prompt">${question.prompt}</div>
      <div class="sentence-drop" id="sentenceDrop" aria-label="zone de dépôt des réponses aux phrases"></div>
      <div class="token-bank" id="tokenBank">
        ${shuffledWords.map((word, index) => `<button class="word-token" draggable="true" type="button" data-word="${escapeAttr(word)}" data-token="${index}">${word}</button>`).join("")}
      </div>
      <div class="game-actions">
        <button class="secondary-button" type="button" id="clearSentence">Effacer</button>
        <button class="primary-button" type="button" data-action="submit-answer">Valider</button>
      </div>
    `;
  }

  function renderMatchPairsQuestion(question) {
    const left = shuffle(question.pairs.map(pair => pair[0]));
    const right = shuffle(question.pairs.map(pair => pair[1]));
    return `
      <div class="game-prompt">${question.prompt}</div>
      <div class="match-grid" id="matchGrid">
        <div class="match-column">
          ${left.map(word => `<button class="match-card" type="button" data-side="left" data-value="${escapeAttr(word)}">${word}</button>`).join("")}
        </div>
        <div class="match-column">
          ${right.map(word => `<button class="match-card" type="button" data-side="right" data-value="${escapeAttr(word)}">${word}</button>`).join("")}
        </div>
      </div>
      <div class="game-actions">
        <button class="primary-button" type="button" data-action="submit-answer">Valider les paires</button>
      </div>
    `;
  }

  function attachQuestionEvents(mode, question) {
    const input = document.querySelector("#answerInput");
    if (input) {
      input.focus();
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submitCurrentAnswer();
      });
    }

    if (mode === "multipleChoice") {
      document.querySelectorAll(".choice-button").forEach(button => {
        button.addEventListener("click", () => evaluateAnswer(button.dataset.choice, button));
      });
    }

    if (mode === "sentenceBuilder") {
      const drop = document.querySelector("#sentenceDrop");
      const bank = document.querySelector("#tokenBank");
      let dragged = null;

      document.querySelectorAll(".word-token").forEach(token => {
        token.addEventListener("dragstart", () => {
          dragged = token;
        });
        token.addEventListener("click", () => moveToken(token, drop));
      });

      drop.addEventListener("dragover", (event) => event.preventDefault());
      drop.addEventListener("drop", (event) => {
        event.preventDefault();
        if (dragged) moveToken(dragged, drop);
      });

      document.querySelector("#clearSentence").addEventListener("click", () => {
        [...drop.querySelectorAll(".word-token")].forEach(token => {
          token.classList.remove("in-drop");
          bank.appendChild(token);
        });
      });
    }

    if (mode === "matchPairs") {
      const selected = { left: null, right: null, matches: [] };
      document.querySelectorAll(".match-card").forEach(card => {
        card.addEventListener("click", () => {
          if (card.classList.contains("is-matched")) return;
          const side = card.dataset.side;
          document.querySelectorAll(`.match-card[data-side="${side}"]`).forEach(item => item.classList.remove("is-selected"));
          selected[side] = card;
          card.classList.add("is-selected");

          if (selected.left && selected.right) {
            const isMatch = question.pairs.some(pair => pair[0] === selected.left.dataset.value && pair[1] === selected.right.dataset.value);
            if (isMatch) {
              selected.left.classList.add("is-matched");
              selected.right.classList.add("is-matched");
              selected.matches.push([selected.left.dataset.value, selected.right.dataset.value]);
              sound.play("unlock");
            } else {
              pulseWrong();
              sound.play("wrong");
            }
            selected.left.classList.remove("is-selected");
            selected.right.classList.remove("is-selected");
            selected.left = null;
            selected.right = null;
          }
        });
      });
    }
  }

  function moveToken(token, drop) {
    token.classList.add("in-drop");
    drop.appendChild(token);
  }

  function submitCurrentAnswer() {
    if (!state.levelSession) return;
    const mode = state.levelSession.mode;
    const question = state.activeQuestionSet[state.activeQuestionIndex];

    if (mode === "fillBlank" || mode === "conjugation") {
      const input = document.querySelector("#answerInput");
      evaluateAnswer(input ? input.value : "");
    }

    if (mode === "sentenceBuilder") {
      const answer = [...document.querySelectorAll("#sentenceDrop .word-token")].map(token => token.dataset.word);
      evaluateAnswer(answer);
    }

    if (mode === "matchPairs") {
      const matched = document.querySelectorAll(".match-card.is-matched").length / 2;
      evaluateAnswer(matched === question.pairs.length ? "complete" : "incomplete");
    }
  }

  function evaluateAnswer(answer, selectedButton = null) {
    const session = state.levelSession;
    const question = state.activeQuestionSet[state.activeQuestionIndex];
    let isCorrect = false;

    if (session.mode === "sentenceBuilder") {
      isCorrect = arraysEqual(answer, question.answer);
    } else if (session.mode === "matchPairs") {
      isCorrect = answer === "complete";
    } else {
      isCorrect = normalize(answer) === normalize(question.answer);
    }

    if (selectedButton && session.mode === "multipleChoice") {
      selectedButton.classList.add(isCorrect ? "is-correct" : "is-wrong");
    }

    if (isCorrect) {
      session.correct += 1;
      sound.play("unlock");
      toast("Bonne réponse !");
      nextQuestionSoon();
    } else {
      handleWrongAnswer(question);
    }
  }

  function handleWrongAnswer(question) {
    const session = state.levelSession;
    if (session.shieldReady && state.save.inventory.boosters.shields > 0) {
      state.save.inventory.boosters.shields -= 1;
      session.shieldReady = false;
      saveGame();
      toast("Le bouclier a annulé l'erreur.");
    } else {
      session.hearts -= 1;
      toast(`Pas tout à fait. Indice : ${question.hint}`);
    }
    sound.play("wrong");
    pulseWrong();
    updateGameMeter();

    if (session.hearts <= 0) {
      setTimeout(() => finishNode(false), 450);
    }
  }

  function nextQuestionSoon() {
    state.activeQuestionIndex += 1;
    updateGameMeter();
    if (state.activeQuestionIndex >= state.activeQuestionSet.length) {
      setTimeout(() => finishNode(true), 550);
      return;
    }
    setTimeout(renderQuestion, 520);
  }

  function useHint() {
    if (!state.levelSession || state.save.inventory.boosters.hints <= 0) {
      toast("Aucun jeton d'indice disponible.");
      return;
    }
    const question = state.activeQuestionSet[state.activeQuestionIndex];
    if (state.levelSession.hintUsedOnQuestion) {
      toast("L'indice a déjà été utilisé pour cette question.");
      return;
    }
    state.levelSession.hintUsedOnQuestion = true;
    state.save.inventory.boosters.hints -= 1;
    saveGame();
    toast(`Indice : ${question.hint}`);
    updateGameMeter();
  }

  function useExtraTime() {
    const session = state.levelSession || state.miniSession;
    if (!session || !("timeLeft" in session) || state.save.inventory.boosters.extraTime <= 0) {
      toast("Aucun bonus de temps disponible.");
      return;
    }
    session.timeLeft += 10;
    state.save.inventory.boosters.extraTime -= 1;
    saveGame();
    sound.play("unlock");
    toast("+10 secondes ajoutées.");
    updateGameMeter();
  }

  function startTimer() {
    clearTimer();
    state.timerId = window.setInterval(() => {
      const session = state.levelSession || state.miniSession;
      if (!session) return clearTimer();
      session.timeLeft -= 1;
      updateGameMeter();
      if (session.timeLeft <= 0) {
        clearTimer();
        finishNode(session.correct >= Math.ceil((session.total || 5) * 0.6));
      }
    }, 1000);
  }

  function clearTimer() {
    if (state.timerId) window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function quitLevel() {
    clearTimer();
    state.levelSession = null;
    state.miniSession = null;
    renderScreen("map");
  }

  function finishNode(won) {
    clearTimer();
    const node = state.activeNode.node;
    const session = state.levelSession || state.miniSession;
    const score = session.correct || 0;
    const total = session.total || 1;
    const starCount = won ? calculateStars(score, total, node.type === "mini") : 0;

    if (won) {
      awardNodeStars(starCount);
      unlockNextNode();
      sound.play("victoire");
      launchConfetti();
      showWinModal(starCount, score, total);
    } else {
      sound.play("wrong");
      showLoseModal(score, total);
    }

    state.levelSession = null;
    state.miniSession = null;
    saveGame();
  }

  function calculateStars(score, total, isMini) {
    if (isMini) {
      if (score >= total) return 4;
      if (score >= Math.ceil(total * 0.75)) return 3;
      return 2;
    }
    const ratio = score / total;
    if (ratio >= 1) return 3;
    if (ratio >= 0.8) return 2;
    if (ratio >= 0.6) return 1;
    return 0;
  }

  function awardNodeStars(stars) {
    const { worldId, nodeIndex, node } = state.activeNode;
    const worldSave = state.save.worlds[worldId];
    const previous = worldSave.nodes[nodeIndex]?.stars || 0;
    const gained = Math.max(0, stars - previous);
    const alreadyComplete = Boolean(worldSave.nodes[nodeIndex]?.complete);

    worldSave.nodes[nodeIndex] = {
      complete: true,
      stars: Math.max(previous, stars),
      type: node.type
    };

    state.save.stars += gained;
    state.save.totalEarnedStars += gained;
    state.save.xp += gained * 25 + (alreadyComplete ? 0 : 35);

    if (!alreadyComplete) {
      if (node.type === "mini") state.save.completedMiniGames += 1;
      else state.save.completedLevels += 1;
    }
  }

  function unlockNextNode() {
    const { worldId, nodeIndex } = state.activeNode;
    const worldSave = state.save.worlds[worldId];
    if (nodeIndex < TOTAL_NODES_PER_WORLD && worldSave.highestUnlocked === nodeIndex) {
      worldSave.highestUnlocked = nodeIndex + 1;
      sound.play("unlock");
      toast("Nouveau niveau débloqué !");
    }

    if (nodeIndex === TOTAL_NODES_PER_WORLD) {
      const currentWorldIndex = worlds.findIndex(world => world.id === worldId);
      const nextWorld = worlds[currentWorldIndex + 1];
      if (nextWorld && !state.save.worlds[nextWorld.id].unlocked) {
        state.save.worlds[nextWorld.id].unlocked = true;
        toast(`${nextWorld.name} débloqué !`);
      }
    }
  }

  function showWinModal(stars, score, total) {
    const extra = stars === 4 ? "Bonus d'étoiles de mini-jeu !" : `${stars}/3 étoiles gagnées`;
    openModal(`
      <h2>Victoire !</h2>
      <p>Vous avez terminé le défi avec ${score}/${total} bonnes réponses.</p>
      <div class="reward-row">
        ${Array.from({ length: Math.min(stars, 3) }, () => `<i class="reward-star"></i>`).join("")}
        ${stars === 4 ? `<i class="reward-star"></i>` : ""}
      </div>
      <p><strong>${extra}</strong></p>
      <div class="game-actions">
        <button class="primary-button" type="button" data-action="next-node">Continuer</button>
        <button class="secondary-button" type="button" data-action="return-map">Carte</button>
      </div>
    `);
  }

  function showLoseModal(score, total) {
    openModal(`
      <h2>Réessayez</h2>
      <p>Vous avez marqué ${score}/${total}. Obtenez au moins 60 % pour réussir ce nœud.</p>
      <div class="game-actions">
        <button class="primary-button" type="button" data-action="retry-node">Réessayer</button>
        <button class="secondary-button" type="button" data-action="return-map">Carte</button>
      </div>
    `);
  }

  function openNextNode() {
    const { worldId, nodeIndex } = state.activeNode;
    const worldSave = state.save.worlds[worldId];
    const nextIndex = Math.min(nodeIndex + 1, worldSave.highestUnlocked);
    if (nextIndex > nodeIndex && nextIndex <= TOTAL_NODES_PER_WORLD) {
      startNode(worldId, nextIndex);
    } else {
      renderScreen("map");
    }
  }

  function startMiniGame(type) {
    state.levelSession = null;
    state.miniSession = {
      type,
      correct: 0,
      total: type === "memory" ? 6 : type === "survival" ? 8 : 7,
      hearts: type === "survival" ? 3 : 2,
      timeLeft: type === "memory" ? 0 : type === "puzzle" ? 75 : 45
    };

    renderScreen("game");
    const label = document.querySelector("#modeLabel");
    if (label) label.textContent = "Mini-game";
    renderMiniGame(type);
    if (state.miniSession.timeLeft > 0) startTimer();
  }

  function renderMiniGame(type) {
    const area = document.querySelector("#questionArea");
    if (!area) return;

    const renderers = {
      speed: renderSpeedMiniGame,
      memory: renderMemoryMiniGame,
      puzzle: renderPuzzleMiniGame,
      survival: renderSurvivalMiniGame
    };

    area.innerHTML = renderers[type]();
    attachMiniEvents(type);
    updateGameMeter();
  }

  function renderSpeedMiniGame() {
    const prompts = shuffle(questionBank[state.selectedWorld].conjugation).slice(0, 7);
    state.miniSession.prompts = prompts;
    state.miniSession.total = prompts.length;
    state.miniSession.index = 0;
    return `
      <div class="game-prompt" id="speedPrompt">${prompts[0].prompt}</div>
      <input id="miniInput" class="answer-input" type="text" autocomplete="off" placeholder="Répondez vite">
      <div class="game-actions">
        <button class="primary-button" type="button" id="miniSubmit">Valider</button>
      </div>
    `;
  }

  function renderMemoryMiniGame() {
    const pairs = questionBank[state.selectedWorld].matchPairs[0].pairs.slice(0, 6);
    state.miniSession.total = pairs.length;
    const cards = shuffle(pairs.flatMap((pair, pairIndex) => [
      { text: pair[0], pair: pairIndex },
      { text: pair[1], pair: pairIndex }
    ]));
    state.miniSession.cards = cards;
    state.miniSession.flipped = [];
    return `
      <div class="game-prompt">Trouvez toutes les paires de mots français-anglais.</div>
      <div class="memory-grid">
        ${cards.map((card, index) => `<button class="memory-card is-hidden" type="button" data-card="${index}" data-pair="${card.pair}">${card.text}</button>`).join("")}
      </div>
    `;
  }

  function renderPuzzleMiniGame() {
    const puzzles = shuffle(questionBank[state.selectedWorld].sentenceBuilder).slice(0, 4);
    state.miniSession.puzzles = puzzles;
    state.miniSession.index = 0;
    state.miniSession.total = puzzles.length;
    return renderPuzzleRound(puzzles[0]);
  }

  function renderPuzzleRound(question) {
    return `
      <div class="game-prompt">${question.prompt}</div>
      <div class="sentence-drop" id="sentenceDrop"></div>
      <div class="token-bank" id="tokenBank">
        ${shuffle(question.words).map((word, index) => `<button class="word-token" draggable="true" type="button" data-word="${escapeAttr(word)}" data-token="${index}">${word}</button>`).join("")}
      </div>
      <div class="game-actions">
        <button class="secondary-button" type="button" id="clearSentence">Effacer</button>
        <button class="primary-button" type="button" id="miniSubmit">Valider le puzzle</button>
      </div>
    `;
  }

  function renderSurvivalMiniGame() {
    const pool = shuffle(questionBank[state.selectedWorld].multipleChoice).concat(shuffle(questionBank[state.selectedWorld].multipleChoice));
    state.miniSession.pool = pool;
    state.miniSession.index = 0;
    return renderSurvivalRound(pool[0]);
  }

  function renderSurvivalRound(question) {
    return `
      <div class="game-prompt">${question.prompt}</div>
      <div class="choice-grid">
        ${shuffle(question.options).map(option => `<button class="choice-button" type="button" data-mini-choice="${escapeAttr(option)}">${option}</button>`).join("")}
      </div>
    `;
  }

  function attachMiniEvents(type) {
    if (type === "speed") {
      const input = document.querySelector("#miniInput");
      const submit = document.querySelector("#miniSubmit");
      input.focus();
      submit.addEventListener("click", handleSpeedAnswer);
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") handleSpeedAnswer();
      });
    }

    if (type === "memory") {
      document.querySelectorAll(".memory-card").forEach(card => {
        card.addEventListener("click", () => handleMemoryCard(card));
      });
    }

    if (type === "puzzle") {
      attachPuzzleRoundEvents();
    }

    if (type === "survival") {
      attachSurvivalChoices();
    }
  }

  function handleSpeedAnswer() {
    const session = state.miniSession;
    const input = document.querySelector("#miniInput");
    const question = session.prompts[session.index];
    if (normalize(input.value) === normalize(question.answer)) {
      session.correct += 1;
      sound.play("unlock");
      toast("Point rapide !");
    } else {
      session.hearts -= 1;
      sound.play("wrong");
      pulseWrong();
    }

    session.index += 1;
    updateGameMeter();
    if (session.hearts <= 0 || session.index >= session.prompts.length) {
      finishNode(session.correct >= 4);
      return;
    }

    document.querySelector("#speedPrompt").textContent = session.prompts[session.index].prompt;
    input.value = "";
    input.focus();
  }

  function handleMemoryCard(card) {
    const session = state.miniSession;
    if (!card.classList.contains("is-hidden") || session.flipped.length >= 2) return;
    card.classList.remove("is-hidden");
    session.flipped.push(card);

    if (session.flipped.length === 2) {
      const [first, second] = session.flipped;
      if (first.dataset.pair === second.dataset.pair) {
        first.classList.add("is-matched");
        second.classList.add("is-matched");
        session.correct += 1;
        session.flipped = [];
        sound.play("unlock");
        updateGameMeter();
        if (session.correct >= session.total) finishNode(true);
      } else {
        session.hearts -= 1;
        sound.play("wrong");
        pulseWrong();
        updateGameMeter();
        setTimeout(() => {
          first.classList.add("is-hidden");
          second.classList.add("is-hidden");
          session.flipped = [];
          if (session.hearts <= 0) finishNode(false);
        }, 780);
      }
    }
  }

  function attachPuzzleRoundEvents() {
    const session = state.miniSession;
    const drop = document.querySelector("#sentenceDrop");
    const bank = document.querySelector("#tokenBank");
    let dragged = null;

    document.querySelectorAll(".word-token").forEach(token => {
      token.addEventListener("dragstart", () => {
        dragged = token;
      });
      token.addEventListener("click", () => moveToken(token, drop));
    });

    drop.addEventListener("dragover", (event) => event.preventDefault());
    drop.addEventListener("drop", (event) => {
      event.preventDefault();
      if (dragged) moveToken(dragged, drop);
    });

    document.querySelector("#clearSentence").addEventListener("click", () => {
      [...drop.querySelectorAll(".word-token")].forEach(token => {
        token.classList.remove("in-drop");
        bank.appendChild(token);
      });
    });

    document.querySelector("#miniSubmit").addEventListener("click", () => {
      const answer = [...document.querySelectorAll("#sentenceDrop .word-token")].map(token => token.dataset.word);
      const puzzle = session.puzzles[session.index];
      if (arraysEqual(answer, puzzle.answer)) {
        session.correct += 1;
        sound.play("unlock");
      } else {
        session.hearts -= 1;
        sound.play("wrong");
        pulseWrong();
      }
      session.index += 1;
      updateGameMeter();
      if (session.hearts <= 0 || session.index >= session.puzzles.length) {
        finishNode(session.correct >= 3);
        return;
      }
      document.querySelector("#questionArea").innerHTML = renderPuzzleRound(session.puzzles[session.index]);
      attachPuzzleRoundEvents();
    });
  }

  function attachSurvivalChoices() {
    const session = state.miniSession;
    document.querySelectorAll("[data-mini-choice]").forEach(button => {
      button.addEventListener("click", () => {
        const question = session.pool[session.index];
        if (normalize(button.dataset.miniChoice) === normalize(question.answer)) {
          button.classList.add("is-correct");
          session.correct += 1;
          sound.play("unlock");
        } else {
          button.classList.add("is-wrong");
          session.hearts -= 1;
          sound.play("wrong");
          pulseWrong();
        }
        updateGameMeter();

        if (session.correct >= session.total) {
          setTimeout(() => finishNode(true), 450);
          return;
        }
        if (session.hearts <= 0) {
          setTimeout(() => finishNode(false), 450);
          return;
        }

        session.index = (session.index + 1) % session.pool.length;
        setTimeout(() => {
          document.querySelector("#questionArea").innerHTML = renderSurvivalRound(session.pool[session.index]);
          attachSurvivalChoices();
        }, 430);
      });
    });
  }

  function renderStore() {
    return `
      <section class="screen">
        ${renderTopBar("Dépensez vos étoiles sur des skins et des bonus")}
        <div class="screen-heading">
          <div>
            <h2>Boutique</h2>
            <p>Les étoiles sont gagnées en réussissant les niveaux et les mini-jeux. Rejouez les niveaux pour augmenter votre total.</p>
          </div>
          <button class="secondary-button" type="button" data-action="screen" data-screen="menu">Menu principal</button>
        </div>
        <div class="store-grid">
          ${storeItems.map(renderStoreItem).join("")}
        </div>
      </section>
    `;
  }

  function renderStoreItem(item) {
    const owned = isOwned(item);
    const canBuy = state.save.stars >= item.price && !owned;
    return `
      <article class="shop-card">
        <div class="avatar ${item.skinClass || ""}">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <button class="store-buy" type="button" data-action="buy" data-item="${item.id}" ${canBuy ? "" : "disabled"}>
          ${owned ? "Possédé" : `${item.price} étoiles`}
        </button>
      </article>
    `;
  }

  function buyItem(itemId) {
    const item = storeItems.find(entry => entry.id === itemId);
    if (!item) return;
    if (isOwned(item)) {
      toast("Déjà possédé.");
      return;
    }
    if (state.save.stars < item.price) {
      toast("Pas assez d'étoiles pour l'instant.");
      return;
    }

    state.save.stars -= item.price;
    if (item.type === "skin") {
      state.save.inventory.skins.push(item.id);
      state.save.inventory.activeSkin = item.id;
    }
    if (item.type === "theme") {
      state.save.inventory.themes.push(item.id);
    }
    if (item.type === "booster") {
      state.save.inventory.boosters[item.key] += item.amount;
    }

    saveGame();
    sound.play("victoire");
    toast(`${item.name} acheté.`);
    renderScreen("store");
  }

  function renderInventory() {
    const ownedSkins = storeItems.filter(item => item.type === "skin" && state.save.inventory.skins.includes(item.id));
    return `
      <section class="screen">
        ${renderTopBar("Inventaire et skins")}
        <div class="screen-heading">
          <div>
            <h2>Inventaire</h2>
            <p>Équipez des skins et suivez les boosters utilisables pendant les niveaux.</p>
          </div>
          <button class="secondary-button" type="button" data-action="screen" data-screen="menu">Menu principal</button>
        </div>
        <div class="inventory-grid">
          <article class="inventory-card">
            <h3>Boosters</h3>
            <p>Indices : ${state.save.inventory.boosters.hints}</p>
            <p>Temps bonus : ${state.save.inventory.boosters.extraTime}</p>
            <p>Boucliers : ${state.save.inventory.boosters.shields}</p>
          </article>
          <article class="inventory-card">
            <div class="avatar">${getActiveSkinIcon()}</div>
            <h3>Skin par défaut</h3>
            <p>Le skin classique de French Quest.</p>
            <button class="store-buy" type="button" data-action="equip-skin" data-skin="default">${state.save.inventory.activeSkin === "default" ? "Équipé" : "Équiper"}</button>
          </article>
          ${ownedSkins.map(item => `
            <article class="inventory-card">
              <div class="avatar ${item.skinClass}">${item.icon}</div>
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <button class="store-buy" type="button" data-action="equip-skin" data-skin="${item.id}">${state.save.inventory.activeSkin === item.id ? "Équipé" : "Équiper"}</button>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function equipSkin(skinId) {
    if (skinId !== "default" && !state.save.inventory.skins.includes(skinId)) {
      toast("Vous ne possédez pas encore ce skin.");
      return;
    }
    state.save.inventory.activeSkin = skinId;
    saveGame();
    toast("Skin équipé.");
    renderScreen("inventory");
  }

  function renderProfile() {
    const progress = getOverallProgress();
    return `
      <section class="screen">
        ${renderTopBar("Profil et statistiques")}
        <div class="screen-heading">
          <div>
            <h2>Profil</h2>
            <p>Votre progression locale est enregistrée automatiquement dans ce navigateur.</p>
          </div>
          <button class="secondary-button" type="button" data-action="screen" data-screen="menu">Menu principal</button>
        </div>
        <div class="profile-grid">
          <article class="profile-card wide">
            <h3>Progression globale de la quête</h3>
            <div class="progress-track"><div class="progress-fill" style="--value:${progress.percent}%"></div></div>
          </article>
          <article class="profile-card"><h3>XP</h3><p>${state.save.xp} XP gagnés grâce aux leçons et aux récompenses en étoiles.</p></article>
          <article class="profile-card"><h3>Étoiles</h3><p>${state.save.stars} étoiles disponibles, ${state.save.totalEarnedStars} gagnées au total.</p></article>
          <article class="profile-card"><h3>Niveaux terminés</h3><p>${state.save.completedLevels} niveaux normaux validés.</p></article>
          <article class="profile-card"><h3>Mini-jeux</h3><p>${state.save.completedMiniGames} défis bonus terminés.</p></article>
        </div>
      </section>
    `;
  }

  function openSettings() {
    openModal(`
      <h2>Paramètres</h2>
      <p>Ces réglages sont enregistrés localement.</p>
      <div class="game-actions">
        <button class="secondary-button" type="button" id="toggleSound">Son : ${state.save.settings.sound ? "Activé" : "Désactivé"}</button>
        <button class="secondary-button" type="button" id="toggleMotion">Mouvement : ${state.save.settings.reducedMotion ? "Réduit" : "Complet"}</button>
        <button class="secondary-button" type="button" data-action="reset-save">Réinitialiser la progression</button>
        <button class="primary-button" type="button" data-action="modal-close">Terminé</button>
      </div>
    `);

    document.querySelector("#toggleSound").addEventListener("click", () => {
      state.save.settings.sound = !state.save.settings.sound;
      saveGame();
      openSettings();
    });

    document.querySelector("#toggleMotion").addEventListener("click", () => {
      state.save.settings.reducedMotion = !state.save.settings.reducedMotion;
      saveGame();
      openSettings();
    });
  }

  function openModal(content) {
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="modal-close"></div>
      <article class="modal-card">${content}</article>
    `;
    requestAnimationFrame(() => modalRoot.classList.add("is-open"));
  }

  function closeModal() {
    modalRoot.classList.remove("is-open");
    setTimeout(() => {
      if (!modalRoot.classList.contains("is-open")) modalRoot.innerHTML = "";
    }, 260);
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    toastRoot.appendChild(node);
    setTimeout(() => node.remove(), 2500);
  }

  function pulseWrong() {
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
  }

  function launchConfetti() {
    const colors = ["#7cf7ff", "#ffdc5e", "#ff76c7", "#5ff0a8", "#ffffff"];
    for (let i = 0; i < 80; i += 1) {
      const bit = document.createElement("span");
      bit.className = "confetti";
      bit.style.setProperty("--x", `${Math.random() * 100}%`);
      bit.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
      bit.style.setProperty("--d", `${1.8 + Math.random() * 1.5}s`);
      bit.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiRoot.appendChild(bit);
      setTimeout(() => bit.remove(), 3600);
    }
  }

  function createParticles() {
    particlesRoot.innerHTML = "";
    for (let i = 0; i < 78; i += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.setProperty("--x", `${Math.random() * 100}%`);
      particle.style.setProperty("--y", `${Math.random() * 100}%`);
      particle.style.setProperty("--size", `${2 + Math.random() * 5}px`);
      particle.style.setProperty("--speed", `${3 + Math.random() * 8}s`);
      particle.style.setProperty("--color", i % 3 === 0 ? "var(--accent)" : i % 3 === 1 ? "var(--accent-two)" : "var(--accent-three)");
      particlesRoot.appendChild(particle);
    }
  }

  function getWorld(worldId) {
    return worlds.find(world => world.id === worldId) || worlds[0];
  }

  function getWorldProgress(worldId) {
    const nodes = state.save.worlds[worldId].nodes;
    const completeNodes = Object.values(nodes).filter(node => node.complete);
    const stars = completeNodes.reduce((sum, node) => sum + (node.stars || 0), 0);
    return {
      completed: completeNodes.length,
      stars,
      percent: Math.round((completeNodes.length / TOTAL_NODES_PER_WORLD) * 100)
    };
  }

  function getOverallProgress() {
    const totalNodes = worlds.length * TOTAL_NODES_PER_WORLD;
    const completed = worlds.reduce((sum, world) => sum + getWorldProgress(world.id).completed, 0);
    return {
      completed,
      percent: Math.round((completed / totalNodes) * 100)
    };
  }

  function isOwned(item) {
    if (item.type === "skin") return state.save.inventory.skins.includes(item.id);
    if (item.type === "theme") return state.save.inventory.themes.includes(item.id);
    return false;
  }

  function getActiveSkinClass() {
    const item = storeItems.find(entry => entry.id === state.save.inventory.activeSkin);
    return item?.skinClass || "";
  }

  function getActiveSkinIcon() {
    const item = storeItems.find(entry => entry.id === state.save.inventory.activeSkin);
    return item?.icon || "FQ";
  }

  function nodeTitle(node) {
    return node.type === "mini" ? miniGameName(node.miniType) : `Niveau ${node.levelNumber}`;
  }

  function miniLabel(type) {
    return { speed: "⚡", memory: "◆", puzzle: "▦", survival: "♥" }[type] || "★";
  }

  function miniGameName(type) {
    return {
      speed: "Conjugaison de la vitesse",
      memory: "Correspondance de la mémoire des mots",
      puzzle: "Puzzle de phrases",
      survival: "Survie grammaticale"
    }[type] || "Mini-jeu";
  }

  function modeName(mode) {
    return {
      fillBlank: "Remplissez le vide",
      multipleChoice: "Choix multiple",
      sentenceBuilder: "Générateur de phrases glisser",
      matchPairs: "Associer des paires de mots",
      conjugation: "Conjugaison programmée"
    }[mode] || "Défi de grammaire";
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function arraysEqual(left, right) {
    return left.length === right.length && left.every((item, index) => normalize(item) === normalize(right[index]));
  }

  function escapeAttr(value) {
    return String(value).replace(/"/g, "&quot;");
  }

  const sound = {
    context: null,
    ensure() {
      if (!state.save.settings.sound) return null;
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      }
      return this.context;
    },
    play(type) {
      const context = this.ensure();
      if (!context) return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
        const settings = {
          click: [460, 0.045, "sine"],
          victoire: [740, 0.18, "triangle"],
          victory: [740, 0.18, "triangle"],
          faux: [150, 0.16, "sawtooth"],
          wrong: [150, 0.16, "sawtooth"],
          ouvrir: [620, 0.09, "square"],
          unlock: [620, 0.09, "square"]
        }[type] || [420, 0.06, "sine"];

        oscillator.type = settings[2];
        oscillator.frequency.setValueAtTime(settings[0], now);
        if (type === "victoire" || type === "victory") oscillator.frequency.exponentialRampToValueAtTime(980, now + settings[1]);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[1]);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + settings[1] + 0.02);
    }
  };

  init();
})();
