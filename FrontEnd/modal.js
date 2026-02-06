import {
  WORKS_URL,
  getToken,
  fetchJSON,
  displayWorks,
  allWorks,
  setAllWorks,
} from "./script.js";

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
  const newWorks = await fetchJSON(WORKS_URL);
  setAllWorks(newWorks);
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
  defaultOption.hidden = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = String(cat.id);
    option.textContent = cat.name;
    select.appendChild(option);
  });

  // Force l'affichage du placeholder après remplissage
  select.value = "";
}

/***********************
 *  AJOUT : RESET / PREVIEW / VALIDATION
 ***********************/
function resetAddForm() {
  const form = document.getElementById("add-work-form");
  const fileInput = document.getElementById("photo-input");
  const previewImg = document.getElementById("image-preview");
  const categorySelect = document.getElementById("work-category");

  const placeholderIcon = document.getElementById("upload-placeholder-icon");
  const addPhotoLabel = document.querySelector("label[for='photo-input']");
  const fileInfo = document.querySelector(".file-info");

  if (form) form.reset();
  if (fileInput) fileInput.value = "";
  if (categorySelect) {
    categorySelect.value = "";
    categorySelect.selectedIndex = 0;
  }

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

      const updatedWorks = await fetchJSON(WORKS_URL);
      setAllWorks(updatedWorks);
      displayWorks(updatedWorks);
      displayModalWorks(updatedWorks);

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

export { displayModalWorks, fillCategorySelect, setupAddFormUX, setupModal };

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
