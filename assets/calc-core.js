(function(root) {
    "use strict";
    var MANAGER = "Рассчитает менеджер";
    function ceilStep(x, step) {
        return Math.ceil(x / step - 1e-9) * step;
    }
    function round1(x) {
        return Math.round(x * 10) / 10;
    }
    function volAir(d, t) {
        return d ? d.l * d.w * d.h / t.volDivisorAir : 0;
    }
    function m3(d) {
        return d ? d.l * d.w * d.h / 1e6 : 0;
    }
    function minB(t, w) {
        return Math.max(t.minBilledKg || 0, w);
    }
    function billedAir(input, t) {
        return minB(t, round1(ceilStep(Math.max(input.weightKg, volAir(input.dims, t)), t.weightStepKg)));
    }
    function billedContainer(input, t, actualOnly) {
        var w = actualOnly ? input.weightKg : Math.max(input.weightKg, m3(input.dims) * t.containerKgPerM3);
        return minB(t, round1(ceilStep(w, t.weightStepKg)));
    }
    function billedKgAir(input, t) {
        return minB(t, round1(ceilStep(Math.max(input.weightKg, m3(input.dims) * t.kgAirKgPerM3), t.weightStepKg)));
    }
    function billedActual(input, t) {
        return minB(t, round1(ceilStep(input.weightKg, t.weightStepKg)));
    }
    function money(parts, pay, rates, t) {
        var m = 1 + t.markup;
        var usdK = (parts.usd || 0) * rates.krwPerUsd * m;
        var kztK = (parts.kzt || 0) * rates.krwPerKzt * m;
        var krw = parts.krw || 0;
        var inKrw = usdK + kztK + krw;
        var amount;
        if (pay === "RUB") amount = Math.ceil((usdK + kztK + krw * m) / rates.krwPerRub - 1e-9); else if (pay === "KZT") amount = Math.ceil((usdK + kztK + krw * m) / rates.krwPerKzt - 1e-9); else amount = Math.ceil(inKrw / 100 - 1e-9) * 100;
        return {
            amount: amount,
            currency: pay || "KRW",
            amountKrw: Math.ceil(inKrw / 100 - 1e-9) * 100
        };
    }
    function findCat(t, id) {
        for (var i = 0; i < t.containerCategories.length; i++) if (t.containerCategories[i].id === id) return t.containerCategories[i];
        return null;
    }
    function okCard(id, name, parts, days, billed, input, rates, t, extra) {
        var c = money(parts, input.pay, rates, t);
        c.id = id;
        c.name = name;
        c.status = "ok";
        c.days = days;
        c.billedKg = billed;
        if (extra) for (var k in extra) c[k] = extra[k];
        return c;
    }
    function managerCard(id, name, note, days) {
        return {
            id: id,
            name: name,
            status: "manager",
            label: MANAGER,
            note: note || null,
            days: days || null
        };
    }
    function daysExpress(t, delivery) {
        if (!delivery || !delivery.days) return "15–25 дней";
        return t.ourLegDays[0] + delivery.days[0] + "–" + (t.ourLegDays[1] + delivery.days[1]) + " дней";
    }
    function calculate(input, t, rates, delivery) {
        var cards = [];
        var stale = !rates || !rates.updatedAt || Date.now() - rates.updatedAt > 24 * 3600 * 1e3;
        var C = t.countries[input.country];
        if (!C) return {
            cards: [],
            packaging: null,
            error: "unknown_country"
        };
        var w = input.weightKg;
        var bAir = billedAir(input, t);
        if (input.country === "RU") {
            cards.push(okCardSafe("air", "Авиа", {
                usd: C.air.usdPerKg * bAir
            }, C.air.days, bAir));
            pushExpress();
            var bMax = Math.max(t.maxpost.stepKg, ceilStep(Math.max(w, volAir(input.dims, t)), t.maxpost.stepKg));
            if (bMax <= t.maxpost.maxKg) {
                var krwMax = t.maxpost.firstKrw + t.maxpost.stepKrw * Math.max(0, Math.round(bMax / t.maxpost.stepKg) - 1);
                cards.push(okCardSafe("maxpost", "Авиа MAXPOST", {
                    krw: krwMax
                }, t.maxpost.days, round1(bMax)));
            } else {
                cards.push(managerCard("maxpost", "Авиа MAXPOST", "До 20 кг — для такого веса подойдёт Экспресс"));
            }
            pushContainerRU();
        }
        if (input.country === "KZ") {
            cards.push(okCardSafe("air", "Авиа", {
                usd: C.air.usdPerKg * bAir
            }, C.air.days, bAir));
            pushExpress();
            var cat = findCat(t, input.category) || findCat(t, "mix");
            var bC = billedContainer(input, t, cat.actualWeightOnly);
            if (delivery && delivery.kzt != null) {
                cards.push(okCardSafe("container", "Доступный (контейнер)", {
                    usd: (cat.usd + C.container.categoryAddUsd) * bC,
                    kzt: delivery.kzt + t.hubFeeKZT
                }, C.container.days, bC, {
                    category: cat.name
                }));
            } else cards.push(managerCard("container", "Доступный (контейнер)", null, C.container.days));
        }
        if (input.country === "BY") {
            pushExpress();
            var catB = findCat(t, input.category) || findCat(t, "mix");
            var bCB = billedContainer(input, t, catB.actualWeightOnly);
            if (delivery && delivery.kzt != null) {
                cards.push(okCardSafe("container", "Доступный (контейнер)", {
                    usd: (catB.usd + C.container.categoryAddUsd) * bCB,
                    kzt: delivery.kzt + t.hubFeeKZT
                }, daysContainerHub(delivery, C.container.hubDays), bCB, {
                    category: catB.name
                }));
            } else cards.push(managerCard("container", "Доступный (контейнер)", "Можно выбрать Экспресс или уточнить у менеджера"));
        }
        if (input.country === "KG") {
            var a = C.airKG, kind = input.kgCargo || "standard";
            if (kind === "documents") {
                cards.push(okCardSafe("air", "Авиа — документы", {
                    krw: a.documents.krwFlat
                }, a.days, null));
            } else {
                var bK = billedKgAir(input, t);
                cards.push(okCardSafe("air", "Авиа — " + a[kind].name.toLowerCase(), {
                    usd: a[kind].usdPerKg * bK
                }, a.days, bK));
            }
            cards.push(managerCard("container", "Доступный (контейнер)", "Цена по категории товара, от 5 кг", C.container.days));
        }
        if (input.country === "UZ") {
            var u = C.airUZ;
            if (input.uzCargo === "commercial") {
                var uc = null;
                for (var i = 0; i < u.commercial.length; i++) if (u.commercial[i].id === input.uzCategory) uc = u.commercial[i];
                uc = uc || u.commercial[0];
                var bU = billedActual(input, t);
                cards.push(okCardSafe("air", "Авиа — коммерческий груз (" + uc.name.toLowerCase() + ")", {
                    usd: uc.usd * bU
                }, u.days, bU, {
                    note: "По фактическому весу"
                }));
            } else {
                cards.push(okCardSafe("air", "Авиа", {
                    krw: u.standardKrwPerKg * bAir
                }, u.days, bAir));
            }
        }
        var best = -1;
        for (var j = 0; j < cards.length; j++) {
            if (cards[j].status !== "ok" || cards[j].id === "container") continue;
            if (best < 0 || cards[j].amount < cards[best].amount) best = j;
        }
        var okCount = cards.filter(function(c) {
            return c.status === "ok" && c.id !== "container";
        }).length;
        if (best >= 0 && okCount > 1) {
            cards[best].badge = "Рекомендуем";
            var c0 = cards.splice(best, 1)[0];
            cards.unshift(c0);
        }
        if (stale) cards = cards.map(function(c) {
            return managerCard(c.id, c.name, "Курс обновляется");
        });
        var pack = null;
        for (var p = 0; p < t.packaging.length; p++) if (w <= t.packaging[p].maxKg + 1e-9) {
            pack = t.packaging[p];
            break;
        }
        var packaging = pack && !stale ? function() {
            var m = money({
                krw: pack.krw
            }, input.pay, rates, t);
            m.status = "ok";
            m.upToKg = pack.maxKg;
            return m;
        }() : {
            status: "manager",
            label: MANAGER
        };
        var extras = [];
        if (input.country === "RU") extras.push({
            id: "parts_vvo",
            name: "Автозапчасти до Владивостока паромом",
            status: "info",
            label: C.vladivostokParts
        });
        return {
            cards: cards,
            packaging: packaging,
            extras: extras,
            billed: {
                airKg: bAir
            }
        };
        function okCardSafe(id, name, parts, days, billed, extra) {
            return okCard(id, name, parts, days, billed, input, rates, t, extra);
        }
        function daysContainerHub(del, baseDays) {
            if (!del || !del.days) return "~" + baseDays + " дней + доставка по городу";
            return "~" + (baseDays + del.days[1]) + " дней";
        }
        function pushExpress() {
            if (t.express.countries.indexOf(input.country) < 0) return;
            if (bAir < t.express.minKg) return;
            if (bAir > t.express.maxKg) {
                var n = Math.ceil(bAir / t.express.maxKg);
                cards.push(managerCard("express", "Экспресс", "Можно разделить на " + n + " посылки до 30 кг или выбрать «Доступный (контейнер)». Сумма за части — примерная: вес и высота коробки делятся поровну, точные размеры частей калькулятор не знает."));
                return;
            }
            if (!delivery || delivery.kzt == null) {
                cards.push(managerCard("express", "Экспресс", "В этот город расчёт недоступен — можно выбрать «Доступный (контейнер)»"));
                return;
            }
            cards.push(okCardSafe("express", "Экспресс", {
                usd: t.express.usdPerKg * bAir,
                kzt: delivery.kzt + t.hubFeeKZT
            }, daysExpress(t, delivery), bAir));
        }
        function pushContainerRU() {
            var Cn = C.container;
            var cat = findCat(t, input.category) || findCat(t, "mix");
            if (input.moscow) {
                var bM = billedContainer(input, t, false);
                cards.push(okCardSafe("container", "Доступный (контейнер)", {
                    usd: Cn.moscowUsdPerKg * bM
                }, Cn.days, bM));
                return;
            }
            var bR = billedContainer(input, t, cat.actualWeightOnly);
            if (!delivery || delivery.kzt == null) {
                cards.push(managerCard("container", "Доступный (контейнер)", null, Cn.days));
                return;
            }
            cards.push(okCardSafe("container", "Доступный (контейнер)", {
                usd: (cat.usd + Cn.categoryAddUsd) * bR,
                kzt: delivery.kzt + t.hubFeeKZT
            }, Cn.days, bR, {
                category: cat.name
            }));
        }
    }
    var api = {
        calculate: calculate,
        MANAGER: MANAGER
    };
    if (typeof module !== "undefined" && module.exports) module.exports = api; else root.VezetCalc = api;
})(typeof window !== "undefined" ? window : this);
