document.addEventListener("DOMContentLoaded", () => {
  /***********************
   *  RÉCUPÉRER LE TOKEN
   ***********************/
  const token = localStorage.getItem("token");

  /***********************
   *  RÉCUPÉRER LES ÉLÉMENTS
   ***********************/
  const editBanner = document.getElementById("edit-banner");
  const loginLink = document.getElementById("nav-login");
  const filters = document.getElementById("filters");
  const editButton = document.getElementById("edit-button");

  /***********************
   *  UTILISATEUR CONNECTÉ
   ***********************/
  if (token) {
    // Afficher le bandeau "mode édition"
    editBanner.style.display = "flex";

    // Changer login en logout
    loginLink.textContent = "logout";
    loginLink.href = "#";

    // Déconnexion
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.reload();
    });

    // Cacher les filtres
    filters.style.display = "none";

    // Afficher le bouton modifier
    editButton.style.display = "inline-flex";
  } else {
    /***********************
     *  UTILISATEUR NON CONNECTÉ
     ***********************/
    editBanner.style.display = "none";
    filters.style.display = "";
    editButton.style.display = "none";

    loginLink.textContent = "login";
    loginLink.href = "login.html";
  }
});
