import {
  initGallery,
  applyEditMode,
  allWorks,
  allCategories,
} from "./script.js";
import {
  setupModal,
  setupAddFormUX,
  displayModalWorks,
  fillCategorySelect,
} from "./modal.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initGallery();
  applyEditMode();
  setupModal();
  setupAddFormUX();

  // initialise les vues qui dépendent des données chargées
  displayModalWorks(allWorks);
  fillCategorySelect(allCategories);
});
