/* Luca Suque — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;

  /* ---------- Preloader ---------- */
  const pre = $(".preloader");
  const count = $("[data-count]");
  const mark = $(".preloader__mark");
  let shown = 0, loaded = false, finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    pre.classList.add("is-done");
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    setTimeout(() => pre.remove(), 1300);
  };
  window.addEventListener("load", () => (loaded = true));
  const tick = () => {
    const target = loaded ? 100 : 86;
    shown += Math.max(0.6, (target - shown) * (loaded ? 0.14 : 0.04));
    if (shown > target) shown = target;
    const v = Math.round(shown);
    count.textContent = v;
    mark.style.backgroundPosition = `0 ${100 - v}%`;
    if (v >= 100) return setTimeout(finish, 250);
    requestAnimationFrame(tick);
  };
  if (reduce) finish(); else requestAnimationFrame(tick);
  setTimeout(finish, 6000); // safety net

  /* ---------- Year ---------- */
  const y = $("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled / hide on scroll down ---------- */
  const nav = $("[data-nav]");
  let lastY = 0;
  const onScroll = () => {
    const sy = window.scrollY;
    nav.classList.toggle("is-scrolled", sy > 40);
    const menuOpen = $("[data-menu]").classList.contains("is-open");
    nav.classList.toggle("is-hidden", !menuOpen && sy > lastY && sy > 400);
    lastY = sy;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("[data-burger]");
  const menu = $("[data-menu]");
  const toggleMenu = (open) => {
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Active nav link ---------- */
  const links = $$(".nav__links a");
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Word-by-word statement ---------- */
  const statement = $("[data-words]");
  if (statement) {
    const hot = ["teclas", "faders.", "palco", "estrada"];
    statement.innerHTML = statement.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w${hot.some((h) => w.toLowerCase().startsWith(h)) ? " hot" : ""}">${w}</span>`)
      .join(" ");
    const words = $$(".w", statement);
    const lightWords = () => {
      const r = statement.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const n = Math.floor(p * words.length * 1.05);
      words.forEach((w, i) => {
        const lit = i < n;
        w.classList.toggle("is-lit", lit && !w.classList.contains("hot"));
        w.classList.toggle("is-hot", lit && w.classList.contains("hot"));
      });
    };
    if (reduce) words.forEach((w) => w.classList.add(w.classList.contains("hot") ? "is-hot" : "is-lit"));
    else { window.addEventListener("scroll", lightWords, { passive: true }); lightWords(); }
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal, .reveal-img, .live, .contact__title").forEach((el) => io.observe(el));

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.counter);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const fmt = (v) => v.toFixed(dec).replace(".", ",");
      if (reduce) { el.textContent = fmt(end); cio.unobserve(el); return; }
      const t0 = performance.now(), dur = 1800;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(end * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-counter]").forEach((el) => cio.observe(el));

  /* ---------- Parallax ---------- */
  const para = $$("[data-parallax]");
  if (!reduce && para.length) {
    let ticking = false;
    const run = () => {
      const vh = window.innerHeight;
      para.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const speed = parseFloat(el.dataset.parallax);
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${center * speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const label = $(".cursor__label");
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  if (finePointer && !reduce) {
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("is-visible"); }, { passive: true });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    const loop = () => {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, [data-hover], label").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    $$(".g").forEach((el) => {
      el.addEventListener("mouseenter", () => { cursor.classList.add("is-view"); label.textContent = "Ver"; });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-view"));
    });
  } else if (cursor) cursor.remove();

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1), color .45s";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Services hover image ---------- */
  const float = $(".svc__float");
  const floatImg = float && $("img", float);
  if (float && finePointer && !reduce) {
    let fx = 0, fy = 0, tx = 0, ty = 0, active = false;
    $$(".svc__item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        floatImg.src = item.dataset.img;
        float.classList.add("is-on"); active = true;
      });
      item.addEventListener("mouseleave", () => { float.classList.remove("is-on"); active = false; });
    });
    window.addEventListener("mousemove", (e) => { tx = e.clientX + 160; ty = e.clientY; }, { passive: true });
    const follow = () => {
      fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12;
      if (active || float.classList.contains("is-on")) float.style.left = fx + "px", float.style.top = fy + "px";
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Lightbox ---------- */
  const lb = $("[data-lightbox]");
  const lbImg = $("img", lb);
  let lastFocus = null;
  const closeLb = () => { lb.classList.remove("is-open"); body.style.overflow = ""; lastFocus && lastFocus.focus(); };
  $$(".g").forEach((g) => g.addEventListener("click", () => {
    lastFocus = g;
    lbImg.src = g.dataset.full;
    lbImg.alt = $("img", g).alt;
    lb.classList.add("is-open");
    body.style.overflow = "hidden";
    $(".lightbox__close", lb).focus();
  }));
  lb.addEventListener("click", (e) => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lb.classList.contains("is-open")) closeLb();
    if (menu.classList.contains("is-open")) toggleMenu(false);
  });

  /* ---------- Contact form → Instagram Direct ---------- */
  const form = $("[data-form]");
  const note = $("[data-note]");
  const toast = $("[data-toast]");
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("is-on"), 4200);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    }
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const msg = form.mensagem.value.trim();
    form.nome.parentElement.classList.toggle("is-error", !nome);
    form.mensagem.parentElement.classList.toggle("is-error", !msg);
    if (!nome || !msg) { note.textContent = "Preencha seu nome e fale um pouco do projeto."; return; }
    const servs = $$("input[name=servico]:checked", form).map((i) => i.value);
    const contato = form.contato.value.trim();
    const text =
      `Fala, Luca! Sou ${nome}.` +
      (servs.length ? `\nPreciso de: ${servs.join(", ")}.` : "") +
      `\n\n${msg}` +
      (contato ? `\n\nContato: ${contato}` : "");
    // Open the window synchronously inside the user gesture so popup blockers allow it
    const win = window.open("https://ig.me/m/luca.suque", "_blank");
    if (win) win.opener = null;
    const ok = await copy(text);
    note.textContent = ok ? "Mensagem copiada! Cole no Direct e envie." : "Abra o Direct e envie sua mensagem.";
    showToast(ok ? "✓ Mensagem copiada — é só colar no Direct" : "Abrindo o Direct do Instagram…");
    if (!win) setTimeout(() => (location.href = "https://ig.me/m/luca.suque"), 900);
  });
})();
