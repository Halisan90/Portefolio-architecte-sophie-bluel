const API_BASE = "http://localhost:5678/api";
const WORKS_URL = `${API_BASE}/works`;
const CATEGORIES_URL = `${API_BASE}/categories`;

let allWorks = [];

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} sur ${url}${txt ? ` - ${txt}` : ""}`);
  }
  return res.json();
}

function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

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
      const filtered = allWorks.filter(
        (work) => Number(work.categoryId) === Number(cat.id)
      );
      displayWorks(filtered);
    });

    container.appendChild(btn);
  });
}

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

document.addEventListener("DOMContentLoaded", init);
