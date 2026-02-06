"use strict";

/* Module ES: centralise la logique de la galerie et l'état partagé */

export const API_BASE = "http://localhost:5678/api";
export const WORKS_URL = `${API_BASE}/works`;
export const CATEGORIES_URL = `${API_BASE}/categories`;

export let allWorks = [];
export let allCategories = [];

export function setAllWorks(v) {
  allWorks = v;
}

export function setAllCategories(v) {
  allCategories = v;
}

export function getToken() {
  let token = localStorage.getItem("token");
  if (!token) return null;
  token = token.replace(/['\"]/g, "").trim();
  return token || null;
}

export async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} sur ${url}${txt ? ` - ${txt}` : ""}`);
  }
  return res.json();
}

export function applyEditMode() {
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

export function displayWorks(works) {
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

function setActiveButton(button) {
  document.querySelectorAll(".filters button").forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

export function createFilters(categories) {
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

export async function initGallery() {
  try {
    const [works, categories] = await Promise.all([
      fetchJSON(WORKS_URL),
      fetchJSON(CATEGORIES_URL),
    ]);

    allWorks = works;
    allCategories = categories;

    createFilters(allCategories);
    displayWorks(allWorks);
  } catch (err) {
    console.error(err);
    const gallery = document.querySelector(".gallery");
    if (gallery) {
      gallery.innerHTML =
        "<p>Impossible de charger les projets. Vérifie que l'API est démarrée.</p>";
    }
  }
}
