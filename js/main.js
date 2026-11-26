import { animate as anime, stagger } from "https://cdn.jsdelivr.net/npm/animejs@4/+esm";
import { animate, press, inView, scroll } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Первый экран: появление ---------- */
const title = $("[data-title]");
title.innerHTML = [...title.textContent]
  .map((c) => `<span class="ch">${c}</span>`)
  .join("");

if (!reduced) {
  // Название проявляется по буквам (Anime.js)
  anime(".hero__title .ch", {
    opacity: [0, 1],
    translateY: ["0.35em", "0em"],
    filter: ["blur(6px)", "blur(0px)"],
    delay: stagger(55, { start: 250 }),
    duration: 1100,
    ease: "outExpo",
  });

  // Золотая линия раскрывается от центра (Anime.js)
  anime("[data-rule]", { scaleX: [0, 1], duration: 900, delay: 900, ease: "inOutQuad" });

  // Остальные элементы плавно поднимаются (Motion)
  $$("[data-reveal]").forEach((el, i) => {
    el.style.opacity = 0;
    animate(el, { opacity: [0, 1], y: [18, 0] }, { duration: 0.9, delay: 0.1 + i * 0.18 + (i > 0 ? 0.9 : 0), ease: [0.22, 0.61, 0.36, 1] });
  });

}

/* ---------- Кнопки на телефоне: отклик на касание (Motion) ----------
   Палец коснулся — кнопка чуть приподнимается и подсвечивается, как при наведении на компьютере;
   отпустил — мягко возвращается на место с лёгкой пружинкой. */
const touchOnly = matchMedia("(hover: none), (pointer: coarse)").matches;
if (touchOnly && !reduced) {
  press(".btn", (btn) => {
    btn.classList.add("is-pressed");
    animate(btn, { y: -3, scale: 0.97 }, { type: "spring", stiffness: 520, damping: 26 });
    return () => {
      btn.classList.remove("is-pressed");
      animate(btn, { y: 0, scale: 1 }, { type: "spring", stiffness: 380, damping: 14 });
    };
  });

  // Мягкий блик по кнопкам первого экрана: проходит слева направо раз в несколько секунд
  $$(".hero__actions .btn").forEach((btn, i) => {
    const shine = document.createElement("span");
    shine.className = "btn__shine";
    shine.setAttribute("aria-hidden", "true");
    btn.prepend(shine);
    animate(shine, { x: ["-120%", "330%"] }, {
      duration: 1.6, ease: "easeInOut",
      delay: 2.6 + i * 0.35,          // после появления кнопок, вторая чуть позже первой
      repeat: Infinity, repeatDelay: 4,
    });
  });
}

/* ---------- Шапка: становится зелёной при прокрутке ---------- */
const header = $("[data-header]");
const onScroll = () => header.classList.toggle("is-solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

if (!reduced) {
  animate(header, { opacity: [0, 1], y: [-16, 0] }, { duration: 0.8, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] });
}

/* ---------- Мобильное меню ---------- */
const burger = $("[data-burger]");
const drawer = $("[data-drawer]");
const drawerItems = $$(".drawer__nav a, .drawer .ornament, .drawer__account > *", drawer);
let menuRun = 0; // защита от быстрых повторных нажатий
const setMenu = async (open) => {
  const run = ++menuRun;
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  document.body.classList.toggle("menu-open", open);

  if (reduced) { drawer.hidden = !open; return; }

  if (open) {
    drawer.hidden = false;
    drawerItems.forEach((el) => (el.style.opacity = 0));
    // фон мягко проявляется, пункты всплывают по одному (Motion)
    animate(drawer, { opacity: [0, 1] }, { duration: 0.45, ease: "easeOut" });
    animate(drawerItems, { opacity: [0, 1], y: [22, 0] },   // только прозрачность и сдвиг — без размытия, оно тормозит
      { delay: (i) => 0.1 + i * 0.05, duration: 0.55, ease: [0.22, 0.61, 0.36, 1] });
  } else {
    // пункты уходят вверх в обратном порядке, затем гаснет фон
    animate(drawerItems, { opacity: 0, y: -10 },
      { delay: (i) => (drawerItems.length - 1 - i) * 0.025, duration: 0.25, ease: "easeIn" });
    await animate(drawer, { opacity: 0 }, { delay: 0.2, duration: 0.3, ease: "easeIn" });
    if (run === menuRun) drawer.hidden = true;
  }
};
burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
// окно растянули до широкого — мобильное меню закрываем
matchMedia("(min-width: 1281px)").addEventListener("change", (e) => e.matches && setMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && !drawer.hidden && setMenu(false));
$$("a, button", drawer).forEach((el) => el.addEventListener("click", () => setMenu(false)));

/* ---------- Корзина ---------- */
const cart = $("[data-cart]");
const cartShade = $("[data-cart-shade]");
const setCart = (open) => {
  cart.hidden = cartShade.hidden = !open;
  document.documentElement.classList.toggle("is-locked", open);
  if (open && !reduced) {
    animate(cart, { x: [40, 0], opacity: [0, 1] }, { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] });
    animate(cartShade, { opacity: [0, 1] }, { duration: 0.3 });
  }
};
$("[data-open-cart]").addEventListener("click", () => setCart(true));
$$("[data-close-cart]").forEach((b) => b.addEventListener("click", () => setCart(false)));
cartShade.addEventListener("click", () => setCart(false));
addEventListener("keydown", (e) => e.key === "Escape" && !cart.hidden && setCart(false));

/* ---------- Плашки и фото: плавная смена слайдов ---------- */
const photos = $$("[data-hero-media] img");
const slides = $$(".plaque__slide");
const dots = $$(".plaque__dots button");
let current = 0;
let timer;

// Новое фото проявляется поверх старого, старое остаётся под ним до конца перехода —
// так нет провала в темноту и скачков масштаба
photos.forEach((p) =>
  p.addEventListener("transitionend", (e) => {
    // новое фото проявилось полностью — убираем то, что лежало под ним
    if (e.propertyName === "opacity" && p.classList.contains("is-active"))
      photos.forEach((o) => o !== p && o.classList.remove("is-leaving"));
  })
);
const showSlide = (i) => {
  if (i === current) return;
  // при быстром листании под новым фото остаётся только то, что сейчас видно
  photos.forEach((p) => p !== photos[current] && p.classList.remove("is-leaving"));
  photos[current].classList.replace("is-active", "is-leaving");
  slides[current].classList.remove("is-active");
  dots[current].setAttribute("aria-selected", "false");
  current = i;
  photos[i].classList.add("is-active");
  slides[i].classList.add("is-active");
  dots[i].setAttribute("aria-selected", "true");
};
const next = () => showSlide((current + 1) % slides.length);
const prev = () => showSlide((current - 1 + slides.length) % slides.length);
const play = () => { clearInterval(timer); if (!reduced) timer = setInterval(next, 7000); };
// Ручное переключение: показать слайд и начать отсчёт 7 секунд заново
const go = (fn) => { fn(); play(); };

dots.forEach((d, i) => d.addEventListener("click", () => go(() => showSlide(i))));
$("[data-prev]").addEventListener("click", () => go(prev));
$("[data-next]").addEventListener("click", () => go(next));

// Стрелки ← → на клавиатуре (когда не открыто окно)
addEventListener("keydown", (e) => {
  if (document.querySelector("dialog[open]") || e.target.closest?.("input, textarea, select")) return;
  if (e.key === "ArrowLeft") go(prev);
  if (e.key === "ArrowRight") go(next);
});

// Свайп пальцем или мышью по первому экрану
let startX = null;
const hero = $(".hero");
hero.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button, a")) return;
  startX = e.clientX;
});
hero.addEventListener("pointerup", (e) => {
  if (startX === null) return;
  const dx = e.clientX - startX;
  startX = null;
  if (Math.abs(dx) > 50) go(dx < 0 ? next : prev);
});
hero.addEventListener("pointercancel", () => (startX = null));
$(".plaque").addEventListener("mouseenter", () => clearInterval(timer));
$(".plaque").addEventListener("mouseleave", play);
play();

/* ---------- Бронирование ---------- */
const booking = $("[data-booking]");
const form = $("[data-booking-form]");
form.date.min = new Date().toISOString().slice(0, 10);

$$("[data-open-booking]").forEach((b) =>
  b.addEventListener("click", () => {
    booking.showModal();
    if (!reduced) animate(form, { opacity: [0, 1], y: [24, 0] }, { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] });
  })
);
booking.addEventListener("click", (e) => e.target === booking && booking.close());
form.addEventListener("submit", (e) => {
  if (e.submitter?.value !== "send") return;
  e.preventDefault();
  // Отправку подключим к реальному приёму заявок позже
  form.innerHTML = `<h2 class="booking__title">Спасибо!</h2>
    <p class="booking__note">Мы свяжемся с вами по телефону, чтобы подтвердить детали бронирования.</p>
    <button class="btn btn--primary booking__submit" type="button" onclick="this.closest('dialog').close()">Хорошо</button>`;
});

/* ---------- Разделы из подвала (подписка, вопросы, документы…) ---------- */
const sheet = $("[data-sheet-dialog]");
const sheetBody = $("[data-sheet-body]");
let info; // тексты с их сайта: data/info.json
const loadInfo = () => (info ??= fetch("data/info.json").then((r) => r.json()));

// Мелкие опечатки оригинала
const fixTypos = (html) =>
  html.replace(/плошадках/g, "площадках").replace(/презвоним/g, "перезвоним").replace(/уропа/g, "укропа");

const fillers = {
  async faq(root) {
    const { faq } = await loadInfo();
    $("[data-faq]", root).innerHTML = faq
      .map((f) => `<details class="faq__item"><summary>${f.q}</summary><div class="faq__answer">${fixTypos(f.a)}</div></details>`)
      .join("");
  },
  async agreement(root) {
    const { agreement } = await loadInfo();
    $("[data-agreement]", root).innerHTML = fixTypos(agreement.html);
  },
  async docs(root) {
    const { docs } = await loadInfo();
    $("[data-docs]", root).innerHTML = docs
      .map((d) => `<li><a class="sheet__doc" href="${d.file}" target="_blank" rel="noopener">${d.title} <span>PDF, ${d.kb} КБ</span></a></li>`)
      .join("");
  },
};

const openSheet = async (name) => {
  sheetBody.replaceChildren($(`#sheet-${name}`).content.cloneNode(true));
  await fillers[name]?.(sheetBody);
  sheet.showModal();
  $(".sheet__inner", sheet).scrollTop = 0;
  if (!reduced) {
    animate($(".sheet__inner", sheet), { opacity: [0, 1], y: [24, 0] }, { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] });
    anime($(".ornament", sheet), { scaleX: [0, 1], duration: 700, delay: 150, ease: "inOutQuad" });
  }
};

$$("[data-sheet]").forEach((b) => b.addEventListener("click", () => openSheet(b.dataset.sheet)));
$("[data-sheet-close]").addEventListener("click", () => sheet.close());
sheet.addEventListener("click", (e) => e.target === sheet && sheet.close());

// Формы подписки и обратной связи: пока без отправки, показываем благодарность
sheetBody.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-thanks]");
  if (!form) return;
  e.preventDefault();
  form.outerHTML = `<p class="sheet__thanks">${form.dataset.thanks}</p>`;
});

/* =====================================================================
   О РЕСТОРАНЕ: появление при прокрутке (Motion + Anime.js)
   ===================================================================== */
const EASE = [0.22, 0.61, 0.36, 1];

// Заголовок раздела разбиваем на буквы для Anime.js
$$("[data-letters]").forEach((h) => {
  h.setAttribute("aria-label", h.textContent);
  // буквы собраны в слова, чтобы слово не разрывалось при переносе строки
  h.innerHTML = h.textContent.split(" ")
    .map((w) => `<span class="word" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join("")}</span>`)
    .join(" ");
});

if (!reduced) {
  // Стартовое (скрытое) состояние задаём из JS: без скриптов всё просто видно
  $$("[data-up]").forEach((el) => (el.style.opacity = 0));
  $$("[data-letters] .ch").forEach((el) => (el.style.opacity = 0));
  $$("[data-ornament], [data-dropcap]").forEach((el) => (el.style.opacity = 0));
  // «шторка» — на снимке внутри рамки; саму рамку не прячем, иначе браузер не заметит её появление
  $$("[data-photo] img").forEach((img) => (img.style.clipPath = "inset(100% 0% 0% 0%)"));

  // Текст плавно поднимается (Motion)
  $$("[data-up]").forEach((el) =>
    inView(el, () => { animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.9, ease: EASE }); }, { amount: 0.3 })
  );

  // Заголовок собирается по буквам, затем рисуется орнамент (Anime.js)
  $$("[data-letters]").forEach((h) =>
    inView(h, () => {
      anime(h.querySelectorAll(".ch"), {
        opacity: [0, 1], translateY: ["0.5em", "0em"], rotate: [6, 0],
        delay: stagger(32), duration: 900, ease: "outExpo",
      });
      const orn = h.parentElement.querySelector("[data-ornament]");
      if (orn) anime(orn, { opacity: [0, 1], scaleX: [0, 1], duration: 900, delay: 500, ease: "inOutQuad" });
    }, { amount: 0.5 })
  );

  // Буквица «распускается» с лёгкой пружинкой (Anime.js)
  $$("[data-dropcap]").forEach((d) =>
    inView(d, () => {
      anime(d, { opacity: [0, 1], scale: [0.4, 1], rotate: [-10, 0], duration: 1200, delay: 150, ease: "outElastic(1, .6)" });
    }, { amount: 0.8 })
  );

  // Фото открываются «шторкой» снизу вверх, а снимок внутри мягко отдаляется (Motion)
  const galleryAll = $$(".gallery__item");
  $$("[data-photo]").forEach((el) => {
    const img = el.querySelector("img");
    inView(el, () => {
      // соседние фото галереи появляются с небольшим сдвигом
      const delay = el.classList.contains("gallery__item") ? (galleryAll.indexOf(el) % 3) * 0.12 : 0;
      img.style.transition = "none"; // CSS-плавность наведения не мешает Motion во время появления
      animate(img, { clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] },
        { duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }).then(() => (img.style.clipPath = ""));
      animate(img, { scale: [1.18, 1] }, { duration: 1.6, delay, ease: EASE })
        .then(() => { img.style.transform = ""; img.style.transition = ""; });
    }, { amount: 0.15 });
  });
}

/* ---------- Переход с первого экрана: лист «О ресторане» наезжает, текст первого экрана тает (Motion) ---------- */
if (!reduced) {
  const aboutSec = $("#about");
  const fade = { target: aboutSec, offset: ["start end", "start 0.25"] };
  scroll(animate($(".hero__content"), { opacity: [1, 0], y: [0, -70] }, { ease: "linear" }), fade);
  // нижняя строка сама проявляется при загрузке — подключаем её таяние после этого
  setTimeout(() => scroll(animate($(".hero__links"), { opacity: [1, 0] }, { ease: "linear" }), fade), 3000);
}

/* ---------- Плавный переезд к разделам (Motion) ----------
   Цель пересчитывается на каждом кадре: пока страница едет, ниже догружаются картинки
   и разделы сдвигаются — так мы всё равно приезжаем точно к началу раздела. */
let glideRun = null;
const glide = (getY) => {
  if (reduced) { scrollTo(0, getY()); return Promise.resolve(); }
  glideRun?.stop();
  document.documentElement.style.scrollBehavior = "auto";
  const from = scrollY;
  const dist = Math.abs(getY() - from);
  glideRun = animate(0, 1, {
    duration: Math.min(1.4, 0.6 + dist / 2500), ease: [0.65, 0, 0.35, 1],
    onUpdate: (p) => scrollTo(0, from + (getY() - from) * p),
  });
  return glideRun.then(() => {
    scrollTo(0, getY());   // последний точный шаг
    document.documentElement.style.scrollBehavior = "";
  });
};
const sectionY = (el) => () => el.getBoundingClientRect().top + scrollY - header.offsetHeight + 10;

document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || link.hasAttribute("data-open-tab")) return;
  const id = link.getAttribute("href").slice(1);
  const target = id === "top" ? document.body : document.getElementById(id);
  if (!target) return; // раздела ещё нет — ничего не делаем
  e.preventDefault();
  glide(id === "top" ? () => 0 : sectionY(target)).then(() => history.replaceState(null, "", "#" + id));
});

/* ---------- Лента фото интерьера ---------- */
const strip = $("[data-strip]");
const stripView = $("[data-strip-viewport]");
const stripTrack = $("[data-strip-track]");
const stripBar = $("[data-strip-bar]");
const stripPrev = $("[data-strip-prev]");
const stripNext = $("[data-strip-next]");

// При прокрутке страницы лента сама плавно едет влево, а фото слегка «плывут»:
// чётные вверх, нечётные вниз — получается живая глубина (Motion)
if (!reduced) {
  const pass = { target: strip, offset: ["start end", "end start"] };
  scroll(animate(stripTrack, { x: [100, -120] }, { ease: "linear" }), pass);
  $$(".gallery__item", stripTrack).forEach((item, i) =>
    scroll(animate(item, { y: i % 2 ? [30, -30] : [-20, 20] }, { ease: "linear" }), pass)
  );
}

// Стрелки: листают на ~ширину экрана, у краёв гаснут; полоса показывает, сколько пролистано
const stripMax = () => stripView.scrollWidth - stripView.clientWidth;
const updateStrip = () => {
  const p = stripMax() > 0 ? stripView.scrollLeft / stripMax() : 0;
  stripBar.style.transform = `scaleX(${Math.max(0.06, p)})`;
  stripPrev.disabled = stripView.scrollLeft < 4;
  stripNext.disabled = stripView.scrollLeft > stripMax() - 4;
};
stripView.addEventListener("scroll", updateStrip, { passive: true });
addEventListener("resize", updateStrip);
$$(".gallery__item img", stripTrack).forEach((img) => img.addEventListener("load", updateStrip));
updateStrip();

const stripStep = (dir) => {
  const to = Math.max(0, Math.min(stripMax(), stripView.scrollLeft + dir * stripView.clientWidth * 0.7));
  if (reduced) { stripView.scrollLeft = to; return; }
  animate(stripView.scrollLeft, to, { duration: 0.9, ease: [0.65, 0, 0.35, 1], onUpdate: (v) => (stripView.scrollLeft = v) });
};
stripPrev.addEventListener("click", () => stripStep(-1));
stripNext.addEventListener("click", () => stripStep(1));

// Перетаскивание мышью (на телефоне лента листается пальцем сама)
let drag = null;
stripView.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 0) return;
  drag = { x: e.clientX, left: stripView.scrollLeft, moved: false };
});
addEventListener("pointermove", (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; stripView.classList.add("is-dragging"); }
  if (drag.moved) stripView.scrollLeft = drag.left - dx;
});
addEventListener("pointerup", () => {
  if (!drag) return;
  // после перетаскивания не открываем фото случайным кликом
  setTimeout(() => stripView.classList.remove("is-dragging"), 50);
  drag = null;
});

/* ---------- Просмотр фото галереи крупно ---------- */
const lightbox = $("[data-lightbox]");
const lbImg = $("[data-lightbox-img]");
const lbCaption = $("[data-lightbox-caption]");
const galleryItems = $$(".gallery__item");
let lbIndex = 0;

const showPhoto = (i, dir = 0) => {
  lbIndex = (i + galleryItems.length) % galleryItems.length;
  const src = galleryItems[lbIndex].querySelector("img");
  lbImg.src = src.currentSrc || src.src;
  lbImg.alt = src.alt;
  lbCaption.textContent = src.alt;
  if (!reduced) animate(lbImg, { opacity: [0, 1], x: [dir * 40, 0], scale: [dir ? 1 : 0.94, 1] }, { duration: 0.45, ease: EASE });
};
galleryItems.forEach((item, i) =>
  item.addEventListener("click", () => { showPhoto(i); lightbox.showModal(); })
);
$("[data-lightbox-close]").addEventListener("click", () => lightbox.close());
$("[data-lightbox-prev]").addEventListener("click", () => showPhoto(lbIndex - 1, -1));
$("[data-lightbox-next]").addEventListener("click", () => showPhoto(lbIndex + 1, 1));
lightbox.addEventListener("click", (e) => e.target === lightbox && lightbox.close());
lightbox.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") showPhoto(lbIndex - 1, -1);
  if (e.key === "ArrowRight") showPhoto(lbIndex + 1, 1);
});
let lbStartX = null;
lbImg.addEventListener("pointerdown", (e) => (lbStartX = e.clientX));
lbImg.addEventListener("pointerup", (e) => {
  if (lbStartX === null) return;
  const dx = e.clientX - lbStartX;
  lbStartX = null;
  if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});

/* =====================================================================
   МЕНЮ И ДОСТАВКА
   ===================================================================== */
const rub = (n) => n.toLocaleString("ru-RU") + " ₽";
const esc = (s = "") => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const smoothTo = (y) => glide(typeof y === "function" ? y : () => y);

const menuData = Promise.all([
  fetch("data/menu-pdf.json").then((r) => r.json()),
  fetch("data/menu.json").then((r) => r.json()),
]);

const tabsEl = $("[data-tabs]");
const pill = $("[data-tabs-pill]");
const menuCard = $('[data-panel="menu"]');
const deliveryEl = $('[data-panel="delivery"]');

// Зелёная подложка переезжает под выбранную вкладку (Motion)
const movePill = (btn, instant) => {
  const box = { left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight };
  if (instant || reduced) Object.assign(pill.style, Object.fromEntries(Object.entries(box).map(([k, v]) => [k, v + "px"])));
  else animate(pill, box, { type: "spring", stiffness: 380, damping: 32 });
};

// Блюда появляются лесенкой (Anime.js)
const staggerIn = (els) => {
  if (reduced || !els.length) return;
  anime(els, { opacity: [0, 1], translateY: [16, 0], delay: stagger(22, { start: 80 }), duration: 600, ease: "outCubic" });
};

const dishHTML = (d) => d.courses
  ? `<li class="dish dish--set"><div class="dish__row"><span class="dish__name">Сет ${esc(d.name)}</span><span class="dish__dots"></span><span class="dish__price">${rub(d.price)}</span></div>
       <ol class="dish__courses">${d.courses.map((c) => `<li>${esc(c)}</li>`).join("")}</ol></li>`
  : `<li class="dish"><div class="dish__row"><span class="dish__name">${esc(d.name)}</span><span class="dish__dots"></span><span class="dish__price">${rub(d.price)}</span></div>
       <div class="dish__meta">${[d.weight, d.desc].filter(Boolean).map(esc).join(" · ")}</div></li>`;

const renderMenu = async (key) => {
  const [pdf] = await menuData;
  const m = pdf[key];
  $("[data-menu-chips]").innerHTML = m.sections
    .map((s, i) => `<button class="chip" type="button" data-goto="mg-${key}-${i}">${esc(s.title)}</button>`).join("");
  $("[data-menu-sections]").innerHTML = m.sections
    .map((s, i) => `<section class="menu-group" id="mg-${key}-${i}"><h3 class="menu-group__title">${esc(s.title)}</h3><ul>${s.items.map(dishHTML).join("")}</ul></section>`).join("");
  const hours = $("[data-menu-hours]");
  hours.hidden = !m.hours;
  hours.textContent = m.hours || "";
  $("[data-menu-note]").textContent = m.note || "";
  staggerIn($$(".menu-group__title, .dish", menuCard).slice(0, 40));
};

// Разделы меню: кнопка-«чип» плавно везёт к разделу
$("[data-menu-chips]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-goto]");
  if (!b) return;
  const g = document.getElementById(b.dataset.goto);
  smoothTo(() => g.getBoundingClientRect().top + scrollY - header.offsetHeight - 70);
});

/* ---------- Доставка ---------- */
const dishId = (d) => (d.img.match(/(\d+)\.\w+$/) || [])[1];
const basket = new Map(JSON.parse(localStorage.getItem("tr-cart") || "[]"));   // id → количество
let catalog = new Map();                                                          // id → блюдо
let deliveryCat = 3; // по умолчанию «Идеальное начало» — с него начинается их основное меню

const addBtnHTML = (id) => {
  const q = basket.get(id) || 0;
  return q
    ? `<div class="qty"><button type="button" data-dec="${id}" aria-label="Убрать одну">−</button><span>${q}</span><button type="button" data-inc="${id}" aria-label="Добавить ещё">+</button></div>`
    : `<button class="dcard__add" type="button" data-inc="${id}">Добавить</button>`;
};

const renderDelivery = async () => {
  const [, cats] = await menuData;
  $("[data-delivery-chips]").innerHTML = cats
    .map((c, i) => `<button class="chip${i === deliveryCat ? " is-active" : ""}" type="button" data-cat="${i}">${esc(c.name)}</button>`).join("");
  const items = cats[deliveryCat].items;
  $("[data-delivery-grid]").innerHTML = items.map((d) => {
    const id = dishId(d);
    return `<article class="dcard" data-id="${id}">
      <div class="dcard__img"><img src="img/dishes/${id}.jpg" alt="${esc(d.name)}" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('no-photo');this.remove()"></div>
      <div class="dcard__body">
        <h3 class="dcard__name">${esc(d.name)}</h3>
        ${d.weight && d.weight !== "0 гр" ? `<span class="dcard__weight">${esc(d.weight)}</span>` : ""}
        ${d.desc ? `<p class="dcard__desc">${esc(d.desc)}</p>` : ""}
        <div class="dcard__foot"><span class="dcard__price">${rub(d.price)}</span><span data-ctl="${id}">${addBtnHTML(id)}</span></div>
      </div></article>`;
  }).join("");
  staggerIn($$(".dcard", deliveryEl).slice(0, 16));
};

$("[data-delivery-chips]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  deliveryCat = +b.dataset.cat;
  renderDelivery();
});

menuData.then(([, cats]) => {
  cats.forEach((c) => c.items.forEach((d) => catalog.set(dishId(d), d)));
  renderCart();
});

/* ---------- Вкладки ---------- */
const openTab = (key, instant) => {
  const btn = $(`[data-tab="${key}"]`, tabsEl);
  $$("[data-tab]", tabsEl).forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
  movePill(btn, instant);
  const isDelivery = key === "delivery";
  menuCard.hidden = isDelivery;
  deliveryEl.hidden = !isDelivery;
  const panel = isDelivery ? deliveryEl : menuCard;
  if (!instant && !reduced) animate(panel, { opacity: [0, 1], y: [18, 0] }, { duration: 0.5, ease: EASE });
  isDelivery ? renderDelivery() : renderMenu(key);
};
tabsEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b && b.getAttribute("aria-selected") !== "true") openTab(b.dataset.tab);
});
addEventListener("resize", () => movePill($('[aria-selected="true"]', tabsEl), true));
openTab("main", true);
document.fonts?.ready.then(() => movePill($('[aria-selected="true"]', tabsEl), true));

/* ---------- Корзина ---------- */
const saveCart = () => localStorage.setItem("tr-cart", JSON.stringify([...basket]));
const cartCount = () => [...basket.values()].reduce((a, b) => a + b, 0);

function renderCart() {
  const n = cartCount();
  $("[data-cart-count]").textContent = n;
  $("[data-open-cart]").setAttribute("aria-label", `Корзина, товаров: ${n}`);
  const list = $("[data-cart-list]");
  const ready = [...basket].filter(([id]) => catalog.has(id));
  $("[data-cart-empty]").hidden = ready.length > 0;
  list.hidden = $("[data-cart-foot]").hidden = ready.length === 0;
  list.innerHTML = ready.map(([id, q]) => {
    const d = catalog.get(id);
    return `<li class="cart__item"><img src="img/dishes/${id}.jpg" alt=""><div><b>${esc(d.name)}</b><small>${rub(d.price)}</small></div>
      <div class="qty"><button type="button" data-dec="${id}" aria-label="Убрать одну">−</button><span>${q}</span><button type="button" data-inc="${id}" aria-label="Добавить ещё">+</button></div></li>`;
  }).join("");
  $("[data-cart-total]").textContent = rub(ready.reduce((s, [id, q]) => s + catalog.get(id).price * q, 0));
  // обновляем кнопки на карточках
  $$("[data-ctl]").forEach((el) => (el.innerHTML = addBtnHTML(el.dataset.ctl)));
}

// Полёт кружка от кнопки к корзине и «подпрыгивание» счётчика
const flyToCart = (fromEl) => {
  if (reduced) return;
  const a = fromEl.getBoundingClientRect();
  const target = $("[data-open-cart]").getBoundingClientRect();
  const dot = document.createElement("span");
  Object.assign(dot.style, {
    position: "fixed", zIndex: 60, left: a.left + a.width / 2 - 9 + "px", top: a.top + a.height / 2 - 9 + "px",
    width: "18px", height: "18px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 0 3px var(--cream)", pointerEvents: "none",
  });
  document.body.append(dot);
  const dx = target.left + target.width / 2 - (a.left + a.width / 2);
  const dy = target.top + target.height / 2 - (a.top + a.height / 2);
  animate(dot, { x: [0, dx * 0.5, dx], y: [0, dy - 80, dy], scale: [1, 1.2, 0.4] }, { duration: 0.75, ease: "easeInOut" })
    .then(() => {
      dot.remove();
      anime("[data-cart-count]", { scale: [1, 1.5, 1], duration: 600, ease: "outElastic(1, .5)" });
    });
};

document.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (!inc && !dec) return;
  const id = (inc || dec).dataset[inc ? "inc" : "dec"];
  const q = (basket.get(id) || 0) + (inc ? 1 : -1);
  if (inc && !basket.get(id) && !e.target.closest(".cart")) flyToCart(inc);
  q > 0 ? basket.set(id, q) : basket.delete(id);
  saveCart();
  renderCart();
});

// Оформление заказа (пока без отправки — показываем благодарность)
const cartForm = $("[data-cart-form]");
const showCartStep = (step) => {
  const has = basket.size > 0;
  $("[data-cart-empty]").hidden = step !== "list" || has;
  $("[data-cart-list]").hidden = $("[data-cart-foot]").hidden = step !== "list" || !has;
  cartForm.hidden = step !== "form";
  $("[data-cart-thanks]").hidden = step !== "thanks";
};
$("[data-cart-checkout]").addEventListener("click", () => showCartStep("form"));
$("[data-cart-back]").addEventListener("click", () => showCartStep("list"));
cartForm.addEventListener("submit", (e) => {
  e.preventDefault();
  basket.clear(); saveCart(); renderCart();
  showCartStep("thanks");
  cartForm.reset();
});
$("[data-open-cart]").addEventListener("click", () => showCartStep("list"));

// «Перейти в меню» из пустой корзины открывает вкладку «Доставка»
$("[data-go-delivery]").addEventListener("click", () => openTab("delivery"));

/* =====================================================================
   НОВОСТИ И АКЦИИ
   ===================================================================== */
// Ссылки внутри новостей («на нашем сайте», «На сайте») открывают нужную вкладку меню
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-open-tab]");
  if (!a) return;
  e.preventDefault();
  if (sheet.open) sheet.close();
  openTab(a.dataset.openTab);
  smoothTo(sectionY($("#menu")));
});

// Отзывы гостей: лента со стрелками и полосой прогресса.
// Сейчас блок скрыт (лежит в <template id="reviews-later">), поэтому код ниже просто не запускается.
const revView = $("[data-reviews-viewport]");
if (revView) {
const revBar = $("[data-reviews-bar]");
const revPrev = $("[data-reviews-prev]");
const revNext = $("[data-reviews-next]");
const revMax = () => revView.scrollWidth - revView.clientWidth;
const updateRev = () => {
  const p = revMax() > 0 ? revView.scrollLeft / revMax() : 0;
  revBar.style.transform = `scaleX(${Math.max(0.08, p)})`;
  revPrev.disabled = revView.scrollLeft < 4;
  revNext.disabled = revView.scrollLeft > revMax() - 4;
};
revView.addEventListener("scroll", updateRev, { passive: true });
addEventListener("resize", updateRev);
const revStep = (dir) => {
  const card = $(".review", revView);
  const step = card ? card.offsetWidth + 20 : revView.clientWidth * 0.8;
  revView.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
};
revPrev.addEventListener("click", () => revStep(-1));
revNext.addEventListener("click", () => revStep(1));

fetch("data/reviews.json").then((r) => r.json()).then((list) => {
  $("[data-reviews]").innerHTML = list.map((r) =>
    `<figure class="review"><span class="review__quote" aria-hidden="true">«</span>
      <blockquote>${r.text.map((p) => `<p>${esc(p)}</p>`).join("")}</blockquote>
      <figcaption class="review__name">${esc(r.name)}</figcaption></figure>`).join("");
  // Длинные отзывы: первые 8 строк и «Читать полностью»
  $$(".review").forEach((card) => {
    const q = $("blockquote", card);
    card.classList.add("is-long");
    if (q.scrollHeight <= q.clientHeight + 2) { card.classList.remove("is-long"); return; }
    const more = document.createElement("button");
    more.type = "button";
    more.className = "review__more";
    more.textContent = "Читать полностью";
    more.addEventListener("click", () => {
      const open = card.classList.toggle("is-open");
      more.textContent = open ? "Свернуть" : "Читать полностью";
      if (!reduced) animate(q, { opacity: [0.4, 1] }, { duration: 0.4 });
      updateRev();
    });
    q.after(more);
  });
  updateRev();
  // отзывы появляются один за другим, когда лента доезжает до экрана (Motion + Anime.js)
  if (!reduced) {
    const cards = $$(".review");
    cards.forEach((c) => (c.style.opacity = 0));
    inView(revView, () => {
      anime(cards, { opacity: [0, 1], translateX: [40, 0], delay: stagger(90), duration: 800, ease: "outCubic" });
    }, { amount: 0.3 });
  }
});
}

/* =====================================================================
   БАНКЕТНОЕ МЕНЮ: примеры заказа на 10 человек (data/banquet.json)
   ===================================================================== */
const bqTabs = $("[data-bq-tabs]");
const bqPill = $("[data-bq-pill]");
const bqCard = $("[data-bq-card]");
const num = (n) => n.toLocaleString("ru-RU");

const bqPillTo = (btn, instant) => {
  const box = { left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight };
  if (instant || reduced) Object.assign(bqPill.style, Object.fromEntries(Object.entries(box).map(([k, v]) => [k, v + "px"])));
  else animate(bqPill, box, { type: "spring", stiffness: 380, damping: 32 });
};

fetch("data/banquet.json").then((r) => r.json()).then(({ examples }) => {
  bqTabs.insertAdjacentHTML("beforeend", examples
    .map((e, i) => `<button class="tabs__btn" type="button" role="tab" aria-selected="${i === 0}" data-bq="${i}">${esc(e.title)}</button>`).join(""));

  const show = (i, instant) => {
    const e = examples[i];
    const btn = $(`[data-bq="${i}"]`, bqTabs);
    $$("[data-bq]", bqTabs).forEach((b) => b.setAttribute("aria-selected", String(b === btn)));
    bqPillTo(btn, instant);
    bqCard.innerHTML = `
      <table class="bq-table">
        <caption class="visually-hidden">${esc(e.title)}: пример предварительного заказа на 10 человек</caption>
        <thead><tr><th>Блюдо</th><th>Выход</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
        ${e.sections.map((s) => `
          <tbody>
            <tr class="bq-sec"><th colspan="5">${esc(s.title)}</th></tr>
            ${s.rows.map(([name, out, qty, price, sum]) => `
              <tr><td>${esc(name)}</td><td>${out} ${s.unit}</td><td>${qty}</td><td>${num(price)} ₽</td><td class="bq-sum">${num(sum)} ₽</td></tr>`).join("")}
          </tbody>`).join("")}
      </table>
      <div class="bq-total">
        <div><span>Выход на одного гостя</span><b>${e.perGuest}</b></div>
        <div><span>Общая сумма заказа</span><b>${num(e.total)} ₽</b></div>
        <div><span>Обслуживание 10%</span><b>${num(e.service)} ₽</b></div>
        <div class="is-grand"><span>Итого</span><b>${num(e.grand)} ₽</b></div>
      </div>`;
    if (!instant && !reduced) {
      animate(bqCard, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: EASE });
      anime(bqCard.querySelectorAll("tr"), { opacity: [0, 1], translateY: [10, 0], delay: stagger(14), duration: 450, ease: "outCubic" });
    }
  };

  bqTabs.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-bq]");
    if (b && b.getAttribute("aria-selected") !== "true") show(+b.dataset.bq);
  });
  addEventListener("resize", () => bqPillTo($('[aria-selected="true"]', bqTabs), true));
  show(0, true);
  document.fonts?.ready.then(() => bqPillTo($('[aria-selected="true"]', bqTabs), true));
});

/* =====================================================================
   БОНУСНАЯ СИСТЕМА
   ===================================================================== */
const walletCard = $(".wallet__card");
if (!reduced) {
  // Карта разворачивается из глубины, когда доезжает до экрана (Motion)
  walletCard.style.opacity = 0;
  inView(walletCard, () => {
    animate(walletCard, { opacity: [0, 1], rotateY: [-35, 0], rotateX: [12, 0], y: [40, 0], scale: [0.92, 1] },
      { duration: 1.2, ease: [0.22, 0.61, 0.36, 1] });
  }, { amount: 0.4 });

  // На компьютере карта слегка наклоняется вслед за мышью
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const wrap = $("[data-wallet]");
    wrap.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      animate(walletCard, { rotateY: px * 14, rotateX: -py * 14 }, { duration: 0.4, ease: "easeOut" });
    });
    wrap.addEventListener("pointerleave", () => animate(walletCard, { rotateY: 0, rotateX: 0 }, { type: "spring", stiffness: 200, damping: 18 }));
  }

  // Цифры преимуществ «набегают» с нуля (Anime.js)
  $$(".perk__num").forEach((el) => {
    const m = el.textContent.trim().match(/^(\d+)%$/);
    if (!m) return;
    const target = +m[1];
    const counter = { v: 0 };
    el.textContent = "0%";
    inView(el, () => {
      anime(counter, { v: target, duration: 1400, ease: "outExpo", onUpdate: () => (el.textContent = Math.round(counter.v) + "%") });
    }, { amount: 0.8 });
  });
}

// Ответ на вопрос раскрывается плавно
$$(".bonus-faq .faq__item").forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open && !reduced) animate($(".faq__answer", d), { opacity: [0, 1], y: [-6, 0] }, { duration: 0.35, ease: EASE });
  })
);

/* =====================================================================
   КОНТАКТЫ: форма обратной связи (пока без отправки — показываем благодарность)
   ===================================================================== */
$("[data-contact-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const h = form.offsetHeight;
  form.innerHTML = `<p class="contacts__thanks">Спасибо! Мы обязательно перезвоним вам как можно скорее.</p>`;
  form.style.minHeight = Math.min(h, 320) + "px";
  form.style.display = "grid";
  form.style.placeItems = "center";
  if (!reduced) animate(form.firstElementChild, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.5, ease: EASE });
});
