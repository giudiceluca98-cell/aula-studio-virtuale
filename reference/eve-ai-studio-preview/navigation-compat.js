(() => {
  const nav = document.querySelector(".nav");
  const materialsView = document.getElementById("rag-materials");
  if (!nav || !materialsView) return;

  const originalButton = nav.querySelector('[data-view="materials"]');
  const generatedButtons = [...nav.querySelectorAll('[data-view="rag-materials"]')];
  let activeButton = null;

  if (originalButton) {
    const cleanButton = originalButton.cloneNode(true);
    cleanButton.dataset.view = "rag-materials";
    cleanButton.innerHTML = '<span class="ico">▤</span>Materiali e RAG';
    originalButton.replaceWith(cleanButton);
    generatedButtons.forEach(button => button.remove());
    activeButton = cleanButton;
  } else {
    activeButton = generatedButtons.shift() || null;
    generatedButtons.forEach(button => button.remove());
    if (activeButton) {
      const cleanButton = activeButton.cloneNode(true);
      activeButton.replaceWith(cleanButton);
      activeButton = cleanButton;
    }
  }

  if (!activeButton) return;
  activeButton.dataset.eveNavigationBound = "true";
  activeButton.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(view => {
      view.classList.toggle("active", view.id === "rag-materials");
    });
    document.querySelectorAll(".nav button").forEach(button => {
      button.classList.toggle("active", button === activeButton);
    });

    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Materiali e RAG";
    if (subtitle) {
      subtitle.textContent = "Importazione, retrieval, risposte citate e apertura verificabile delle fonti.";
    }
    window.scrollTo({top: 0, behavior: "smooth"});
  });
})();
