const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Buzzing letter-by-letter reveal helpers
function prepareReveal(body) {
  if (body.querySelector('.char-buzz')) return;
  body._revealTimeouts = [];

  body.querySelectorAll('.timeline-bullets li').forEach(li => li.classList.add('li-hidden'));
  body.querySelectorAll('.shipped-section, .contributed-section').forEach(sec => sec.classList.add('section-hidden'));
  body.querySelectorAll('.shipped-tag, .contributed-tag').forEach(tag => tag.classList.add('tag-hidden'));

  const targets = body.querySelectorAll('.timeline-desc, .timeline-bullets li, .shipped-section-title, .shipped-tag, .contributed-section-title, .contributed-tag');
  let delay = 0;
  let prevWasBullet = false;

  targets.forEach(target => {
    const isSectionTitle = target.matches('.shipped-section-title, .contributed-section-title');

    // Add gap after last bullet so its 200ms animation can finish before the section appears
    if (isSectionTitle && prevWasBullet) delay += 200;
    prevWasBullet = target.matches('.timeline-bullets li');

    const startDelay = delay;

    if (target.matches('.timeline-bullets li')) {
      body._revealTimeouts.push(setTimeout(() => target.classList.remove('li-hidden'), startDelay));
    } else if (target.matches('.shipped-section-title')) {
      const sec = target.closest('.shipped-section');
      body._revealTimeouts.push(setTimeout(() => sec && sec.classList.remove('section-hidden'), startDelay));
    } else if (target.matches('.contributed-section-title')) {
      const sec = target.closest('.contributed-section');
      body._revealTimeouts.push(setTimeout(() => sec && sec.classList.remove('section-hidden'), startDelay));
    } else if (target.matches('.shipped-tag, .contributed-tag')) {
      body._revealTimeouts.push(setTimeout(() => target.classList.remove('tag-hidden'), startDelay));
    }

    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(textNode => {
      const frag = document.createDocumentFragment();
      for (const char of textNode.textContent) {
        const s = document.createElement('span');
        s.className = 'char-buzz';
        s.textContent = char;
        s.style.animationDelay = delay + 'ms';
        s.addEventListener('animationend', () => {
          s.style.animation = 'none';
          s.style.opacity  = '1';
        }, { once: true });
        delay += 5;
        frag.appendChild(s);
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  });

}

function cleanupReveal(body) {
  (body._revealTimeouts || []).forEach(clearTimeout);
  body._revealTimeouts = [];
  body.querySelectorAll('.li-hidden').forEach(el => el.classList.remove('li-hidden'));
  body.querySelectorAll('.section-hidden').forEach(el => el.classList.remove('section-hidden'));
  body.querySelectorAll('.tag-hidden').forEach(el => el.classList.remove('tag-hidden'));
  body.querySelectorAll('.char-buzz').forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent));
  });
}

// Experience collapse/expand
const timelineItems = document.querySelectorAll('.timeline-item');

timelineItems.forEach(item => {
  const body = item.querySelector('.timeline-body');

  function toggle() {
    const wasOpen = item.classList.contains('open');
    if (!wasOpen && body) prepareReveal(body);
    else if (wasOpen && body) cleanupReveal(body);
    item.classList.toggle('open');
  }

  const header = item.querySelector('.timeline-header');
  if (header) {
    header.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      toggle();
    });
  }
});

// Game card → expand matching experience and scroll to it
document.querySelectorAll('.game-card[data-exp]').forEach(card => {
  card.addEventListener('click', () => {
    const target = document.querySelector(card.dataset.exp);
    if (!target) return;
    target.classList.add('visible');
    if (!target.classList.contains('open')) {
      const body = target.querySelector('.timeline-body');
      if (body) prepareReveal(body);
      target.classList.add('open');
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const title = target.querySelector('.timeline-role');
    if (!title) return;
    setTimeout(() => {
      title.classList.remove('exp-focus');
      void title.offsetWidth;
      title.classList.add('exp-focus');
      title.addEventListener('animationend', () => title.classList.remove('exp-focus'), { once: true });
    }, 600);
  });
});

// Stagger fade-in children inside grids
document.querySelectorAll('.games-grid .fade-in, .timeline .fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
});

document.addEventListener('DOMContentLoaded', function () {

  // Hero name expand/collapse animation cycling between labels
  (function () {
    const LABELS = ['Giuseppe Gioi', 'Good Game'];
    const heroN  = document.querySelector('.hero-name');
    const w1El   = document.getElementById('hero-w1');
    const w2El   = document.getElementById('hero-w2');
    let labelIdx = 0;

    function expand(label, onDone) {
      const [w1, w2] = label.split(' ');
      const maxLen = Math.max(w1.length, w2.length);
      let tick = 2;
      heroN.classList.add('buzzing');
      const iv = setInterval(() => {
        w1El.textContent = w1.slice(0, tick);
        w2El.textContent = w2.slice(0, tick);
        tick++;
        if (tick > maxLen) {
          clearInterval(iv);
          w1El.textContent = w1;
          w2El.textContent = w2;
          heroN.classList.remove('buzzing');
          onDone && onDone();
        }
      }, 38);
    }

    function collapse(label, onDone) {
      const [w1, w2] = label.split(' ');
      let len = Math.max(w1.length, w2.length);
      heroN.classList.add('buzzing');
      const iv = setInterval(() => {
        len--;
        w1El.textContent = w1.slice(0, Math.max(1, len));
        w2El.textContent = w2.slice(0, Math.max(1, len));
        if (len <= 1) {
          clearInterval(iv);
          heroN.classList.remove('buzzing');
          onDone && onDone();
        }
      }, 30);
    }

    function cycle() {
      const label = LABELS[labelIdx];
      labelIdx = (labelIdx + 1) % LABELS.length;
      setTimeout(() => {
        expand(label, () => {
          setTimeout(() => {
            collapse(label, () => {
              setTimeout(cycle, 150);
            });
          }, 1800);
        });
      }, 150);
    }

    cycle();
  })();

  // UE-style frame counter widget (decorative)
  (function () {
    const HIST = 80;
    const history = new Array(HIST).fill(16.7);
    let head = 0;

    let scrollPressure = 0;
    let lastScrollY = window.scrollY;
    const heroScrollEl = document.querySelector('.hero-scroll');

    window.addEventListener('scroll', () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      scrollPressure = Math.min(1, scrollPressure + delta * 0.012);
      if (heroScrollEl) heroScrollEl.classList.toggle('hidden', window.scrollY > 80);
    }, { passive: true });

    const valFrame = document.getElementById('ue-val-frame');
    const valFps   = document.getElementById('ue-val-fps');
    const canvas   = document.getElementById('ue-graph');
    const ctx      = canvas.getContext('2d');

    function colorFor(ms) {
      if (ms < 20) return '#c8ff47';
      if (ms < 33) return '#ffe600';
      return '#ff4f7b';
    }

    function drawGraph() {
      canvas.width  = canvas.offsetWidth || 148;
      canvas.height = 32;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const maxMs = 50;
      const ty = H - (16.7 / maxMs) * H;
      ctx.strokeStyle = 'rgba(200,255,71,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
      ctx.setLineDash([]);

      const step = W / HIST;
      ctx.beginPath();
      for (let i = 0; i < HIST; i++) {
        const ms = history[(head + i) % HIST];
        const x  = i * step;
        const y  = H - Math.min((ms / maxMs) * H, H - 1);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colorFor(history[(head + HIST - 1) % HIST]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    let current = 16.7;
    function tick() {
      scrollPressure *= 0.88;
      const target = 16.7 + scrollPressure * 28 + (Math.random() - 0.5) * 1.8;
      current += (target - current) * 0.25;
      current  = Math.max(8, current);

      history[head % HIST] = current;
      head++;

      const fps = Math.round(1000 / current);
      valFrame.textContent = current.toFixed(1) + ' ms';
      valFrame.style.color = colorFor(current);
      valFps.textContent   = fps + ' fps';
      valFps.style.color   = colorFor(current);
      document.getElementById('ue-stats').style.color = colorFor(current);

      drawGraph();
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  })();

  // Mobile hamburger menu
  (function () {
    const btn  = document.getElementById('nav-hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function toggle() {
      const isOpen = btn.classList.toggle('open');
      menu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    btn.addEventListener('click', toggle);

    menu.querySelectorAll('.mobile-menu-link').forEach(function (link) {
      link.addEventListener('click', function () {
        btn.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  })();

});

// Cursor glow follow
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
});

// Stat count-up on scroll into view
function animateCount(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 1200;
  const start    = performance.now();
  function step(now) {
    const t    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.childNodes[0].textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(step);
  }
  el.childNodes[0].textContent = '0';
  requestAnimationFrame(step);
}

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-count]').forEach(el => countObserver.observe(el));
