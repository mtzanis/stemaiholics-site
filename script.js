const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(
  ".section, .trust-strip, .hero-copy, .hero-card"
);
const contactEmail = document.body.dataset.contactEmail;
const contactLink = document.querySelector("[data-contact-link]");
const contactCta = document.querySelector("[data-contact-cta]");

if (contactEmail) {
  if (contactLink) {
    contactLink.href = `mailto:${contactEmail}`;
    contactLink.textContent = contactEmail;
  }

  if (contactCta) {
    contactCta.href = `mailto:${contactEmail}?subject=STEMAIholics%20School%20Inquiry`;
  }
}

if (menuToggle && siteHeader && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteHeader.classList.toggle("nav-active", !isExpanded);
    document.body.classList.toggle("nav-open", !isExpanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteHeader.classList.remove("nav-active");
      document.body.classList.remove("nav-open");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => {
  item.classList.add("reveal");
  observer.observe(item);
});
