/***********************
 *  CONFIGURATION API
 ***********************/
const API_BASE = "http://localhost:5678/api";
const WORKS_URL = `${API_BASE}/works`;
const CATEGORIES_URL = `${API_BASE}/categories`;

/************************
 *  VARIABLES GLOBALES
 ************************/
let allWorks = [];

/************************
 *  APPEL API (FETCH)
 ************************/
async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} sur ${url}${txt ? ` - ${txt}` : ""}`);
  }

  return res.json();
}

/************************
 *  AFFICHAGE DES PROJETS
 ************************/
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  if (works.length === 0) {
    gallery.innerHTML = "<p>Aucun projet dans cette catégorie.</p>";
    return;
  }

  works.forEach((work) => {
    const figure = document.createElement("figure");

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;

    const caption = document.createElement("figcaption");
    caption.textContent = work.title;

    figure.append(img, caption);
    gallery.appendChild(figure);
  });
}

/************************
 *  GESTION DES FILTRES
 ************************/

/* Gestion du bouton actif */
function setActiveButton(button) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

/* Création dynamique des filtres */
function createFilters(categories) {
  const container = document.querySelector(".filters");
  container.innerHTML = "";

  /* Bouton "Tous" */
  const allBtn = document.createElement("button");
  allBtn.textContent = "Tous";
  allBtn.classList.add("active");
  allBtn.dataset.categoryId = "all";

  allBtn.addEventListener("click", () => {
    setActiveButton(allBtn);
    displayWorks(allWorks);
  });

  container.appendChild(allBtn);

  /* Boutons catégories */
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat.name;
    btn.dataset.categoryId = cat.id;

    btn.addEventListener("click", (e) => {
      setActiveButton(btn);

      const categoryId = Number(e.currentTarget.dataset.categoryId);

      const filteredWorks = allWorks.filter(
        (work) => Number(work.categoryId) === categoryId
      );

      displayWorks(filteredWorks);
    });

    container.appendChild(btn);
  });
}

/************************
 *  INITIALISATION PAGE
 ************************/
async function init() {
  try {
    const [works, categories] = await Promise.all([
      fetchJSON(WORKS_URL),
      fetchJSON(CATEGORIES_URL),
    ]);

    allWorks = works;

    createFilters(categories);
    displayWorks(allWorks);
  } catch (err) {
    console.error(err);
    document.querySelector(".gallery").innerHTML =
      "<p>Impossible de charger les projets. Vérifie que l’API est démarrée.</p>";
  }
}

/************************
 *  LANCEMENT AU CHARGEMENT
 ************************/
document.addEventListener("DOMContentLoaded", init);
