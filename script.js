const webinarDates = [
  new Date("2026-04-12T11:00:00+05:30"),
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
const submitBtn = form?.querySelector('button[type="submit"]');

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form) {
    return;
  }

  const formData = new FormData(form);
  const selectedValue = sessionDateEl?.value || "";
  const sessionLabels = {
    sunday: "This Sunday (12 April)",
    saturday: "Next Saturday (18 April)",
  };
  const selectedDate = sessionLabels[selectedValue] || "your selected session";

  const payload = new URLSearchParams({
    firstName: (formData.get("firstName") || "").toString().trim(),
    lastName: (formData.get("lastName") || "").toString().trim(),
    email: (formData.get("email") || "").toString().trim(),
    phone: (formData.get("phone") || "").toString().trim(),
    sessionDate: selectedValue,
    sendConfirmation: "1",
  });

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    // no-cors keeps Apps Script integration reliable across static hosting.
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    });

    formMessage.textContent =
      `Thank you for registering for ${selectedDate}! You will receive the webinar link via email.`;
    formMessage.classList.remove("error");
    formMessage.classList.add("success");
    form.reset();
  } catch (_) {
    formMessage.textContent =
      "We could not submit your registration right now. Please try again.";
    formMessage.classList.remove("success");
    formMessage.classList.add("error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Registration";
    }
  }
});
