/*
 * Personal site — renders all text from content.json and posts from posts.json.
 * No build step and no frameworks.
 */
(function () {
  'use strict';

  var content = null;
  var posts = [];
  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  /* ---------- helpers ---------- */

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(key) {
    return (content.shared.links || {})[key] || '';
  }

  // Shows an image if a path is set, otherwise (or if it fails to load) a labelled placeholder.
  function media(src, alt, placeholderText) {
    var placeholder = el('div', 'placeholder');
    placeholder.appendChild(el('span', 'placeholder__icon'));
    placeholder.appendChild(el('span', 'placeholder__text', placeholderText));
    if (!src) return placeholder;
    var img = el('img');
    img.src = src;
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = function () { img.replaceWith(placeholder); };
    return img;
  }

  /* ---------- renderers ---------- */

  function renderStatic(t) {
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      var value = get(t, node.getAttribute('data-i18n'));
      if (typeof value === 'string') node.textContent = value;
    });
    document.querySelectorAll('[data-link]').forEach(function (node) {
      var href = link(node.getAttribute('data-link'));
      if (href) node.href = href; else node.hidden = true;
    });

    document.title = t.meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t.meta.description);

    var toggle = document.getElementById('langToggle');
    toggle.setAttribute('aria-label', t.ui.toggleAria);
    toggle.setAttribute('lang', lang === 'ar' ? 'en' : 'ar');

    var email = link('email');
    var emailBtn = document.getElementById('emailBtn');
    if (email) {
      emailBtn.href = 'mailto:' + email;
      emailBtn.hidden = false;
    }
  }

  function renderProfile(t) {
    var frame = document.getElementById('profileFrame');
    frame.replaceChildren(media(content.shared.images.profile, t.hero.name, t.ui.photoPlaceholder));
  }

  function renderFacts(t) {
    var dl = document.getElementById('aboutFacts');
    dl.replaceChildren();
    t.about.facts.forEach(function (f) {
      var row = el('div', 'facts__row');
      row.appendChild(el('dt', null, f.label));
      row.appendChild(el('dd', null, f.value));
      dl.appendChild(row);
    });
  }

  function renderExpertise(t) {
    var list = document.getElementById('expertiseList');
    list.replaceChildren();
    t.expertise.items.forEach(function (item, i) {
      var card = el('article', 'card reveal');
      card.appendChild(el('span', 'card__num', String(i + 1).padStart(2, '0')));
      card.appendChild(el('h3', 'card__title', item.title));
      card.appendChild(el('p', 'card__text', item.text));
      list.appendChild(card);
    });
  }

  function bulletList(items, className) {
    var ul = el('ul', className);
    items.forEach(function (b) { ul.appendChild(el('li', null, b)); });
    return ul;
  }

  // Logos are one-color marks (transparent PNG) tinted by the theme through CSS masks.
  function logoMark(key, name, className) {
    var logos = (content.shared.images && content.shared.images.logos) || {};
    var src = logos[key];
    if (!src) return null;
    var m = el('span', className);
    m.style.setProperty('--logo', 'url("' + src + '")');
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', name);
    m.title = name;
    return m;
  }

  function renderTimeline(t) {
    var ol = document.getElementById('timeline');
    ol.replaceChildren();
    t.experience.items.forEach(function (item) {
      var li = el('li', 'tl reveal');
      li.appendChild(el('span', 'tl__marker'));
      li.appendChild(el('span', 'tl__years', item.years));

      var body = el('div', 'tl__body');
      var logoItems = item.logos || (item.logo ? [{ key: item.logo, name: item.org }] : []);
      if (logoItems.length) {
        var logoRow = el('div', 'tl__logos');
        logoItems.forEach(function (l) {
          var m = logoMark(l.key, l.name, 'tl__logo');
          if (!m) return;
          if (logoRow.children.length) logoRow.appendChild(el('span', 'tl__sep'));
          logoRow.appendChild(m);
        });
        if (logoRow.children.length) body.appendChild(logoRow);
      }
      var head = el('div', 'tl__head');
      head.appendChild(el('h3', 'tl__org', item.org));
      if (item.orgAlt) {
        var alt = el('span', 'tl__alt', item.orgAlt);
        alt.lang = lang === 'ar' ? 'en' : 'ar';
        head.appendChild(alt);
      }
      if (item.location) head.appendChild(el('span', 'tl__loc', item.location));
      body.appendChild(head);

      var roles = el('div', 'tl__roles');
      (item.roles || []).forEach(function (r) {
        var role = el('div', 'tl__role');
        role.appendChild(el('span', 'tl__role-title', r.title));
        role.appendChild(el('span', 'tl__role-period', r.period));
        roles.appendChild(role);
      });
      body.appendChild(roles);

      if (item.summary) body.appendChild(el('p', 'tl__summary', item.summary));
      if (item.bullets && item.bullets.length) body.appendChild(bulletList(item.bullets, 'tl__list'));

      if (item.brands && item.brands.length) {
        var brands = el('div', 'tl__brands');
        item.brands.forEach(function (b) {
          var mark = logoMark(b.logo, b.name, 'tl__brand');
          if (mark) brands.appendChild(mark);
        });
        if (brands.children.length) body.appendChild(brands);
      }

      if (item.highlight) {
        var h = el('div', 'tl__highlight');
        h.appendChild(el('h4', null, item.highlight.heading));
        if (item.highlight.intro) h.appendChild(el('p', null, item.highlight.intro));
        h.appendChild(bulletList(item.highlight.items, 'tl__list'));
        body.appendChild(h);
      }

      if (item.extra && item.extra.length) body.appendChild(bulletList(item.extra, 'tl__list'));

      var links = (item.links || []).filter(function (l) { return link(l.key); });
      if (links.length) {
        var row = el('div', 'tl__links');
        links.forEach(function (l) {
          var a = el('a', 'link-arrow', l.label);
          a.href = link(l.key);
          a.target = '_blank';
          a.rel = 'noopener';
          a.dir = 'ltr';
          row.appendChild(a);
        });
        body.appendChild(row);
      }

      li.appendChild(body);
      ol.appendChild(li);
    });
  }

  function renderProjects(t) {
    var wrap = document.getElementById('projectList');
    wrap.replaceChildren();
    var images = content.shared.images.projects || {};
    t.projects.items.forEach(function (p) {
      var card = el('article', 'project reveal' + (p.featured ? ' project--featured' : ''));
      var fig = el('figure', 'project__media');
      // صورة العمل: ضع مسارها في content.json ← shared.images.projects
      var vids = content.shared.media || {};
      var v = p.video && vids[p.video];
      var plogo = !v && !images[p.id] && p.logo ? logoMark(p.logo, p.title, 'project__logo') : null;
      if (v) {
        var video = el('video');
        video.src = v.src;
        if (v.poster) video.poster = v.poster;
        video.controls = true;
        video.preload = 'none';
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('aria-label', p.title);
        fig.classList.add('project__media--video');
        fig.appendChild(video);
      } else if (p.logoImage && content.shared.images.logos && content.shared.images.logos[p.logoImage]) {
        var li = el('img', 'project__logo-img');
        li.src = content.shared.images.logos[p.logoImage]; li.alt = p.title; li.loading = 'lazy';
        fig.classList.add('project__media--logo'); fig.appendChild(li);
      } else if (plogo) { fig.classList.add('project__media--logo'); fig.appendChild(plogo); }
      else fig.appendChild(media(images[p.id], p.title, t.ui.workPlaceholder));
      if (p.vertical) card.classList.add('project--vertical');
      card.appendChild(fig);

      var body = el('div', 'project__body');
      if (p.brandLogo) {
        var bl = logoMark(p.brandLogo, p.title, 'project__brand');
        if (bl) body.appendChild(bl);
      }
      body.appendChild(el('span', 'project__tag', p.tag));
      var title = el('h3', 'project__title', p.title);
      if (p.titleAlt) {
        var alt = el('span', 'project__alt', p.titleAlt);
        alt.lang = lang === 'ar' ? 'en' : 'ar';
        title.appendChild(alt);
      }
      body.appendChild(title);
      body.appendChild(el('p', 'project__text', p.text));
      var gal = p.gallery && content.shared.images.galleries && content.shared.images.galleries[p.gallery];
      if (gal && gal.length) {
        var g = el('div', 'project__gallery');
        g.setAttribute('role', 'list');
        g.setAttribute('aria-label', t.ui.galleryLabel || '');
        gal.forEach(function (src) {
          var a = el('a', 'project__shot');
          a.href = src; a.target = '_blank'; a.rel = 'noopener';
          a.setAttribute('role', 'listitem');
          var img = el('img'); img.src = src; img.alt = p.title; img.loading = 'lazy'; img.decoding = 'async';
          a.appendChild(img); g.appendChild(a);
        });
        body.appendChild(g);
      }
      if (p.linkKey && link(p.linkKey)) {
        var a = el('a', 'link-arrow', t.ui.visit);
        a.href = link(p.linkKey);
        a.target = '_blank';
        a.rel = 'noopener';
        body.appendChild(a);
      }
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  // Accepts either the full LinkedIn embed code (<iframe src="...">) or just its URL,
  // and only renders iframes that point to linkedin.com/embed.
  function embedUrl(code) {
    if (!code) return '';
    var match = String(code).match(/src\s*=\s*["']([^"']+)["']/i);
    var url = (match ? match[1] : String(code)).trim();
    try {
      var u = new URL(url);
      if (u.protocol === 'https:' && /(^|\.)linkedin\.com$/.test(u.hostname) && u.pathname.indexOf('/embed/') === 0) {
        return u.href;
      }
    } catch (e) {}
    return '';
  }

  function embedHeight(code) {
    var match = String(code || '').match(/height\s*=\s*["']?(\d+)/i);
    return match ? Math.min(Math.max(parseInt(match[1], 10), 300), 1200) : 560;
  }

  function renderPosts(t) {
    var wrap = document.getElementById('postList');
    wrap.replaceChildren();
    var valid = posts.filter(function (p) { return embedUrl(p.embed); });
    var section = document.getElementById('posts');
    var navLink = document.querySelector('.nav a[href="#posts"]');
    // Hide the whole section (and its menu link) until posts.json has posts.
    if (section) section.hidden = !valid.length;
    if (navLink) navLink.hidden = !valid.length;
    if (!valid.length) return;
    valid.forEach(function (p) {
      var card = el('div', 'post reveal');
      var frame = document.createElement('iframe');
      frame.src = embedUrl(p.embed);
      frame.height = embedHeight(p.embed);
      frame.loading = 'lazy';
      frame.title = 'LinkedIn post';
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('allowfullscreen', '');
      card.appendChild(frame);
      wrap.appendChild(card);
    });
  }

  function render() {
    var t = content[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    renderStatic(t);
    renderProfile(t);
    renderFacts(t);
    renderExpertise(t);
    renderTimeline(t);
    renderProjects(t);
    renderPosts(t);
    observeReveals();
  }

  /* ---------- interactions ---------- */

  var observer = null;
  function observeReveals() {
    var nodes = document.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    nodes.forEach(function (n) { observer.observe(n); });
  }

  function setupToggle() {
    document.getElementById('langToggle').addEventListener('click', function () {
      lang = lang === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('lang', lang); } catch (e) {}
      render();
    });
  }

  function setupMenu() {
    var btn = document.getElementById('menuToggle');
    var header = document.querySelector('.header');
    function close() {
      header.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function setupHeaderShadow() {
    var header = document.querySelector('.header');
    function update() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- boot ---------- */

  document.getElementById('year').textContent = new Date().getFullYear();
  setupMenu();
  setupHeaderShadow();

  Promise.all([
    fetch('content.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
    fetch('posts.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .catch(function () { return { posts: [] }; })
  ]).then(function (data) {
    content = data[0];
    posts = Array.isArray(data[1]) ? data[1] : (data[1].posts || []);
    setupToggle();
    render();
  }).catch(function () {
    var msg = lang === 'ar'
      ? 'تعذّر تحميل المحتوى. افتح الموقع عبر GitHub Pages أو خادم محلي.'
      : 'Content could not be loaded. Please open the site via GitHub Pages or a local server.';
    var notice = el('p', 'load-error', msg);
    document.getElementById('main').prepend(notice);
  });
})();
