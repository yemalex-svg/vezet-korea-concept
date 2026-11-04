(function() {
    const $ = s => document.querySelector(s), $$ = s => [ ...document.querySelectorAll(s) ];
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const V = window.VK;
    const toastEl = $("#toast");
    let tt;
    function toast(m) {
        toastEl.textContent = m;
        toastEl.classList.add("on");
        clearTimeout(tt);
        tt = setTimeout(() => toastEl.classList.remove("on"), 2800);
    }
    const RMOT = matchMedia("(prefers-reduced-motion: reduce)").matches;
    $$("[data-soon]").forEach(a => a.addEventListener("click", e => {
        e.preventDefault();
        toast(a.dataset.soon);
    }));
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
        }
    }), {
        threshold: .12
    });
    $$(".rv").forEach(el => io.observe(el));
    $$(".dd-b").forEach(b => b.addEventListener("click", e => {
        e.stopPropagation();
        const d = b.parentElement, on = !d.classList.contains("open");
        $$(".dd").forEach(x => x.classList.remove("open"));
        d.classList.toggle("open", on);
    }));
    document.addEventListener("click", e => {
        if (!e.target.closest(".dd")) $$(".dd").forEach(x => x.classList.remove("open"));
    });
    $("#burger").addEventListener("click", () => $("#nav").classList.toggle("open"));
    $$(".nav .links a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));
    document.addEventListener("click", e => {
        const a = e.target.closest("[data-calc]");
        if (!a) return;
        const c = $("#calc");
        if (!c) return;
        e.preventDefault();
        $("#nav").classList.remove("open");
        c.scrollIntoView({
            behavior: RMOT ? "auto" : "smooth"
        });
    });
    const pop = $("#pop");
    function trackHTML(k) {
        const d = V.DEMO[k];
        return d ? "<b>" + V.STG[d.st] + '</b><div class="bar">' + V.STG.map((s, i) => '<span class="' + (i <= d.st ? "on" : "") + '"></span>').join("") + "</div><small>" + k + " · получение: " + d.city + " · ожидаем " + d.eta + "</small>" : "<b>Посылки с таким номером нет</b><small>Номер приходит в сообщении менеджера. Для примера попробуйте " + V.DEMO_NO + ".</small>";
    }
    $("#trackForm").addEventListener("submit", e => {
        e.preventDefault();
        const k = $("#trackIn").value.trim().toUpperCase().replace(/\s/g, "");
        pop.innerHTML = trackHTML(k);
        pop.classList.add("on");
    });
    document.addEventListener("click", e => {
        if (!e.target.closest("#trackForm")) pop.classList.remove("on");
    });
    $$(".q button").forEach(b => b.addEventListener("click", () => b.parentElement.classList.toggle("on")));
    function busy(btn, ms) {
        return new Promise(res => {
            if (!btn || RMOT) {
                res();
                return;
            }
            if (!btn.querySelector(".dots")) btn.insertAdjacentHTML("beforeend", '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>');
            btn.classList.add("busy");
            setTimeout(() => {
                btn.classList.remove("busy");
                res();
            }, ms);
        });
    }
    function roll(el, text) {
        el.classList.add("odo");
        el.setAttribute("aria-label", text);
        el.textContent = "";
        const ch = [ ...text ], di = ch.map((c, i) => /\d/.test(c) ? i : -1).filter(i => i >= 0);
        ch.forEach((c, i) => {
            const col = document.createElement("span"), st = document.createElement("span");
            col.className = "odo-d";
            col.setAttribute("aria-hidden", "true");
            st.className = "odo-s";
            if (!/\d/.test(c) || RMOT) {
                st.innerHTML = "<i>" + c + "</i>";
                col.appendChild(st);
                el.appendChild(col);
                return;
            }
            const n = di.indexOf(i), d = +c, R = Math.min(1 + n, 4);
            let h = "";
            for (let r = 0; r < R; r++) for (let k = 0; k < 10; k++) h += "<i>" + k + "</i>";
            for (let k = 0; k <= d; k++) h += "<i>" + k + "</i>";
            st.innerHTML = h;
            col.appendChild(st);
            el.appendChild(col);
            st.animate([ {
                transform: "translateY(0)",
                filter: "blur(0)"
            }, {
                filter: "blur(1.8px)",
                offset: .35
            }, {
                filter: "blur(.5px)",
                offset: .8
            }, {
                transform: "translateY(-" + (R * 10 + d) + "em)",
                filter: "blur(0)"
            } ], {
                duration: 700 + n * 120,
                easing: "cubic-bezier(.15,.75,.25,1)",
                fill: "forwards"
            });
        });
    }
    $$("form.lead").forEach(f => {
        const send = f.querySelector(".send"), done = f.parentElement.querySelector(".done");
        const ok = () => {
            const n = f.querySelector("[name=name]"), c = f.querySelector("[name=contact]");
            return (!n || n.value.trim().length > 1) && c && c.value.trim().length > 2;
        };
        f.addEventListener("input", () => send.classList.toggle("ok", ok()));
        f.addEventListener("submit", e => {
            e.preventDefault();
            if (!ok()) {
                toast("Заполните имя и телефон или Telegram");
                return;
            }
            busy(send, 900).then(() => {
                f.style.display = "none";
                if (done) done.style.display = "block";
            });
        });
    });
    function card(k) {
        const cls = k.s === "img" ? "t-img" : k.s === "grey" ? "t-grey" : "t-navy";
        const im = k.img ? '<img class="bgi" loading="lazy" alt="" ' + (k.img === "plane" ? 'style="transform:translateX(12%) scale(1.35)" ' : "") + 'src="' + V.IMG[k.img] + '"><div class="ov"></div>' : "";
        const bt = k.pick ? '<a class="btn o" href="#calc" data-pick="' + k.pick + '">Посчитать ' + k.bn + "</a>" : '<a class="btn o" href="#contact">Узнать цену</a>';
        const nm = k.lab.split(" · "), tag = nm[1] ? nm[1].charAt(0).toUpperCase() + nm[1].slice(1) + ". " : "";
        return '<article class="tc ' + cls + '">' + im + "<div><h3>" + nm[0] + '</h3><p class="tl">' + tag + k.h + '.</p></div><div><div class="spec">' + k.spec.map(x => '<div><div class="mono">' + x[0] + "</div><b>" + x[1] + "</b></div>").join("") + "</div>" + bt + "</div></article>";
    }
    function cards(el, code) {
        const list = V.CARDS[code];
        el.innerHTML = list.map(card).join("");
        el.classList.toggle("odd", list.length % 2 === 1 && list.length > 1);
    }
    const esc = s => String(s).replace(/[&<>"]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    }[c]));
    const PICK = {
        avia: "air",
        aviav: "air",
        exp: "express",
        mp: "maxpost",
        eco: "container"
    };
    const CC = {
        ru: "RU",
        kz: "KZ",
        kg: "KG",
        by: "BY",
        uz: "UZ"
    }, LC = {
        RU: "ru",
        KZ: "kz",
        KG: "kg",
        BY: "by",
        UZ: "uz"
    };
    const FLAG = c => '<img class="flag" src="assets/flag-' + c + '.svg" alt="" width="20" height="15">';
    function initCalc(root, opt) {
        opt = opt || {};
        const P = window.VezetPlan, T = P.T, q = s => root.querySelector(s);
        const st = {
            country: CC[opt.country || "ru"] || "RU",
            box: "M",
            pay: "KRW",
            sel: null,
            cityId: null
        };
        const el = {
            countries: q(".cCountries"),
            city: q(".cCity"),
            w: q(".cW"),
            boxes: q(".cBoxes"),
            dims: q(".cDims"),
            hint: q(".cHint"),
            cat: q(".cCat"),
            uz: q(".cUz"),
            kg: q(".cKg"),
            pay: q(".cPay"),
            ttl: q(".rTtl"),
            sum: q(".rSum"),
            meta: q(".rMeta"),
            cta: q(".rCta"),
            allT: q(".rAllT"),
            list: q(".rList")
        };
        if (opt.lock) q(".cfCountry").hidden = true;
        el.cat.innerHTML = T.containerCategories.map(c => '<option value="' + c.id + '">' + esc(c.name) + (c.actualWeightOnly ? " (по фактическому весу)" : "") + "</option>").join("");
        el.uz.innerHTML = '<option value="standard">Стандартный груз</option>' + T.countries.UZ.airUZ.commercial.map(c => '<option value="c:' + c.id + '">Коммерческий: ' + esc(c.name.toLowerCase()) + "</option>").join("");
        el.kg.innerHTML = [ "standard", "commercial", "dyson", "documents" ].map(k => '<option value="' + k + '">' + esc(T.countries.KG.airKG[k].name) + "</option>").join("");
        const tab = (lab, on, data) => '<button type="button" class="tab' + (on ? " on" : "") + '" aria-pressed="' + on + '" ' + data + ">" + lab + "</button>";
        const kg = n => String(n).replace(".", ",") + " кг";
        function chips() {
            el.countries.innerHTML = [ "RU", "KZ", "BY", "KG", "UZ" ].map(c => tab(FLAG(LC[c]) + T.countries[c].name, st.country === c, 'data-c="' + c + '"')).join("");
            el.boxes.innerHTML = T.boxes.map(b => tab(b.id + " · до " + kg(b.maxKg), st.box === b.id, 'data-b="' + b.id + '"')).join("") + tab("Свои размеры", st.box === "custom", 'data-b="custom"');
            el.dims.hidden = st.box !== "custom";
            el.pay.innerHTML = [ [ "KRW", "₩ вонах" ], [ "RUB", "₽ рублях" ], [ "KZT", "₸ тенге" ] ].map(p => tab(p[1], st.pay === p[0], 'data-p="' + p[0] + '"')).join("");
        }
        function fields() {
            const c = st.country, list = P.CITIES[c];
            q(".cfCity").hidden = !list;
            if (list) {
                if (!list.some(x => x.id === st.cityId)) st.cityId = list[0].id;
                el.city.innerHTML = list.map(x => '<option value="' + x.id + '"' + (x.id === st.cityId ? " selected" : "") + ">" + esc(x.name) + "</option>").join("");
            } else st.cityId = null;
            const msk = c === "RU" && list && (list.find(x => x.id === st.cityId) || {}).moscow;
            q(".cfCat").hidden = !(c === "RU" || c === "KZ" || c === "BY") || !!msk;
            q(".cfUz").hidden = c !== "UZ";
            q(".cfKg").hidden = c !== "KG";
        }
        function dims() {
            if (st.box === "custom") {
                const l = +q(".dL").value, w = +q(".dW").value, h = +q(".dH").value;
                return l && w && h ? {
                    l: l,
                    w: w,
                    h: h
                } : null;
            }
            const b = T.boxes.find(x => x.id === st.box);
            return {
                l: b.l,
                w: b.w,
                h: b.h
            };
        }
        function opts() {
            const uzv = el.uz.value || "standard";
            return {
                country: st.country,
                cityId: st.cityId,
                weightKg: parseFloat(String(el.w.value).replace(",", ".")),
                dims: dims(),
                box: st.box,
                category: el.cat.value,
                uzCargo: uzv === "standard" ? "standard" : "commercial",
                uzCategory: uzv.indexOf("c:") === 0 ? uzv.slice(2) : null,
                kgCargo: el.kg.value,
                pay: st.pay
            };
        }
        function empty(msg) {
            el.ttl.textContent = "";
            el.sum.classList.remove("odo");
            el.sum.textContent = msg;
            el.meta.innerHTML = "";
            el.cta.innerHTML = "";
            el.allT.textContent = "";
            el.list.innerHTML = "";
        }
        function row(x, pk) {
            const pa = x.approx ? x.packAmount : pk && pk.status === "ok" ? pk.amount : null, ap = x.approx ? "≈ " : "";
            const right = x.status === "ok" ? '<span class="vt-p">' + ap + "от " + P.fmt(x.amount, x.currency) + (pa != null ? "<small>с упаковкой " + ap + "от " + P.fmt(x.amount + pa, x.currency) + "</small>" : "") + "</span>" : '<span class="vt-p mgr">' + esc(x.label || "Рассчитает менеджер") + "</span>";
            const sub = [ x.term, x.dispatchText && !x.badge2 ? "ближайшая отправка " + x.dispatchText : "" ].filter(Boolean).join(" · ");
            return '<button type="button" class="vt' + (x.id === st.sel ? " on" : "") + (x.status !== "ok" ? " na" : "") + '" data-id="' + x.id + '"><span class="vt-h"><b>' + esc(x.name) + "</b>" + (x.badge ? '<em class="vb">' + esc(x.badge) + "</em>" : "") + (x.badge2 ? '<em class="vb b2">' + esc(x.badge2) + "</em>" : "") + "</span>" + right + (sub ? '<span class="vt-s">' + esc(sub) + "</span>" : "") + "</button>";
        }
        function calc(animate) {
            const o = opts(), b = T.boxes.find(x => x.id === st.box);
            el.hint.textContent = "";
            el.hint.classList.remove("warn");
            if (!(o.weightKg > 0)) {
                empty("Укажите вес посылки");
                return;
            }
            if (b && o.weightKg > b.maxKg) {
                el.hint.textContent = "Для такого веса выберите размер больше";
                el.hint.classList.add("warn");
            }
            if (!o.dims) {
                empty("Укажите длину, ширину и высоту коробки");
                return;
            }
            const r = P.run(o), cards = r.cards, pk = r.packaging;
            if (!cards.length) {
                empty("Рассчитает менеджер");
                return;
            }
            if (!cards.some(x => x.id === st.sel)) st.sel = cards[0].id;
            const c = cards.find(x => x.id === st.sel), ap = c.approx ? "≈ " : "";
            el.ttl.innerHTML = esc(c.name) + " в " + r.countryTo + (r.city && r.city.id !== "other" ? ", " + esc(r.city.name) : "") + (c.badge ? ' <span class="vb">' + esc(c.badge) + "</span>" : "") + (c.badge2 ? ' <span class="vb b2">' + esc(c.badge2) + "</span>" : "");
            const m = [];
            if (c.status === "ok") {
                const pa = c.approx ? c.packAmount : pk && pk.status === "ok" ? pk.amount : null, s = ap + "от " + P.fmt(c.amount + (pa || 0), c.currency);
                if (animate) roll(el.sum, s); else {
                    el.sum.classList.remove("odo");
                    el.sum.textContent = s;
                }
                m.push("Доставка: <b>" + ap + "от " + P.fmt(c.amount, c.currency) + "</b>" + (c.approx ? " за " + c.parts + " " + (c.parts < 5 ? "посылки" : "посылок") + " по ~" + kg(c.partKg) : ""));
                m.push(pa != null ? "Упаковка" + (!c.approx && pk.name ? " «" + esc(pk.name) + "»" : "") + ": <b>" + P.fmt(pa, c.currency) + "</b>" : "Упаковка: <b>рассчитает менеджер</b>");
                if (c.billedKg) m.push((c.approx ? "Каждую часть считаем по " : "Считаем по ") + kg(c.billedKg) + ": больший из фактического и объёмного веса");
                if (c.term) m.push("Срок: <b>" + esc(c.term) + "</b>");
                if (c.schedule) m.push("Отправки: " + c.schedule + (c.dispatchText ? " · ближайшая — <b>" + c.dispatchText + "</b>" : ""));
                if (c.receive) m.push(esc(c.receive.charAt(0).toUpperCase() + c.receive.slice(1)));
                if (c.category) m.push("Категория: " + esc(c.category));
                if (c.note) m.push(esc(c.note));
                if (c.id === "express") m.push("Телефоны, колонки и шуруповёрты — по согласованию с менеджером");
                el.cta.innerHTML = '<a class="btn o" href="' + P.startLink(o, c.id) + '" target="_blank" rel="noopener">Оформить в Telegram</a><a class="btn w" href="' + P.BOT + '" target="_blank" rel="noopener">Спросить менеджера</a>';
            } else {
                el.sum.classList.remove("odo");
                el.sum.textContent = c.label || "Рассчитает менеджер";
                if (c.days) m.push("Срок: <b>" + esc(c.days) + "</b>");
                if (c.note) m.push(esc(c.note));
                m.push("Менеджеры на связи ежедневно 09:00–21:00, ответ в течение 15 минут");
                el.cta.innerHTML = '<a class="btn o" href="' + P.startLink(o, c.id) + '" target="_blank" rel="noopener">Написать менеджеру</a>';
            }
            el.meta.innerHTML = m.map(x => "<span>" + x + "</span>").join("");
            const ex = r.extras || [], many = cards.length > 1 || ex.length;
            el.allT.textContent = many ? "Все тарифы для " + kg(o.weightKg) + ":" : "";
            el.list.innerHTML = many ? cards.map(x => row(x, pk)).join("") + ex.map(x => '<div class="vt info"><span class="vt-h"><b>' + esc(x.name) + '</b></span><span class="vt-p mgr">' + esc(x.label) + "</span></div>").join("") : "";
        }
        function set(code) {
            const C = CC[code] || code;
            if (!T.countries[C]) return;
            st.country = C;
            st.sel = null;
            chips();
            fields();
            calc(true);
            if (opt.onCountry) opt.onCountry(LC[C]);
        }
        el.countries.addEventListener("click", e => {
            const b = e.target.closest("[data-c]");
            if (b) set(b.dataset.c);
        });
        el.boxes.addEventListener("click", e => {
            const b = e.target.closest("[data-b]");
            if (!b) return;
            st.box = b.dataset.b;
            chips();
            calc(true);
        });
        el.pay.addEventListener("click", e => {
            const b = e.target.closest("[data-p]");
            if (!b) return;
            st.pay = b.dataset.p;
            chips();
            calc(true);
        });
        el.city.addEventListener("change", () => {
            st.cityId = el.city.value;
            fields();
            calc(true);
        });
        el.w.addEventListener("input", () => calc(false));
        el.w.addEventListener("change", () => calc(true));
        [ el.cat, el.uz, el.kg ].forEach(s => s.addEventListener("change", () => calc(true)));
        root.querySelectorAll(".cDims input").forEach(i => i.addEventListener("input", () => calc(false)));
        el.list.addEventListener("click", e => {
            const b = e.target.closest(".vt[data-id]");
            if (!b) return;
            st.sel = b.dataset.id;
            calc(true);
        });
        document.addEventListener("click", e => {
            const a = e.target.closest("[data-pick]");
            if (!a) return;
            e.preventDefault();
            if (a.dataset.c && CC[a.dataset.c] !== st.country) set(a.dataset.c);
            st.sel = PICK[a.dataset.pick] || a.dataset.pick;
            calc(true);
            root.scrollIntoView({
                behavior: RMOT ? "auto" : "smooth"
            });
        });
        chips();
        fields();
        calc(false);
        return {
            set: set
        };
    }
    const SVGNS = "http://www.w3.org/2000/svg";
    function pulse(host, build, o) {
        o = o || {};
        const svg = document.createElementNS(SVGNS, "svg"), gid = "plg" + Math.random().toString(36).slice(2, 8);
        svg.setAttribute("class", "pl");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML = '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="#F96C19" stop-opacity=".6"/><stop offset=".3" stop-color="#F96C19" stop-opacity=".22"/><stop offset="1" stop-color="#F96C19" stop-opacity="0"/></radialGradient></defs><path class="pl-base"/><circle class="pl-glow" r="72" fill="url(#' + gid + ')" opacity="0"/><path class="pl-dot" opacity="0"/>';
        host.appendChild(svg);
        const base = svg.querySelector(".pl-base"), dot = svg.querySelector(".pl-dot"), glow = svg.querySelector(".pl-glow");
        let len = 0, vis = false;
        const draw = () => {
            const r = host.getBoundingClientRect();
            if (!r.width) return;
            svg.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
            const d = build(r.width, r.height, r);
            svg.style.display = d ? "" : "none";
            if (!d) {
                len = 0;
                return;
            }
            base.setAttribute("d", d);
            dot.setAttribute("d", d);
            len = dot.getTotalLength();
        };
        draw();
        addEventListener("resize", draw);
        if (document.fonts) document.fonts.ready.then(draw);
        if (RMOT) return;
        new IntersectionObserver(es => {
            vis = es[0].isIntersecting;
        }).observe(host);
        const D = 18, sp = o.speed || .5, pause = o.pause || 1400, t0 = performance.now() - Math.random() * 1500;
        const tick = now => {
            if (vis && len) {
                const t = (now - t0) % (len / sp + pause), pos = t * sp - D, on = pos < len;
                dot.setAttribute("opacity", on ? 1 : 0);
                glow.setAttribute("opacity", on ? 1 : 0);
                if (on) {
                    dot.style.strokeDasharray = D + " " + (len + D);
                    dot.style.strokeDashoffset = -pos;
                    const p = dot.getPointAtLength(Math.max(0, Math.min(len, pos + D / 2)));
                    glow.setAttribute("cx", p.x);
                    glow.setAttribute("cy", p.y);
                }
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    const rounded = (pts, rad) => {
        let d = "M" + pts[0][0] + " " + pts[0][1];
        for (let i = 1; i < pts.length - 1; i++) {
            const a = pts[i - 1], c = pts[i], b = pts[i + 1], da = Math.hypot(c[0] - a[0], c[1] - a[1]), db = Math.hypot(b[0] - c[0], b[1] - c[1]), q = Math.min(rad, da / 2, db / 2);
            d += "L" + (c[0] - (c[0] - a[0]) / da * q) + " " + (c[1] - (c[1] - a[1]) / da * q) + "Q" + c[0] + " " + c[1] + " " + (c[0] + (b[0] - c[0]) / db * q) + " " + (c[1] + (b[1] - c[1]) / db * q);
        }
        const z = pts[pts.length - 1];
        return d + "L" + z[0] + " " + z[1];
    };
    const fin = $(".final");
    if (fin) {
        const geo = r => {
            const nw = [ ...fin.querySelectorAll(".slogan .nw") ].map(e => e.getBoundingClientRect()), sl = {
                left: Math.min(...nw.map(x => x.left)),
                right: Math.max(...nw.map(x => x.right)),
                top: Math.min(...nw.map(x => x.top))
            };
            sl.width = sl.right - sl.left;
            const bt = fin.querySelector(".cta .btn").getBoundingClientRect(), sv = fin.querySelectorAll(":scope > .edge svg");
            const gl = sv.length ? sv[0].getBoundingClientRect().right - r.left : 0, gr = sv.length ? sv[1].getBoundingClientRect().left - r.left : r.width;
            return {
                sl: {
                    l: sl.left - r.left,
                    r: sl.right - r.left,
                    t: sl.top - r.top,
                    w: sl.width
                },
                bt: {
                    t: bt.top - r.top,
                    b: bt.bottom - r.top
                },
                gl: gl,
                gr: gr
            };
        };
        pulse(fin, (w, h, r) => {
            if (w < 1024) return "";
            const g = geo(r), x0 = Math.max(g.sl.l + g.sl.w * .22, g.gl + 60), yA = Math.max(96, g.sl.t - 70), xL = Math.max(40, g.sl.l - 110), yB = g.bt.b + 80;
            return rounded([ [ x0, 0 ], [ x0, yA ], [ xL, yA ], [ xL, yB ], [ 0, yB ] ], 44);
        }, {
            speed: .42,
            pause: 1600
        });
        pulse(fin, (w, h, r) => {
            if (w < 1024) return "";
            const g = geo(r), x1 = Math.min(g.sl.l + g.sl.w * .78, g.gr - 60), yC = Math.max(120, g.sl.t - 40), xR = Math.min(w - 40, g.sl.r + 110), yD = g.bt.t + 20;
            return rounded([ [ x1, 0 ], [ x1, yC ], [ xR, yC ], [ xR, yD ], [ w, yD ] ], 44);
        }, {
            speed: .42,
            pause: 2200
        });
    }
    window.VKUI = {
        $: $,
        $$: $$,
        clamp: clamp,
        toast: toast,
        busy: busy,
        roll: roll,
        cards: cards,
        initCalc: initCalc,
        trackHTML: trackHTML,
        esc: esc
    };
})();
