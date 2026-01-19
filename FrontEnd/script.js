const API_URL = "http://localhost:5678/api/works";

function createWorkFigure(work) {
  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = work.imageUrl;
  img.alt = work.title;

  const figcaption = document.createElement("figcaption");
  figcaption.textContent = work.title;

  figure.appendChild(img);
  figure.appendChild(figcaption);

  return figure;
}

function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  works.forEach((work) => {
    gallery.appendChild(createWorkFigure(work));
  });
}

fetch(API_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Erreur API : ${response.status}`);
    }
    return response.json();
  })
  .then((works) => {
    displayWorks(works);
  })
  .catch((error) => {
    console.error("Impossible de charger la galerie :", error);
  });
