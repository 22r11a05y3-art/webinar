const webinarDates = [
  new Date("2026-04-15T11:00:00+05:30"),
  new Date("2026-04-18T11:00:00+05:30"),
];
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbxza9nqLKWPm6nvXRPxIjhaLirFeLRKuErenFK43eoreviouDryIBV3thZ9UoOii3eXTw/exec";

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const form = document.getElementById("registrationForm");
const formMessage = document.getElementById("formMessage");
const sessionDateEl = document.getElementById("sessionDate");
const paymentScreen = document.getElementById("paymentScreen");
const successScreen = document.getElementById("successScreen");
const paymentSessionText = document.getElementById("paymentSessionText");
const paymentError = document.getElementById("paymentError");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");
const successMessage = document.getElementById("successMessage");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");

const sessionLabels = {
  wednesday: "This Wednesday (15 April)",
  saturday: "Next Saturday (18 April)",
};

let pendingPayload = null;
let pendingSelectedDate = "";

function formatTime(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const upcomingDate =
    webinarDates.find((date) => date.getTime() > now.getTime()) ||
    webinarDates[webinarDates.length - 1];

  const diff = upcomingDate.getTime() - now.getTime();

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = formatTime(days);
  hoursEl.textContent = formatTime(hours);
  minutesEl.textContent = formatTime(minutes);
  secondsEl.textContent = formatTime(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".fade-up").forEach((element) => {
  observer.observe(element);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    if (!targetElement) {
      return;
    }

    event.preventDefault();
    const navbarHeight = document.querySelector(".navbar").offsetHeight;
    const targetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight + 2;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  });
});

function setScreenState(screen, isActive) {
  if (!screen) {
    return;
  }

  screen.classList.toggle("active", isActive);
  screen.setAttribute("aria-hidden", isActive ? "false" : "true");

  const isAnyOpen = document.querySelector(".flow-screen.active");
  document.body.classList.toggle("flow-open", Boolean(isAnyOpen));
}

function getSessionText(value) {
  return sessionLabels[value] || "your selected session";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form) {
    return;
  }

  const formData = new FormData(form);
  const selectedValue = sessionDateEl?.value || "";
  pendingSelectedDate = getSessionText(selectedValue);

  pendingPayload = new URLSearchParams({
    firstName: (formData.get("firstName") || "").toString().trim(),
    lastName: (formData.get("lastName") || "").toString().trim(),
    email: (formData.get("email") || "").toString().trim(),
    phone: (formData.get("phone") || "").toString().trim(),
    sessionDate: selectedValue,
    paymentStatus: "paid",
    sendConfirmation: "1",
  });

  if (paymentSessionText) {
    paymentSessionText.textContent = `Selected session: ${pendingSelectedDate}`;
  }

  if (paymentError) {
    paymentError.textContent = "";
  }

  if (formMessage) {
    formMessage.textContent = "";
    formMessage.classList.remove("success", "error");
  }

  setScreenState(paymentScreen, true);
});

confirmPaymentBtn?.addEventListener("click", async () => {
  if (!pendingPayload) {
    return;
  }

  try {
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = "Processing...";

    // no-cors keeps Apps Script integration reliable across static hosting.
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: pendingPayload,
    });

    setScreenState(paymentScreen, false);

    if (successMessage) {
      successMessage.textContent =
        `Thank you for registering for ${pendingSelectedDate}. You will receive the webinar link via email.`;
    }

    setScreenState(successScreen, true);
    form.reset();
    pendingPayload = null;
    pendingSelectedDate = "";
  } catch (_) {
    if (paymentError) {
      paymentError.textContent =
        "Payment confirmation failed to submit. Please tap 'I Have Paid' again.";
    }
  } finally {
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = "I Have Paid";
  }
});

cancelPaymentBtn?.addEventListener("click", () => {
  setScreenState(paymentScreen, false);
  pendingPayload = null;
  pendingSelectedDate = "";
});

closeSuccessBtn?.addEventListener("click", () => {
  setScreenState(successScreen, false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (paymentScreen?.classList.contains("active")) {
    setScreenState(paymentScreen, false);
    pendingPayload = null;
    pendingSelectedDate = "";
    return;
  }

  if (successScreen?.classList.contains("active")) {
    setScreenState(successScreen, false);
  }
});
