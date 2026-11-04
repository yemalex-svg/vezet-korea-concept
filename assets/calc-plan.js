(function() {
    "use strict";
    var T = window.TARIFFS, Core = window.VezetCalc;
    var BOT = "https://t.me/vezet_korea_bot";
    var RATES_DEMO = {
        krwPerUsd: 1325,
        krwPerRub: 16.46,
        krwPerKzt: 2.96
    };
    var CITIES = {
        RU: [ {
            id: "msk",
            name: "Москва",
            moscow: true,
            kzt: 7093,
            days: [ 11, 12 ]
        }, {
            id: "nsk",
            name: "Новосибирск",
            kzt: 6735,
            days: [ 8, 10 ]
        }, {
            id: "vvo",
            name: "Владивосток",
            kzt: 10270,
            days: null
        }, {
            id: "spb",
            name: "Санкт-Петербург",
            kzt: null
        }, {
            id: "other",
            name: "Другой город",
            kzt: null
        } ],
        KZ: [ {
            id: "ast",
            name: "Астана",
            kzt: 3737,
            days: [ 3, 4 ]
        }, {
            id: "other",
            name: "Другой город",
            kzt: null
        } ],
        BY: [ {
            id: "msq",
            name: "Минск",
            kzt: 8391,
            days: null
        }, {
            id: "other",
            name: "Другой город",
            kzt: null
        } ],
        KG: null,
        UZ: null
    };
    var COUNTRY = {
        RU: "Россию",
        KZ: "Казахстан",
        BY: "Беларусь",
        KG: "Кыргызстан",
        UZ: "Узбекистан"
    };
    var PACK_NAMES = {
        2: "Лёгкий вес",
        5: "Оптимальный вес",
        12: "Вместительный вес",
        18: "Большой вес",
        35: "Максимальный вес"
    };
    var SCHED = {
        RU: {
            express: {
                days: [ 1, 4 ]
            },
            maxpost: {
                days: [ 2 ],
                after: 2
            }
        },
        KZ: {
            air: {
                days: [ 1, 4 ],
                go: [ 3, 3 ]
            },
            express: {
                days: [ 1, 4 ]
            }
        },
        BY: {
            express: {
                days: [ 1, 4 ]
            }
        },
        KG: {
            air: {
                days: [ 2, 5 ]
            }
        },
        UZ: {
            air: {
                days: [ 2 ],
                go: [ 5, 5 ]
            }
        }
    };
    var DOW = [ "вс", "пн", "вт", "ср", "чт", "пт", "сб" ];
    var MONTHS = [ "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря" ];
    function todayKR() {
        var p = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date).split("-");
        return Date.UTC(+p[0], +p[1] - 1, +p[2]);
    }
    var DAY = 864e5;
    function dd(t) {
        var d = new Date(t);
        return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
    }
    function dDay(t) {
        var d = new Date(t);
        return DOW[d.getUTCDay()] + ", " + dd(t);
    }
    function range(a, b) {
        if (a === b) return dd(a);
        var A = new Date(a), B = new Date(b);
        return A.getUTCMonth() === B.getUTCMonth() ? A.getUTCDate() + "–" + dd(b) : dd(a) + " – " + dd(b);
    }
    function weekdays(list) {
        return list.map(function(i) {
            return DOW[i];
        }).join(" и ");
    }
    function nextDispatch(s, from) {
        for (var i = s.after || 1; i < 15; i++) {
            var t = from + i * DAY;
            if (s.days.indexOf(new Date(t).getUTCDay()) >= 0) return t;
        }
        return null;
    }
    function fmt(n, cur) {
        return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ") + " " + {
            KRW: "₩",
            RUB: "₽",
            KZT: "₸"
        }[cur || "KRW"];
    }
    function run(o) {
        var list = CITIES[o.country], city = null;
        if (list) city = list.filter(function(c) {
            return c.id === o.cityId;
        })[0] || list[0];
        var rates = {
            krwPerUsd: RATES_DEMO.krwPerUsd,
            krwPerRub: RATES_DEMO.krwPerRub,
            krwPerKzt: RATES_DEMO.krwPerKzt,
            updatedAt: Date.now()
        };
        var delivery = city && city.kzt != null ? {
            kzt: city.kzt,
            days: city.days
        } : null;
        var input = {
            country: o.country,
            moscow: !!(city && city.moscow),
            weightKg: o.weightKg,
            dims: o.dims,
            category: o.category,
            uzCargo: o.uzCargo || "standard",
            uzCategory: o.uzCategory || null,
            kgCargo: o.kgCargo || "standard",
            pay: o.pay || "KRW"
        };
        var r = Core.calculate(input, T, rates, delivery);
        if (r.error) return r;
        r.city = city;
        r.input = input;
        r.delivery = delivery;
        if (r.packaging && r.packaging.status === "ok") r.packaging.name = PACK_NAMES[r.packaging.upToKg] || "";
        r.cards.forEach(function(c, i) {
            if (c.id !== "express" || c.status !== "manager" || !delivery || r.billed.airKg <= T.express.maxKg) return;
            var n = Math.ceil(r.billed.airKg / T.express.maxKg);
            var part = {};
            for (var k in input) part[k] = input[k];
            part.weightKg = Math.round(input.weightKg / n * 10) / 10;
            part.dims = input.dims ? {
                l: input.dims.l,
                w: input.dims.w,
                h: input.dims.h / n
            } : null;
            var pr = Core.calculate(part, T, rates, delivery);
            var pc = pr.cards.filter(function(x) {
                return x.id === "express" && x.status === "ok";
            })[0];
            if (!pc) return;
            r.cards[i] = {
                id: "express",
                name: "Экспресс",
                status: "ok",
                approx: true,
                parts: n,
                partKg: part.weightKg,
                amount: pc.amount * n,
                currency: pc.currency,
                days: pc.days,
                billedKg: pc.billedKg,
                packAmount: pr.packaging && pr.packaging.status === "ok" ? pr.packaging.amount * n : null,
                note: "Сумма примерная: вес и высота коробки делятся поровну, точные размеры частей калькулятор не знает"
            };
        });
        var today = todayKR(), S = SCHED[o.country] || {};
        r.cards.forEach(function(c) {
            var s = S[c.id];
            if (!s || c.status !== "ok") return;
            c.schedule = weekdays(s.days);
            var t = nextDispatch(s, today);
            if (!t) return;
            c.dispatch = t;
            c.dispatchText = dDay(t);
            if (c.id === "express" && delivery && delivery.days) c.receive = "получение ориентировочно " + range(t + (3 + delivery.days[0]) * DAY, t + (6 + delivery.days[1]) * DAY); else if (c.id === "maxpost") c.receive = "получение ориентировочно с " + dd(t + 14 * DAY); else if (s.go) c.receive = "получение ориентировочно " + range(t + s.go[0] * DAY, t + s.go[1] * DAY);
        });
        r.cards.forEach(function(c) {
            c.term = c.days && c.schedule ? c.days.replace(/,?\s*(отправка|вылет)[^,]*$/, "").trim() || null : c.days;
        });
        var rec = r.cards[0] && r.cards[0].badge ? r.cards[0] : null, early = null;
        r.cards.forEach(function(c) {
            if (c.status !== "ok" || c.id === "container" || !c.dispatch) return;
            if (!early || c.dispatch < early.dispatch) early = c;
        });
        if (rec && early && early !== rec && (!rec.dispatch || early.dispatch < rec.dispatch)) {
            early.badge2 = "Уйдёт раньше — " + dd(early.dispatch);
            r.cards.splice(r.cards.indexOf(early), 1);
            r.cards.splice(1, 0, early);
        }
        r.countryTo = COUNTRY[o.country];
        return r;
    }
    function startLink(o, cardId) {
        var box = o.box === "custom" && o.dims ? "d" + [ o.dims.l, o.dims.w, o.dims.h ].map(Math.round).join("x") : o.box || "M";
        var extra = o.country === "UZ" ? o.uzCategory || "std" : o.country === "KG" ? o.kgCargo || "standard" : o.category || "";
        var parts = [ "calc", o.country, o.cityId || "", "w" + Math.round(o.weightKg * 10), box, o.pay || "KRW", cardId || "", extra ];
        var p = parts.join("_").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
        return BOT + "?start=" + p;
    }
    window.VezetPlan = {
        run: run,
        startLink: startLink,
        fmt: fmt,
        CITIES: CITIES,
        BOT: BOT,
        T: T
    };
})();
