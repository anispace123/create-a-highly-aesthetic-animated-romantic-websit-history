const snapContainer = document.querySelector(".snap-container");
const screens = document.querySelectorAll("[data-screen]");
const reveals = document.querySelectorAll(".reveal");
const typewriter = document.getElementById("typewriter");
const musicToggle = document.getElementById("music-toggle");
const bgMusic = document.getElementById("bg-music");
const secretButton = document.getElementById("secret-message-button");
const secretMessage = document.getElementById("secret-message");
const scrollTargets = document.querySelectorAll("[data-scroll-target]");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const particleCanvas = document.getElementById("particle-canvas");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeScreenId = "";
let typewriterStarted = false;
let typewriterFinished = false;
let userActivatedAudio = false;

function revealEntries(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}

const revealObserver = new IntersectionObserver(revealEntries, {
  root: snapContainer,
  threshold: 0.22
});

reveals.forEach((item) => revealObserver.observe(item));

function handleScreenActivation(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    screens.forEach((screen) => screen.classList.remove("active"));
    entry.target.classList.add("active");
    activeScreenId = entry.target.id;

    if (activeScreenId === "message" && !typewriterStarted) {
      runTypewriter();
    }

    if (activeScreenId === "finale") {
      burstHearts();
    }
  });
}

const screenObserver = new IntersectionObserver(handleScreenActivation, {
  root: snapContainer,
  threshold: 0.6
});

screens.forEach((screen) => screenObserver.observe(screen));

function runTypewriter() {
  if (!typewriter || typewriterStarted) {
    return;
  }

  typewriterStarted = true;
  const text = typewriter.dataset.text || "";

  if (prefersReducedMotion) {
    typewriter.textContent = text;
    typewriter.classList.add("done");
    typewriterFinished = true;
    return;
  }

  let index = 0;
  const interval = window.setInterval(() => {
    typewriter.textContent = text.slice(0, index + 1);
    index += 1;

    if (index >= text.length) {
      window.clearInterval(interval);
      typewriter.classList.add("done");
      typewriterFinished = true;
    }
  }, 42);
}

function toggleMusic() {
  if (!bgMusic) {
    return;
  }

  userActivatedAudio = true;

  if (bgMusic.paused) {
    bgMusic
      .play()
      .then(() => {
        musicToggle.classList.add("is-playing");
        musicToggle.setAttribute("aria-pressed", "true");
        musicToggle.querySelector(".music-label").textContent = "Pause our song";
      })
      .catch(() => {
        musicToggle.querySelector(".music-label").textContent = "Tap again for music";
      });
  } else {
    bgMusic.pause();
    musicToggle.classList.remove("is-playing");
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggle.querySelector(".music-label").textContent = "Play our song";
  }
}

musicToggle?.addEventListener("click", toggleMusic);

secretButton?.addEventListener("click", () => {
  const isVisible = secretMessage.classList.toggle("visible");
  secretMessage.setAttribute("aria-hidden", String(!isVisible));
});

scrollTargets.forEach((trigger) => {
  const navigate = () => {
    const target = document.querySelector(trigger.dataset.scrollTarget);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  trigger.addEventListener("click", navigate);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  });
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    if (prefersReducedMotion) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

function initCursor() {
  if (!cursorDot || !cursorRing || window.innerWidth <= 640 || prefersReducedMotion) {
    return;
  }

  let ringX = window.innerWidth / 2;
  let ringY = window.innerHeight / 2;
  let mouseX = ringX;
  let mouseY = ringY;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  const hoverables = document.querySelectorAll("button, .memory-card, .love-card, .scroll-indicator");
  hoverables.forEach((element) => {
    element.addEventListener("mouseenter", () => cursorRing.classList.add("is-hover"));
    element.addEventListener("mouseleave", () => cursorRing.classList.remove("is-hover"));
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(animateRing);
  }

  animateRing();
}

function initParticles() {
  if (!particleCanvas) {
    return;
  }

  const context = particleCanvas.getContext("2d");
  const particles = [];
  const particleCount = Math.min(40, Math.round(window.innerWidth / 32));

  function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }

  function createParticle(index) {
    const isHeart = index % 6 === 0;
    return {
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      size: isHeart ? Math.random() * 10 + 8 : Math.random() * 4 + 1,
      speedY: Math.random() * 0.45 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.45 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      type: isHeart ? "heart" : "dot"
    };
  }

  function resetParticles() {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(createParticle(index));
    }
  }

  function drawHeart(x, y, size, alpha) {
    context.save();
    context.translate(x, y);
    context.scale(size / 16, size / 16);
    context.beginPath();
    context.moveTo(0, -4);
    context.bezierCurveTo(8, -14, 18, -2, 0, 12);
    context.bezierCurveTo(-18, -2, -8, -14, 0, -4);
    context.closePath();
    context.fillStyle = `rgba(255, 151, 199, ${alpha})`;
    context.shadowBlur = 18;
    context.shadowColor = "rgba(255, 110, 176, 0.5)";
    context.fill();
    context.restore();
  }

  function draw() {
    context.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach((particle) => {
      particle.y -= particle.speedY;
      particle.x += particle.speedX + Math.sin(particle.pulse) * 0.15;
      particle.pulse += 0.02;

      if (particle.y < -20) {
        particle.y = particleCanvas.height + 20;
        particle.x = Math.random() * particleCanvas.width;
      }

      const alpha = particle.alpha + Math.sin(particle.pulse) * 0.08;

      if (particle.type === "heart") {
        drawHeart(particle.x, particle.y, particle.size, alpha);
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${Math.max(alpha, 0.12)})`;
        context.shadowBlur = 12;
        context.shadowColor = "rgba(255, 188, 221, 0.36)";
        context.fill();
      }
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    }
  }

  resizeCanvas();
  resetParticles();
  draw();
  window.addEventListener("resize", () => {
    resizeCanvas();
    resetParticles();
  });
}

function burstHearts() {
  const burstCount = 10;

  for (let index = 0; index < burstCount; index += 1) {
    const heart = document.createElement("div");
    heart.textContent = "❤";
    heart.style.position = "fixed";
    heart.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
    heart.style.top = `${58 + (Math.random() - 0.5) * 10}%`;
    heart.style.fontSize = `${Math.random() * 18 + 16}px`;
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "40";
    heart.style.color = "rgba(255, 164, 206, 0.9)";
    heart.style.textShadow = "0 0 20px rgba(255, 118, 182, 0.6)";
    heart.style.transition = "transform 1200ms ease, opacity 1200ms ease";
    document.body.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.transform = `translate(${(Math.random() - 0.5) * 240}px, -${Math.random() * 220 + 80}px) scale(${Math.random() * 0.8 + 0.7})`;
      heart.style.opacity = "0";
    });

    window.setTimeout(() => heart.remove(), 1300);
  }
}

document.addEventListener(
  "click",
  () => {
    if (userActivatedAudio || !bgMusic) {
      return;
    }

    bgMusic.volume = 0.72;
  },
  { once: true }
);

initCursor();
initParticles();
