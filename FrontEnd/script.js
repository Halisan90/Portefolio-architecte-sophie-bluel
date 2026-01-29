console.log("script.js chargé");
console.log("Token :", localStorage.getItem("token"));

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
 *  MODE ÉDITION (PAGE D'ACCUEIL)
 ************************/
function applyEditMode() {
  const token = localStorage.getItem("token");

  const editBanner = document.getElementById("edit-banner");
  const loginLink = document.getElementById("nav-login");
  const filters = document.getElementById("filters");
  const editButton = document.getElementById("edit-button");

  if (token) {
    // Mode connecté
    editBanner.style.display = "flex";
    filters.style.display = "none";
    editButton.style.display = "block";

    loginLink.textContent = "logout";
    loginLink.href = "#";

    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.reload();
    });
  } else {
    // Mode non connecté
    editBanner.style.display = "none";
    filters.style.display = "";
    editButton.style.display = "none";

    loginLink.textContent = "login";
    loginLink.href = "login.html";
  }
}

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
 *  SUPPRESSION D'UN TRAVAIL
 ************************/
async function deleteWork(workId) {
  let token = localStorage.getItem("token");
  token = token.replace(/['"]/g, "").trim();

  const res = await fetch(`${WORKS_URL}/${workId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  if (!res.ok) {
    alert("Suppression refusée (HTTP " + res.status + ")");
    return;
  }

  allWorks = allWorks.filter((work) => work.id !== workId);
  displayWorks(allWorks);
  displayModalWorks(allWorks);
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
function setActiveButton(button) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

function createFilters(categories) {
  const container = document.querySelector(".filters");
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "Tous";
  allBtn.classList.add("active");

  allBtn.addEventListener("click", () => {
    setActiveButton(allBtn);
    displayWorks(allWorks);
  });

  container.appendChild(allBtn);

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat.name;

    btn.addEventListener("click", () => {
      setActiveButton(btn);
      const filteredWorks = allWorks.filter(
        (work) => Number(work.categoryId) === Number(cat.id),
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
    displayModalWorks(allWorks);
  } catch (err) {
    console.error(err);
    document.querySelector(".gallery").innerHTML =
      "<p>Impossible de charger les projets. Vérifie que l’API est démarrée.</p>";
  }
}

/************************
 *  MODALE : OUVERTURE / FERMETURE / NAV
 ************************/
function setupModal() {
  const overlay = document.getElementById("modal-overlay");
  const modal = overlay?.querySelector(".modal");

  const openBtn = document.getElementById("edit-button");
  const closeBtn = document.getElementById("modal-close");
  const backBtn = document.getElementById("modal-back");

  const viewGallery = document.getElementById("modal-view-gallery");
  const viewAdd = document.getElementById("modal-view-add");

  const btnOpenAdd = document.getElementById("btn-open-add");

  if (
    !overlay ||
    !modal ||
    !openBtn ||
    !closeBtn ||
    !backBtn ||
    !viewGallery ||
    !viewAdd ||
    !btnOpenAdd
  )
    return;

  function showGalleryView() {
    viewGallery.style.display = "block";
    viewAdd.style.display = "none";
    backBtn.style.visibility = "hidden";
  }

  function showAddView() {
    viewGallery.style.display = "none";
    viewAdd.style.display = "block";
    backBtn.style.visibility = "visible";
  }

  function openModal() {
    overlay.style.display = "flex";
    showGalleryView(); // par défaut, on ouvre sur la galerie
  }

  function closeModal() {
    overlay.style.display = "none";
  }

  // Ouvrir au clic sur "Modifier"
  openBtn.addEventListener("click", openModal);

  // Fermer au clic sur la croix
  closeBtn.addEventListener("click", closeModal);

  // Fermer au clic en dehors de la modale (sur l’overlay)
  overlay.addEventListener("click", closeModal);

  // Empêcher la fermeture si on clique dans la modale
  modal.addEventListener("click", (e) => e.stopPropagation());

  // Aller sur le formulaire au clic "Ajouter une photo"
  btnOpenAdd.addEventListener("click", showAddView);

  // Revenir à la galerie au clic sur la flèche
  backBtn.addEventListener("click", showGalleryView);
}

/************************
 *  AFFICHAGE GALERIE MODALE
 ************************/
function displayModalWorks(works) {
  const modalGallery = document.getElementById("modal-gallery");
  if (!modalGallery) return;

  modalGallery.innerHTML = "";

  works.forEach((work) => {
    const figure = document.createElement("figure");
    figure.classList.add("modal-figure");

    const img = document.createElement("img");
    img.src = work.imageUrl;
    img.alt = work.title;

    const trashBtn = document.createElement("button");
    trashBtn.type = "button";
    trashBtn.classList.add("modal-trash");
    trashBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

    trashBtn.addEventListener("click", () => {
      const ok = confirm("Voulez-vous vraiment supprimer ce projet ?");
      if (!ok) return;

      deleteWork(work.id);
    });

    figure.appendChild(img);
    figure.appendChild(trashBtn);
    modalGallery.appendChild(figure);
  });
}

/************************
 *  LANCEMENT AU CHARGEMENT
 ************************/
document.addEventListener("DOMContentLoaded", () => {
  applyEditMode();
  setupModal();
  init();
});
