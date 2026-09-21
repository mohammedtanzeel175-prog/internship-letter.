(() => {
  "use strict";

  // ============================
  // CHANGE THIS URL FOR THE CTA
  // ============================
  const CTA_URL = "https://mail.google.com/mail/?view=cm&fs=1&to=mohammedtanzeel175@gmail.com";

  const scene = document.getElementById("scene");
  const postbox = document.getElementById("postbox");
  const intro = document.getElementById("intro");
  const letter = document.getElementById("letter");
  const burst = document.getElementById("burst");
  const dustLayer = document.getElementById("dust");
  const smokeLayer = document.getElementById("smoke");
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  const message = document.getElementById("message");
  const mainMessage = document.getElementById("mainMessage");
  const finalMessage = document.getElementById("finalMessage");
  const cta = document.getElementById("cta");
  const restart = document.getElementById("restart");

  cta.href = CTA_URL;
  
  cta.addEventListener("click", () => {
  window.open(CTA_URL, "_blank");
});

  let state = "IDLE";
  let started = false;
  let particleCountTarget = 0;
  let particles = [];
  let raf = 0;
  let audioCtx = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function setState(next) {
    state = next;
    scene.dataset.state = next;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function playClick() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(105, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + .22);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.18, now + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .28);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + .3);

      const bell = audioCtx.createOscillator();
      const bellGain = audioCtx.createGain();
      bell.type = "triangle";
      bell.frequency.value = 630;
      bellGain.gain.setValueAtTime(.0001, now + .55);
      bellGain.gain.exponentialRampToValueAtTime(.025, now + .58);
      bellGain.gain.exponentialRampToValueAtTime(.0001, now + 1.0);
      bell.connect(bellGain).connect(audioCtx.destination);
      bell.start(now + .55);
      bell.stop(now + 1.05);
    } catch (_) {}
  }

  function makeDust(count = 26) {
    dustLayer.innerHTML = "";
    const rect = postbox.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = "dust";
      p.style.left = `${rect.left + rect.width * (.2 + Math.random() * .6)}px`;
      p.style.top = `${rect.top + rect.height * (.25 + Math.random() * .25)}px`;
      p.style.setProperty("--x", `${(Math.random() - .5) * 150}px`);
      p.style.setProperty("--y", `${-40 - Math.random() * 140}px`);
      p.style.setProperty("--dur", `${1.8 + Math.random() * 2.4}s`);
      p.style.animationDelay = `${Math.random() * .7}s`;
      dustLayer.appendChild(p);
    }
  }

  function makeSmoke(count = 8) {
    smokeLayer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = "smoke";
      p.style.left = `${50 + (Math.random() - .5) * 13}%`;
      p.style.top = `${37 + Math.random() * 8}%`;
      p.style.setProperty("--x", `${(Math.random() - .5) * 130}px`);
      p.style.setProperty("--y", `${-100 - Math.random() * 150}px`);
      p.style.setProperty("--dur", `${2.4 + Math.random() * 2.2}s`);
      p.style.animationDelay = `${Math.random() * .6}s`;
      smokeLayer.appendChild(p);
    }
  }

  function spawnParticles(count) {
    const colors = ["#5a241c", "#7a321f", "#a86528", "#c28b3d", "#d3ad5d", "#8d5d2d"];
    const shapes = ["leaf", "leaf", "petal", "dot"];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * innerWidth,
        y: -20 - Math.random() * innerHeight * .25,
        vx: (Math.random() - .5) * .28,
        vy: .35 + Math.random() * .65,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - .5) * .018,
        size: 3 + Math.random() * 5,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: .008 + Math.random() * .015,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        alpha: .35 + Math.random() * .5
      });
    }
  }

  function drawParticle(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;

    if (p.shape === "dot") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * .45, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * .65, p.size * 1.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(245,210,140,.14)";
      ctx.lineWidth = .6;
      ctx.stroke();
    }
    ctx.restore();
  }

  function animateParticles() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (const p of particles) {
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * .34;
      p.y += p.vy;
      p.rot += p.vr;

      if (p.y > innerHeight + 30) {
        p.y = -20;
        p.x = Math.random() * innerWidth;
      }
      if (p.x < -30) p.x = innerWidth + 30;
      if (p.x > innerWidth + 30) p.x = -30;

      drawParticle(p);
    }

    raf = requestAnimationFrame(animateParticles);
  }

  async function growPetals() {
    setState("PETALS");
    canvas.classList.add("active");

    particleCountTarget = 8;
    spawnParticles(8);
    if (!raf) animateParticles();

    // Gradual growth: never dump 90 particles on screen at once.
    for (const target of [18, 30, 45, 60, 75, 88]) {
      await sleep(430);
      if (particles.length < target) spawnParticles(target - particles.length);
    }

    scene.classList.add("warm");
  }

  async function showLines() {
    setState("MESSAGE_REVEAL");
    const lines = [...message.querySelectorAll(".line")];
    for (let i = 0; i < lines.length; i++) {
      await sleep(i === 0 ? 450 : 850);
      lines[i].classList.add("show");
    }

    await sleep(700);
    setState("MAIN_MESSAGE");
    mainMessage.classList.add("show");
    await sleep(2300);
  }

  async function showFinal() {
    await sleep(900);
    setState("FINAL_MESSAGE");
    finalMessage.classList.add("show");

    await sleep(2300);
    cta.classList.add("show");

    await sleep(1200);
    setState("COMPLETE");
    restart.classList.add("visible");
  }

  async function runSequence() {
    if (started || state !== "IDLE") return;
    started = true;

    setState("TAPPING");
    intro.classList.add("hidden");
    scene.classList.add("revealing");
    postbox.classList.add("tap");
    playClick();

    await sleep(520);
    postbox.classList.remove("tap");

    setState("DOOR_OPENING");
    postbox.classList.add("open");

    await sleep(1050);
    setState("LIGHT_REVEAL");
    postbox.classList.add("light");
    burst.classList.remove("fire");
    void burst.offsetWidth;
    burst.classList.add("fire");
    makeDust(34);

    await sleep(650);
    setState("SMOKE");
    makeSmoke(10);

    await sleep(700);
    setState("LETTER_EMERGING");
    letter.classList.add("visible");

    await sleep(1250);
    await showLines();

    // CRITICAL: petals start only AFTER main message has completely finished.
    await growPetals();

    await sleep(1200);
    await showFinal();
  }

  function reset() {
    cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    started = false;
    setState("IDLE");

    scene.classList.remove("revealing", "warm");
    intro.classList.remove("hidden");
    postbox.className = "postbox-wrap";
    letter.classList.remove("visible");
    burst.classList.remove("fire");
    canvas.classList.remove("active");
    dustLayer.innerHTML = "";
    smokeLayer.innerHTML = "";
    message.querySelectorAll(".line").forEach(x => x.classList.remove("show"));
    mainMessage.classList.remove("show");
    finalMessage.classList.remove("show");
    cta.classList.remove("show");
    restart.classList.remove("visible");
  }

  postbox.addEventListener("click", runSequence);
  postbox.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      runSequence();
    }
  });
  restart.addEventListener("click", reset);
})();
