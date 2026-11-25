// ----- Install Daily Lite -------------------------------------------
// Shows how to add the app to the home screen / desktop on any device:
//  • a one-time banner above the bottom bar (dismissible, remembered)
//  • the header download button and an "Install app" item in the menu
//  • a dialog with steps for the current device first, others below
// Where the browser supports it (Android Chrome, desktop Chrome/Edge),
// "Install" triggers the browser's own one-tap install prompt.

const installButton = document.getElementById("installApp");
const installMenuButton = document.getElementById("installMenuBtn");
const installDialog = document.getElementById("installDialog");
const installNow = document.getElementById("installNow");
const banner = document.getElementById("installBanner");
const bannerGo = document.getElementById("installBannerGo");
const bannerClose = document.getElementById("installBannerClose");
const bannerHint = document.getElementById("installBannerHint");

const BANNER_DISMISSED_KEY = "dailylite_install_banner_dismissed";
const standalone = window.matchMedia("(display-mode: standalone)");

let installPrompt = null;
let installed = false;

// ----- Device detection ----------------------------------------------

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || isIPadOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

const platform = detectPlatform();

function isInstalled() {
  return installed || standalone.matches || navigator.standalone === true;
}

function readDismissed() {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, "1");
  } catch {
    /* storage unavailable: banner will simply show again next visit */
  }
}

// ----- Dialog: current device first ----------------------------------

function arrangeDialog() {
  const sections = [...installDialog.querySelectorAll(".install-steps")];
  const current = sections.find(section => section.dataset.platform === platform);
  if (!current) return;

  current.classList.add("is-current");
  const firstSection = sections[0];
  if (current !== firstSection) firstSection.before(current);

  // Label the other devices so the current one reads as "yours"
  let divider = installDialog.querySelector(".install-others");
  if (!divider) {
    divider = document.createElement("p");
    divider.className = "install-others";
    divider.textContent = "Other devices";
    current.after(divider);
  }
}

function showDialog() {
  installNow.hidden = !installPrompt;
  installDialog.showModal();
  // Open at the top with focus on the title, not scrolled to the Done button
  installDialog.scrollTop = 0;
  document.getElementById("installTitle").focus({ preventScroll: true });
}

// ----- Native install prompt where available -------------------------

async function promptInstall() {
  if (!installPrompt) {
    showDialog();
    return;
  }

  const prompt = installPrompt;
  installPrompt = null;
  try {
    const { outcome } = await prompt.prompt();
    if (outcome === "accepted") {
      installed = true;
      hideBanner();
    }
  } catch {
    showDialog();
  }
  updateUi();
}

// ----- Banner --------------------------------------------------------

function hideBanner() {
  banner.hidden = true;
  document.body.classList.remove("has-install-banner");
}

function updateBannerHint() {
  if (installPrompt) {
    bannerHint.textContent = "One tap to install — open it like an app.";
  } else if (platform === "ios") {
    bannerHint.textContent = "Tap Share, then Add to Home Screen.";
  } else if (platform === "android") {
    bannerHint.textContent = "Tap ⋮, then Add to home screen.";
  } else {
    bannerHint.textContent = "Install it as an app on this computer.";
  }
}

function updateUi() {
  const done = isInstalled();
  installButton.hidden = done;
  if (installMenuButton) installMenuButton.hidden = done;

  const showBanner = !done && !readDismissed();
  banner.hidden = !showBanner;
  document.body.classList.toggle("has-install-banner", showBanner);
  updateBannerHint();
}

// ----- Events --------------------------------------------------------

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  updateUi();
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installed = true;
  hideBanner();
  updateUi();
});

standalone.addEventListener("change", updateUi);

installButton.addEventListener("click", promptInstall);
installNow.addEventListener("click", () => {
  installDialog.close();
  promptInstall();
});
if (installMenuButton) {
  installMenuButton.addEventListener("click", () => {
    document.getElementById("menuPanel")?.classList.remove("open");
    promptInstall();
  });
}
bannerGo.addEventListener("click", promptInstall);
bannerClose.addEventListener("click", () => {
  writeDismissed();
  hideBanner();
});

arrangeDialog();
updateUi();
