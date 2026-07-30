(() => {
  const nav = document.querySelector(".sidebar .nav");
  if (!nav || nav.dataset.organized === "true") return;

  const label = nav.previousElementSibling;
  if (label?.classList.contains("nav-label")) {
    label.textContent = "Percorso di lavoro";
  }

  const definitions = [
    {
      id: "build",
      label: "Costruisci Eve",
      description: "Modelli, comportamento e prova in chat",
      icon: "✦",
      views: ["laboratory", "prompts", "providers"],
    },
    {
      id: "knowledge",
      label: "Conoscenza",
      description: "Fonti, ricerca e memoria",
      icon: "⌕",
      views: ["materials", "rag-materials", "intelligence-research", "memory"],
    },
    {
      id: "appearance",
      label: "Aspetto",
      description: "Voce, identità e animazioni",
      icon: "◉",
      views: ["animation-library"],
    },
    {
      id: "quality",
      label: "Controllo qualità",
      description: "Requisiti, sicurezza e test",
      icon: "✓",
      views: ["requirements", "tests", "core-architecture"],
    },
    {
      id: "publish",
      label: "Pubblica",
      description: "Versioni e rilascio",
      icon: "↑",
      views: ["versions", "publish"],
    },
  ];

  const existingButtons = [...nav.querySelectorAll(":scope > button[data-view]")];
  const viewLabels = {
    laboratory: "Configura e prova",
    prompts: "Modelli e comportamento",
    providers: "Connessione AI",
  };
  existingButtons.forEach((button) => {
    const replacement = viewLabels[button.dataset.view];
    if (replacement && button.lastChild) button.lastChild.textContent = replacement;
  });
  const dashboardButton = existingButtons.find((button) => button.dataset.view === "dashboard");
  const assignedViews = new Set(definitions.flatMap((definition) => definition.views));
  const unassignedButtons = existingButtons.filter(
    (button) => button !== dashboardButton && !assignedViews.has(button.dataset.view)
  );

  const intro = document.createElement("p");
  intro.className = "studio-nav-intro";
  intro.textContent = "Scegli cosa vuoi fare. Gli strumenti tecnici restano disponibili dentro ogni area.";

  nav.replaceChildren(intro);
  nav.classList.add("studio-nav--grouped");
  nav.dataset.organized = "true";

  if (dashboardButton) {
    dashboardButton.classList.add("studio-nav-home");
    nav.appendChild(dashboardButton);
  }

  const groups = definitions.map((definition) => {
    const details = document.createElement("details");
    details.className = "studio-nav-group";
    details.dataset.group = definition.id;

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <span class="studio-nav-group__icon" aria-hidden="true">${definition.icon}</span>
      <span class="studio-nav-group__copy">
        <strong>${definition.label}</strong>
        <small>${definition.description}</small>
      </span>
    `;

    const items = document.createElement("div");
    items.className = "studio-nav-group__items";
    definition.views.forEach((view) => {
      const button = existingButtons.find((candidate) => candidate.dataset.view === view);
      if (button) items.appendChild(button);
    });

    if (!items.children.length) details.hidden = true;
    details.append(summary, items);
    nav.appendChild(details);
    return details;
  });

  if (unassignedButtons.length) {
    const details = document.createElement("details");
    details.className = "studio-nav-group studio-nav-unassigned";
    details.innerHTML = `
      <summary>
        <span class="studio-nav-group__icon" aria-hidden="true">⋯</span>
        <span class="studio-nav-group__copy">
          <strong>Altri strumenti</strong>
          <small>Funzioni ancora da classificare</small>
        </span>
      </summary>
      <div class="studio-nav-group__items"></div>
    `;
    const items = details.querySelector(".studio-nav-group__items");
    unassignedButtons.forEach((button) => items.appendChild(button));
    nav.appendChild(details);
    groups.push(details);
  }

  const syncCurrentGroup = () => {
    const activeButton = nav.querySelector("button.active[data-view]");
    groups.forEach((group) => {
      const isCurrent = Boolean(activeButton && group.contains(activeButton));
      group.classList.toggle("is-current", isCurrent);
      if (isCurrent) group.open = true;
      else if (activeButton) group.open = false;
    });
  };

  groups.forEach((group) => {
    group.addEventListener("toggle", () => {
      if (!group.open) return;
      groups.forEach((other) => {
        if (other !== group && !other.classList.contains("is-current")) other.open = false;
      });
    });
  });

  nav.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-view]");
    if (!button) return;
    requestAnimationFrame(syncCurrentGroup);
  });

  const observer = new MutationObserver(syncCurrentGroup);
  nav.querySelectorAll("button[data-view]").forEach((button) => {
    observer.observe(button, { attributes: true, attributeFilter: ["class"] });
  });
  syncCurrentGroup();
})();
