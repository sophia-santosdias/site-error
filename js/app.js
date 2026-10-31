(function () {
  "use strict";

  var cfg = window.SITE_CONFIG;
  var view = document.getElementById("view");
  var progress = document.getElementById("progress");
  var chapters = [];

  // ---------- armazenamento (preferências e progresso) ----------
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }
  function readSet() {
    try { return JSON.parse(store("read") || "[]"); } catch (e) { return []; }
  }
  function markRead(id) {
    var s = readSet();
    if (s.indexOf(id) === -1) { s.push(id); store("read", JSON.stringify(s)); }
  }

  // ---------- helpers de DOM (sem innerHTML => sem XSS) ----------
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // Converte **negrito** e *itálico* em nós de DOM.
  function inline(parent, text) {
    text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach(function (part) {
      if (!part) return;
      if (part.indexOf("**") === 0 && part.length > 4) parent.appendChild(el("strong", null, part.slice(2, -2)));
      else if (part.charAt(0) === "*" && part.length > 2) parent.appendChild(el("em", null, part.slice(1, -1)));
      else parent.appendChild(document.createTextNode(part));
    });
  }

  // Separa " | 14:32" do final de uma linha.
  function splitTime(s) {
    var i = s.lastIndexOf(" | ");
    if (i === -1) return { text: s.trim(), time: "" };
    return { text: s.slice(0, i).trim(), time: s.slice(i + 3).trim() };
  }

  // ::: whatsapp Contato
  //   :foto https://url.jpg             (opcional — foto de perfil)
  //   < recebida | 14:32      <Fulano> recebida (grupo)      > enviada | 14:33      = Hoje
  function renderWhatsapp(title, lines) {
    // extrai :foto se presente (deve ser a primeira linha de conteúdo)
    var photoUrl = "";
    var contentLines = [];
    lines.forEach(function (line) {
      var m = line.trim().match(/^:foto\s+(\S+)$/i);
      if (m) { photoUrl = m[1]; }
      else { contentLines.push(line); }
    });

    var chat = el("div", { "class": "chat wa" });
    var head = el("div", { "class": "chat-head" });
    if (photoUrl) {
      head.appendChild(el("img", { "class": "avatar wa-avatar-img", src: photoUrl, alt: title || "avatar", loading: "lazy" }));
    } else {
      head.appendChild(el("span", { "class": "avatar" }, (title || "?").charAt(0).toUpperCase()));
    }
    head.appendChild(el("span", { "class": "chat-title" }, title || "Conversa"));
    chat.appendChild(head);
    var body = el("div", { "class": "chat-body" });
    contentLines.forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m;
      if (line.charAt(0) === "=") {
        body.appendChild(el("div", { "class": "wa-date" }, line.slice(1).trim()));
      } else if ((m = line.match(/^<(?:([^\s>][^>]{0,29})>)?\s*(.*)$/))) {
        body.appendChild(waBubble("in", m[1], m[2]));
      } else if ((m = line.match(/^>\s*(.*)$/))) {
        body.appendChild(waBubble("out", null, m[1]));
      } else {
        body.appendChild(el("div", { "class": "wa-date" }, line));
      }
    });
    chat.appendChild(body);
    return chat;
  }
  function waBubble(dir, sender, raw) {
    var t = splitTime(raw);
    var b = el("div", { "class": "wa-msg " + dir });
    if (sender) b.appendChild(el("span", { "class": "wa-sender" }, sender));
    var p = el("span", { "class": "wa-text" });
    inline(p, t.text);
    b.appendChild(p);
    if (t.time) b.appendChild(el("span", { "class": "wa-time" }, t.time));
    return b;
  }

  // ::: tweet Nome | @usuario | 08:42 · 01 jun. 26
  //   :foto https://url.jpg             (opcional — foto de perfil)
  //   texto do post (várias linhas)
  //   :img https://url.jpg              (opcional — imagem no corpo)
  //   + 2,4 mil Visualizações · 340 Retweets   (opcional)
  //
  //   :resposta Nome | @handle | hora   (zero ou mais respostas encadeadas)
  //   :foto https://url.jpg
  //   Texto da resposta
  //   + stats

  // Constrói um único card de tweet (sem respostas).
  function buildTweetCard(title, lines, isReply) {
    var parts = title.split("|").map(function (s) { return s.trim(); });
    var name = parts[0] || "Anônimo";
    var handle = parts[1] || "";
    var datetime = parts[2] || "";

    var photoUrl = "";
    var imgUrl = "";
    var stats = "";
    var textLines = [];
    lines.forEach(function (l) {
      var lt = l.trim();
      var mPhoto = lt.match(/^:foto\s+(\S+)$/i);
      var mImg   = lt.match(/^:img\s+(\S+)$/i);
      if (mPhoto) { photoUrl = mPhoto[1]; }
      else if (mImg) { imgUrl = mImg[1]; }
      else if (/^\+\s/.test(lt)) { stats = lt.slice(1).trim(); }
      else { textLines.push(l); }
    });

    var card = el("div", { "class": isReply ? "tw-reply" : "chat tw" });

    // coluna esquerda: avatar + fio (se for tweet-pai com respostas, fio é adicionado via CSS)
    var leftCol = el("div", { "class": "tw-left" });
    if (photoUrl) {
      leftCol.appendChild(el("img", { "class": "avatar tw-avatar-img", src: photoUrl, alt: name, loading: "lazy" }));
    } else {
      leftCol.appendChild(el("span", { "class": "avatar" }, name.charAt(0).toUpperCase()));
    }
    card.appendChild(leftCol);

    var main = el("div", { "class": "tw-main" });

    // cabeçalho
    var head = el("div", { "class": "tw-head" });
    var nameBlock = el("div", { "class": "tw-name-block" });
    nameBlock.appendChild(el("strong", { "class": "tw-name" }, name));
    if (handle) nameBlock.appendChild(el("span", { "class": "tw-user" }, handle));
    head.appendChild(nameBlock);
    if (!isReply) head.appendChild(el("span", { "class": "tw-x-icon", "aria-hidden": "true" }, "𝕏"));
    main.appendChild(head);

    // texto
    textLines.join("\n").split(/\n{2,}/).forEach(function (par) {
      par = par.trim();
      if (!par) return;
      var p = el("p", { "class": "tw-text" });
      inline(p, par.replace(/\n/g, " "));
      main.appendChild(p);
    });

    // imagem
    if (imgUrl) {
      var imgWrap = el("div", { "class": "tw-img-wrap" });
      imgWrap.appendChild(el("img", { src: imgUrl, alt: "", loading: "lazy", "class": "tw-img" }));
      main.appendChild(imgWrap);
    }

    // data/hora
    if (datetime) main.appendChild(el("div", { "class": "tw-meta" }, datetime));

    // stats
    if (stats) {
      var statsEl = el("div", { "class": "tw-stats" }, stats);
      main.appendChild(statsEl);
    }

    card.appendChild(main);
    return card;
  }

  // Quebra as linhas em grupos: [{ title, lines }, ...] sendo o primeiro o tweet-pai
  // e os demais as respostas (delimitadas por :resposta).
  function splitTweetGroups(title, lines) {
    var groups = [{ title: title, lines: [] }];
    lines.forEach(function (l) {
      var m = l.trim().match(/^:resposta\s+(.+)$/i);
      if (m) { groups.push({ title: m[1].trim(), lines: [] }); }
      else { groups[groups.length - 1].lines.push(l); }
    });
    return groups;
  }

  function renderTweet(title, lines) {
    var groups = splitTweetGroups(title, lines);
    var hasReplies = groups.length > 1;

    // wrapper só quando há thread
    if (!hasReplies) return buildTweetCard(title, lines, false);

    var thread = el("div", { "class": "tw-thread" });
    groups.forEach(function (g, i) {
      var isReply = i > 0;
      var card = buildTweetCard(g.title, g.lines, isReply);
      // marca o tweet-pai com classe especial para desenhar o fio abaixo do avatar
      if (!isReply) card.classList.add("tw-has-replies");
      thread.appendChild(card);
    });
    return thread;
  }

  var _paraCount = 0;

  function resetParaCount() { _paraCount = 0; }

  function renderParagraphs(box, lines, chapterId) {
    lines.join("\n").split(/\n{2,}/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      if (block === "---") { box.appendChild(el("hr")); return; }
      var idx = _paraCount++;
      var wrap = el("div", { "class": "para-wrap" });
      var p = el("p");
      inline(p, block.replace(/\n/g, " "));
      if (commentsEnabled() && chapterId != null) {
        var btn = el("button", { type: "button", "class": "para-comment-btn", "aria-label": "Comentar este parágrafo", "data-idx": String(idx) });
        btn.textContent = "¶";
        btn.addEventListener("click", function () { toggleParaPanel(wrap, chapterId, idx); });
        wrap.appendChild(btn);
      }
      wrap.appendChild(p);
      box.appendChild(wrap);
    });
  }

  function renderText(raw, chapterId) {
    resetParaCount();
    var box = el("div", { "class": "text" });
    var buf = [];
    var lines = raw.replace(/\r/g, "").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^:::\s*(\w+)\s*(.*)$/);
      if (!m) { buf.push(lines[i]); continue; }
      var inner = [];
      for (i++; i < lines.length && lines[i].trim() !== ":::"; i++) inner.push(lines[i]);
      renderParagraphs(box, buf, chapterId); buf = [];
      var kind = m[1].toLowerCase(), title = m[2].trim();
      if (kind === "whatsapp") box.appendChild(renderWhatsapp(title, inner));
      else if (kind === "tweet" || kind === "twitter") box.appendChild(renderTweet(title, inner));
      else renderParagraphs(box, inner, chapterId);
    }
    renderParagraphs(box, buf, chapterId);
    return box;
  }

  // ---------- preferências ----------
  var fs = parseInt(store("fs"), 10) || 19;
  function applyFont() { document.documentElement.style.setProperty("--fs", fs + "px"); }
  function applyTheme(t) {
    if (["light", "sepia", "dark"].indexOf(t) === -1) t = "light";
    document.body.setAttribute("data-theme", t);
    document.getElementById("theme").value = t;
    store("theme", t);
  }
  applyFont();
  applyTheme(store("theme") || "light");

  document.getElementById("font-up").addEventListener("click", function () { fs = Math.min(30, fs + 1); store("fs", fs); applyFont(); });
  document.getElementById("font-down").addEventListener("click", function () { fs = Math.max(14, fs - 1); store("fs", fs); applyFont(); });
  document.getElementById("theme").addEventListener("change", function (e) {
    applyTheme(e.target.value);
  });

  // ---------- comentários (Supabase, sem login para o leitor) ----------
  function api(path, options) {
    var c = cfg.comments;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 10000);
    options = options || {};
    options.signal = ctrl.signal;
    options.headers = Object.assign({ apikey: c.anonKey }, options.headers || {});
    return fetch(c.url + "/rest/v1/" + path, options).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("http");
      return r;
    });
  }

  function commentsEnabled() {
    var c = cfg.comments;
    return !!(c && /^https:\/\/[\w-]+\.supabase\.co$/.test(c.url || "") && c.anonKey);
  }

  function commentItem(c) {
    var li = el("li", { "class": "comment" });
    var head = el("div", { "class": "comment-head" });
    head.appendChild(el("strong", null, c.author));
    head.appendChild(el("span", { "class": "comment-date" }, new Date(c.created_at).toLocaleDateString("pt-BR")));
    li.appendChild(head);
    li.appendChild(el("p", null, c.body));
    return li;
  }

  // ---------- comentários por parágrafo ----------
  function toggleParaPanel(wrap, chapterId, paraIdx) {
    var existing = wrap.querySelector(".para-panel");
    if (existing) { existing.remove(); return; }
    var panel = buildParaPanel(chapterId, paraIdx);
    wrap.appendChild(panel);
    panel.querySelector(".para-panel-name") && panel.querySelector(".para-panel-name").focus();
  }

  function buildParaPanel(chapterId, paraIdx) {
    var panel = el("div", { "class": "para-panel" });

    var list = el("ul", { "class": "comment-list para-comment-list" });
    var status = el("p", { "class": "notice" }, "Carregando...");
    panel.appendChild(status);
    panel.appendChild(list);

    api("comments?select=author,body,created_at&approved=eq.true&chapter_id=eq." +
        encodeURIComponent(chapterId) +
        "&paragraph_index=eq." + paraIdx +
        "&order=created_at.asc&limit=100")
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        status.textContent = rows.length ? "" : "Nenhum comentário ainda.";
        rows.forEach(function (row) { list.appendChild(commentItem(row)); });
      })
      .catch(function () { status.textContent = "Não foi possível carregar."; });

    var form = el("form", { "class": "comment-form", autocomplete: "off" });
    var name = el("input", { type: "text", maxlength: "50", required: "required", placeholder: "Seu nome ou apelido", "aria-label": "Nome", "class": "para-panel-name" });
    var body = el("textarea", { maxlength: "2000", required: "required", rows: "3", placeholder: "Comente este trecho...", "aria-label": "Comentário" });
    var trap = el("input", { type: "text", name: "site", tabindex: "-1", autocomplete: "off", "aria-hidden": "true", "class": "trap" });
    var btn = el("button", { type: "submit", "class": "btn primary" }, "Enviar");
    var msg = el("p", { "class": "notice", role: "status" });
    [name, body, trap, btn, msg].forEach(function (n) { form.appendChild(n); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (trap.value) return;
      var last = parseInt(store("lastComment"), 10) || 0;
      if (Date.now() - last < 30000) { msg.textContent = "Aguarde alguns segundos."; return; }
      var author = name.value.trim(), text = body.value.trim();
      if (!author || !text) return;
      btn.disabled = true;
      msg.textContent = "Enviando...";
      api("comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ chapter_id: chapterId, paragraph_index: paraIdx, author: author, body: text })
      }).then(function () {
        store("lastComment", String(Date.now()));
        body.value = "";
        msg.textContent = "Obrigado! Aparecerá após aprovação.";
      }).catch(function () {
        msg.textContent = "Erro ao enviar. Tente novamente.";
      }).then(function () { btn.disabled = false; });
    });

    panel.appendChild(form);
    return panel;
  }

  function renderComments(chapter) {
    return document.createDocumentFragment(); // comentários agora são por parágrafo
  }

  // ---------- páginas ----------
  function home() {
    document.title = cfg.title;
    var box = el("section", { "class": "home" });
    box.appendChild(el("h1", null, cfg.title));
    box.appendChild(el("p", { "class": "sub" }, cfg.subtitle));

    var last = store("last");
    var target = chapters.filter(function (c) { return c.id === last; })[0];
    if (target) box.appendChild(el("a", { "class": "btn primary", href: "#/cap/" + target.id }, "Continuar: " + target.title));
    else if (chapters.length) box.appendChild(el("a", { "class": "btn primary", href: "#/cap/" + chapters[0].id }, "Começar a ler"));

    var done = readSet();
    var ul = el("ul", { "class": "chapter-list" });
    chapters.forEach(function (c, i) {
      var li = el("li");
      var a = el("a", { href: "#/cap/" + c.id });
      a.appendChild(el("span", null, c.title));
      if (done.indexOf(c.id) !== -1) a.appendChild(el("span", { "class": "read" }, "lido"));
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    view.replaceChildren(box);
    window.scrollTo(0, 0);
  }

  function navLink(label, chapter) {
    if (!chapter) return el("a", { "class": "btn", "aria-disabled": "true", href: "#/" }, label);
    return el("a", { "class": "btn", href: "#/cap/" + chapter.id }, label);
  }

  function chapterPage(id) {
    var idx = -1;
    chapters.forEach(function (c, i) { if (c.id === id) idx = i; });
    if (idx === -1) { location.hash = "#/"; return; }
    var c = chapters[idx];
    document.title = c.title + " · " + cfg.title;
    store("last", c.id);

    fetch("chapters/" + encodeURIComponent(c.file))
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.text(); })
      .then(function (raw) {
        var art = el("article", { "class": "chapter" });
        art.appendChild(el("h1", null, c.title));
        art.appendChild(el("div", { "class": "meta" }, "Capítulo " + (idx + 1) + " de " + chapters.length));
        art.appendChild(renderText(raw, c.id));

        var nav = el("nav", { "class": "nav" });
        nav.appendChild(navLink("← Anterior", chapters[idx - 1]));
        nav.appendChild(el("a", { "class": "btn", href: "#/" }, "Índice"));
        nav.appendChild(navLink("Próximo →", chapters[idx + 1]));
        art.appendChild(nav);
        art.appendChild(renderComments(c));

        view.replaceChildren(art);
        window.scrollTo(0, 0);
        view.focus();
        onScroll();
      })
      .catch(function () {
        view.replaceChildren(el("p", { "class": "notice" }, "Não foi possível carregar este capítulo."));
      });
  }

  // ---------- progresso de leitura ----------
  function onScroll() {
    var art = document.querySelector(".chapter .text");
    if (!art) { progress.style.width = "0"; return; }
    var rect = art.getBoundingClientRect();
    var total = rect.height - window.innerHeight * 0.5;
    var pct = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    progress.style.width = (pct * 100) + "%";
    if (pct > 0.9) markRead(location.hash.replace("#/cap/", ""));
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- roteamento ----------
  function route() {
    var m = location.hash.match(/^#\/cap\/([\w-]+)$/);
    if (m) chapterPage(m[1]); else home();
  }
  window.addEventListener("hashchange", route);

  // setas do teclado
  document.addEventListener("keydown", function (e) {
    var m = location.hash.match(/^#\/cap\/([\w-]+)$/);
    if (!m || e.target.matches("input, textarea, select")) return;
    var idx = -1;
    chapters.forEach(function (c, i) { if (c.id === m[1]) idx = i; });
    if (e.key === "ArrowRight" && chapters[idx + 1]) location.hash = "#/cap/" + chapters[idx + 1].id;
    if (e.key === "ArrowLeft" && chapters[idx - 1]) location.hash = "#/cap/" + chapters[idx - 1].id;
  });

  document.getElementById("brand").textContent = cfg.title;

  fetch("chapters/chapters.json")
    .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
    .then(function (list) { chapters = list; route(); })
    .catch(function () {
      view.replaceChildren(el("p", { "class": "notice" }, "Não foi possível carregar a lista de capítulos."));
    });
})();
