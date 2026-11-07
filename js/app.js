(function () {
  "use strict";

  var BUILD_VER = window.BUILD_VER || "";
  var _bv = BUILD_VER ? "?v=" + BUILD_VER : "";

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

  // Envolve qualquer elemento DOM em um .para-wrap com botão de comentário
  function wrapWithComment(node, chapterId) {
    var idx = _paraCount++;
    var wrap = el("div", { "class": "para-wrap" });
    if (commentsEnabled() && chapterId != null) {
      var btn = el("button", { type: "button", "class": "para-comment-btn", "aria-label": "Comentar este trecho", "data-idx": String(idx) });
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      btn.addEventListener("click", function () { toggleParaPanel(wrap, chapterId, idx); });
      wrap.appendChild(btn);
    }
    wrap.appendChild(node);
    return wrap;
  }

  function renderParagraphs(box, lines, chapterId) {
    lines.join("\n").split(/\n{2,}/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      if (block === "---") { box.appendChild(el("hr")); return; }
      // == Ponto de Vista: Nome == → marcador especial
      var pvMatch = block.match(/^==\s*(.+?)\s*==$/);
      if (pvMatch) {
        var pv = el("div", { "class": "ponto-de-vista" });
        pv.appendChild(el("span", { "class": "pdv-label" }, "Ponto de Vista"));
        pv.appendChild(el("span", { "class": "pdv-nome" }, pvMatch[1]));
        box.appendChild(pv);
        return;
      }
      var p = el("p");
      inline(p, block.replace(/\n/g, " "));
      box.appendChild(wrapWithComment(p, chapterId));
    });
  }

  function renderSpotify(title, inner) {
    // título é a URL ou ID do Spotify (track, album, playlist, episode)
    // inner pode ter uma linha de legenda opcional
    var url = title.trim();
    // aceita URL completa ou URI spotify:type:id
    var embedUrl = "";
    var m = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
    if (m) {
      embedUrl = "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?utm_source=generator&theme=0";
    } else {
      var uri = url.match(/spotify:(track|album|playlist|episode|show):([A-Za-z0-9]+)/);
      if (uri) embedUrl = "https://open.spotify.com/embed/" + uri[1] + "/" + uri[2] + "?utm_source=generator&theme=0";
    }
    if (!embedUrl) return el("div"); // URL inválida, retorna vazio
    var caption = inner.join(" ").trim();
    // altura: track/episode = 152px, playlist/album = 352px
    var isCompact = /\/(track|episode)\//.test(embedUrl);
    var wrap = el("div", { "class": "spotify-wrap" });
    var iframe = document.createElement("iframe");
    iframe.style.borderRadius = "12px";
    iframe.setAttribute("src", embedUrl);
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", isCompact ? "152" : "352");
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("allow", "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture");
    iframe.setAttribute("loading", "lazy");
    wrap.appendChild(iframe);
    if (caption) {
      var leg = el("p", { "class": "spotify-caption" }, caption);
      wrap.appendChild(leg);
    }
    return wrap;
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
      if (kind === "whatsapp") box.appendChild(wrapWithComment(renderWhatsapp(title, inner), chapterId));
      else if (kind === "tweet" || kind === "twitter") box.appendChild(wrapWithComment(renderTweet(title, inner), chapterId));
      else if (kind === "spotify") box.appendChild(renderSpotify(title, inner));
      else if (kind === "nota") {
        var note = renderAuthorNote(inner);
        if (note) box.appendChild(note);
      }
      else renderParagraphs(box, inner, chapterId);
    }
    renderParagraphs(box, buf, chapterId);
    return box;
  }

  // ---------- preferências ----------
  var fs = parseInt(store("fs"), 10) || 19;
  function applyFont() { document.documentElement.style.setProperty("--fs", fs + "px"); }
  function applyTheme(t) {
    if (["light", "dark", "claro", "acessivel"].indexOf(t) === -1) t = "light";
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

    var closeBar = el("div", { "class": "para-panel-close-bar" });
    var closeBtn = el("button", { type: "button", "class": "para-panel-close", "aria-label": "Fechar comentários" }, "×");
    closeBtn.addEventListener("click", function () { panel.remove(); });
    closeBar.appendChild(closeBtn);
    panel.appendChild(closeBar);

    var list = el("ul", { "class": "comment-list para-comment-list" });
    var status = el("p", { "class": "notice" }, "Carregando...");
    panel.appendChild(status);
    panel.appendChild(list);

    function loadComments() {
      list.innerHTML = "";
      status.textContent = "Carregando...";
      api("comments?select=author,body,created_at&chapter_id=eq." +
          encodeURIComponent(chapterId) +
          "&paragraph_index=eq." + paraIdx +
          "&order=created_at.asc&limit=100")
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          status.textContent = rows.length ? "" : "Nenhum comentário ainda.";
          rows.forEach(function (row) { list.appendChild(commentItem(row)); });
        })
        .catch(function () { status.textContent = "Não foi possível carregar."; });
    }
    loadComments();

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
        msg.textContent = "Comentário enviado!";
        loadComments();
      }).catch(function () {
        msg.textContent = "Erro ao enviar. Tente novamente.";
      }).then(function () { btn.disabled = false; });
    });

    panel.appendChild(form);
    return panel;
  }

  // ---------- reações por capítulo ----------
  var REACTIONS = ["💔", "😭", "👀", "🔥", "🥺"];

  function reactionsEnabled() { return commentsEnabled(); }

  function loadedReactions(chapterId, btns, counts) {
    btns.forEach(function (btn) {
      var emoji = btn.dataset.emoji;
      var n = counts[emoji] || 0;
      btn.querySelector(".rx-count").textContent = n > 0 ? (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n) : "";
    });
  }

  function renderReactions(chapter) {
    if (!reactionsEnabled()) return document.createDocumentFragment();

    var wrap = el("div", { "class": "reactions-wrap" });
    wrap.appendChild(el("p", { "class": "reactions-label" }, "O que você achou?"));
    var bar = el("div", { "class": "reactions-bar" });

    var voted = store("rx_" + chapter.id); // emoji já votado neste capítulo

    var btns = REACTIONS.map(function (emoji) {
      var btn = el("button", {
        "class": "rx-btn" + (voted === emoji ? " rx-active" : ""),
        "data-emoji": emoji,
        "aria-label": "Reagir com " + emoji,
        "type": "button"
      });
      btn.appendChild(document.createTextNode(emoji));
      var cnt = el("span", { "class": "rx-count" });
      btn.appendChild(cnt);
      bar.appendChild(btn);
      return btn;
    });

    wrap.appendChild(bar);

    // carrega contagens
    function fetchCounts() {
      api("reactions?chapter_id=eq." + encodeURIComponent(chapter.id) + "&select=emoji")
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          var map = {};
          rows.forEach(function (row) { map[row.emoji] = (map[row.emoji] || 0) + 1; });
          loadedReactions(chapter.id, btns, map);
        })
        .catch(function () {}); // silencioso — contagens não são críticas
    }

    // clique numa reação
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var emoji = btn.dataset.emoji;
        var prev = store("rx_" + chapter.id);

        // já votou no mesmo: desfaz localmente, não remove do servidor (sem DELETE por segurança)
        if (prev === emoji) {
          store("rx_" + chapter.id, "");
          btns.forEach(function (b) { b.classList.remove("rx-active"); });
          return;
        }

        // marca como votado localmente
        store("rx_" + chapter.id, emoji);
        btns.forEach(function (b) { b.classList.toggle("rx-active", b.dataset.emoji === emoji); });

        api("reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ chapter_id: chapter.id, emoji: emoji })
        }).then(function () {
          fetchCounts();
        }).catch(function () {});
      });
    });

    fetchCounts();
    return wrap;
  }

  function renderComments(chapter) {
    return document.createDocumentFragment(); // comentários agora são por parágrafo
  }

  // ---------- nota da autora ----------
  function renderAuthorNote(lines) {
    if (!lines.length) return null;

    var wrap = el("details", { "class": "author-note" });
    var summary = el("summary", { "class": "author-note-header" });
    summary.appendChild(el("span", { "class": "author-note-label" }, "Nota da autora"));
    summary.appendChild(el("span", { "class": "author-note-chevron" }, "▾"));
    wrap.appendChild(summary);

    var body = el("div", { "class": "author-note-body" });
    lines.join("\n").split(/\n{2,}/).forEach(function (par) {
      par = par.trim();
      if (par) body.appendChild(el("p", null, par.replace(/\n/g, " ")));
    });
    wrap.appendChild(body);
    return wrap;
  }

  // ---------- visualizações por capítulo ----------
  function trackView(chapterId, viewEl) {
    if (!commentsEnabled()) return;

    // mostra contagem
    function showCount(n) {
      if (n > 0) {
        viewEl.textContent = " · " + (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n) + " leituras";
      }
    }

    // busca contagem atual
    api("views?chapter_id=eq." + encodeURIComponent(chapterId) + "&select=id")
      .then(function (r) { return r.json(); })
      .then(function (rows) { showCount(rows.length + 1); }) // +1 pela visita atual
      .catch(function () {});

    // registra visita (sem await — dispara e esquece)
    api("views", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ chapter_id: chapterId })
    }).then(function () {
      // após registrar, busca contagem atualizada
      api("views?chapter_id=eq." + encodeURIComponent(chapterId) + "&select=id")
        .then(function (r) { return r.json(); })
        .then(function (rows) { showCount(rows.length); })
        .catch(function () {});
    }).catch(function () {});
  }

  // ---------- personagens ----------
  function personagensPage() {
    document.title = "Personagens · " + cfg.title;
    fetch("personagens.json" + _bv)
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (nucleos) {
        var box = el("section", { "class": "personagens-page" });
        box.appendChild(el("h1", { "class": "personagens-titulo" }, "Personagens"));
        nucleos.forEach(function (nucleo) {
          var sec = el("div", { "class": "nucleo" });
          sec.appendChild(el("h2", { "class": "nucleo-nome" }, nucleo.nucleo));
          nucleo.personagens.forEach(function (p) {
            // card: foto + descrição
            var card = el("div", { "class": "char-card" });
            var fotoWrap = el("div", { "class": "char-foto-wrap" });
            fotoWrap.appendChild(el("img", { src: p.foto, alt: p.nome, "class": "char-foto", loading: "lazy" }));
            card.appendChild(fotoWrap);
            var info = el("div", { "class": "char-info" });
            info.appendChild(el("h3", { "class": "char-nome" }, p.nome));
            p.descricao.forEach(function (par) {
              info.appendChild(el("p", { "class": "char-desc" }, par));
            });
            card.appendChild(info);
            sec.appendChild(card);

            // perfil(s) do Twitter — aceita objeto único ou array
            if (p.twitter) {
              var twList = Array.isArray(p.twitter) ? p.twitter : [p.twitter];
              twList.forEach(function (tw) {
                var perfil = el("div", { "class": "char-twitter" });
                if (tw.banner) {
                  var banner = el("div", { "class": "char-tw-banner" });
                  banner.appendChild(el("img", { src: tw.banner, alt: "", loading: "lazy" }));
                  perfil.appendChild(banner);
                }
                var twHead = el("div", { "class": "char-tw-head" });
                var twAvatar = el("div", { "class": "char-tw-avatar" });
                if (tw.avatar) twAvatar.appendChild(el("img", { src: tw.avatar, alt: p.nome, loading: "lazy" }));
                twHead.appendChild(twAvatar);
                var twNome = el("div", { "class": "char-tw-nome" });
                twNome.appendChild(document.createTextNode(tw.nome_exibicao || p.nome));
                if (tw.privada) twNome.appendChild(el("span", { "class": "char-tw-lock", "aria-label": "conta privada" }, " 🔒"));
                twHead.appendChild(twNome);
                if (tw.handle) twHead.appendChild(el("div", { "class": "char-tw-handle" }, tw.handle));
                if (tw.bio) twHead.appendChild(el("div", { "class": "char-tw-bio" }, tw.bio));
                if (tw.localizacao) {
                  var loc = el("div", { "class": "char-tw-loc" });
                  var pinSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  pinSvg.setAttribute("viewBox", "0 0 24 24"); pinSvg.setAttribute("width", "14"); pinSvg.setAttribute("height", "14");
                  pinSvg.setAttribute("aria-hidden", "true"); pinSvg.setAttribute("class", "char-tw-loc-icon");
                  pinSvg.innerHTML = '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>';
                  loc.appendChild(pinSvg);
                  loc.appendChild(document.createTextNode(" " + tw.localizacao));
                  twHead.appendChild(loc);
                }
                perfil.appendChild(twHead);
                if (tw.seguindo || tw.seguidores) {
                  var twStats = el("div", { "class": "char-tw-stats" });
                  var s1 = el("span"); s1.appendChild(el("b", null, tw.seguindo)); s1.appendChild(document.createTextNode(" Seguindo"));
                  var s2 = el("span"); s2.appendChild(el("b", null, tw.seguidores)); s2.appendChild(document.createTextNode(" Seguidores"));
                  twStats.appendChild(s1);
                  twStats.appendChild(s2);
                  perfil.appendChild(twStats);
                }
                sec.appendChild(perfil);
              });
            }
          });
          box.appendChild(sec);
        });
        view.replaceChildren(box);
        window.scrollTo(0, 0);
      })
      .catch(function () {
        view.replaceChildren(el("p", { "class": "notice" }, "Não foi possível carregar os personagens."));
      });
  }

  // ---------- páginas ----------
  function home() {
    document.title = cfg.title;
    var box = el("section", { "class": "home" });
    box.appendChild(el("h1", null, cfg.title));
    // subtítulo com efeito de digitação
    var subEl = el("p", { "class": "sub" });
    box.appendChild(subEl);
    if (cfg.subtitle) {
      // parse: converte ~texto~ em segmentos marcados
      var segments = [];
      cfg.subtitle.split(/(~[^~]+~)/).forEach(function (part) {
        if (!part) return;
        if (part.charAt(0) === "~" && part.length > 2) {
          segments.push({ text: part.slice(1, -1), strike: true });
        } else {
          segments.push({ text: part, strike: false });
        }
      });

      // constrói a sequência de "quadros" do efeito:
      // 1) digita tudo sem risco
      // 2) apaga o trecho que vai ficar riscado
      // 3) redigita com risco
      var plainFull = segments.map(function (s) { return s.text; }).join("");
      var strikeSegs = segments.filter(function (s) { return s.strike; });
      var strikeText = strikeSegs.length ? strikeSegs[0].text : "";
      var strikeStart = strikeSegs.length ? plainFull.indexOf(strikeText) : -1;

      // nó de texto antes do risco, <s>, nó de texto depois
      var beforeNode = document.createTextNode("");
      var strikeNode = el("s");
      var strikeInner = document.createTextNode("");
      strikeNode.appendChild(strikeInner);
      var afterNode  = document.createTextNode("");
      var cursor     = el("span", { "class": "type-cursor" }, "|");

      subEl.appendChild(beforeNode);
      subEl.appendChild(strikeNode);
      subEl.appendChild(afterNode);
      subEl.appendChild(cursor);

      var PREFIX  = strikeStart >= 0 ? plainFull.slice(0, strikeStart) : plainFull;
      var STRIKE  = strikeText;
      var SUFFIX  = strikeStart >= 0 ? plainFull.slice(strikeStart + strikeText.length) : "";
      var SPEED   = 55;   // ms por caractere digitando
      var DEL     = 35;   // ms por caractere apagando
      var PAUSE   = 600;  // ms de pausa antes de apagar/redigitar

      // fase 1: digita PREFIX + STRIKE em beforeNode (sem risco ainda)
      function phase1(i) {
        var full = PREFIX + STRIKE;
        if (i <= full.length) {
          beforeNode.nodeValue = full.slice(0, i);
          setTimeout(function () { phase1(i + 1); }, SPEED);
        } else {
          if (STRIKE) setTimeout(phase2, PAUSE);
          else phase4(0);
        }
      }

      // fase 2: apaga só a parte STRIKE de beforeNode
      function phase2() {
        var cur = STRIKE;
        function del() {
          if (cur.length > 0) {
            cur = cur.slice(0, -1);
            beforeNode.nodeValue = PREFIX + cur;
            setTimeout(del, DEL);
          } else {
            setTimeout(phase3, PAUSE);
          }
        }
        del();
      }

      // fase 3: redigita STRIKE dentro do <s> (agora riscado)
      function phase3() {
        var i = 0;
        function type() {
          if (i <= STRIKE.length) {
            strikeInner.nodeValue = STRIKE.slice(0, i);
            i++;
            setTimeout(type, SPEED);
          } else {
            phase4(0);
          }
        }
        type();
      }

      // fase 4: digita SUFFIX em afterNode
      function phase4(i) {
        if (i <= SUFFIX.length) {
          afterNode.nodeValue = SUFFIX.slice(0, i);
          setTimeout(function () { phase4(i + 1); }, SPEED);
        } else {
          cursor.classList.add("type-done");
        }
      }

      setTimeout(function () { phase1(0); }, 300);
    }

    if (cfg.sinopse && cfg.sinopse.length) {
      var sinopseEl = el("div", { "class": "sinopse" });
      cfg.sinopse.forEach(function (par) {
        sinopseEl.appendChild(el("p", null, par));
      });
      box.appendChild(sinopseEl);
    }

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

    fetch("chapters/" + encodeURIComponent(c.file) + _bv)
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.text(); })
      .then(function (raw) {
        var art = el("article", { "class": "chapter" });
        art.appendChild(el("h1", null, c.title));
        var metaEl = el("div", { "class": "meta" });
        metaEl.appendChild(document.createTextNode("Capítulo " + (idx + 1) + " de " + chapters.length));
        var viewsEl = el("span", { "class": "meta-views" });
        metaEl.appendChild(viewsEl);
        art.appendChild(metaEl);
        art.appendChild(renderText(raw, c.id));
        trackView(c.id, viewsEl);

        art.appendChild(renderReactions(c));

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

  // ---------- barra mobile ----------
  function updateMobileBar() {
    var mbHome  = document.getElementById("mb-home");
    var mbChars = document.getElementById("mb-chars");
    if (!mbHome) return;
    var isChars = location.hash === "#/personagens";
    mbHome.classList.toggle("active", !isChars);
    mbChars.classList.toggle("active", isChars);
  }

  var mbTheme = document.getElementById("mb-theme-toggle");
  var mbThemeIcon = document.getElementById("mb-theme-icon");
  var themes = ["light", "dark", "claro", "acessivel"];
  if (mbTheme) {
    mbTheme.addEventListener("click", function (e) {
      e.preventDefault();
      var cur = themes.indexOf(store("theme") || "light");
      applyTheme(themes[(cur + 1) % themes.length]);
    });
  }

  // ---------- roteamento ----------
  function route() {
    updateMobileBar();
    if (location.hash === "#/personagens") { personagensPage(); return; }
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

  fetch("chapters/chapters.json" + _bv)
    .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
    .then(function (list) { chapters = list; route(); })
    .catch(function () {
      view.replaceChildren(el("p", { "class": "notice" }, "Não foi possível carregar a lista de capítulos."));
    });
})();
