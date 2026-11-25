const installButton = document.getElementById("installApp");
const installDialog = document.getElementById("installDialog");
const standalone = window.matchMedia("(display-mode: standalone)");
let installPrompt = null;
let installed = false;

function updateInstallButton() {
  installButton.hidden = installed || standalone.matches || navigator.standalone === true;
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installed = true;
  updateInstallButton();
});

standalone.addEventListener("change", updateInstallButton);
updateInstallButton();

installButton.addEventListener("click", async () => {
  if (!installPrompt) {
    installDialog.showModal();
    return;
  }

  const prompt = installPrompt;
  installPrompt = null;
  try {
    const { outcome } = await prompt.prompt();
    if (outcome === "accepted") {
      installed = true;
      updateInstallButton();
    }
  } catch {
    installDialog.showModal();
  }
});
