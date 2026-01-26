/***********************
 *  CONFIGURATION API
 ***********************/
const API_BASE = "http://localhost:5678/api";
const LOGIN_URL = `${API_BASE}/users/login`;

/***********************
 *  AUTHENTIFICATION
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");

  if (!form || !emailInput || !passwordInput || !errorEl) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur dans l’identifiant ou le mot de passe");
        }
        return res.json();
      })
      .then((data) => {
        /***********************
         *  VÉRIFICATION TOKEN
         ***********************/
        if (!data.token) {
          throw new Error("Token manquant dans la réponse API");
        }

        /***********************
         *  STOCKAGE + REDIRECTION
         ***********************/
        localStorage.setItem("token", data.token);
        window.location.href = "index.html";
      })
      .catch((err) => {
        /***********************
         *  AFFICHAGE ERREUR
         ***********************/
        errorEl.textContent = err.message;

        // Optionnel : vider le champ mot de passe après erreur
        passwordInput.value = "";
      });
  });
});
