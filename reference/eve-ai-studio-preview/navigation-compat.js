(() => {
  const nav = document.querySelector(".nav");
  const materialsView = document.getElementById("rag-materials");
  if (!nav || !materialsView) return;

  const originalButton = nav.querySelector('[data-view="materials"]');
  const generatedButtons = [...nav.querySelectorAll('[data-view="rag-materials"]')];

  if (originalButton) {
    originalButton.dataset.view = "rag-materials";
    originalButton.innerHTML = '<span class="ico">▤</span>Materiali e RAG';
    generatedButtons.forEach(button => button.remove());
    return;
  }

  if (generatedButtons.length > 1) {
    generatedButtons.slice(1).forEach(button => button.remove());
  }

  const activeButton = nav.querySelector('[data-view="rag-materials"]');
  if (activeButton && !activeButton.dataset.eveNavigationBound) {
    activeButton.dataset.eveNavigationBound = "true";
    activeButton.addEventListener("click", () => {
      document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === "rag-materials"));
      document.querySelectorAll(".nav button").forEach(button => button.classList.toggle("active", button === activeButton));
      const title = document.getElementById("pageTitle");
      const subtitle = document.getElementById("pageSubtitle");
      if (title) title.textContent = "Materiali e RAG";
      if (subtitle) subtitle.textContent = "Importazione, retrieval, risposte citate e apertura verificabile delle fonti.";
      window.scrollTo({top: 0, behavior: "smooth"});
    });
  }
})();
