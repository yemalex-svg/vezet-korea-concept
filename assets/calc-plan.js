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
            gen: "Москвы",
            moscow: true,
            kzt: 7093,
            days: [ 11, 12 ],
            door: [ 1028, 514.5 ]
        }, {
            id: "nsk",
            name: "Новосибирск",
            gen: "Новосибирска",
            kzt: 6735,
            days: [ 8, 10 ]
        }, {
            id: "vvo",
            name: "Владивосток",
            gen: "Владивостока",
            kzt: 10270,
            days: null
        }, {
            id: "spb",
            name: "Санкт-Петербург",
            gen: "Санкт-Петербурга",
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
    var AIR_RU = {
        usdPerKg: 11,
        days: [ 6, 8 ]
    };
    var FERRY = {
        types: [ {
            id: "heavy",
            name: "Тяжёлые",
            usd: 5
        }, {
            id: "light",
            name: "Лёгкие",
            usd: 9
        }, {
            id: "bulky",
            name: "Объёмные",
            usd: 16,
            confirm: true
        } ],
        days: "~14 дней + 2–4 дня по России"
    };
    var EXPRESS_RU_DAYS = [ 15, 25 ];
    var TIP = {
        ratio: 1.3,
        diffKg: 3,
        minSaveKrw: 3e3
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
    function plural(n, f) {
        n = Math.abs(n) % 100;
        var d = n % 10;
        if (n > 10 && n < 20) return f[2];
        if (d > 1 && d < 5) return f[1];
        return d === 1 ? f[0] : f[2];
    }
    var DAYS_F = [ "день", "дня", "дней" ];
    function daysTxt(a, b) {
        return (a === b ? a : a + "–" + b) + " " + plural(b, DAYS_F);
    }
    function fixDays(x) {
        return typeof x === "string" ? x.replace(/(\d+)\s(дней|дня|день)(?![а-яё])/g, function(m, n) {
            return n + " " + plural(+n, DAYS_F);
        }) : x;
    }
    function ceil1(x) {
        return Math.round(Math.ceil(x / T.weightStepKg - 1e-9) * T.weightStepKg * 10) / 10;
    }
    function moneyX(usd, rub, pay, rates) {
        var usdK = usd * rates.krwPerUsd * (1 + T.markup), inKrw = usdK + rub * rates.krwPerRub;
        var krw = Math.ceil(inKrw / 100 - 1e-9) * 100, amount = krw;
        if (pay === "RUB") amount = Math.ceil(usdK / rates.krwPerRub + rub - 1e-9); else if (pay === "KZT") amount = Math.ceil(inKrw / rates.krwPerKzt - 1e-9);
        return {
            amount: amount,
            currency: pay || "KRW",
            amountKrw: krw
        };
    }
    function fmt(n, cur) {
        return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ") + " " + {
            KRW: "₩",
            RUB: "₽",
            KZT: "₸"
        }[cur || "KRW"];
    }
    function findCat(id) {
        return T.containerCategories.filter(function(c) {
            return c.id === id;
        })[0] || null;
    }
    function compute(o) {
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
        var ru = o.country === "RU", parts = ru && o.category === "parts", ptype = o.partsType || "heavy";
        var category = parts ? ptype === "bulky" ? "parts_bulky" : "parts_heavy" : o.category;
        var input = {
            country: o.country,
            moscow: !!(city && city.moscow),
            weightKg: o.weightKg,
            dims: o.dims,
            category: category,
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
        r.rates = rates;
        var stale = r.cards.length && r.cards.every(function(c) {
            return c.status !== "ok";
        }) && r.packaging && r.packaging.status !== "ok";
        if (ru && !stale) {
            r.cards.forEach(function(c, i) {
                if (c.id !== "air") return;
                var b = r.billed.airKg;
                if (city && city.door) {
                    var m = moneyX(AIR_RU.usdPerKg * b, city.door[0] + city.door[1] * b, input.pay, rates);
                    m.id = "air";
                    m.name = "Авиа";
                    m.status = "ok";
                    m.billedKg = b;
                    m.days = daysTxt(AIR_RU.days[0], AIR_RU.days[1]);
                    m.lines = [ "Доставка до двери получателя; по желанию — до ближайшего ПВЗ (дешевле, тот же срок)" ];
                    r.cards[i] = m;
                } else {
                    r.cards[i] = {
                        id: "air",
                        name: "Авиа",
                        status: "manager",
                        label: Core.MANAGER,
                        days: null,
                        note: "Доставку до двери в этот город посчитает менеджер. Срок до Москвы — 6–8 дней"
                    };
                }
            });
            if (parts && ptype === "light" && !(city && city.moscow)) r.cards.forEach(function(c, i) {
                if (c.id === "container") r.cards[i] = {
                    id: "container",
                    name: "Доступный (контейнер)",
                    status: "manager",
                    label: Core.MANAGER,
                    days: c.days || null,
                    note: "Для лёгких автозапчастей посчитает менеджер"
                };
            });
            r.extras = (r.extras || []).filter(function(x) {
                return x.id !== "parts_vvo";
            });
            if (parts) {
                var ft = FERRY.types.filter(function(x) {
                    return x.id === ptype;
                })[0] || FERRY.types[0];
                var bF = Math.max(T.minBilledKg, ceil1(input.weightKg));
                var f = moneyX(ft.usd * bF, 0, input.pay, rates);
                f.id = "ferry";
                f.name = "Автозапчасти паромом";
                f.status = "ok";
                f.billedKg = bF;
                f.actualOnly = true;
                f.days = FERRY.days;
                f.category = ft.name.toLowerCase() + ", $" + ft.usd + " за кг";
                f.lines = [];
                if (ft.confirm) f.lines.push("Ставку для объёмных запчастей уточнит менеджер");
                if (!(city && city.id === "vvo")) f.lines.push("Плюс доставка по России — оплачивается отдельно при получении");
                r.cards.push(f);
            } else {
                r.extras.push({
                    id: "parts_vvo",
                    name: "Автозапчасти паромом до Владивостока",
                    status: "info",
                    label: "от $5 за кг",
                    pick: "parts"
                });
            }
        }
        if (parts && r.cards.some(function(c) {
            return c.id === "container" && c.status === "ok";
        })) r.cards.forEach(function(c) {
            if (c.id === "container" && c.status === "ok") {
                c.category = "Автозапчасти, " + (ptype === "bulky" ? "объёмные" : "тяжёлые");
            }
        });
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
                amountKrw: pc.amountKrw * n,
                currency: pc.currency,
                days: pc.days,
                billedKg: pc.billedKg,
                packAmount: pr.packaging && pr.packaging.status === "ok" ? pr.packaging.amount * n : null,
                packKrw: pr.packaging && pr.packaging.status === "ok" ? pr.packaging.amountKrw * n : null,
                note: "Сумма примерная: вес и высота коробки делятся поровну, точные размеры частей калькулятор не знает"
            };
        });
        if (ru) r.cards.forEach(function(c) {
            if (c.id !== "express" || c.status !== "ok") return;
            var d = delivery && delivery.days;
            c.tariffDays = daysTxt(EXPRESS_RU_DAYS[0], EXPRESS_RU_DAYS[1]);
            if (d) {
                var a = Math.max(EXPRESS_RU_DAYS[0], Math.min(EXPRESS_RU_DAYS[1], T.ourLegDays[0] + d[0]));
                var b = Math.min(EXPRESS_RU_DAYS[1], Math.max(a, T.ourLegDays[1] + d[1]));
                c.days = daysTxt(a, b);
                c.estimate = "ориентировочно " + c.days + (city && city.gen ? " для " + city.gen : "");
            } else c.days = c.tariffDays;
        });
        r.cards.forEach(function(c) {
            c.days = fixDays(c.days);
        });
        r.cards.forEach(function(c) {
            delete c.badge;
        });
        var pool = r.cards.filter(function(c) {
            return c.status === "ok" && c.id !== "container" && c.id !== "ferry" && !c.approx;
        });
        if (pool.length > 1) {
            var best = pool.reduce(function(a, c) {
                return c.amountKrw < a.amountKrw ? c : a;
            });
            best.badge = "Рекомендуем";
            r.cards.splice(r.cards.indexOf(best), 1);
            r.cards.unshift(best);
        }
        var d0 = input.dims, w0 = input.weightKg;
        var rawAir = Math.max(w0, d0 ? d0.l * d0.w * d0.h / T.volDivisorAir : 0);
        var cat0 = findCat(category) || findCat("mix");
        var rawCont = cat0 && cat0.actualWeightOnly ? w0 : Math.max(w0, d0 ? d0.l * d0.w * d0.h / 1e6 * T.containerKgPerM3 : 0);
        r.cards.forEach(function(c) {
            if (c.status !== "ok" || c.billedKg == null) return;
            if (c.id === "container" && cat0 && cat0.actualWeightOnly && !input.moscow) c.actualOnly = true;
            var raw = c.id === "ferry" || c.actualOnly ? w0 : c.id === "container" ? rawCont : rawAir;
            var min = c.id === "maxpost" ? T.maxpost.stepKg : T.minBilledKg;
            if (raw < min - 1e-9 && Math.abs(c.billedKg - min) < 1e-9) c.minBilled = min;
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
    function run(o) {
        var r = compute(o);
        if (r.error || !o.dims || !(o.weightKg > 0)) return r;
        var vol = o.dims.l * o.dims.w * o.dims.h / T.volDivisorAir, w = o.weightKg;
        if (!(vol >= TIP.ratio * w && vol - w >= TIP.diffKg)) return r;
        var box = T.boxes.filter(function(b) {
            return b.maxKg >= w - 1e-9;
        })[0];
        if (!box || box.l * box.w * box.h / T.volDivisorAir >= vol - 1e-9) return r;
        var o2 = {};
        for (var k in o) o2[k] = o[k];
        o2.dims = {
            l: box.l,
            w: box.w,
            h: box.h
        };
        o2.box = box.id;
        var r2 = compute(o2);
        r.cards.forEach(function(c) {
            if (c.status !== "ok" || c.approx || !/^(air|express|maxpost)$/.test(c.id)) return;
            var c2 = r2.cards.filter(function(x) {
                return x.id === c.id && x.status === "ok" && !x.approx;
            })[0];
            if (!c2 || c.amountKrw - c2.amountKrw < TIP.minSaveKrw) return;
            c.boxTip = {
                box: box.id,
                dims: box.l + "×" + box.w + "×" + box.h + " см",
                save: c.amount - c2.amount,
                currency: c.currency
            };
        });
        return r;
    }
    function startLink(o, cardId) {
        var box = o.box === "custom" && o.dims ? "d" + [ o.dims.l, o.dims.w, o.dims.h ].map(Math.round).join("x") : o.box || "M";
        var extra = o.country === "UZ" ? o.uzCategory || "std" : o.country === "KG" ? o.kgCargo || "standard" : o.category === "parts" ? "parts-" + (o.partsType || "heavy") : o.category || "";
        var parts = [ "calc", o.country, o.cityId || "", "w" + Math.round(o.weightKg * 10), box, o.pay || "KRW", cardId || "", extra ];
        var p = parts.join("_").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
        return BOT + "?start=" + p;
    }
    window.VezetPlan = {
        run: run,
        startLink: startLink,
        fmt: fmt,
        plural: plural,
        CITIES: CITIES,
        BOT: BOT,
        T: T,
        FERRY: FERRY
    };
})();
