var TARIFFS = {
    markup: .05,
    hubFeeKZT: 1500,
    volDivisorAir: 5e3,
    containerKgPerM3: 180,
    kgAirKgPerM3: 167,
    weightStepKg: .1,
    minBilledKg: 1,
    ourLegDays: [ 4, 9 ],
    packaging: [ {
        maxKg: 2,
        krw: 2e3
    }, {
        maxKg: 5,
        krw: 4e3
    }, {
        maxKg: 12,
        krw: 6e3
    }, {
        maxKg: 18,
        krw: 8e3
    }, {
        maxKg: 35,
        krw: 1e4
    } ],
    maxpost: {
        firstKrw: 21300,
        stepKrw: 8e3,
        stepKg: .5,
        maxKg: 20,
        days: "от 2 недель"
    },
    express: {
        usdPerKg: 12,
        minKg: 2,
        maxKg: 30,
        countries: [ "RU", "KZ", "BY" ]
    },
    containerCategories: [ {
        id: "mix",
        name: "Личные посылки (микс)",
        usd: 5
    }, {
        id: "cosmetics",
        name: "Косметика",
        usd: 2.5
    }, {
        id: "socks",
        name: "Носки",
        usd: 2.5
    }, {
        id: "vitamins",
        name: "Витамины",
        usd: 3.5
    }, {
        id: "parts_heavy",
        name: "Автозапчасти тяжёлые",
        usd: 4
    }, {
        id: "parts_bulky",
        name: "Автозапчасти объёмные",
        usd: 8,
        actualWeightOnly: true
    }, {
        id: "clothes",
        name: "Одежда",
        usd: 4.5
    }, {
        id: "dishes",
        name: "Посуда",
        usd: 4.5
    }, {
        id: "household",
        name: "Хозтовары",
        usd: 4.5
    }, {
        id: "food",
        name: "Продукты питания",
        usd: 4.5
    }, {
        id: "appliances",
        name: "Мелкая бытовая техника",
        usd: 5
    }, {
        id: "dyson",
        name: "Dyson (только от сети)",
        usd: 5
    }, {
        id: "kpop",
        name: "K-POP",
        usd: 5
    } ],
    branchDiscountUsd: .5,
    countries: {
        RU: {
            name: "Россия",
            air: {
                usdPerKg: 20,
                days: "7–12 дней"
            },
            container: {
                moscowUsdPerKg: 6,
                categoryAddUsd: 1,
                viaHub: true,
                days: "~35 дней"
            },
            vladivostokParts: "от $5/кг, ~14 дней — рассчитает менеджер"
        },
        KZ: {
            name: "Казахстан",
            air: {
                usdPerKg: 11,
                days: "3 дня, отправка 2 раза в неделю"
            },
            container: {
                categoryAddUsd: .5,
                viaHub: true,
                days: "~15 дней"
            }
        },
        BY: {
            name: "Беларусь",
            container: {
                categoryAddUsd: 1,
                viaHub: true,
                hubDays: 15,
                days: "~15 дней + доставка по городу"
            }
        },
        KG: {
            name: "Кыргызстан",
            airKG: {
                standard: {
                    name: "Стандартные посылки",
                    usdPerKg: 11
                },
                commercial: {
                    name: "Коммерческий груз",
                    usdPerKg: 11
                },
                dyson: {
                    name: "Техника Dyson",
                    usdPerKg: 12.5
                },
                documents: {
                    name: "Документы",
                    krwFlat: 12e3
                },
                days: "отправка 2 раза в неделю"
            },
            container: {
                manager: true,
                days: "12–14 дней со дня погрузки"
            }
        },
        UZ: {
            name: "Узбекистан",
            airUZ: {
                standardKrwPerKg: 12e3,
                commercial: [ {
                    id: "cosm_tash",
                    name: "Косметика, Ташкент",
                    usd: 12
                }, {
                    id: "cosm_reg",
                    name: "Косметика, регионы",
                    usd: 13
                }, {
                    id: "vitamins",
                    name: "БАДы, витамины",
                    usd: 15
                }, {
                    id: "parts",
                    name: "Автозапчасти",
                    usd: 14
                }, {
                    id: "parts_bulky",
                    name: "Автозапчасти объёмные",
                    usd: 17
                } ],
                days: "5 дней, вылет каждый вторник"
            }
        }
    },
    boxes: [ {
        id: "XS",
        l: 17,
        w: 12,
        h: 9,
        maxKg: .5
    }, {
        id: "S",
        l: 23,
        w: 19,
        h: 10,
        maxKg: 2
    }, {
        id: "M",
        l: 33,
        w: 25,
        h: 15,
        maxKg: 5
    }, {
        id: "L",
        l: 31,
        w: 25,
        h: 38,
        maxKg: 12
    }, {
        id: "XL",
        l: 60,
        w: 35,
        h: 30,
        maxKg: 18
    }, {
        id: "XXL",
        l: 69,
        w: 39,
        h: 42,
        maxKg: 30
    } ]
};
