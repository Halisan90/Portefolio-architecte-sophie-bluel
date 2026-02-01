"use strict";

/***********************
 *  CONFIG API
 ***********************/
const API_BASE = "http://localhost:5678/api";
const WORKS_URL = `${API_BASE}/works`;
const CATEGORIES_URL = `${API_BASE}/categories`;

/***********************
 *  STATE
 ***********************/
let allWorks = [];
let allCategories = [];

/***********************
 *  HELPERS
 ***********************/
function getToken() {
  let token = localStorage.getItem("token");
  if (!token) return null;
  token = token.replace(/['"]/g, "").trim();
  return token || null;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} sur ${url}${txt ? ` - ${txt}` : ""}`);
  }
  return res.json();
}

function setMessage(msg, type = "error") {
  const el = document.getElementById("add-error");
  if (!el) return;

  el.textContent = msg || "";
  el.classList.remove("msg-error", "msg-success");
  if (msg) el.classList.add(type === "success" ? "msg-success" : "msg-error");
}

function setSubmitEnabled(enabled) {
  const form = document.getElementById("add-work-form");
  const btn = form?.querySelector("button[type='submit']");
  if (!btn) return;
  btn.disabled = !enabled;
}

/***********************
 *  MODE ÉDITION
 ***********************/
function applyEditMode() {
  const token = getToken();

  const editBanner = document.getElementById("edit-banner");
  const loginLink = document.getElementById("nav-login");
  const filters = document.getElementById("filters");
  const editButton = document.getElementById("edit-button");

  if (!loginLink) return;

  if (token) {
    if (editBanner) editBanner.style.display = "flex";
    if (filters) filters.style.display = "none";
    if (editButton) editButton.style.display = "block";

    loginLink.textContent = "logout";
    loginLink.href = "#";
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.reload();
    });
  } else {
    if (editBanner) editBanner.style.display = "none";
    if (filters) filters.style.display = "";
    if (editButton) editButton.style.display = "none";

    loginLink.textContent = "login";
    loginLink.href = "login.html";
  }
}

/***********************
 *  RENDER : GALERIE HOME
 ***********************/
function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  if (!works || works.length === 0) {
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

/***********************
 *  FILTRES
 ***********************/
function setActiveButton(button) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

function createFilters(categories) {
  const container = document.querySelector(".filters");
  if (!container) return;

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
      const filtered = allWorks.filter(
        (w) => Number(w.categoryId) === Number(cat.id),
      );
      displayWorks(filtered);
    });

    container.appendChild(btn);
  });
}

/***********************
 *  MODALE : GALERIE (SUPPRESSION)
 ***********************/
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

    figure.append(img, trashBtn);
    modalGallery.appendChild(figure);
  });
}

async function deleteWork(workId) {
  const token = getToken();
  if (!token) return;

  const res = await fetch(`${WORKS_URL}/${workId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });

  if (!res.ok) {
    alert("Suppression refusée (HTTP " + res.status + ")");
    return;
  }

  // ✅ refresh robuste depuis l'API
  allWorks = await fetchJSON(WORKS_URL);
  displayWorks(allWorks);
  displayModalWorks(allWorks);
}

/***********************
 *  AJOUT : CATEGORIES
 ***********************/
function fillCategorySelect(categories) {
  const select = document.getElementById("work-category");
  if (!select) return;

  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Sélectionner une catégorie --";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = String(cat.id);
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

/***********************
 *  AJOUT : RESET / PREVIEW / VALIDATION
 ***********************/
function resetAddForm() {
  const form = document.getElementById("add-work-form");
  const fileInput = document.getElementById("photo-input");
  const previewImg = document.getElementById("image-preview");

  const placeholderIcon = document.getElementById("upload-placeholder-icon");
  const addPhotoLabel = document.querySelector("label[for='photo-input']");
  const fileInfo = document.querySelector(".file-info");

  if (form) form.reset();
  if (fileInput) fileInput.value = "";

  if (previewImg) {
    try {
      if (previewImg.src && previewImg.src.startsWith("blob:")) {
        URL.revokeObjectURL(previewImg.src);
      }
    } catch (_) {}
    previewImg.src = "";
    previewImg.style.display = "none";
  }

  if (placeholderIcon) placeholderIcon.style.display = "block";
  if (addPhotoLabel) addPhotoLabel.style.display = "block";
  if (fileInfo) fileInfo.style.display = "block";

  // On laisse reset effacer les messages (OK),
  // mais on affichera le succès APRES reset lors d'un upload réussi.
  setMessage("");
  setSubmitEnabled(false);
}

function validateImage(file) {
  if (!file) return { ok: false, msg: "Veuillez sélectionner une image." };
  const okType = file.type === "image/jpeg" || file.type === "image/png";
  if (!okType) return { ok: false, msg: "Format invalide (JPG ou PNG)." };
  const maxSize = 4 * 1024 * 1024;
  if (file.size > maxSize)
    return { ok: false, msg: "Image trop lourde (max 4 Mo)." };
  return { ok: true, msg: "" };
}

function computeCanSubmit() {
  const fileInput = document.getElementById("photo-input");
  const titleInput = document.getElementById("work-title");
  const categorySelect = document.getElementById("work-category");

  const file = fileInput?.files?.[0];
  const title = titleInput?.value?.trim() || "";
  const categoryId = categorySelect?.value || "";

  const imgCheck = validateImage(file);
  const canSubmit = imgCheck.ok && title.length > 0 && !!categoryId;

  setSubmitEnabled(canSubmit);

  if (canSubmit) setMessage("");

  return { canSubmit, imgCheck, title, categoryId };
}

function setupAddFormUX() {
  const form = document.getElementById("add-work-form");
  const fileInput = document.getElementById("photo-input");
  const titleInput = document.getElementById("work-title");
  const categorySelect = document.getElementById("work-category");

  const previewImg = document.getElementById("image-preview");
  const placeholderIcon = document.getElementById("upload-placeholder-icon");
  const addPhotoLabel = document.querySelector("label[for='photo-input']");
  const fileInfo = document.querySelector(".file-info");

  if (!form || !fileInput || !titleInput || !categorySelect) return;

  setSubmitEnabled(false);

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    const check = validateImage(file);

    if (!check.ok) {
      resetAddForm();
      setMessage(check.msg, "error");
      return;
    }

    if (previewImg) {
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = "block";
    }
    if (placeholderIcon) placeholderIcon.style.display = "none";
    if (addPhotoLabel) addPhotoLabel.style.display = "none";
    if (fileInfo) fileInfo.style.display = "none";

    computeCanSubmit();
  });

  titleInput.addEventListener("input", () => computeCanSubmit());
  categorySelect.addEventListener("change", () => computeCanSubmit());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      setMessage("Vous devez être connecté pour ajouter un projet.", "error");
      return;
    }

    const { canSubmit, imgCheck } = computeCanSubmit();
    if (!canSubmit) {
      if (!imgCheck.ok) setMessage(imgCheck.msg, "error");
      else setMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const categoryId = categorySelect.value;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title);
    formData.append("category", categoryId);

    try {
      const res = await fetch(WORKS_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.log("Erreur brute :", errorText);
        setMessage(`Erreur : envoi refusé (HTTP ${res.status}).`, "error");
        return;
      }

      await res.json().catch(() => null);

      allWorks = await fetchJSON(WORKS_URL);
      displayWorks(allWorks);
      displayModalWorks(allWorks);

      // ✅ IMPORTANT : reset d'abord (sinon il efface ton succès)
      resetAddForm();
      setMessage("Projet ajouté avec succès ✅", "success");

      // ✅ ferme après un petit délai pour laisser voir le message
      const overlay = document.getElementById("modal-overlay");
      setTimeout(() => {
        if (overlay) overlay.style.display = "none";
        setMessage(""); // nettoie pour la prochaine ouverture
      }, 700);
    } catch (err) {
      console.error(err);
      setMessage("Erreur réseau lors de l'envoi du projet.", "error");
    }
  });
}

/***********************
 *  MODALE : OUVERTURE / FERMETURE / NAV
 ***********************/
function setupModal() {
  const overlay = document.getElementById("modal-overlay");
  const modal = overlay?.querySelector(".modal");

  const openBtn = document.getElementById("edit-button");
  const closeBtn = document.getElementById("modal-close");
  const backBtn = document.getElementById("modal-back");

  const viewGallery = document.getElementById("modal-view-gallery");
  const viewAdd = document.getElementById("modal-view-add");
  const btnOpenAdd = document.getElementById("btn-open-add");

  if (!overlay || !modal || !openBtn || !closeBtn || !backBtn) return;

  function showGalleryView() {
    if (viewGallery) viewGallery.style.display = "block";
    if (viewAdd) viewAdd.style.display = "none";
    backBtn.style.visibility = "hidden";
    resetAddForm();
  }

  function showAddView() {
    resetAddForm();
    if (viewGallery) viewGallery.style.display = "none";
    if (viewAdd) viewAdd.style.display = "block";
    backBtn.style.visibility = "visible";

    // optionnel : remet à jour l'état du bouton
    computeCanSubmit();
  }

  function openModal() {
    overlay.style.display = "flex";
    showGalleryView();
  }

  function closeModal() {
    overlay.style.display = "none";
    resetAddForm();
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  modal.addEventListener("click", (e) => e.stopPropagation());

  if (btnOpenAdd) btnOpenAdd.addEventListener("click", showAddView);
  backBtn.addEventListener("click", showGalleryView);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display === "flex") closeModal();
  });
}

/***********************
 *  INIT
 ***********************/
async function init() {
  try {
    const [works, categories] = await Promise.all([
      fetchJSON(WORKS_URL),
      fetchJSON(CATEGORIES_URL),
    ]);

    allWorks = works;
    allCategories = categories;

    createFilters(allCategories);
    displayWorks(allWorks);
    displayModalWorks(allWorks);
    fillCategorySelect(allCategories);
  } catch (err) {
    console.error(err);
    const gallery = document.querySelector(".gallery");
    if (gallery) {
      gallery.innerHTML =
        "<p>Impossible de charger les projets. Vérifie que l'API est démarrée.</p>";
    }
  }
}

/***********************
 *  BOOT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  applyEditMode();
  setupModal();
  setupAddFormUX();
  init();
});
