/* ==========================================================================
   UniAtlas — application logic
   Vanilla JS. All state is local (localStorage) so the WordPress plugin needs
   no database tables. Replace the data below with your verified campus data.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ic(name, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  var LS_KEY = "uniatlasState.v2";
  var LEGACY_KEYS = ["uniatlasState.v1", "unibgHubState.v1", "unibgHubState"];
  var store = {
    read: function () {
      try {
        var raw = window.localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
        for (var i = 0; i < LEGACY_KEYS.length; i++) {
          var old = window.localStorage.getItem(LEGACY_KEYS[i]);
          if (old) {
            var parsed = JSON.parse(old);
            if (parsed && typeof parsed === "object") parsed.__migrated = true;
            return parsed;
          }
        }
        return null;
      } catch (e) { return null; }
    },
    write: function (value) {
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(value));
        LEGACY_KEYS.forEach(function (key) {
          try { window.localStorage.removeItem(key); } catch (e) {}
        });
      } catch (e) {}
    }
  };

  var MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  var DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  function addDays(days) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  }

  function daysUntil(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = Math.ceil((date.getTime() - today.getTime()) / 86400000);
    return Math.max(0, diff);
  }

  function eventMeta(date, time, place) {
    var n = daysUntil(date);
    var when = n === 0 ? "النهارده" : n === 1 ? "بكرة" : n === 2 ? "بعد بكرة" : n <= 10 ? "بعد " + n + " أيام" : "بعد " + n + " يوم";
    return when + " · " + place + " · " + time;
  }

  /* ======================================================================
     DATA — CAMPUSES & PLACES
     ====================================================================== */
  var TYPES = {
    lecture: { label: "قاعة محاضرات", icon: "building", color: "#7c5cff", soft: "rgba(124,92,255,.14)" },
    library: { label: "مكتبة", icon: "book-open", color: "#22d3ee", soft: "rgba(34,211,238,.13)" },
    lab: { label: "مختبر", icon: "flask", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    study: { label: "مساحة دراسة", icon: "armchair", color: "#c6ff5e", soft: "rgba(198,255,94,.12)" },
    food: { label: "كافيتيريا", icon: "coffee", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    service: { label: "خدمات", icon: "printer", color: "#a78bfa", soft: "rgba(167,139,250,.14)" }
  };

  var CAMPUSES = [
    {
      id: "dalmine", name: "Dalmine", ar: "دالمينه", faculty: "كلية الهندسة",
      address: "Via Pasubio 3/5 · Dalmine", coords: [45.6495, 9.6042], color: "#7c5cff",
      blurb: "مقر الهندسة — حوالي 25 دقيقة من وسط بيرغامو."
    },
    {
      id: "caniana", name: "Caniana", ar: "كانيانا", faculty: "كلية الاقتصاد",
      address: "Via dei Caniana 2 · Bergamo", coords: [45.7005, 9.6716], color: "#22d3ee",
      blurb: "مقر الاقتصاد في المدينة السفلى، قريب من المحطة."
    },
    {
      id: "citta-alta", name: "Città Alta", ar: "المدينة العليا", faculty: "الآداب والعلوم الإنسانية",
      address: "Piazza Rosate 2 · Bergamo", coords: [45.7037, 9.6625], color: "#c6ff5e",
      blurb: "قلب بيرغامو التاريخي — مقر الآداب واللغات."
    },
    {
      id: "sant-agostino", name: "Sant'Agostino", ar: "سانت أغوستينو", faculty: "كلية الحقوق",
      address: "Via Salvecchio 19 · Bergamo", coords: [45.7044, 9.6636], color: "#ff7a59",
      blurb: "مجمّع الحقوق داخل المدينة العليا."
    },
    {
      id: "pignolo", name: "Pignolo", ar: "بينيولو", faculty: "علوم التربية",
      address: "Via Pignolo 123 · Bergamo", coords: [45.7006, 9.6755], color: "#a78bfa",
      blurb: "مقر علوم التربية والبحث التربوي."
    }
  ];

  var PLACES = [
    {
      id: "dal-a", campus: "dalmine", name: "مبنى A — قاعات الهندسة", it: "Edificio A · Aule",
      type: "lecture", room: "الطابق الأرضي — Aula 1/2", hours: "08:00 – 20:00",
      wifi: 5, outlets: 4, noise: 3, capacity: 140, rating: 4.6, coords: [45.6498, 9.6046],
      features: ["Wi-Fi 6E", "مقابس كهرباء", "شاشة عرض", "تكييف"],
      tip: "قاعات Aula 1 و2 أقرب للمدخل الشمالي، وأهدأ بعد الخامسة مساءً."
    },
    {
      id: "dal-lab", campus: "dalmine", name: "مختبرات الحاسوب B", it: "Laboratorio Informatico B",
      type: "lab", room: "الطابق الأول — Lab B", hours: "08:30 – 19:00",
      wifi: 5, outlets: 5, noise: 2, capacity: 40, rating: 4.8, coords: [45.6493, 9.6038],
      features: ["48 جهاز", "Linux + Windows", "مقابس", "طابعة"],
      tip: "الجلوس في الصف الأخير = أقرب مقبس. اطلب كلمة سر المختبر من مكتب القسم."
    },
    {
      id: "dal-lib", campus: "dalmine", name: "المكتبة الهندسية", it: "Biblioteca Dalmine",
      type: "library", room: "الطابق الثاني", hours: "08:30 – 19:30",
      wifi: 5, outlets: 4, noise: 1, capacity: 90, rating: 4.9, coords: [45.6491, 9.6049],
      features: ["صمت تام", "مقابس", "غرف فردية", "Wi-Fi 6E"],
      tip: "غرف الدراسة الفردية تُحجز من الاستقبال — أحجز بدري أيام الامتحانات."
    },
    {
      id: "dal-cafe", campus: "dalmine", name: "كافيتيريا Dalmine", it: "Caffetteria Dalmine",
      type: "food", room: "الطابق الأرضي", hours: "07:30 – 17:00",
      wifi: 3, outlets: 2, noise: 4, capacity: 60, rating: 4.2, coords: [45.6499, 9.6033],
      features: ["قهوة", "ساندويتش", "خصم طلاب", "مكان للجلوس"],
      tip: "وقت الذروة 12:30–13:30. بعد 14:00 بيبقى هادي ومثالي للمراجعة."
    },
    {
      id: "dal-study", campus: "dalmine", name: "Aule Studio — Dalmine", it: "Aule Studio",
      type: "study", room: "مبنى C — الطابق الأرضي", hours: "08:00 – 22:00",
      wifi: 5, outlets: 5, noise: 1, capacity: 70, rating: 4.7, coords: [45.6494, 9.6052],
      features: ["صمت", "مقابس", "Wi-Fi 6E", "إضاءة ممتازة"],
      tip: "أفضل مكان للمراجعة الطويلة. خد معاك كوباية قهوة وجاكيت — التكييف بارد."
    },
    {
      id: "dal-print", campus: "dalmine", name: "نقطة الطباعة والنسخ", it: "Centro Stampa",
      type: "service", room: "بجوار المدخل الرئيسي", hours: "08:30 – 18:00",
      wifi: 4, outlets: 1, noise: 3, capacity: 5, rating: 4.0, coords: [45.6501, 9.6040],
      features: ["طباعة", "نسخ", "تجليد", "دفع بالبطاقة"],
      tip: "ارفع ملفك من البوابة واطبعه بكود — أسرع من الانتظار في الطابور."
    },
    {
      id: "can-aula", campus: "caniana", name: "Aula Magna — Caniana", it: "Aula Magna",
      type: "lecture", room: "الطابق الأول", hours: "08:00 – 20:00",
      wifi: 5, outlets: 3, noise: 3, capacity: 180, rating: 4.5, coords: [45.7007, 9.6719],
      features: ["Wi-Fi 6E", "ميكروفون", "شاشة كبيرة", "تكييف"],
      tip: "القاعة الكبيرة بتستخدم للمحاضرات المشتركة والفعاليات — وصل بدري."
    },
    {
      id: "can-lib", campus: "caniana", name: "مكتبة الاقتصاد", it: "Biblioteca Caniana",
      type: "library", room: "الطابق الثاني", hours: "08:30 – 19:00",
      wifi: 5, outlets: 4, noise: 1, capacity: 75, rating: 4.8, coords: [45.7003, 9.6712],
      features: ["صمت", "مقابس", "قواعد بيانات", "Wi-Fi 6E"],
      tip: "فيها وصول لقواعد بيانات اقتصادية مفيدة للرسالة — اسأل أمين المكتبة."
    },
    {
      id: "can-lab", campus: "caniana", name: "مختبر تحليل البيانات", it: "Lab Dati",
      type: "lab", room: "الطابق الأرضي — Lab 3", hours: "09:00 – 18:00",
      wifi: 5, outlets: 5, capacity: 35, noise: 2, rating: 4.6, coords: [45.7008, 9.6710],
      features: ["Excel / R", "Power BI", "مقابس", "شاشات"],
      tip: "اطلب نسخة من بيانات المحاضرة قبل الحصة — الملفات كبيرة."
    },
    {
      id: "can-bar", campus: "caniana", name: "Bar Caniana", it: "Bar interno",
      type: "food", room: "الطابق الأرضي", hours: "07:30 – 16:30",
      wifi: 3, outlets: 1, noise: 4, capacity: 40, rating: 4.1, coords: [45.7002, 9.6718],
      features: ["قهوة", "كرواسون", "خصم طلاب"],
      tip: "الكرواسون السادة بيخلص بدري — قبل 10:30."
    },
    {
      id: "can-study", campus: "caniana", name: "Aule Studio Caniana", it: "Aule Studio",
      type: "study", room: "الطابق الأول", hours: "08:00 – 21:00",
      wifi: 5, outlets: 4, noise: 1, capacity: 55, rating: 4.5, coords: [45.7006, 9.6708],
      features: ["صمت", "مقابس", "Wi-Fi 6E"],
      tip: "الغرفة اللي على الناحية اليسرى أهدأ — بعيدة عن الرصيف."
    },
    {
      id: "ca-rosate", campus: "citta-alta", name: "Palazzo Rosate — قاعات الآداب", it: "Palazzo Rosate",
      type: "lecture", room: "الطابق الأول والثاني", hours: "08:00 – 19:00",
      wifi: 4, outlets: 2, noise: 3, capacity: 120, rating: 4.4, coords: [45.7039, 9.6628],
      features: ["Wi-Fi", "شاشة عرض", "موقع تاريخي"],
      tip: "المبنى تاريخي — المقابس قليلة، اشحن لابتوبك قبل ما تطلع."
    },
    {
      id: "ca-lib", campus: "citta-alta", name: "المكتبة الإنسانية", it: "Biblioteca Umanistica",
      type: "library", room: "الطابق الأرضي", hours: "08:30 – 18:30",
      wifi: 4, outlets: 3, noise: 1, capacity: 65, rating: 4.7, coords: [45.7035, 9.6621],
      features: ["صمت", "أرشيف", "مقابس"],
      tip: "فيها أرشيف نادر — للمراجع فقط، مش للاستعارة."
    },
    {
      id: "ca-study", campus: "citta-alta", name: "Aule Studio Città Alta", it: "Aule Studio",
      type: "study", room: "Palazzo Rosate — الطابق الأرضي", hours: "08:00 – 20:00",
      wifi: 4, outlets: 3, noise: 2, capacity: 45, rating: 4.3, coords: [45.7033, 9.6632],
      features: ["Wi-Fi", "مقابس", "قريب من المركز"],
      tip: "أفضل وقت للدراسة الصبح بدري قبل زحمة السياح."
    },
    {
      id: "ca-cafe", campus: "citta-alta", name: "Caffè del Campus", it: "Caffè del Campus",
      type: "food", room: "بجوار Palazzo Rosate", hours: "07:00 – 19:00",
      wifi: 3, outlets: 1, noise: 4, capacity: 35, rating: 4.4, coords: [45.7041, 9.6623],
      features: ["قهوة", "حلويات", "تراس"],
      tip: "التراس جميل للاستراحة بين المحاضرات، بس الواي فاي ضعيف."
    },
    {
      id: "ca-service", campus: "citta-alta", name: "مكتب العلاقات الدولية", it: "International Office",
      type: "service", room: "Palazzo Rosate — الطابق الأول", hours: "09:00 – 12:30 · 14:00 – 16:00",
      wifi: 4, outlets: 1, noise: 2, capacity: 10, rating: 4.2, coords: [45.7037, 9.6631],
      features: ["Erasmus", "تأشيرات", "استقبال الطلاب الدوليين"],
      tip: "خد معاك نسخ ورقية من كل مستند — أحياناً بيطلبوها."
    },
    {
      id: "sa-aula", campus: "sant-agostino", name: "Aula Magna Sant'Agostino", it: "Aula Magna",
      type: "lecture", room: "الطابق الأول", hours: "08:00 – 19:00",
      wifi: 4, outlets: 2, noise: 3, capacity: 150, rating: 4.6, coords: [45.7045, 9.6638],
      features: ["Wi-Fi", "شاشة عرض", "ميكروفون"],
      tip: "المدخل من Via Salvecchio — مش من ناحية الساحة."
    },
    {
      id: "sa-lib", campus: "sant-agostino", name: "المكتبة القانونية", it: "Biblioteca Giuridica",
      type: "library", room: "الطابق الثاني", hours: "08:30 – 19:00",
      wifi: 4, outlets: 3, noise: 1, capacity: 50, rating: 4.8, coords: [45.7042, 9.6632],
      features: ["صمت", "مراجع قانونية", "مقابس"],
      tip: "المراجع القديمة للاستخدام الداخلي فقط — صوّر اللي تحتاجه."
    },
    {
      id: "sa-study", campus: "sant-agostino", name: "Sala Studio Sant'Agostino", it: "Sala Studio",
      type: "study", room: "الطابق الأرضي", hours: "08:00 – 21:00",
      wifi: 4, outlets: 3, noise: 1, capacity: 40, rating: 4.5, coords: [45.7047, 9.6641],
      features: ["صمت", "مقابس", "Wi-Fi"],
      tip: "مكان مثالي لمراجعة القانون — هادي حتى وقت الامتحانات."
    },
    {
      id: "pig-aula", campus: "pignolo", name: "قاعات Pignolo", it: "Aule Pignolo",
      type: "lecture", room: "الطابق الأول", hours: "08:00 – 19:00",
      wifi: 4, outlets: 3, noise: 3, capacity: 90, rating: 4.2, coords: [45.7007, 9.6758],
      features: ["Wi-Fi", "شاشة عرض", "مقابس"],
      tip: "القاعات أدفأ في الشتاء — خد طبقة خفيفة."
    },
    {
      id: "pig-lab", campus: "pignolo", name: "مختبر التربية", it: "Laboratorio Pedagogico",
      type: "lab", room: "الطابق الأرضي", hours: "09:00 – 17:30",
      wifi: 4, outlets: 3, capacity: 30, noise: 2, rating: 4.4, coords: [45.7004, 9.6751],
      features: ["مواد تعليمية", "مقابس", "Wi-Fi"],
      tip: "في أدوات ومواد للأنشطة — احجز المختبر قبل الحصة."
    },
    {
      id: "pig-lib", campus: "pignolo", name: "مكتبة Pignolo", it: "Biblioteca Pignolo",
      type: "library", room: "الطابق الأول", hours: "08:30 – 18:30",
      wifi: 4, outlets: 2, noise: 1, capacity: 40, rating: 4.5, coords: [45.7003, 9.6759],
      features: ["صمت", "مراجع تربوية", "مقابس"],
      tip: "صغيرة وهادية — مناسبة للمراجعة الفردية."
    },
    {
      id: "pig-cafe", campus: "pignolo", name: "Bar Pignolo", it: "Bar Pignolo",
      type: "food", room: "الشارع الرئيسي", hours: "07:00 – 20:00",
      wifi: 3, outlets: 1, noise: 4, capacity: 25, rating: 4.3, coords: [45.7010, 9.6752],
      features: ["قهوة", "بانيني", "خصم طلاب"],
      tip: "بانيني البروشوتو مشهور — اطلبه قبل 13:00."
    },
    {
      id: "pig-service", campus: "pignolo", name: "شؤون الطلاب — Pignolo", it: "Segreteria Studenti",
      type: "service", room: "الطابق الأرضي", hours: "09:00 – 12:00 · 14:00 – 15:30",
      wifi: 3, outlets: 0, noise: 2, capacity: 12, rating: 4.0, coords: [45.7006, 9.6762],
      features: ["تسجيل", "شهادات", "مواعيد"],
      tip: "المواعيد بتخلص بسرعة — احجز أونلاين من بوابة UniBg."
    }
  ];

  function campusById(id) {
    for (var i = 0; i < CAMPUSES.length; i++) if (CAMPUSES[i].id === id) return CAMPUSES[i];
    return CAMPUSES[0];
  }

  function placeById(id) {
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i];
    return null;
  }

  function placesForCampus(id) {
    return PLACES.filter(function (p) { return p.campus === id; });
  }

  /* ======================================================================
     DATA — DEGREES & COURSES
     ====================================================================== */
  var DEGREES = [
    {
      id: "ing-inf",
      name: "هندسة الحاسوب",
      it: "Ingegneria Informatica",
      short: "Ingegneria Informatica",
      icon: "flask",
      color: "violet",
      total: 180,
      years: [
        {
          n: 1, label: "السنة الأولى", sub: "الأساسيات الرياضية والبرمجية",
          courses: [
            { id: "inf-a1", name: "تحليل رياضي I", it: "Analisi Matematica I", cfu: 12, sem: 1, prereq: [], concepts: ["النهايات والاتصال", "الاشتقاق", "التكامل", "متسلسلات تايلور", "التطبيقات الهندسية"], desc: "أساس التحليل الرياضي: النهايات، الاشتقاق، والتكامل لدوال متغير واحد.", exam: "شفهي + تمارين" },
            { id: "inf-fd", name: "أساسيات المعلوماتية", it: "Fondamenti di Informatica", cfu: 12, sem: 1, prereq: [], concepts: ["الخوارزميات", "المتغيرات والتحكم", "الدوال", "المصفوفات", "البرمجة بلغة C"], desc: "أول خطوة في البرمجة: التفكير الخوارزمي وكتابة كود C نظيف.", exam: "مشروع + شفهي" },
            { id: "inf-geo", name: "الهندسة والجبر الخطي", it: "Geometria e Algebra Lineare", cfu: 9, sem: 1, prereq: [], concepts: ["المصفوفات", "المحددات", "الفضاءات المتجهية", "التحويلات الخطية", "القيم الذاتية"], desc: "اللغة الرياضية للذكاء الاصطناعي والرسومات الحاسوبية.", exam: "شفهي + تمارين" },
            { id: "inf-fis", name: "الفيزياء العامة", it: "Fisica Generale", cfu: 9, sem: 2, prereq: ["inf-a1"], concepts: ["الميكانيكا", "الديناميكا", "الطاقة", "الكهرباء", "المغناطيسية"], desc: "قوانين الطبيعة من نيوتن للكهرومغناطيسية، بأسلوب هندسي.", exam: "شفهي + تجارب" },
            { id: "inf-eng", name: "إنجليزي B2", it: "Inglese B2", cfu: 6, sem: 2, prereq: [], concepts: ["Academic Writing", "Presentations", "Technical Vocabulary", "Listening"], desc: "مهارات الإنجليزية الأكاديمية والمهنية لمهندس المستقبل.", exam: "اختبار مستوى" },
            { id: "inf-chim", name: "الكيمياء", it: "Chimica", cfu: 6, sem: 2, prereq: [], concepts: ["الذرة والجدول الدوري", "الروابط", "التفاعلات", "الكيمياء العضوية"], desc: "أساسيات الكيمياء العامة والعضوية لمسار الهندسة.", exam: "شفهي" }
          ]
        },
        {
          n: 2, label: "السنة الثانية", sub: "البرمجة والأنظمة والشبكات",
          courses: [
            { id: "inf-a2", name: "تحليل رياضي II", it: "Analisi Matematica II", cfu: 9, sem: 1, prereq: ["inf-a1"], concepts: ["الدوال متعددة المتغيرات", "التفاضل الجزئي", "التكامل المتعدد", "المعادلات التفاضلية"], desc: "توسيع التحليل لدوال عدة متغيرات والمعادلات التفاضلية.", exam: "شفهي + تمارين" },
            { id: "inf-poo", name: "البرمجة كائنية التوجه", it: "Programmazione a Oggetti", cfu: 9, sem: 1, prereq: ["inf-fd"], concepts: ["الكائنات والأصناف", "الوراثة", "تعدد الأشكال", "SOLID", "Java"], desc: "من الكود الإجرائي لتصميم أنظمة قابلة للتوسع باستخدام Java.", exam: "مشروع + شفهي" },
            { id: "inf-db", name: "قواعد البيانات", it: "Basi di Dati", cfu: 9, sem: 1, prereq: [], concepts: ["ER Model", "SQL", "Normalizzazione", "Transazioni", "Indici"], desc: "تصميم قواعد بيانات علائقية وكتابة استعلامات SQL احترافية.", exam: "مشروع + شفهي" },
            { id: "inf-arch", name: "معمارية الحاسوب", it: "Architettura degli Elaboratori", cfu: 9, sem: 2, prereq: ["inf-fd"], concepts: ["CPU", "الذاكرة", "Assembly", "Pipelining", "Cache"], desc: "كيف يفكر الحاسوب من الترانزستور لحد المعالج.", exam: "شفهي + تمارين" },
            { id: "inf-os", name: "أنظمة التشغيل", it: "Sistemi Operativi", cfu: 9, sem: 2, prereq: ["inf-arch"], concepts: ["العمليات والخيوط", "الجدولة", "إدارة الذاكرة", "Deadlock", "نظام الملفات"], desc: "إدارة الموارد في Linux: العمليات، الذاكرة، والتزامن.", exam: "شفهي + مشروع" },
            { id: "inf-prob", name: "الاحتمالات والإحصاء", it: "Probabilità e Statistica", cfu: 6, sem: 2, prereq: ["inf-a2"], concepts: ["الاحتمال الشرطي", "المتغيرات العشوائية", "التوزيعات", "اختبار الفرضيات"], desc: "الأساس الرياضي للذكاء الاصطناعي وتحليل البيانات.", exam: "شفهي + تمارين" }
          ]
        },
        {
          n: 3, label: "السنة الثالثة", sub: "التخصص والمشروع النهائي",
          courses: [
            { id: "inf-se", name: "هندسة البرمجيات", it: "Ingegneria del Software", cfu: 12, sem: 1, prereq: ["inf-poo", "inf-db"], concepts: ["Agile / Scrum", "Requirements", "UML", "Testing", "CI/CD"], desc: "بناء منتجات برمجية حقيقية ضمن فريق، من المتطلبات للنشر.", exam: "مشروع + شفهي" },
            { id: "inf-net", name: "شبكات الحاسوب", it: "Reti di Calcolatori", cfu: 9, sem: 1, prereq: ["inf-os"], concepts: ["TCP/IP", "HTTP", "Routing", "DNS", "أمن الشبكات"], desc: "كيف تنتقل البيانات من جهازك للسيرفر والعكس.", exam: "شفهي + Packet Tracer" },
            { id: "inf-ai", name: "الذكاء الاصطناعي", it: "Intelligenza Artificiale", cfu: 9, sem: 1, prereq: ["inf-prob"], concepts: ["Search", "Knowledge Representation", "Machine Learning", "NLP", "Agents"], desc: "خوارزميات التفكير والبحث والتعلم الآلي الأساسية.", exam: "شفهي + مشروع" },
            { id: "inf-sec", name: "أمن المعلومات", it: "Sicurezza Informatica", cfu: 6, sem: 2, prereq: ["inf-net"], concepts: ["التشفير", "Authentication", "OWASP", "Web Security", "Risk"], desc: "حماية الأنظمة والتطبيقات من الهجمات الشائعة.", exam: "شفهي + CTF" },
            { id: "inf-num", name: "الحساب العددي", it: "Calcolo Numerico", cfu: 6, sem: 2, prereq: ["inf-a2"], concepts: ["Errori", "Interpolazione", "Integrazione numerica", "Matrici sparse"], desc: "طرق حل المسائل الرياضية بالحاسوب بدقة وكفاءة.", exam: "تمارين + شفهي" },
            { id: "inf-ml", name: "تعلم الآلة", it: "Machine Learning", cfu: 12, sem: 2, prereq: ["inf-ai"], concepts: ["Supervised Learning", "Regression", "Classification", "Overfitting", "Neural Networks"], desc: "من الانحدار الخطي للشبكات العصبية — بناء نماذج تتعلم من البيانات.", exam: "مشروع + شفهي" },
            { id: "inf-mob", name: "تطبيقات الموبايل", it: "Mobile Computing", cfu: 9, sem: 2, prereq: ["inf-poo"], concepts: ["React Native", "State Management", "APIs", "UX للجوال", "النشر"], desc: "تصميم وبناء تطبيق موبايل كامل من الفكرة للمتجر.", exam: "مشروع" },
            { id: "inf-int", name: "تدريب عملي", it: "Tirocinio", cfu: 9, sem: 2, prereq: [], concepts: ["Curriculum", "Colloquio", "Teamwork", "Documentazione"], desc: "خبرة ميدانية في شركة أو مختبر بحثي مع تقرير نهائي.", exam: "تقرير + تقييم" },
            { id: "inf-thesis", name: "المشروع النهائي", it: "Prova Finale", cfu: 3, sem: 2, prereq: [], concepts: ["اختيار الموضوع", "البحث", "الكتابة", "العرض"], desc: "رسالة التخرج والمناقشة أمام اللجنة.", exam: "مناقشة" }
          ]
        }
      ]
    },
    {
      id: "economia",
      name: "إدارة الأعمال",
      it: "Economia Aziendale",
      short: "Economia Aziendale",
      icon: "chart",
      color: "cyan",
      total: 180,
      years: [
        {
          n: 1, label: "السنة الأولى", sub: "أساسيات الاقتصاد والإدارة",
          courses: [
            { id: "eco-az", name: "اقتصاد الأعمال", it: "Economia Aziendale", cfu: 12, sem: 1, prereq: [], concepts: ["النموذج الاقتصادي", "الميزانية", "التكاليف", "اتخاذ القرار", "الأداء"], desc: "كيف تعمل الشركة من الداخل: الموارد، القرارات، والنتائج.", exam: "شفهي + حالات" },
            { id: "eco-micro", name: "الاقتصاد الجزئي", it: "Microeconomia", cfu: 9, sem: 1, prereq: [], concepts: ["العرض والطلب", "المرونة", "سلوك المستهلك", "هياكل السوق", "التوازن"], desc: "قرارات الأفراد والشركات في الأسواق.", exam: "شفهي + تمارين" },
            { id: "eco-math", name: "الرياضيات العامة", it: "Matematica Generale", cfu: 9, sem: 1, prereq: [], concepts: ["الدوال", "المشتقات", "المصفوفات", "التحسين", "التطبيقات الاقتصادية"], desc: "الأدوات الرياضية لتحليل الظواهر الاقتصادية.", exam: "تمارين + شفهي" },
            { id: "eco-dir", name: "القانون الخاص", it: "Diritto Privato", cfu: 9, sem: 2, prereq: [], concepts: ["الأشخاص", "العقود", "المسؤولية", "الملكية", "الالتزامات"], desc: "القواعد القانونية التي تحكم العلاقات بين الأفراد والشركات.", exam: "شفهي" },
            { id: "eco-info", name: "المعلوماتية للاقتصاد", it: "Informatica per l'Economia", cfu: 6, sem: 2, prereq: [], concepts: ["Excel المتقدم", "قواعد البيانات", "تحليل البيانات", "العروض"], desc: "أدوات رقمية عملية لتحليل البيانات الاقتصادية.", exam: "مشروع + اختبار" },
            { id: "eco-eng", name: "إنجليزي B2", it: "Inglese B2", cfu: 3, sem: 2, prereq: [], concepts: ["Business English", "Emails", "Meetings", "Presentations"], desc: "الإنجليزية المهنية للأعمال والتواصل الدولي.", exam: "اختبار مستوى" },
            { id: "eco-stor", name: "التاريخ الاقتصادي", it: "Storia Economica", cfu: 6, sem: 2, prereq: [], concepts: ["الثورة الصناعية", "التجارة العالمية", "الأزمات", "العولمة"], desc: "كيف وصل الاقتصاد العالمي لشكله الحالي.", exam: "شفهي" }
          ]
        },
        {
          n: 2, label: "السنة الثانية", sub: "المحاسبة والتمويل والتسويق",
          courses: [
            { id: "eco-macro", name: "الاقتصاد الكلي", it: "Macroeconomia", cfu: 9, sem: 1, prereq: ["eco-micro"], concepts: ["الناتج المحلي", "التضخم", "البطالة", "السياسة النقدية", "الدورة الاقتصادية"], desc: "الاقتصاد من منظور الدولة والأسواق العالمية.", exam: "شفهي + تمارين" },
            { id: "eco-rag", name: "المحاسبة والميزانية", it: "Ragioneria Generale e Bilancio", cfu: 9, sem: 1, prereq: ["eco-az"], concepts: ["القيد المزدوج", "دفتر اليومية", "الميزانية", "قائمة الدخل", "التحليل المالي"], desc: "قراءة وبناء القوائم المالية للشركات.", exam: "تمارين + شفهي" },
            { id: "eco-stat", name: "الإحصاء", it: "Statistica", cfu: 9, sem: 1, prereq: ["eco-math"], concepts: ["العينات", "التوزيعات", "الانحدار", "الاستدلال", "SPSS/R"], desc: "تحليل البيانات واتخاذ قرارات مبنية على أرقام.", exam: "مشروع + اختبار" },
            { id: "eco-comm", name: "القانون التجاري", it: "Diritto Commerciale", cfu: 9, sem: 1, prereq: ["eco-dir"], concepts: ["الشركات", "الإفلاس", "الأوراق التجارية", "الحوكمة"], desc: "قانون الشركات والأعمال في إيطاليا.", exam: "شفهي" },
            { id: "eco-fin", name: "التمويل المؤسسي", it: "Finanza Aziendale", cfu: 9, sem: 2, prereq: ["eco-rag"], concepts: ["NPV", "المخاطر", "هيكل رأس المال", "التقييم", "الاستثمار"], desc: "كيف تجمع الشركة الأموال وتقرر أين تستثمرها.", exam: "تمارين + شفهي" },
            { id: "eco-mkt", name: "التسويق", it: "Marketing", cfu: 6, sem: 2, prereq: [], concepts: ["STP", "4Ps", "سلوك المستهلك", "العلامة التجارية", "Campaign"], desc: "فهم العميل وبناء عرض قيمة يبيع.", exam: "مشروع + شفهي" }
          ]
        },
        {
          n: 3, label: "السنة الثالثة", sub: "الإدارة المتقدمة والاختيارات",
          courses: [
            { id: "eco-ctrl", name: "مراقبة الإدارة", it: "Controllo di Gestione", cfu: 9, sem: 1, prereq: ["eco-rag"], concepts: ["Budget", "ABC Costing", "KPI", "Balanced Scorecard", "Reporting"], desc: "قياس أداء الشركة وتوجيه القرارات الإدارية.", exam: "حالات + شفهي" },
            { id: "eco-pub", name: "الاقتصاد العام", it: "Economia Pubblica", cfu: 9, sem: 1, prereq: ["eco-macro"], concepts: ["الضرائب", "الإنفاق العام", "الفشل السوقي", "الرفاهية", "السياسات"], desc: "دور الدولة في الاقتصاد وكيف تصمم سياسات فعالة.", exam: "شفهي" },
            { id: "eco-dig", name: "التسويق الرقمي", it: "Digital Marketing", cfu: 9, sem: 1, prereq: ["eco-mkt"], concepts: ["SEO", "Social Ads", "Analytics", "Content", "Funnel"], desc: "بناء حملات رقمية قابلة للقياس من الصفر.", exam: "مشروع + شفهي" },
            { id: "eco-hr", name: "إدارة الموارد البشرية", it: "Gestione delle Risorse Umane", cfu: 6, sem: 1, prereq: [], concepts: ["Recruiting", "Motivazione", "Valutazione", "Team"], desc: "اختيار الناس وتطويرهم والحفاظ عليهم.", exam: "حالات + شفهي" },
            { id: "eco-int", name: "الاقتصاد الدولي", it: "Economia Internazionale", cfu: 9, sem: 1, prereq: ["eco-macro"], concepts: ["التجارة الدولية", "سعر الصرف", "الميزان التجاري", "العولمة"], desc: "كيف تتفاعل الاقتصادات عبر الحدود.", exam: "شفهي + تمارين" },
            { id: "eco-bp", name: "خطة العمل والشركات الناشئة", it: "Business Plan e Start-up", cfu: 9, sem: 2, prereq: ["eco-fin", "eco-mkt"], concepts: ["Business Model Canvas", "Market Sizing", "Financial Plan", "Pitch"], desc: "حوّل فكرة لمشروع قابل للتمويل.", exam: "Pitch + تقرير" },
            { id: "eco-lav", name: "قانون العمل", it: "Diritto del Lavoro", cfu: 6, sem: 2, prereq: ["eco-comm"], concepts: ["العقود", "الحقوق", "الإنهاء", "النقابات"], desc: "حقوق وواجبات العامل وصاحب العمل في إيطاليا.", exam: "شفهي" },
            { id: "eco-eth", name: "الأخلاق والاستدامة", it: "Etica e Sostenibilità", cfu: 6, sem: 2, prereq: [], concepts: ["ESG", "CSR", "الاقتصاد الدائري", "الحوكمة"], desc: "كيف تكون الشركة مربحة ومسؤولة في نفس الوقت.", exam: "شفهي" },
            { id: "eco-tir", name: "تدريب عملي", it: "Tirocinio", cfu: 9, sem: 2, prereq: [], concepts: ["CV", "LinkedIn", "Interview", "Report"], desc: "خبرة عملية في شركة أو مؤسسة مع تقرير نهائي.", exam: "تقرير + تقييم" },
            { id: "eco-thesis", name: "المشروع النهائي", it: "Prova Finale", cfu: 3, sem: 2, prereq: [], concepts: ["الموضوع", "البحث", "الكتابة", "المناقشة"], desc: "رسالة التخرج والمناقشة أمام اللجنة.", exam: "مناقشة" }
          ]
        }
      ]
    }
  ];

  function degreeById(id) {
    for (var i = 0; i < DEGREES.length; i++) if (DEGREES[i].id === id) return DEGREES[i];
    return DEGREES[0];
  }

  function allCourses(degree) {
    var out = [];
    degree.years.forEach(function (year) {
      year.courses.forEach(function (c) {
        out.push({ course: c, year: year.n });
      });
    });
    return out;
  }

  function courseById(degree, id) {
    var found = null;
    allCourses(degree).forEach(function (item) {
      if (item.course.id === id) found = item.course;
    });
    return found;
  }

  function courseNameById(degree, id) {
    var c = courseById(degree, id);
    return c ? c.name : id;
  }

  /* ======================================================================
     DATA — BUREAUCRACY GUIDE
     ====================================================================== */
  var PROCEDURES = [
    {
      id: "permesso",
      title: "تصريح الإقامة",
      it: "Permesso di Soggiorno",
      icon: "shield",
      color: "#7c5cff",
      soft: "rgba(124,92,255,.14)",
      tag: "لغير الأوروبيين",
      duration: "60 – 90 يوم",
      cost: "~ 70 – 100 €",
      desc: "أهم إجراء بعد وصولك. الإيصال المؤقت بيحميك قانونياً لحد ما تستلم البطاقة.",
      steps: [
        { t: "اطلع على Codice Fiscale", d: "لو لسه معندكش كود ضريبي، استخرجه الأول من Agenzia delle Entrate — مطلوب في كل حاجة." },
        { t: "جهّز حزمة Kit Giallo", d: "خدها من أي مكتب بريد (Poste Italiane)، املأ النموذج، وادفع الرسوم." },
        { t: "أرسل الحزمة واحتفظ بالإيصال", d: "ابعت الحزمة بالبريد المسجّل. الإيصال (ricevuta) هو إثبات وضعك القانوني المؤقت.", tip: "صوّر الإيصال واحفظه على الموبايل — هتحتاجه في البنك وISEE." },
        { t: "استنى موعد البصمات", d: "هيوصلك SMS أو رسالة بموعد Questura. راقب البريد والرسائل باستمرار." },
        { t: "روح للبصمات", d: "خد جواز السفر، الإيصال، الصور، وإثبات السكن/الدراسة. البصمات سريعة." },
        { t: "استلم البطاقة وجدّد بدري", d: "بعد الاستلام، جدّد قبل الانتهاء بـ 60 يوم على الأقل." }
      ],
      docs: ["جواز سفر ساري", "إيصال Kit Giallo", "إثبات التسجيل الجامعي", "إثبات السكن", "4 صور شخصية", "Codice Fiscale", "تأمين صحي"],
      links: [
        { label: "Polizia di Stato", url: "https://www.poliziadistato.it" },
        { label: "Poste Italiane", url: "https://www.poste.it" },
        { label: "UniBg", url: "https://www.unibg.it" }
      ]
    },
    {
      id: "codice",
      title: "الكود الضريبي",
      it: "Codice Fiscale",
      icon: "award",
      color: "#22d3ee",
      soft: "rgba(34,211,238,.13)",
      tag: "أول أسبوع",
      duration: "نفس اليوم",
      cost: "مجاني",
      desc: "16 حرفاً بيفتح لك كل الأبواب: عقد السكن، SIM، ISEE، البنك، وتصريح الإقامة.",
      steps: [
        { t: "احجز موعد أو روح مباشرة", d: "من موقع Agenzia delle Entrate أو من المكتب. بعض المكاتب بتقبل بدون موعد." },
        { t: "جهّز المستندات", d: "جواز السفر + نسخة، إثبات سكن أو تسجيل جامعي، وأي مستند هوية." },
        { t: "املأ النموذج AA4/1", d: "الموظف ممكن يساعدك في الملء. خد رقم الانتظار واستنى دورك." },
        { t: "استلم الكود فوراً", d: "هتستلم ورقة فيها 16 حرفاً. راجع الاسم وتاريخ الميلاد." },
        { t: "احفظ نسخة رقمية", d: "صوّرها واحفظها في Drive — هتستخدمها كل أسبوع تقريباً.", tip: "لو الكود فيه خطأ في الاسم، اطلب تصحيح فوراً — تصحيحه بعدين أصعب." }
      ],
      docs: ["جواز السفر + نسخة", "إثبات السكن / الجامعة", "نموذج AA4/1"],
      links: [
        { label: "Agenzia delle Entrate", url: "https://www.agenziaentrate.gov.it" }
      ]
    },
    {
      id: "isee",
      title: "منحة DSU و ISEE",
      it: "ISEE / DSU",
      icon: "wallet",
      color: "#c6ff5e",
      soft: "rgba(198,255,94,.12)",
      tag: "موعد حاسم",
      duration: "2 – 4 أسابيع",
      cost: "مجاني / رمزي",
      desc: "ISEE هو مفتاح المنحة والسكن ورسوم أقل. قدّم بدري — المواعيد بتقفل بسرعة.",
      steps: [
        { t: "اجمع مستندات دخل الأسرة", d: "دخل السنة الماضية، إثبات الأسرة، الحسابات البنكية، والعقود." },
        { t: "اطلب ISEE Parificato", d: "من CAF أو مكتب DSU. للطلاب الدوليين بيتم حساب الدخل الأجنبي بمعايير إيطالية." },
        { t: "قدّم طلب DSU أونلاين", d: "من بوابة DSU قبل الموعد النهائي (عادة أغسطس/سبتمبر). ارفع ISEE وIBAN." },
        { t: "تابع الحالة", d: "راقب البوابة والإيميل. لو ناقص مستند، ارفعه فوراً." },
        { t: "احتفظ بالإيصال", d: "احفظ رقم الطلب وكل المراسلات — هتحتاجها لو حصل تأخير.", tip: "المواعيد بتتغير كل سنة — راجع صفحة DSU على موقع UniBg." }
      ],
      docs: ["ISEE Parificato", "مستندات دخل الأسرة", "IBAN إيطالي", "إثبات السكن", "رقم Matricola"],
      links: [
        { label: "UniBg — DSU", url: "https://www.unibg.it" },
        { label: "INPS", url: "https://www.inps.it" }
      ]
    },
    {
      id: "enroll",
      title: "التسجيل والتجديد",
      it: "Immatricolazione",
      icon: "clipboard",
      color: "#ff7a59",
      soft: "rgba(255,122,89,.13)",
      tag: "كل سنة",
      duration: "1 – 3 أسابيع",
      cost: "حسب ISEE",
      desc: "التسجيل مش مجرد دفع رسوم — لازم ترفع مستنداتك وتفعّل حسابك الجامعي.",
      steps: [
        { t: "أنشئ حساب UniBg / ESSE3", d: "سجّل بياناتك واستلم بيانات الدخول على البوابة." },
        { t: "ارفع مستنداتك", d: "شهادة الثانوية، الترجمة، Declaration of Value / CIMEA، وإثبات اللغة إن لزم." },
        { t: "ادفع الرسوم الأولى", d: "المبلغ بيعتمد على ISEE. ادفع من البوابة واحتفظ بالإيصال." },
        { t: "استلم Matricola", d: "رقم الطالب وبطاقة الجامعة. فعّل البريد الجامعي." },
        { t: "سجّل المواد وجدّد سنوياً", d: "من البوابة: خطة الدراسة، حجز الامتحانات، وتجديد السنة قبل الموعد.", tip: "احجز الامتحانات بدري — المقاعد بتخلص." }
      ],
      docs: ["شهادة الثانوية", "ترجمة معتمدة", "Declaration of Value / CIMEA", "جواز السفر", "إيصال الرسوم", "ISEE إن وجد"],
      links: [
        { label: "UniBg", url: "https://www.unibg.it" },
        { label: "CIMEA", url: "https://www.cimea.it" }
      ]
    }
  ];

  var EMAILS = [
    {
      id: "prof",
      label: "للبروفيسور",
      note: "استخدمه لطلب توضيح أو موعد. خلّيها قصيرة ومحددة، واذكر اسم المادة والكود.",
      text: "Gentile Professor [Cognome],\n\nLe scrivo in qualità di studente del corso di [Nome del corso] (a.a. 2026/2027).\nVorrei chiederLe un chiarimento riguardo a [argomento]. Sarei grato se potesse indicarmi un orario di ricevimento o un momento in cui potermi confrontare con Lei.\n\nLa ringrazio anticipatamente per la disponibilità.\n\nCordiali saluti,\n[Nome e Cognome]\n[Matricola]"
    },
    {
      id: "segreteria",
      label: "للسكرتارية",
      note: "للاستفسار عن التسجيل، ISEE، أو خطة الدراسة. اذكر رقم الطالب (Matricola) دائماً.",
      text: "Gentile Segreteria Studenti,\n\nMi chiamo [Nome] e sono uno studente del corso di [Corso di Laurea] (matricola [numero]).\nAvrei bisogno di un'informazione riguardo a [ISEE / immatricolazione / piano di studi].\nVi ringrazio per l'attenzione e resto in attesa di un Vostro riscontro.\n\nCordiali saluti,\n[Nome e Cognome]\n[Matricola]\n[Email]"
    },
    {
      id: "landlord",
      label: "لصاحب السكن",
      note: "لطلب نسخة العقد المسجّل — مهم جداً لتصريح الإقامة وISEE.",
      text: "Gentile [Nome],\n\nLe scrivo in merito al contratto di locazione dell'appartamento in [indirizzo].\nAvrei bisogno di una copia del contratto registrato per poter richiedere [permesso di soggiorno / ISEE].\nLa ringrazio per la disponibilità.\n\nCordiali saluti,\n[Nome e Cognome]\n[Telefono]"
    },
    {
      id: "dsu",
      label: "لـ DSU",
      note: "لمتابعة طلب المنحة أو رفع مستند ناقص. اذكر رقم الطلب والتاريخ.",
      text: "Gentile Ufficio DSU,\n\nMi chiamo [Nome] e sono uno studente del corso di [Corso] (matricola [numero]).\nVorrei chiedere conferma circa lo stato della mia domanda di borsa di studio per l'a.a. 2026/2027, protocollo [numero], inviata in data [gg/mm/aaaa].\nResto a disposizione per eventuali documenti aggiuntivi.\n\nCordiali saluti,\n[Nome e Cognome]\n[Matricola]\n[Email]"
    }
  ];

  var FAQS = [
    { q: "هل أحتاج إيطالي B2 عشان أدرس في UniBg؟", a: "بيعتمد على البرنامج: بعض البرامج الإيطالية بتطلب مستوى B2، وبرامج أخرى بالإنجليزية بتطلب IELTS/TOEFL. راجع صفحة البرنامج على موقع UniBg — المتطلبات بتتغير كل سنة." },
    { q: "متى أبدأ طلب منحة DSU؟", a: "عادةً من الصيف (يونيو–أغسطس) والموعد النهائي غالباً في أغسطس/سبتمبر. جهّز ISEE بدري، لأن استخراجه بياخد وقت. المواعيد الرسمية بتتنشر على موقع الجامعة." },
    { q: "هل يمكنني العمل أثناء الدراسة؟", a: "نعم، الطالب غير الأوروبي الحامل لتصريح إقامة للدراسة يمكنه العمل حتى 20 ساعة أسبوعياً (1040 ساعة سنوياً) وفق القواعد الإيطالية. راجع مكتب العلاقات الدولية للتأكد." },
    { q: "ماذا لو تأخر Permesso di Soggiorno؟", a: "الإيصال (ricevuta) يثبت وضعك القانوني أثناء الانتظار. احتفظ به مع جواز السفر. لو تأخر الموعد كثيراً، تواصل مع Questura أو مكتب الطلاب الدوليين." },
    { q: "كيف أفتح حساب بنكي إيطالي؟", a: "محتاج codice fiscale + جواز سفر + إثبات سكن/تسجيل جامعي. بعض البنوك الرقمية بتفتح الحساب أونلاين، لكن البنوك التقليدية غالباً بتطلب حضوراً شخصياً." },
    { q: "هل بيانات المنصة رسمية؟", a: "لا. دي نسخة تجريبية (MVP) غير رسمية، والبيانات للعرض والتجربة. تحقق دائماً من موقع UniBg والمصادر الرسمية قبل أي إجراء." }
  ];

  /* ======================================================================
     DATA — EXAMS, COMMUNITY, MAP, TIPS
     ====================================================================== */
  var PROFS = [
    {
      id: "bianchi", name: "Prof.ssa Bianchi", course: "Basi di Dati", courseId: "inf-db",
      campus: "dalmine", difficulty: 3, rating: 4.8, votes: 42, notes: 18,
      tags: ["SQL", "Normalizzazione", "Progetto"],
      style: "أسئلة مباشرة + مناقشة المشروع. بتحب تفهم ليه اخترت التصميم ده.",
      questions: [
        "Differenza tra chiave primaria e chiave candidata?",
        "Spiega la terza forma normale con un esempio pratico.",
        "Quando conviene creare un indice e quali sono i costi?"
      ]
    },
    {
      id: "conti", name: "Prof. Conti", course: "Analisi Matematica I", courseId: "inf-a1",
      campus: "dalmine", difficulty: 4, rating: 4.5, votes: 61, notes: 25,
      tags: ["Limiti", "Teoremi", "Dimostrazioni"],
      style: "شفهي بيبدأ بتعريف، وبعدها برهان قصير. الإجابة الغامضة مش بتعدّي.",
      questions: [
        "Enuncia e dimostra il teorema di Weierstrass.",
        "Studia la continuità di una funzione definita a tratti.",
        "Calcola il limite di (sin x)/x e spiega il passaggio."
      ]
    },
    {
      id: "romano", name: "Prof.ssa Romano", course: "Sistemi Operativi", courseId: "inf-os",
      campus: "dalmine", difficulty: 4, rating: 4.6, votes: 33, notes: 14,
      tags: ["Thread", "Scheduling", "Deadlock"],
      style: "بتحب الأمثلة العملية وربط النظرية بـ Linux. مشروع صغير بيزيد التقييم.",
      questions: [
        "Differenza tra processo e thread?",
        "Spiega lo scheduling Round Robin con un esempio.",
        "Cos'è un deadlock e come si può prevenire?"
      ]
    },
    {
      id: "moretti", name: "Prof. Moretti", course: "Microeconomia", courseId: "eco-micro",
      campus: "caniana", difficulty: 3, rating: 4.4, votes: 29, notes: 11,
      tags: ["Elasticità", "Mercati", "Grafici"],
      style: "أسئلة نظرية + رسم بياني. بيطلب تفسير اقتصادي مش حفظ.",
      questions: [
        "Effetto reddito e effetto sostituzione: spiegali con un esempio.",
        "Elasticità della domanda: definizione e fattori che la influenzano.",
        "Monopolio e concorrenza perfetta: confronto."
      ]
    },
    {
      id: "greco", name: "Prof.ssa Greco", course: "Inglese B2", courseId: "eco-eng",
      campus: "caniana", difficulty: 2, rating: 4.7, votes: 22, notes: 8,
      tags: ["Speaking", "Listening", "Writing"],
      style: "المحادثة أهم من القواعد. بتسأل عن تجاربك وآرائك، فجهّز أمثلة شخصية.",
      questions: [
        "Describe a challenge you faced and how you solved it.",
        "What are the pros and cons of remote work?",
        "Summarize an article you read recently in 90 seconds."
      ]
    },
    {
      id: "ferrari", name: "Prof. Ferrari", course: "Ingegneria del Software", courseId: "inf-se",
      campus: "dalmine", difficulty: 3, rating: 4.9, votes: 37, notes: 19,
      tags: ["Agile", "Testing", "Architettura"],
      style: "المناقشة حول المشروع هي 70% من التقييم. اعرف كل قرار في الكود.",
      questions: [
        "Differenza tra Scrum e Kanban?",
        "Cos'è il debito tecnico e come si gestisce?",
        "Come scriveresti un test case per il login?"
      ]
    },
    {
      id: "ricci", name: "Prof.ssa Ricci", course: "Diritto Privato", courseId: "eco-dir",
      campus: "caniana", difficulty: 3, rating: 4.3, votes: 26, notes: 10,
      tags: ["Contratti", "Responsabilità", "Codice Civile"],
      style: "بتسأل عن المادة والاستثناءات. اربط كل إجابة بمادة من القانون المدني.",
      questions: [
        "Differenza tra capacità giuridica e capacità di agire?",
        "Cos'è l'inadempimento e quali rimedi prevede la legge?",
        "Nullità e annullabilità: differenze ed effetti."
      ]
    },
    {
      id: "galli", name: "Prof. Galli", course: "Reti di Calcolatori", courseId: "inf-net",
      campus: "dalmine", difficulty: 4, rating: 4.6, votes: 31, notes: 13,
      tags: ["TCP/IP", "Routing", "Sicurezza"],
      style: "بيسأل خطوة بخطوة: من العنوان للباكيت. لو غلطت في الأساسيات، هيوقفك.",
      questions: [
        "Differenza tra TCP e UDP?",
        "Come funziona il three-way handshake?",
        "Cos'è il NAT e perché è stato introdotto?"
      ]
    }
  ];

  var FLASHCARDS = [
    { q: "Differenza tra TCP e UDP?", a: "TCP موثوق ومتصل (handshake، إعادة إرسال، ترتيب). UDP سريع وبدون اتصال، مناسب للبث والألعاب." },
    { q: "Cos'è la terza forma normale (3NF)?", a: "الجدول يكون في 2NF وكل الاعتماديات غير الأساسية تعتمد على المفتاح الأساسي فقط — بدون اعتماديات متعدية." },
    { q: "Effetto reddito vs effetto sostituzione?", a: "تأثير السعر ينقسم لتأثيرين: تغيّر القوة الشرائية (دخل) وتغيّر نسب الأسعار (استبدال)." },
    { q: "Cosa significa deadlock?", a: "حالة توقف فيها عمليتان أو أكثر، كل واحدة منتظرة مورد محتجز عند الأخرى — الحل: ترتيب الموارد أو timeout." },
    { q: "Cos'è il debito tecnico?", a: "تكلفة مستقبلية ناتجة عن حلول سريعة أو تصميم ضعيف — بتدفعها على شكل صيانة وبطء تطوير." },
    { q: "Differenza tra nullità e annullabilità?", a: "البطلان (nullità) يمس النظام العام ويُحتسب من تلقاء نفسه. القابلية للإبطال (annullabilità) تحمي طرفاً معيناً وتحتاج طلباً." }
  ];

  var GROUP_CATEGORIES = {
    study: { label: "مذاكرة", icon: "book-open", color: "#7c5cff", soft: "rgba(124,92,255,.14)" },
    language: { label: "لغات", icon: "messages", color: "#22d3ee", soft: "rgba(34,211,238,.13)" },
    sport: { label: "رياضة", icon: "target", color: "#c6ff5e", soft: "rgba(198,255,94,.12)" },
    culture: { label: "ثقافة", icon: "compass", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    volunteer: { label: "تطوع", icon: "heart", color: "#a78bfa", soft: "rgba(167,139,250,.14)" }
  };

  var GROUPS = [
    { id: "g1", course: "Analisi Matematica I", category: "study", campus: "Dalmine", members: 8, max: 12, next: "غداً · 18:00", place: "Biblioteca Dalmine — الطابق 2", tags: ["تمارين", "حلول"], desc: "مراجعة أسبوعية للتمارين وحلول الامتحانات القديمة.", color: "#7c5cff", soft: "rgba(124,92,255,.14)", avatars: ["أ", "م", "س", "ل"] },
    { id: "g2", course: "Basi di Dati", category: "study", campus: "Dalmine", members: 6, max: 10, next: "الخميس · 17:30", place: "Aule Studio Dalmine", tags: ["SQL", "مشروع"], desc: "نشتغل على مشروع SQL ومراجعة الاستعلامات قبل الامتحان.", color: "#22d3ee", soft: "rgba(34,211,238,.13)", avatars: ["ي", "ن", "ر"] },
    { id: "g3", course: "Microeconomia", category: "study", campus: "Caniana", members: 9, max: 14, next: "السبت · 11:00", place: "Bar Caniana", tags: ["رسومات", "أسئلة"], desc: "رسومات بيانية وحل أسئلة — مناسب للسنة الأولى.", color: "#c6ff5e", soft: "rgba(198,255,94,.12)", avatars: ["ه", "ع", "ف", "م"] },
    { id: "g4", course: "Inglese B2", category: "language", campus: "Online", members: 12, max: 20, next: "الأحد · 20:00", place: "Google Meet", tags: ["Speaking", "Online"], desc: "Speaking practice أونلاين — مستوى B2 وكل المستويات مرحب بها.", color: "#ff7a59", soft: "rgba(255,122,89,.13)", avatars: ["س", "د", "ك"] },
    { id: "g5", course: "Diritto Privato", category: "study", campus: "Città Alta", members: 5, max: 8, next: "بعد بكرة · 16:00", place: "Biblioteca Giuridica", tags: ["عقود", "مراجعة"], desc: "مراجعة عقود وملخصات — مجموعة صغيرة ومركّزة.", color: "#a78bfa", soft: "rgba(167,139,250,.14)", avatars: ["ر", "ب"] },
    { id: "g6", course: "Reti di Calcolatori", category: "study", campus: "Dalmine", members: 7, max: 12, next: "الجمعة · 15:00", place: "Lab B — Dalmine", tags: ["Packet Tracer", "TCP/IP"], desc: "Packet Tracer وTCP/IP — تحضير للـLab والامتحان.", color: "#22d3ee", soft: "rgba(34,211,238,.13)", avatars: ["ط", "ح", "ز"] },
    { id: "g7", course: "Italiano per tutti", category: "language", campus: "Online", members: 14, max: 18, next: "الثلاثاء · 19:00", place: "Google Meet", tags: ["A2", "محادثة"], desc: "محادثة إيطالية أسبوعية للمبتدئين والمتوسطين.", color: "#22d3ee", soft: "rgba(34,211,238,.13)", avatars: ["م", "ع", "ه", "ر"] },
    { id: "g8", course: "Bergamo Running Club", category: "sport", campus: "Città Alta", members: 11, max: 20, next: "السبت · 08:30", place: "Porta San Giacomo", tags: ["5K", "صباحي"], desc: "جري صباحي 5K — نبدأ من Porta San Giacomo.", color: "#c6ff5e", soft: "rgba(198,255,94,.12)", avatars: ["ط", "ي", "س"] },
    { id: "g9", course: "Volontariato · Bergamo", category: "volunteer", campus: "Centro", members: 9, max: 15, next: "الأحد · 10:00", place: "Piazza Matteotti", tags: ["تطوع", "مجتمع"], desc: "تطوع شهري مع جمعيات بيرغامو — تعارف وخدمة مجتمع.", color: "#a78bfa", soft: "rgba(167,139,250,.14)", avatars: ["ن", "ب", "ف"] },
    { id: "g10", course: "Photo Walk · Città Alta", category: "culture", campus: "Città Alta", members: 7, max: 12, next: "الجمعة · 17:00", place: "Piazza Vecchia", tags: ["تصوير", "مشي"], desc: "مشي تصويري في Città Alta — موبايل أو كاميرا.", color: "#ff7a59", soft: "rgba(255,122,89,.13)", avatars: ["ل", "د", "ك", "أ"] }
  ];

  var EVENT_CATEGORIES = {
    social: { label: "اجتماعي", icon: "users", color: "#7c5cff", soft: "rgba(124,92,255,.14)" },
    career: { label: "مهني", icon: "briefcase", color: "#22d3ee", soft: "rgba(34,211,238,.13)" },
    study: { label: "مذاكرة", icon: "book-open", color: "#c6ff5e", soft: "rgba(198,255,94,.12)" },
    culture: { label: "ثقافة", icon: "compass", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    sport: { label: "رياضة", icon: "target", color: "#a78bfa", soft: "rgba(167,139,250,.14)" }
  };

  var EVENTS = [
    { id: "e1", title: "Welcome Day", desc: "تعارف، جولة في الحرم، وبوفيه للطلاب الجدد.", date: addDays(8), time: "18:00", place: "Aula Magna — Dalmine", category: "social", capacity: 60, attendees: 42, color: "#7c5cff", soft: "rgba(124,92,255,.14)", icon: "sparkles" },
    { id: "e2", title: "Career Lab: CV & LinkedIn", desc: "ورشة عملية مع مكتب التوظيف لتحسين سيرتك.", date: addDays(15), time: "16:30", place: "Caniana — Aula 3", category: "career", capacity: 30, attendees: 24, color: "#22d3ee", soft: "rgba(34,211,238,.13)", icon: "briefcase" },
    { id: "e3", title: "Study Night", desc: "مراجعة جماعية، قهوة، وطاولات هادية لحد متأخر.", date: addDays(22), time: "20:00", place: "Biblioteca Dalmine", category: "study", capacity: 40, attendees: 31, color: "#c6ff5e", soft: "rgba(198,255,94,.12)", icon: "moon" },
    { id: "e4", title: "Aperitivo Internazionale", desc: "لقاء الطلاب الدوليين وتعارف قبل الامتحانات.", date: addDays(29), time: "19:00", place: "Città Alta — Caffè del Campus", category: "social", capacity: 50, attendees: 38, color: "#ff7a59", soft: "rgba(255,122,89,.13)", icon: "users" },
    { id: "e5", title: "Photo Walk · Città Alta", desc: "مشي تصويري بين الأزقة التاريخية — خد كاميرتك.", date: addDays(36), time: "17:00", place: "Piazza Vecchia", category: "culture", capacity: 25, attendees: 12, color: "#ff7a59", soft: "rgba(255,122,89,.13)", icon: "compass" },
    { id: "e6", title: "Calcetto Night", desc: "ماتش ودّي بين الطلاب — كل المستويات مرحب بها.", date: addDays(43), time: "20:30", place: "Campo Sportivo · Dalmine", category: "sport", capacity: 20, attendees: 17, color: "#a78bfa", soft: "rgba(167,139,250,.14)", icon: "target" }
  ];

  var DEALS = [
    { id: "d1", name: "Caffè Letterario", area: "Città Alta · 4 دقائق من Rosate", offer: "خصم 15%", code: "UNIBG15", icon: "coffee", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    { id: "d2", name: "Pizzeria Da Mimmo", area: "Via Pignolo · قريب من المقر", offer: "خصم 10%", code: "STUDENT10", icon: "utensils", color: "#c6ff5e", soft: "rgba(198,255,94,.12)" },
    { id: "d3", name: "Copisteria Il Sole", area: "Dalmine · أمام الحرم", offer: "20% على الطباعة", code: "PRINT20", icon: "printer", color: "#22d3ee", soft: "rgba(34,211,238,.13)" },
    { id: "d4", name: "FitLab Bergamo", area: "Centro · 8 دقائق بالباص", offer: "شهر تجريبي", code: "FITUNI", icon: "target", color: "#7c5cff", soft: "rgba(124,92,255,.14)" },
    { id: "d5", name: "Libreria Campus", area: "Via Pignolo · كتب وقرطاسية", offer: "خصم 10%", code: "BOOK10", icon: "book-open", color: "#a78bfa", soft: "rgba(167,139,250,.14)" },
    { id: "d6", name: "Cinema Conca Verde", area: "Bergamo · ليلة الفيلم", offer: "تذكرة 6€", code: "CINEMA6", icon: "ticket", color: "#22d3ee", soft: "rgba(34,211,238,.13)" }
  ];

  var POST_CATEGORIES = {
    question: { label: "سؤال", color: "#7c5cff" },
    recommendation: { label: "توصية", color: "#22d3ee" },
    housing: { label: "سكن", color: "#c6ff5e" },
    transport: { label: "مواصلات", color: "#ff7a59" },
    meetup: { label: "لقاء", color: "#a78bfa" }
  };

  var COMMUNITY_POSTS = [
    { id: "p1", name: "مريم", meta: "هندسة الحاسوب · سنة 2", category: "question", text: "حد يعرف مكتبة بتفتح لحد متأخر قريب من Dalmine؟ محتاج أذاكر بعد المحاضرات.", createdAt: new Date(Date.now() - 40 * 60000).toISOString(), likes: 8, color: "#7c5cff" },
    { id: "p2", name: "عمر", meta: "إدارة أعمال · سنة 1", category: "recommendation", text: "جربت مطعم مصري في Via Borgo Palazzo — أكل بيتي وأسعاره معقولة للطلبة. يستاهل التجربة.", createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), likes: 12, color: "#22d3ee" },
    { id: "p3", name: "سارة", meta: "علوم الاتصال · سنة 3", category: "housing", text: "غرفة متاحة في شقة قريبة من Dalmine من أول نوفمبر. لو حد مهتم، اكتب هنا وأنا أبعت التفاصيل.", createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), likes: 6, color: "#c6ff5e" },
    { id: "p4", name: "يوسف", meta: "علوم التربية · سنة 1", category: "transport", text: "لاحظت إن خط 5 بقى كل 15 دقيقة في الصباح — وفر عليّ 20 دقيقة في الطريق للجامعة.", createdAt: new Date(Date.now() - 22 * 3600000).toISOString(), likes: 9, color: "#ff7a59" },
    { id: "p5", name: "نور", meta: "الاقتصاد · سنة 2", category: "meetup", text: "مين جاي Welcome Day؟ نتقابل عند المدخل الساعة 17:45 ونعرف بعض قبل الفعالية.", createdAt: new Date(Date.now() - 28 * 3600000).toISOString(), likes: 5, color: "#a78bfa" }
  ];

  var POST_COMMENTS = {
    p1: [
      { id: "pc1", name: "عمر", text: "مكتبة Dalmine بتفتح لحد 22:00 في أيام الأسبوع، وAule Studio Caniana لحد 23:00.", createdAt: new Date(Date.now() - 25 * 60000).toISOString(), color: "#22d3ee" },
      { id: "pc2", name: "سارة", text: "في كافيه قريب من المحطة بيفضل فاتح لحد 23:30، بس الواي فاي أضعف شوية.", createdAt: new Date(Date.now() - 10 * 60000).toISOString(), color: "#c6ff5e" }
    ],
    p2: [
      { id: "pc3", name: "مريم", text: "جربت المكان ده الأسبوع اللي فات — الأكل تحفة والسعر مناسب جداً.", createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), color: "#7c5cff" }
    ],
    p3: [
      { id: "pc4", name: "يوسف", text: "مهتم! ممكن تبعتلي تفاصيل الإيجار والمدة؟", createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), color: "#ff7a59" },
      { id: "pc5", name: "سارة", text: "أكيد، هبعتلك على الخاص.", createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), color: "#c6ff5e" }
    ],
    p5: [
      { id: "pc6", name: "مريم", text: "أنا جاية! نتقابل عند المدخل 17:45.", createdAt: new Date(Date.now() - 20 * 3600000).toISOString(), color: "#7c5cff" }
    ]
  };

  var STORY_CATEGORIES = {
    housing: { label: "سكن", icon: "home", color: "#7c5cff", soft: "rgba(124,92,255,.14)" },
    bureaucracy: { label: "ورق وإجراءات", icon: "clipboard", color: "#22d3ee", soft: "rgba(34,211,238,.13)" },
    study: { label: "دراسة", icon: "book-open", color: "#c6ff5e", soft: "rgba(198,255,94,.12)" },
    money: { label: "فلوس ومنح", icon: "wallet", color: "#ff7a59", soft: "rgba(255,122,89,.13)" },
    wellbeing: { label: "نفسية", icon: "heart", color: "#a78bfa", soft: "rgba(167,139,250,.14)" },
    social: { label: "مجتمع", icon: "users", color: "#22d3ee", soft: "rgba(34,211,238,.13)" }
  };

  var STORIES = [
    { id: "s1", category: "housing", title: "البيت اللي حجزته أونلاين طلع مش موجود", problem: "لقيت غرفة على جروب فيسبوك، دفعت عربون 200€ قبل ما أشوفها، ولما وصلت بيرغامو العنوان كان لمكان تاني والرقم مش بيرد.", solution: "روحت أقرب مركز شرطة عملت محضر، وكلمت مكتب السكن في UniBg، ساعدوني ألاقي سكن مؤقت في hostel، وبعدها دورت على عقود موثقة وزارت الشقة بنفسي.", advice: "متخلصش أي فلوس قبل ما تشوف الشقة والعقد.", name: "أحمد", meta: "هندسة الحاسوب · سنة 1", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), helpful: 24, color: "#7c5cff" },
    { id: "s2", category: "bureaucracy", title: "الـPermesso اتأخر ومش عارف أذاكر", problem: "موعد التجديد اتأخر شهرين، وكنت خايف أكون مخالف ومش قادر أركز في الامتحانات.", solution: "حجزت موعد في Questura، وأخدت الـricevuta اللي بتثبت إن الطلب تحت الإجراء، وبلغت المكتب الدولي في الجامعة، وكمّلت دراستي عادي.", advice: "صوّر الـricevuta واحتفظ بيها — بتفرق في أي موقف.", name: "مريم", meta: "إدارة أعمال · سنة 2", createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), helpful: 31, color: "#22d3ee" },
    { id: "s3", category: "money", title: "المنحة اتأخرت والفلوس خلصت", problem: "المنحة تأخرت شهرين، والإيجار كان مستحق، ومش عارف أوفر.", solution: "كلمت مكتب المنح وشرحت الوضع، قدّمت على part-time في الجامعة، واستخدمت مطبخ الطلبة والمساعدات المؤقتة، وخططت مصاريفي على أساس تأخير شهرين.", advice: "خلي عندك احتياطي شهرين على الأقل.", name: "يوسف", meta: "الاقتصاد · سنة 3", createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), helpful: 18, color: "#c6ff5e" },
    { id: "s4", category: "wellbeing", title: "كنت لوحدي ومش قادر أتكلم", problem: "أول ترم حسيت بوحدة وقلق، وكنت بذاكر كتير وبعيط من غير سبب.", solution: "حجزت أول جلسة counseling مجانية في UniBg، وبدأت أمشي كل يوم، وانضممت لمجموعة مذاكرة، والموضوع بقى أخف.", advice: "اطلب مساعدة بدري — مش ضعف.", name: "نور", meta: "علوم التربية · سنة 1", createdAt: new Date(Date.now() - 9 * 86400000).toISOString(), helpful: 42, color: "#a78bfa" },
    { id: "s5", category: "study", title: "دفعت غرامة مكتبة لأني نسيت الكتاب", problem: "استعيرت كتاب من مكتبة Dalmine ونسيت موعد الإرجاع، والغرامة كانت أكبر من ميزانيتي.", solution: "كلمت أمين المكتبة وشرحت الظروف، ودفعت الغرامة على أقساط صغيرة، وعملت reminder على التليفون لكل كتاب.", advice: "فعّل تذكير قبل موعد الإرجاع بيومين.", name: "سارة", meta: "علوم الاتصال · سنة 3", createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), helpful: 12, color: "#ff7a59" },
    { id: "s6", category: "social", title: "مش لاقي ناس أتكلم معاهم", problem: "كنت بخرج من المحاضرة وأرجع البيت، ومش عارف أبدأ كلام مع حد.", solution: "بدأت أحضر فعاليات UniBg، وانضممت لمجموعة إنجليزي أونلاين، وبقيت أسأل زمايلي سؤال واحد بعد كل محاضرة.", advice: "ابدأ بسؤال بسيط — الناس غالباً مستنية حد يبدأ.", name: "عمر", meta: "هندسة الحاسوب · سنة 2", createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), helpful: 27, color: "#22d3ee" }
  ];

  var LIFE_SPOTS = [
    { id: "life-market", title: "تسوق", name: "Esselunga · Dalmine", note: "سوبرماركت كبير للمشتريات الأسبوعية.", area: "Dalmine", icon: "bag", color: "#ff7a59", soft: "rgba(255,122,89,.13)", link: "https://www.google.com/maps/search/?api=1&query=Esselunga+Dalmine" },
    { id: "life-health", title: "صحة", name: "Farmacia · Dalmine", note: "صيدلية قريبة من الحرم — اسأل عن الخدمة الليلية.", area: "Dalmine", icon: "activity", color: "#22d3ee", soft: "rgba(34,211,238,.13)", link: "https://www.google.com/maps/search/?api=1&query=Farmacia+Dalmine" },
    { id: "life-study", title: "مذاكرة", name: "Biblioteca Dalmine", note: "مكتبة هادية ومقابس — أحجز بدري في الامتحانات.", area: "Dalmine", icon: "book-open", color: "#c6ff5e", soft: "rgba(198,255,94,.12)", link: "https://www.google.com/maps/search/?api=1&query=Biblioteca+Dalmine" },
    { id: "life-sport", title: "رياضة", name: "Palestra · Bergamo", note: "جيم قريب من وسط المدينة — اسأل عن عرض الطلبة.", area: "Bergamo", icon: "target", color: "#a78bfa", soft: "rgba(167,139,250,.14)", link: "https://www.google.com/maps/search/?api=1&query=palestra+Bergamo" },
    { id: "life-coffee", title: "قهوة", name: "Caffè · Città Alta", note: "قهوة سريعة وهدوء قبل المحاضرة.", area: "Città Alta", icon: "coffee", color: "#ff7a59", soft: "rgba(255,122,89,.13)", link: "https://www.google.com/maps/search/?api=1&query=caff%C3%A8+Citt%C3%A0+Alta+Bergamo" },
    { id: "life-help", title: "مساعدة", name: "أرقام الطوارئ", note: "112 للطوارئ، 1522 للدعم والمساندة.", area: "إيطاليا", icon: "phone", color: "#7c5cff", soft: "rgba(124,92,255,.14)", internal: "community-help" }
  ];

  var TRANSPORT = [
    { line: "1", from: "Città Alta ↔ Stazione FS", freq: "كل 10 دقائق", color: "#7c5cff", note: "أفضل خط للوصول للمدينة العليا." },
    { line: "5", from: "Dalmine ↔ Bergamo Centro", freq: "كل 20 دقيقة", color: "#22d3ee", note: "الخط الأساسي لمقر الهندسة." },
    { line: "6", from: "Caniana ↔ Pignolo", freq: "كل 15 دقيقة", color: "#c6ff5e", note: "بيربط مقرين في مسار واحد." },
    { line: "F", from: "Città Bassa ↔ Città Alta", freq: "كل 5 دقائق", color: "#ff7a59", note: "Funicolare — تجربة لازم تجربها." },
    { line: "9", from: "Stazione FS ↔ Città Alta", freq: "كل 12 دقيقة", color: "#a78bfa", note: "بديل سريع لخط 1 وقت الزحمة." },
    { line: "8", from: "Dalmine ↔ Stazione FS", freq: "كل 30 دقيقة", color: "#22d3ee", note: "مسار مباشر للمحطة بدون تغيير." }
  ];

  var TIPS = [
    "قدّم على ISEE بدري… هو المفتاح لكل شيء: المنحة، السكن، ورسوم أقل.",
    "احجز الامتحانات أول ما تفتح — المقاعد بتخلص قبل ما تتخيل.",
    "صوّر كل إيصال ومستند رسمي. نسخة على الموبايل بتوفر عليك يوم كامل.",
    "أول أسبوع: اعرف مبنى مكتبتك، مكان الطباعة، وأقرب مقبس كهرباء.",
    "اتكلم مع زميل واحد كل محاضرة. المجتمع بيبدأ بسلام واحد.",
    "الشفهي مش حفظ… افهم ليه الإجابة صح، واشرحها بصوتك.",
    "خد نسخة ورقية من العقد المسجّل — هتحتاجها في Permesso وISEE.",
    "لو حسّيت بتوهان، ابدأ بمهمة واحدة صغيرة. الترتيب بييجي بعد كده."
  ];

  var QUOTES = [
    { text: "أول أسبوع كنت تايه في Dalmine. الخريطة والمجموعة خلّوني أحس إني في مكاني.", name: "مريم", meta: "هندسة الحاسوب · السنة الثانية", color: "#7c5cff" },
    { text: "قوالب الإيميلات وفّرت عليّ أسابيع من المراسلات الغلط مع السكرتارية.", name: "عمر", meta: "إدارة أعمال · السنة الأولى", color: "#22d3ee" },
    { text: "أسئلة الشفهي هنا كانت أقرب للامتحان من أي ملخص شريته.", name: "سارة", meta: "علوم الاتصال · السنة الثالثة", color: "#c6ff5e" },
    { text: "أحسن حاجة إن كل حاجة في مكان واحد — مش ١٠ مواقع و١٠٠ إيميل.", name: "لؤي", meta: "هندسة الحاسوب · السنة الثالثة", color: "#ff7a59" },
    { text: "مجموعة المذاكرة بدأت بسلام… وبقت أعز أصحابي في بيرغامو.", name: "نور", meta: "الاقتصاد · السنة الثانية", color: "#a78bfa" },
    { text: "أخيراً حد شرح Permesso بلغة مفهومة، مش بمصطلحات قانونية.", name: "يوسف", meta: "علوم التربية · السنة الأولى", color: "#22d3ee" }
  ];

  /* ======================================================================
     UNIVERSITY REGISTRY — UniBg is live, the rest are roadmap teasers.
     WordPress can append more through window.UniAtlasData.universities.
     ====================================================================== */
  var UNIVERSITIES = [
    {
      id: "unibg",
      name: "Università degli Studi di Bergamo",
      short: "UniBg",
      ar: "جامعة بيرغامو",
      city: "بيرغامو",
      cityIt: "Bergamo",
      country: "إيطاليا",
      countryIt: "Italia",
      flag: "🇮🇹",
      coords: [45.6983, 9.6773],
      status: "live",
      established: 1968,
      students: "~20,000",
      programs: "40+",
      tagline: "جامعتك من أول يوم — خريطة، مسار، إجراءات، ومجتمع في مكان واحد.",
      blurb: "التجربة الكاملة: خمسة مقرات، دليل مباني، مسار أكاديمي، دليل إجراءات، بنك أسئلة، سكن، منح، وفرص تدريب.",
      highlights: ["5 مقرات", "هندسة واقتصاد", "دعم DSU", "مجتمع عربي"],
      official: "https://www.unibg.it",
      accent: "#c6ff5e",
      accentSoft: "rgba(198,255,94,.14)",
      baseInterest: 1240,
      eta: "متاحة الآن"
    },
    {
      id: "bologna",
      name: "Università di Bologna",
      short: "UniBo",
      ar: "جامعة بولونيا",
      city: "بولونيا",
      cityIt: "Bologna",
      country: "إيطاليا",
      countryIt: "Italia",
      flag: "🇮🇹",
      coords: [44.4949, 11.3426],
      status: "coming",
      established: 1088,
      students: "~90,000",
      programs: "250+",
      tagline: "أقدم جامعة في العالم — ومدينة طلابية ما بتنام.",
      blurb: "بنجهّز دليل المقرات، السكن، والمنح لطلاب بولونيا. سجّل اهتمامك وهنبلغك أول ما تنزل.",
      highlights: ["أقدم جامعة", "مدينة طلابية", "منح إقليمية"],
      official: "https://www.unibo.it",
      accent: "#ff7a59",
      accentSoft: "rgba(255,122,89,.14)",
      baseInterest: 860,
      eta: "قريباً · 2027"
    },
    {
      id: "sapienza",
      name: "Sapienza Università di Roma",
      short: "Sapienza",
      ar: "جامعة سابينزا",
      city: "روما",
      cityIt: "Roma",
      country: "إيطاليا",
      countryIt: "Italia",
      flag: "🇮🇹",
      coords: [41.9028, 12.4964],
      status: "coming",
      established: 1303,
      students: "~110,000",
      programs: "280+",
      tagline: "أكبر جامعة في أوروبا — وسط روما وتاريخها.",
      blurb: "هنضيف خريطة المقرات، القبول، والسكن في روما. اهتمامك بيساعدنا نبدأ بيها بدري.",
      highlights: ["أكبر جامعة أوروبية", "تخصصات نادرة", "وسط روما"],
      official: "https://www.uniroma1.it",
      accent: "#22d3ee",
      accentSoft: "rgba(34,211,238,.14)",
      baseInterest: 780,
      eta: "قريباً · 2027"
    },
    {
      id: "polimi",
      name: "Politecnico di Milano",
      short: "PoliMi",
      ar: "بوليتكنيك ميلانو",
      city: "ميلانو",
      cityIt: "Milano",
      country: "إيطاليا",
      countryIt: "Italia",
      flag: "🇮🇹",
      coords: [45.4781, 9.2270],
      status: "coming",
      established: 1863,
      students: "~47,000",
      programs: "140+",
      tagline: "هندسة وتصميم… على أعلى مستوى.",
      blurb: "دليل المقرات، مشاريع التخرج، وفرص التدريب في ميلانو — كل ده جاي في النسخة الجاية.",
      highlights: ["هندسة وتصميم", "ارتباط بالصناعة", "ميلانو"],
      official: "https://www.polimi.it",
      accent: "#7c5cff",
      accentSoft: "rgba(124,92,255,.16)",
      baseInterest: 690,
      eta: "قريباً · 2027"
    },
    {
      id: "barcelona",
      name: "Universitat de Barcelona",
      short: "UB",
      ar: "جامعة برشلونة",
      city: "برشلونة",
      cityIt: "Barcelona",
      country: "إسبانيا",
      countryIt: "España",
      flag: "🇪🇸",
      coords: [41.3874, 2.1686],
      status: "coming",
      established: 1450,
      students: "~63,000",
      programs: "120+",
      tagline: "بحر، ثقافة، ودراسة بالإنجليزي أو الإسباني.",
      blurb: "هنغطي القبول، السكن، وتكلفة الحياة في برشلونة. سجّل اهتمامك عشان نبدأ صح.",
      highlights: ["مدينة ساحلية", "برامج إنجليزية", "حياة طلابية"],
      official: "https://www.ub.edu",
      accent: "#ffb020",
      accentSoft: "rgba(255,176,32,.14)",
      baseInterest: 540,
      eta: "قريباً · 2028"
    },
    {
      id: "vienna",
      name: "University of Vienna",
      short: "UniVie",
      ar: "جامعة فيينا",
      city: "فيينا",
      cityIt: "Wien",
      country: "النمسا",
      countryIt: "Österreich",
      flag: "🇦🇹",
      coords: [48.2130, 16.3600],
      status: "coming",
      established: 1365,
      students: "~90,000",
      programs: "180+",
      tagline: "دراسة مجانية تقريباً… في أجمل مدن أوروبا.",
      blurb: "هنشرح القبول، رسوم الفصل، والسكن في فيينا. اهتمامك بيحدد أولويتنا.",
      highlights: ["رسوم منخفضة", "برامج إنجليزية", "جودة حياة"],
      official: "https://www.univie.ac.at",
      accent: "#ff5c7a",
      accentSoft: "rgba(255,92,122,.14)",
      baseInterest: 610,
      eta: "قريباً · 2028"
    }
  ];

  // Custom universities coming from the WordPress University Manager.
  (function mergeCustomUniversities() {
    var custom = window.UniAtlasData && Array.isArray(window.UniAtlasData.universities)
      ? window.UniAtlasData.universities
      : [];
    custom.forEach(function (u) {
      if (!u || !u.id || !u.name) return;
      var exists = UNIVERSITIES.some(function (x) { return x.id === u.id; });
      if (exists) return;
      UNIVERSITIES.push({
        id: String(u.id),
        name: String(u.name),
        short: u.short ? String(u.short) : String(u.name).split(" ")[0],
        ar: u.ar ? String(u.ar) : String(u.name),
        city: u.city ? String(u.city) : "",
        cityIt: u.city ? String(u.city) : "",
        country: u.country ? String(u.country) : "",
        countryIt: u.country ? String(u.country) : "",
        flag: u.flag ? String(u.flag) : "🌍",
        coords: Array.isArray(u.coords) && u.coords.length === 2
          ? [parseFloat(u.coords[0]), parseFloat(u.coords[1])]
          : [30.0444, 31.2357],
        status: u.status === "live" ? "live" : "coming",
        established: parseInt(u.established, 10) || 0,
        students: u.students ? String(u.students) : "—",
        programs: u.programs ? String(u.programs) : "—",
        tagline: u.tagline ? String(u.tagline) : "جامعة جديدة على خريطة UniAtlas.",
        blurb: u.blurb ? String(u.blurb) : "بيانات تعريفية تجريبية — التفاصيل بتتحدث تدريجياً.",
        highlights: Array.isArray(u.highlights) ? u.highlights.slice(0, 4).map(String) : [],
        official: u.official ? String(u.official) : "",
        accent: u.accent ? String(u.accent) : "#7c5cff",
        accentSoft: "rgba(124,92,255,.14)",
        baseInterest: parseInt(u.baseInterest, 10) || 0,
        eta: u.eta ? String(u.eta) : "قريباً"
      });
    });
  })();

  function universityById(id) {
    for (var i = 0; i < UNIVERSITIES.length; i++) {
      if (UNIVERSITIES[i].id === id) return UNIVERSITIES[i];
    }
    return UNIVERSITIES[0];
  }

  function isEnterable(u) {
    return !!u && u.id === "unibg" && u.status === "live";
  }

  function selectedUniversity() { return universityById(state.selectedUniversity); }

  /* ======================================================================
     HOUSING / SCHOLARSHIPS / CAREERS — demo datasets
     ====================================================================== */
  var HOUSING = [
    {
      id: "h-dalmine-room",
      title: "غرفة في شقة مشتركة — Dalmine Centro",
      zone: "dalmine", zoneLabel: "Dalmine · المركز",
      type: "room", price: 380, deposit: 760, distance: "8 دقائق مشي للحرم",
      amenities: ["مطبخ مشترك", "Wi-Fi", "غسالة", "تدفئة"],
      badge: "الأقرب للحرم", color: "#c6ff5e", soft: "rgba(198,255,94,.18)", icon: "key",
      tip: "اسأل عن عدد السكان في الشقة وفاتورة التدفئة قبل التوقيع، واطلب نسخة من العقد المسجّل."
    },
    {
      id: "h-dalmine-studio",
      title: "ستوديو مستقل — Via Pasubio",
      zone: "dalmine", zoneLabel: "Dalmine · Via Pasubio",
      type: "studio", price: 620, deposit: 1240, distance: "5 دقائق مشي للحرم",
      amenities: ["مطبخ صغير", "حمام خاص", "Wi-Fi", "مفروش"],
      badge: "أفضل تقييم", color: "#22d3ee", soft: "rgba(34,211,238,.18)", icon: "home",
      tip: "الستوديو مناسب لو بتحب الهدوء، بس راجع فاتورة الكهرباء والتدفئة — ممكن تكون أعلى من الإيجار نفسه."
    },
    {
      id: "h-bergamo-room",
      title: "غرفة طالب — Bergamo Bassa",
      zone: "bergamo", zoneLabel: "Bergamo · المدينة السفلى",
      type: "room", price: 420, deposit: 840, distance: "20 دقيقة باص للحرم",
      amenities: ["قريب من المحطة", "Wi-Fi", "مطبخ", "غسالة"],
      badge: "حياة مدينة", color: "#7c5cff", soft: "rgba(124,92,255,.2)", icon: "building-2",
      tip: "قربك من المحطة مفيد لو هتسافر ميلانو كتير. اتأكد من مواعيد آخر باص في الأسبوع."
    },
    {
      id: "h-citta-apartment",
      title: "شقة مشتركة — Città Alta",
      zone: "citta-alta", zoneLabel: "Città Alta · البلدة العليا",
      type: "apartment", price: 520, deposit: 1040, distance: "15 دقيقة باص للحرم",
      amenities: ["إطلالة تاريخية", "مطبخ مشترك", "تدفئة", "Wi-Fi"],
      badge: "أجمل إطلالة", color: "#ff7a59", soft: "rgba(255,122,89,.18)", icon: "building",
      tip: "Città Alta جميلة لكن الشوارع ضيقة والمواصلات أقل. جرّب تسكن قريب من محطة Funicolare."
    },
    {
      id: "h-milano-room",
      title: "غرفة اقتصادية — Milano Lambrate",
      zone: "milano", zoneLabel: "Milano · Lambrate",
      type: "room", price: 450, deposit: 900, distance: "50 دقيقة قطار للحرم",
      amenities: ["قطار مباشر", "Wi-Fi", "مطبخ مشترك"],
      badge: "أرخص خيار", color: "#ffb020", soft: "rgba(255,176,32,.18)", icon: "bus",
      tip: "احسب تكلفة الاشتراك الشهري في القطار قبل ما تقرر — الوقت والفلوس بيختلفوا حسب جدولك."
    },
    {
      id: "h-bergamo-studio",
      title: "ستوديو — Bergamo Centro",
      zone: "bergamo", zoneLabel: "Bergamo · Centro",
      type: "studio", price: 700, deposit: 1400, distance: "12 دقيقة باص للحرم",
      amenities: ["حمام خاص", "مطبخ", "مفروش", "غسالة"],
      badge: "جاهز للسكن", color: "#ff5c7a", soft: "rgba(255,92,122,.18)", icon: "home",
      tip: "الستوديوهات في المركز بتنزل بسرعة. لو عجبك مكان، جهّز المستندات واطلب معاينة في نفس الأسبوع."
    }
  ];

  var FEE_BRACKETS = [
    { max: 13000, label: "€0 – €13,000", fee: 0, note: "إعفاء كامل تقريباً" },
    { max: 20000, label: "€13,001 – €20,000", fee: 180, note: "شريحة منخفضة" },
    { max: 28000, label: "€20,001 – €28,000", fee: 450, note: "شريحة متوسطة" },
    { max: 36000, label: "€28,001 – €36,000", fee: 950, note: "شريحة أعلى" },
    { max: 50000, label: "€36,001 – €50,000", fee: 1650, note: "شريحة مرتفعة" },
    { max: Infinity, label: "أكثر من €50,000", fee: 2400, note: "الحد الأقصى التقريبي" }
  ];

  var DEADLINES = [
    { label: "ISEE Parificato", date: "31 أغسطس", note: "ابدأ الإجراءات من يوليو", tag: "قبل DSU" },
    { label: "طلب DSU", date: "10 سبتمبر", note: "الموعد بيتغير كل سنة", tag: "مهم" },
    { label: "التسجيل / Immatricolazione", date: "أكتوبر", note: "راجع صفحة القسم", tag: "إلزامي" },
    { label: "تجديد المنحة", date: "يوليو", note: "للسنة الدراسية التالية", tag: "سنوي" }
  ];

  var CAREER_TYPES = {
    internship: { label: "تدريب", color: "#c6ff5e", soft: "rgba(198,255,94,.14)" },
    job: { label: "وظيفة", color: "#22d3ee", soft: "rgba(34,211,238,.14)" },
    "part-time": { label: "Part-time", color: "#ffb020", soft: "rgba(255,176,32,.14)" },
    remote: { label: "عن بُعد", color: "#7c5cff", soft: "rgba(124,92,255,.16)" }
  };

  var CAREERS = [
    {
      id: "c-fintech-frontend",
      role: "Frontend Developer Intern",
      company: "Fintech Bergamo", logo: "FB",
      type: "internship", location: "Dalmine · Hybrid", pay: "€800 / شهر", posted: "قبل يومين",
      tags: ["React", "JavaScript", "UI"],
      summary: "تدريب 6 شهور في فريق منتج صغير، هتشتغل على واجهات لوحة تحكم عملاء حقيقيين مع مراجعة كود أسبوعية.",
      requirements: ["HTML/CSS/JavaScript أساسيات قوية", "معرفة بـ React أو Vue", "إنجليزي للتواصل", "Git"],
      url: "https://www.linkedin.com/jobs"
    },
    {
      id: "c-brembo-data",
      role: "Data Analyst Junior",
      company: "Brembo", logo: "BR",
      type: "job", location: "Stezzano · On-site", pay: "€26,000 / سنة", posted: "قبل 4 أيام",
      tags: ["SQL", "Power BI", "Excel"],
      summary: "تحليل بيانات الإنتاج وتجهيز تقارير أسبوعية لفريق الجودة. مناسبة لخريجي هندسة أو إحصاء.",
      requirements: ["SQL متوسط", "Power BI أو Tableau", "Excel متقدم", "دقة في التفاصيل"],
      url: "https://www.linkedin.com/jobs"
    },
    {
      id: "c-techhub-support",
      role: "Customer Support — Arabic",
      company: "TechHub Milano", logo: "TH",
      type: "remote", location: "عن بُعد · من إيطاليا", pay: "€1,100 / شهر", posted: "قبل أسبوع",
      tags: ["عربي", "إنجليزي", "CRM"],
      summary: "دعم عملاء بالعربي والإنجليزي عبر الشات والإيميل، بنظام شيفتات مرنة تناسب الدراسة.",
      requirements: ["عربي وإنجليزي ممتاز", "كتابة واضحة", "معرفة بـ CRM", "إنترنت ثابت"],
      url: "https://www.linkedin.com/jobs"
    },
    {
      id: "c-valtellina-marketing",
      role: "Marketing Intern",
      company: "Valtellina Food", logo: "VF",
      type: "internship", location: "Bergamo · On-site", pay: "€600 / شهر", posted: "قبل 5 أيام",
      tags: ["Social Media", "Content", "Canva"],
      summary: "صناعة محتوى لمنتجات غذائية إيطالية، تصوير بسيط، وإدارة حسابات السوشيال ميديا.",
      requirements: ["حس تجاري للمحتوى", "Canva أو Adobe", "إيطالي أساسي", "تنظيم وقت"],
      url: "https://www.linkedin.com/jobs"
    },
    {
      id: "c-abb-mechanical",
      role: "Junior Mechanical Engineer",
      company: "ABB", logo: "ABB",
      type: "job", location: "Dalmine · On-site", pay: "€30,000 / سنة", posted: "قبل 3 أيام",
      tags: ["CAD", "SolidWorks", "إنجليزي"],
      summary: "تصميم أجزاء ميكانيكية ومتابعة اختبارات أولية مع فريق البحث والتطوير.",
      requirements: ["بكالوريوس هندسة ميكانيكية", "SolidWorks/CAD", "إنجليزي فني", "روح فريق"],
      url: "https://www.linkedin.com/jobs"
    },
    {
      id: "c-unibg-library",
      role: "Part-time Library Assistant",
      company: "UniBg Library", logo: "UB",
      type: "part-time", location: "Dalmine · On-site", pay: "€9 / ساعة", posted: "قبل يوم",
      tags: ["تنظيم", "خدمة طلاب", "مرونة"],
      summary: "مساعدة الطلاب في استعارة الكتب وترتيب الرفوف، بنظام 12–15 ساعة أسبوعياً.",
      requirements: ["طالب مسجل في UniBg", "إيطالي أساسي", "لباقة مع الطلاب", "التزام بالمواعيد"],
      url: "https://www.unibg.it"
    },
    {
      id: "c-scalapay-backend",
      role: "Backend Developer",
      company: "Scalapay", logo: "SP",
      type: "remote", location: "عن بُعد / ميلانو", pay: "€32,000 / سنة", posted: "قبل 6 أيام",
      tags: ["Node.js", "API", "Cloud"],
      summary: "تطوير APIs لخدمات الدفع، مع فريق موزع بين ميلانو وبرلين. مرونة كاملة في المكان.",
      requirements: ["Node.js أو Java", "REST APIs", "قواعد بيانات SQL", "اختبارات آلية"],
      url: "https://www.linkedin.com/jobs"
    }
  ];

  var NAV = [
    { route: "home", label: "الرئيسية", icon: "home" },
    { route: "map", label: "الخريطة التفاعلية", icon: "map" },
    { route: "campus", label: "دليل المباني", icon: "building" },
    { route: "planner", label: "المسار الأكاديمي", icon: "grad" },
    { route: "guide", label: "دليل الإجراءات", icon: "clipboard" },
    { route: "exams", label: "بنك الأسئلة", icon: "messages" },
    { route: "community", label: "المجتمع والحياة", icon: "users" },
    { route: "housing", label: "السكن والغرف", icon: "key" },
    { route: "scholarships", label: "المنح والرسوم", icon: "euro" },
    { route: "careers", label: "التدريب والوظائف", icon: "briefcase" },
    { route: "myspace", label: "مساحتي", icon: "user" }
  ];

  /* ======================================================================
     STATE
     ====================================================================== */
  var DEFAULT_STATE = {
    theme: "dark",
    profile: {
      name: "",
      campus: "dalmine",
      degree: "ing-inf",
      onboarded: false,
      matricola: "2026-" + Math.floor(1000 + Math.random() * 9000)
    },
    courseStatus: {},
    courseAwards: [],
    favorites: [],
    procChecks: {},
    joined: [],
    rsvps: [],
    customGroups: [],
    communityPosts: [],
    postLikes: {},
    postComments: {},
    communityStories: [],
    storyHelpful: {},
    savedDeals: [],
    ratings: {},
    contributions: [],
    xp: 0,
    email: "",
    activeCampus: "dalmine",
    selectedProc: "permesso",
    tipIndex: 0,
    selectedUniversity: "unibg",
    interests: [],
    suggestions: [],
    savedHousing: [],
    savedJobs: [],
    isee: 20000,
    enteredUniBg: false
  };

  var savedState = store.read() || {};
  var state = Object.assign({}, DEFAULT_STATE, savedState);
  state.profile = Object.assign({}, DEFAULT_STATE.profile, savedState.profile || {});
  state.courseStatus = Object.assign({}, savedState.courseStatus || {});
  state.procChecks = Object.assign({}, savedState.procChecks || {});
  state.ratings = Object.assign({}, savedState.ratings || {});
  state.favorites = Array.isArray(savedState.favorites) ? savedState.favorites : [];
  state.courseAwards = Array.isArray(savedState.courseAwards) ? savedState.courseAwards : [];
  state.joined = Array.isArray(savedState.joined) ? savedState.joined : [];
  state.rsvps = Array.isArray(savedState.rsvps) ? savedState.rsvps : [];
  state.customGroups = Array.isArray(savedState.customGroups) ? savedState.customGroups : [];
  state.communityPosts = Array.isArray(savedState.communityPosts) ? savedState.communityPosts : [];
  state.postLikes = savedState.postLikes && typeof savedState.postLikes === "object" ? savedState.postLikes : {};
  state.postComments = savedState.postComments && typeof savedState.postComments === "object" && !Array.isArray(savedState.postComments) ? savedState.postComments : {};
  Object.keys(state.postComments).forEach(function (key) {
    if (!Array.isArray(state.postComments[key])) state.postComments[key] = [];
  });
  state.communityStories = Array.isArray(savedState.communityStories) ? savedState.communityStories : [];
  state.storyHelpful = savedState.storyHelpful && typeof savedState.storyHelpful === "object" && !Array.isArray(savedState.storyHelpful) ? savedState.storyHelpful : {};
  state.savedDeals = Array.isArray(savedState.savedDeals) ? savedState.savedDeals : [];
  state.contributions = Array.isArray(savedState.contributions) ? savedState.contributions : [];
  state.interests = Array.isArray(savedState.interests) ? savedState.interests : [];
  state.suggestions = Array.isArray(savedState.suggestions) ? savedState.suggestions : [];
  state.savedHousing = Array.isArray(savedState.savedHousing) ? savedState.savedHousing : [];
  state.savedJobs = Array.isArray(savedState.savedJobs) ? savedState.savedJobs : [];
  state.selectedUniversity = savedState.selectedUniversity && universityById(savedState.selectedUniversity).id === savedState.selectedUniversity
    ? savedState.selectedUniversity
    : "unibg";
  state.isee = Math.max(0, Math.min(50000, parseInt(savedState.isee, 10) || 20000));
  if (state.__migrated) delete state.__migrated;

  function save() { store.write(state); }

  function profileName() { return state.profile.name ? state.profile.name : "طالب UniBg"; }
  function profileInitial() { return state.profile.name ? state.profile.name.trim().charAt(0) : "ط"; }
  function currentDegree() { return degreeById(state.profile.degree); }
  function statusOf(courseId) { return state.courseStatus[courseId] || "todo"; }
  function cfuDone() {
    var degree = currentDegree();
    var total = 0;
    allCourses(degree).forEach(function (item) {
      if (statusOf(item.course.id) === "done") total += item.course.cfu;
    });
    return total;
  }
  function coursesDone() {
    var degree = currentDegree();
    return allCourses(degree).filter(function (item) { return statusOf(item.course.id) === "done"; }).length;
  }
  function progressPercent() {
    var degree = currentDegree();
    return Math.min(100, Math.round((cfuDone() / degree.total) * 100));
  }
  function procChecks(proc) {
    var arr = state.procChecks[proc.id];
    if (!Array.isArray(arr)) arr = [];
    return proc.steps.map(function (_, i) { return !!arr[i]; });
  }
  function procDoneCount(proc) {
    return procChecks(proc).filter(Boolean).length;
  }
  function procPercent(proc) {
    return Math.round((procDoneCount(proc) / proc.steps.length) * 100);
  }
  function overallGuidePercent() {
    var done = 0, total = 0;
    PROCEDURES.forEach(function (p) { done += procDoneCount(p); total += p.steps.length; });
    return total ? Math.round((done / total) * 100) : 0;
  }
  function completedProcedures() {
    return PROCEDURES.filter(function (p) { return procDoneCount(p) === p.steps.length; }).length;
  }

  var LEVELS = [
    { min: 0, name: "مستكشف" },
    { min: 100, name: "مستكشف نشيط" },
    { min: 250, name: "متمكن" },
    { min: 450, name: "خبير" },
    { min: 700, name: "سفير UniBg" },
    { min: 1000, name: "أسطورة" }
  ];

  function levelInfo() {
    var level = LEVELS[0];
    var next = null;
    for (var i = 0; i < LEVELS.length; i++) {
      if (state.xp >= LEVELS[i].min) level = LEVELS[i];
      else { next = LEVELS[i]; break; }
    }
    return { level: level, next: next };
  }

  function awardXP(amount, title, sub, silent) {
    if (!amount) return;
    state.xp = Math.max(0, state.xp + amount);
    save();
    updateXP();
    if (!silent) toast(title || "إنجاز جديد", sub || "", amount);
  }

  function updateXP() {
    var info = levelInfo();
    var xpValue = $("#xpValue");
    var xpLevel = $("#xpLevel");
    if (xpValue) xpValue.textContent = state.xp + " XP";
    if (xpLevel) xpLevel.textContent = info.level.name;
    var chip = $("#xpChip");
    if (chip) {
      chip.title = info.next
        ? info.level.name + " — باقي " + (info.next.min - state.xp) + " XP للمستوى التالي"
        : "أعلى مستوى — أسطورة UniBg";
    }
  }

  function toast(title, sub, xp) {
    var wrap = $("#toastWrap");
    if (!wrap) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<span class="toast-ic">' + ic(xp ? "sparkles" : "check") + "</span>" +
      '<span class="toast-copy"><b>' + esc(title) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>" +
      (xp ? '<span class="toast-xp">+' + xp + " XP</span>" : "");
    wrap.appendChild(el);
    window.setTimeout(function () {
      el.classList.add("is-out");
      window.setTimeout(function () { el.remove(); }, 350);
    }, 3800);
  }

  var openModals = [];

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    if (openModals.indexOf(id) === -1) openModals.push(id);
    document.body.style.overflow = "hidden";
    var focusable = modal.querySelector("input, button, select, textarea, [tabindex]");
    if (focusable && id !== "onboardingModal") {
      window.setTimeout(function () { try { focusable.focus({ preventScroll: true }); } catch (e) {} }, 120);
    }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    openModals = openModals.filter(function (m) { return m !== id; });
    if (!openModals.length) document.body.style.overflow = "";
  }

  function closeAllModals() {
    openModals.slice().forEach(closeModal);
  }

  function confetti() {
    var canvas = $("#confettiCanvas");
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colors = ["#7c5cff", "#22d3ee", "#c6ff5e", "#ff7a59", "#f5f7ff"];
    var particles = [];
    for (var i = 0; i < 110; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 160,
        y: window.innerHeight * 0.38,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 10 - 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        life: 1
      });
    }
    var start = performance.now();
    function frame(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(function (p) {
        p.vy += 0.24;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / 2400);
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < 2400) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(frame);
  }

  function applyTheme(theme, silent) {
    state.theme = theme === "light" ? "light" : "dark";
    var app = $("#uniatlas-app");
    if (app) app.setAttribute("data-theme", state.theme);
    if (window.UniBgMap && window.UniBgMap.setTheme) window.UniBgMap.setTheme(state.theme);
    if (mapTileLayer) mapTileLayer.setUrl(tileUrl(state.theme));
    if (mapLabelLayer) mapLabelLayer.setUrl(tileLabelUrl(state.theme));
    updateWorldMapTheme();
    save();
    if (!silent) {
      toast(state.theme === "dark" ? "الوضع الليلي اتفعّل" : "الوضع النهاري اتفعّل", "اختار اللي مريح لعينك.");
    }
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  function init() {
    applyTheme(state.theme, true);
    var shortcut = $("#searchTrigger kbd");
    if (shortcut) {
      shortcut.textContent = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent) ? "⌘ K" : "Ctrl K";
    }
    populateStaticSelects();
    bindEvents();
    renderAll();
    initRouting();
    initReveal();
    initCounters();
    initClock();
    initTilt();
    updateXP();
    if (currentRoute === "landing") {
      window.setTimeout(function () { initWorldMap(); }, 120);
    } else if (!state.profile.onboarded) {
      window.setTimeout(function () {
        if (!openModals.length) openOnboarding(false);
      }, 1600);
    }
    window.setTimeout(function () {
      if (location.hash === "#map") initMap();
    }, 300);
  }

  function populateStaticSelects() {
    var dirCampus = $("#dirCampus");
    if (dirCampus) {
      dirCampus.innerHTML = '<option value="all">كل المقرات</option>' + CAMPUSES.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name + " — " + c.ar) + "</option>";
      }).join("");
    }
    var dirType = $("#dirType");
    if (dirType) {
      dirType.innerHTML = '<option value="all">كل الأنواع</option>' + Object.keys(TYPES).map(function (key) {
        return '<option value="' + key + '">' + esc(TYPES[key].label) + "</option>";
      }).join("");
    }
    var examCampus = $("#examCampus");
    if (examCampus) {
      examCampus.innerHTML = '<option value="all">كل المقرات</option>' + CAMPUSES.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + "</option>";
      }).join("");
    }
    var contribCampus = $("#contribCampus");
    if (contribCampus) {
      contribCampus.innerHTML = CAMPUSES.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + "</option>";
      }).join("");
    }
    var groupCampus = $("#groupCampus");
    if (groupCampus) {
      groupCampus.innerHTML = CAMPUSES.map(function (c) {
        return '<option value="' + esc(c.name) + '">' + esc(c.name + " — " + c.ar) + "</option>";
      }).join("") + '<option value="Online">Online</option>';
    }
    var degreeSelect = $("#degreeSelect");
    if (degreeSelect) {
      degreeSelect.innerHTML = DEGREES.map(function (d) {
        return '<option value="' + d.id + '">' + esc(d.name + " · " + d.it) + "</option>";
      }).join("");
    }
  }

  function renderAll() {
    renderProfile();
    renderHero();
    renderHomeExtras();
    renderCampusChips();
    renderCampusInfo();
    renderMapList();
    renderDirectory();
    renderPlanner();
    renderGuide();
    renderEmails();
    renderFaqs();
    renderProfs();
    renderFlashcard();
    renderCommunity();
    renderUniversityList();
    renderHousing();
    renderScholarships();
    renderCareers();
    renderSpace();
    renderCommandIndex();
    updateXP();
  }

  function renderProfile() {
    var name = profileName();
    var initial = profileInitial();
    var campus = campusById(state.profile.campus);
    var degree = currentDegree();
    var avatar = $("#profileAvatar");
    if (avatar) avatar.textContent = initial;
    var nameEl = $("#profileName");
    if (nameEl) nameEl.textContent = name;
    var campusEl = $("#profileCampus");
    if (campusEl) campusEl.textContent = campus.name;
    var uni = universityById("unibg");
    var uniSwitchName = $("#uniSwitchName");
    if (uniSwitchName) uniSwitchName.textContent = uni.short;
    var uniSwitchFlag = $("#uniSwitchFlag");
    if (uniSwitchFlag) uniSwitchFlag.textContent = uni.flag;
    var drawerUniName = $("#drawerUniName");
    if (drawerUniName) drawerUniName.textContent = uni.short + " · " + uni.city;
    var drawerUniFlag = $("#drawerUniFlag");
    if (drawerUniFlag) drawerUniFlag.textContent = uni.flag;
    var plannerAvatar = $("#plannerAvatar");
    if (plannerAvatar) plannerAvatar.textContent = initial;
    var plannerName = $("#plannerName");
    if (plannerName) plannerName.textContent = name;
    var degreeSelect = $("#degreeSelect");
    if (degreeSelect) degreeSelect.value = degree.id;
    var heroName = $("#heroName");
    if (heroName) heroName.textContent = name;
    var heroAvatar = $("#heroAvatar");
    if (heroAvatar) heroAvatar.textContent = initial;
    var heroDegree = $("#heroDegree");
    if (heroDegree) heroDegree.textContent = degree.name + " · " + degree.it;
    var heroCampus = $("#heroCampus");
    if (heroCampus) heroCampus.textContent = campus.name;
    var heroMatricola = $("#heroMatricola");
    if (heroMatricola) heroMatricola.textContent = state.profile.matricola;
  }

  function renderHero() {
    var degree = currentDegree();
    var done = cfuDone();
    var pct = progressPercent();
    var heroCfu = $("#heroCfu");
    if (heroCfu) heroCfu.textContent = done + " / " + degree.total + " CFU";
    var bar = $("#heroBar");
    if (bar) bar.style.width = pct + "%";
    var dots = $("#heroDots");
    if (dots) {
      var segments = 18;
      var html = "";
      for (var i = 0; i < segments; i++) {
        var threshold = Math.round((i + 1) * (degree.total / segments));
        html += '<i class="' + (done >= threshold ? "on" : "") + '"></i>';
      }
      dots.innerHTML = html;
    }
    var ring = $("#homeRing");
    if (ring) ring.style.setProperty("--p", pct);
    var ringText = $("#homeRingText");
    if (ringText) ringText.textContent = done;
  }

  function renderHomeExtras() {
    var event = EVENTS[0];
    var title = $("#nextEventTitle");
    var meta = $("#nextEventMeta");
    if (title) title.textContent = event.title;
    if (meta) meta.textContent = eventMeta(event.date, event.time, event.place);
    var tip = $("#dailyTip");
    if (tip) tip.textContent = "«" + TIPS[state.tipIndex % TIPS.length] + "»";
  }

  function initClock() {
    function tick() {
      var now = new Date();
      var time;
      var date;
      var hour = now.getHours();
      try {
        time = new Intl.DateTimeFormat("ar-EG", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
        date = new Intl.DateTimeFormat("ar-EG", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" }).format(now);
        var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hour: "2-digit", hour12: false }).formatToParts(now);
        parts.forEach(function (part) { if (part.type === "hour") hour = parseInt(part.value, 10); });
      } catch (e) {
        time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
        date = DAYS_AR[now.getDay()] + " · " + now.getDate() + " " + MONTHS_AR[now.getMonth()];
      }
      var clock = $("#liveClock");
      var dateEl = $("#liveDate");
      var weather = $("#liveWeather");
      if (clock) clock.textContent = time;
      if (dateEl) dateEl.textContent = date + " · بتوقيت بيرغامو";
      if (weather) {
        weather.textContent = hour < 6
          ? "ليلة هادية… وقت مناسب لمراجعة سريعة."
          : hour < 12
            ? "صباح الخير… قهوة سريعة قبل المحاضرة."
            : hour < 18
              ? "وقت مثالي لقهوة سريعة قبل المحاضرة."
              : "مساء الخير… لخّص يومك وريّح دماغك.";
      }
    }
    tick();
    window.setInterval(tick, 30000);
  }

  function initCounters() {
    var stats = $("#heroStats");
    if (!stats) return;
    var done = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done) return;
        done = true;
        $$("[data-count]", stats).forEach(function (el) {
          var target = parseInt(el.getAttribute("data-count"), 10) || 0;
          var start = performance.now();
          function step(now) {
            var p = Math.min(1, (now - start) / 1300);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
        io.disconnect();
      });
    }, { threshold: 0.4 });
    io.observe(stats);
  }

  function initTilt() {
    var card = $("#studentCard");
    if (!card || window.matchMedia("(pointer: coarse)").matches) return;
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", function () {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  }

  function initReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-in");
      } else {
        io.observe(el);
      }
    });
    window.UniBgReveal = function (root) {
      $$(".reveal:not(.is-in)", root || document).forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("is-in");
        } else {
          io.observe(el);
        }
      });
    };
  }

  /* ======================================================================
     ROUTING
     ====================================================================== */
  var currentRoute = "landing";
  var validRoutes = NAV.map(function (n) { return n.route; }).concat(["landing"]);

  function initRouting() {
    var hash = (location.hash || "").replace("#", "");
    navigate(validRoutes.indexOf(hash) !== -1 ? hash : "landing", true);
    window.addEventListener("hashchange", function () {
      var route = (location.hash || "").replace("#", "");
      navigate(validRoutes.indexOf(route) !== -1 ? route : "landing", true);
    });
  }

  function closeNavMore() {
    var more = $("#navMore");
    var btn = $("#navMoreBtn");
    if (more) more.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function navigate(route, fromHash) {
    if (validRoutes.indexOf(route) === -1) route = "home";
    currentRoute = route;
    var app = $("#uniatlas-app");
    if (app) app.setAttribute("data-screen", route === "landing" ? "landing" : "app");
    $$(".view").forEach(function (view) {
      var active = view.getAttribute("data-view") === route;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });
    $$(".nav-link").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-route") === route);
    });
    $$(".drawer-nav button").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-route") === route);
    });
    if (!fromHash) {
      try { history.replaceState(null, "", "#" + route); } catch (e) { location.hash = route; }
    }
    closeDrawer();
    closeNavMore();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (route === "landing") {
      window.setTimeout(function () {
        initWorldMap();
        if (worldMapInstance) worldMapInstance.invalidateSize();
        renderUniversityList();
      }, 80);
    }
    if (route === "map") {
      window.setTimeout(function () {
        initMap();
        if (window.UniBgMap && window.UniBgMap.invalidate) window.UniBgMap.invalidate();
      }, 80);
    }
    if (route === "planner") renderPlanner();
    if (route === "guide") renderGuide();
    if (route === "exams") renderProfs();
    if (route === "community") renderCommunity();
    if (route === "housing") renderHousing();
    if (route === "scholarships") renderScholarships();
    if (route === "careers") renderCareers();
    if (route === "myspace") renderSpace();
    if (window.UniBgReveal) window.setTimeout(function () { window.UniBgReveal(document.getElementById("view-" + route)); }, 60);
  }

  function closeDrawer() {
    var drawer = $("#mobileDrawer");
    var scrim = $("#drawerScrim");
    var btn = $("#menuBtn");
    if (drawer) drawer.classList.remove("is-open");
    if (drawer) drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function openDrawer() {
    var drawer = $("#mobileDrawer");
    var scrim = $("#drawerScrim");
    var btn = $("#menuBtn");
    if (drawer) drawer.classList.add("is-open");
    if (drawer) drawer.setAttribute("aria-hidden", "false");
    if (scrim) scrim.hidden = false;
    if (btn) btn.setAttribute("aria-expanded", "true");
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */
  function bindEvents() {
    document.addEventListener("click", function (e) {
      var routeEl = e.target.closest("[data-route]");
      if (routeEl) {
        e.preventDefault();
        navigate(routeEl.getAttribute("data-route"));
        return;
      }
      var closeEl = e.target.closest("[data-close]");
      if (closeEl) {
        closeModal(closeEl.getAttribute("data-close"));
        return;
      }
      var actionEl = e.target.closest("[data-action]");
      if (actionEl) {
        handleAction(actionEl.getAttribute("data-action"));
        return;
      }
    });

    var themeToggle = $("#themeToggle");
    if (themeToggle) themeToggle.addEventListener("click", function () {
      applyTheme(state.theme === "dark" ? "light" : "dark", false);
    });

    var searchTrigger = $("#searchTrigger");
    if (searchTrigger) searchTrigger.addEventListener("click", openCommand);

    var xpChip = $("#xpChip");
    if (xpChip) xpChip.addEventListener("click", function () {
      var info = levelInfo();
      toast("مستواك: " + info.level.name, info.next ? "باقي " + (info.next.min - state.xp) + " XP للمستوى التالي" : "وصلت لأعلى مستوى — أسطورة!");
    });

    var profileChip = $("#profileChip");
    if (profileChip) profileChip.addEventListener("click", function () { openOnboarding(true); });

    var menuBtn = $("#menuBtn");
    if (menuBtn) menuBtn.addEventListener("click", openDrawer);
    var drawerClose = $("#drawerClose");
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
    var drawerScrim = $("#drawerScrim");
    if (drawerScrim) drawerScrim.addEventListener("click", closeDrawer);

    // Landing: search, country filters and university picker
    var uniSearch = $("#uniSearch");
    if (uniSearch) uniSearch.addEventListener("input", function () {
      uniFilter.q = uniSearch.value;
      renderUniversityList();
    });
    var uniSearchClear = $("#uniSearchClear");
    if (uniSearchClear) uniSearchClear.addEventListener("click", function () {
      if (uniSearch) { uniSearch.value = ""; uniSearch.focus(); }
      uniFilter.q = "";
      renderUniversityList();
    });
    var uniCountryFilters = $("#uniCountryFilters");
    if (uniCountryFilters) uniCountryFilters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-uni-country]");
      if (!btn) return;
      uniFilter.country = btn.getAttribute("data-uni-country");
      renderUniversityList();
    });
    var uniList = $("#uniList");
    if (uniList) uniList.addEventListener("click", function (e) {
      var row = e.target.closest("[data-uni-id]");
      if (row) selectUniversity(row.getAttribute("data-uni-id"), true);
    });
    var worldFitBtn = $("#worldFitBtn");
    if (worldFitBtn) worldFitBtn.addEventListener("click", worldView);
    var worldEuropeBtn = $("#worldEuropeBtn");
    if (worldEuropeBtn) worldEuropeBtn.addEventListener("click", europeView);
    var worldLocateBtn = $("#worldLocateBtn");
    if (worldLocateBtn) worldLocateBtn.addEventListener("click", locateMe);
    var sheetHandle = $("#sheetHandle");
    if (sheetHandle) sheetHandle.addEventListener("click", toggleSheet);

    // Navigation: university switch + More menu
    var uniSwitch = $("#uniSwitch");
    if (uniSwitch) uniSwitch.addEventListener("click", function () { navigate("landing"); });
    var navMoreBtn = $("#navMoreBtn");
    if (navMoreBtn) navMoreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var more = $("#navMore");
      var open = more ? more.classList.toggle("is-open") : false;
      navMoreBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#navMore")) closeNavMore();
    });

    // Housing
    ["housingSearch"].forEach(function (id) {
      var el = $("#" + id);
      if (el) el.addEventListener("input", renderHousing);
    });
    ["housingZone", "housingType", "housingBudget"].forEach(function (id) {
      var el = $("#" + id);
      if (el) el.addEventListener("change", renderHousing);
    });
    var housingSavedToggle = $("#housingSavedToggle");
    if (housingSavedToggle) housingSavedToggle.addEventListener("click", function () {
      housingSavedOnly = !housingSavedOnly;
      renderHousing();
    });
    var housingReset = $("#housingReset");
    if (housingReset) housingReset.addEventListener("click", resetHousingFilters);
    var housingEmptyReset = $("#housingEmptyReset");
    if (housingEmptyReset) housingEmptyReset.addEventListener("click", resetHousingFilters);

    // Scholarships
    var iseeRange = $("#iseeRange");
    if (iseeRange) {
      iseeRange.addEventListener("input", function () {
        state.isee = parseInt(iseeRange.value, 10) || 0;
        updateFeeCalculator();
      });
      iseeRange.addEventListener("change", function () {
        state.isee = parseInt(iseeRange.value, 10) || 0;
        save();
      });
    }
    var feeBrackets = $("#feeBrackets");
    if (feeBrackets) feeBrackets.addEventListener("click", function (e) {
      var row = e.target.closest("[data-fee-set]");
      if (!row) return;
      state.isee = parseInt(row.getAttribute("data-fee-set"), 10) || 0;
      save();
      updateFeeCalculator();
    });

    // Careers
    var careerSearch = $("#careerSearch");
    if (careerSearch) careerSearch.addEventListener("input", renderCareers);
    var careerType = $("#careerType");
    if (careerType) careerType.addEventListener("change", renderCareers);
    var careerSavedToggle = $("#careerSavedToggle");
    if (careerSavedToggle) careerSavedToggle.addEventListener("click", function () {
      careerSavedOnly = !careerSavedOnly;
      renderCareers();
    });
    var careerReset = $("#careerReset");
    if (careerReset) careerReset.addEventListener("click", resetCareerFilters);
    var careerEmptyReset = $("#careerEmptyReset");
    if (careerEmptyReset) careerEmptyReset.addEventListener("click", resetCareerFilters);
    var careerCvBtn = $("#careerCvBtn");
    if (careerCvBtn) careerCvBtn.addEventListener("click", downloadCvChecklist);

    // Suggest a university
    var suggestForm = $("#suggestForm");
    if (suggestForm) suggestForm.addEventListener("submit", submitSuggestion);

    var backTop = $("#backTop");
    if (backTop) backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    var nextTip = $("#nextTipBtn");
    if (nextTip) nextTip.addEventListener("click", function () {
      state.tipIndex = (state.tipIndex + 1) % TIPS.length;
      save();
      renderHomeExtras();
      var tip = $("#dailyTip");
      if (tip) {
        tip.style.opacity = "0";
        window.setTimeout(function () { tip.style.opacity = "1"; }, 120);
      }
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (window.UniBgMap && window.UniBgMap.invalidate) window.UniBgMap.invalidate();
    });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommand();
        return;
      }
      if (e.key === "Escape") {
        if (openModals.length) {
          e.preventDefault();
          closeModal(openModals[openModals.length - 1]);
        } else {
          closeDrawer();
        }
      }
      if (!typing && e.key === "/") {
        e.preventDefault();
        openCommand();
      }
    });

    // Onboarding
    var obNext = $("#obNext");
    if (obNext) obNext.addEventListener("click", function () {
      var nameInput = $("#obName");
      obDraft.name = nameInput ? nameInput.value.trim() : "";
      obDraft.campus = selectedObCampus;
      showObStep(2);
    });
    var obBack = $("#obBack");
    if (obBack) obBack.addEventListener("click", function () { showObStep(1); });
    var obStart = $("#obStart");
    if (obStart) obStart.addEventListener("click", finishOnboarding);

    var obChips = $("#obCampusChips");
    if (obChips) obChips.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-ob-campus]");
      if (!chip) return;
      selectedObCampus = chip.getAttribute("data-ob-campus");
      $$("[data-ob-campus]", obChips).forEach(function (c) {
        c.classList.toggle("is-active", c.getAttribute("data-ob-campus") === selectedObCampus);
      });
    });

    var obDegrees = $("#obDegreeCards");
    if (obDegrees) obDegrees.addEventListener("click", function (e) {
      var card = e.target.closest("[data-ob-degree]");
      if (!card) return;
      selectedObDegree = card.getAttribute("data-ob-degree");
      $$("[data-ob-degree]", obDegrees).forEach(function (c) {
        c.classList.toggle("is-active", c.getAttribute("data-ob-degree") === selectedObDegree);
      });
    });

    // Command palette
    var commandInput = $("#commandInput");
    if (commandInput) {
      commandInput.addEventListener("input", function () {
        renderCommandResults(commandInput.value);
      });
      commandInput.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); moveCommandSelection(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); moveCommandSelection(-1); }
        else if (e.key === "Enter") {
          e.preventDefault();
          if (currentCmdResults[cmdSelected]) runCommand(currentCmdResults[cmdSelected]);
        }
      });
    }
    var commandResults = $("#commandResults");
    if (commandResults) commandResults.addEventListener("click", function (e) {
      var item = e.target.closest("[data-cmd-index]");
      if (!item) return;
      var idx = parseInt(item.getAttribute("data-cmd-index"), 10);
      if (currentCmdResults[idx]) runCommand(currentCmdResults[idx]);
    });

    // Map controls
    var worldBtn = $("#worldBtn");
    if (worldBtn) worldBtn.addEventListener("click", function () {
      initMap();
      if (window.UniBgMap && window.UniBgMap.world) window.UniBgMap.world();
      toast("جامعات العالم", "قريباً… نقاط مبدئية للاستكشاف فقط.");
    });
    var locateBtn = $("#locateBtn");
    if (locateBtn) locateBtn.addEventListener("click", function () {
      initMap();
      if (window.UniBgMap && window.UniBgMap.locate) window.UniBgMap.locate();
    });
    var fitBtn = $("#fitBergamoBtn");
    if (fitBtn) fitBtn.addEventListener("click", function () {
      initMap();
      if (window.UniBgMap && window.UniBgMap.fitBergamo) window.UniBgMap.fitBergamo();
    });

    var campusChips = $("#campusChips");
    if (campusChips) campusChips.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-campus]");
      if (chip) focusCampus(chip.getAttribute("data-campus"));
    });

    var mapList = $("#mapPlaceList");
    if (mapList) mapList.addEventListener("click", function (e) {
      var item = e.target.closest("[data-focus-place]");
      if (!item) return;
      var place = placeById(item.getAttribute("data-focus-place"));
      if (place) {
        state.activeCampus = place.campus;
        save();
        renderCampusChips();
        renderCampusInfo();
        renderMapList();
        focusCampus(place.campus, place.id);
      }
    });

    var mapSearch = $("#mapSearch");
    if (mapSearch) {
      mapSearch.addEventListener("input", function () {
        var clear = $("#mapSearchClear");
        if (clear) clear.hidden = !mapSearch.value;
        renderMapList();
      });
    }
    var mapSearchClear = $("#mapSearchClear");
    if (mapSearchClear) mapSearchClear.addEventListener("click", function () {
      if (mapSearch) mapSearch.value = "";
      mapSearchClear.hidden = true;
      renderMapList();
    });

    // Directory
    var dirSearch = $("#dirSearch");
    if (dirSearch) dirSearch.addEventListener("input", renderDirectory);
    var dirCampus = $("#dirCampus");
    if (dirCampus) dirCampus.addEventListener("change", renderDirectory);
    var dirType = $("#dirType");
    if (dirType) dirType.addEventListener("change", renderDirectory);
    var favToggle = $("#favToggle");
    if (favToggle) favToggle.addEventListener("click", function () {
      favOnly = !favOnly;
      favToggle.classList.toggle("is-active", favOnly);
      renderDirectory();
    });
    var dirReset = $("#dirReset");
    if (dirReset) dirReset.addEventListener("click", resetDirectory);
    var dirEmptyReset = $("#dirEmptyReset");
    if (dirEmptyReset) dirEmptyReset.addEventListener("click", resetDirectory);
    var placeGrid = $("#placeGrid");
    if (placeGrid) placeGrid.addEventListener("click", function (e) {
      var fav = e.target.closest("[data-fav]");
      if (fav) { toggleFavorite(fav.getAttribute("data-fav")); return; }
      var open = e.target.closest("[data-open-place]");
      if (open) { openPlaceModal(open.getAttribute("data-open-place")); return; }
      var map = e.target.closest("[data-map-place]");
      if (map) { openPlaceOnMap(map.getAttribute("data-map-place")); }
    });

    // Planner
    var degreeSelect = $("#degreeSelect");
    if (degreeSelect) degreeSelect.addEventListener("change", function () {
      state.profile.degree = degreeSelect.value;
      save();
      renderProfile();
      renderHero();
      renderPlanner();
      toast("تم تغيير التخصص", currentDegree().name + " — تم تحديث المسار.");
    });
    var timeline = $("#plannerTimeline");
    if (timeline) timeline.addEventListener("click", function (e) {
      var cycle = e.target.closest("[data-cycle-course]");
      if (cycle) {
        e.stopPropagation();
        cycleCourse(cycle.getAttribute("data-cycle-course"));
        return;
      }
      var row = e.target.closest("[data-course-row]");
      if (row) openCourseModal(row.getAttribute("data-course-row"));
    });
    var timelineKey = $("#plannerTimeline");
    if (timelineKey) timelineKey.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest("[data-course-row]");
      if (row) { e.preventDefault(); openCourseModal(row.getAttribute("data-course-row")); }
    });
    var avgRange = $("#avgRange");
    if (avgRange) avgRange.addEventListener("input", updateGpa);
    var thesisRange = $("#thesisRange");
    if (thesisRange) thesisRange.addEventListener("input", updateGpa);

    // Guide
    var procedureGrid = $("#procedureGrid");
    if (procedureGrid) procedureGrid.addEventListener("click", function (e) {
      var card = e.target.closest("[data-proc]");
      if (!card) return;
      state.selectedProc = card.getAttribute("data-proc");
      save();
      renderGuide();
      var detail = $("#guideDetail");
      if (detail) detail.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    var guideSteps = $("#guideSteps");
    if (guideSteps) guideSteps.addEventListener("click", function (e) {
      var step = e.target.closest("[data-proc-step]");
      if (!step) return;
      toggleProcStep(parseInt(step.getAttribute("data-proc-step"), 10));
    });
    var emailTabs = $("#emailTabs");
    if (emailTabs) emailTabs.addEventListener("click", function (e) {
      var tab = e.target.closest("[data-email]");
      if (!tab) return;
      activeEmail = tab.getAttribute("data-email");
      renderEmails();
    });
    var copyEmail = $("#copyEmailBtn");
    if (copyEmail) copyEmail.addEventListener("click", copyEmailText);
    var faqList = $("#faqList");
    if (faqList) faqList.addEventListener("click", function (e) {
      var q = e.target.closest("[data-faq]");
      if (!q) return;
      var item = q.closest(".faq-item");
      if (item) item.classList.toggle("is-open");
    });

    // Exams
    var examSearch = $("#examSearch");
    if (examSearch) examSearch.addEventListener("input", renderProfs);
    var examCampus = $("#examCampus");
    if (examCampus) examCampus.addEventListener("change", renderProfs);
    var examSort = $("#examSort");
    if (examSort) examSort.addEventListener("click", function () {
      examSortByRating = !examSortByRating;
      examSort.classList.toggle("is-active", !examSortByRating);
      examSort.innerHTML = ic("chart") + " " + (examSortByRating ? "الأعلى تقييماً" : "الأصعب أولاً");
      renderProfs();
    });
    var profGrid = $("#profGrid");
    if (profGrid) profGrid.addEventListener("click", function (e) {
      var card = e.target.closest("[data-prof]");
      if (card) openProfModal(card.getAttribute("data-prof"));
    });

    var flashcard = $("#flashcard");
    if (flashcard) {
      flashcard.addEventListener("click", function () { flashcard.classList.toggle("is-flipped"); });
      flashcard.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flashcard.classList.toggle("is-flipped"); }
      });
    }
    var fcNext = $("#fcNext");
    if (fcNext) fcNext.addEventListener("click", function () { changeFlashcard(1); });
    var fcPrev = $("#fcPrev");
    if (fcPrev) fcPrev.addEventListener("click", function () { changeFlashcard(-1); });

    var contributeForm = $("#contributeForm");
    if (contributeForm) contributeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitContribution();
    });

    // Community
    var groupGrid = $("#groupGrid");
    if (groupGrid) groupGrid.addEventListener("click", function (e) {
      var join = e.target.closest("[data-join]");
      if (join) toggleJoin(join.getAttribute("data-join"));
    });
    var eventGrid = $("#eventGrid");
    if (eventGrid) eventGrid.addEventListener("click", function (e) {
      var ics = e.target.closest("[data-ics]");
      if (ics) { downloadIcs(ics.getAttribute("data-ics")); return; }
      var rsvp = e.target.closest("[data-rsvp]");
      if (rsvp) toggleRsvp(rsvp.getAttribute("data-rsvp"));
    });
    var groupSearch = $("#groupSearch");
    if (groupSearch) groupSearch.addEventListener("input", function () {
      communityGroupQuery = groupSearch.value;
      renderGroups();
    });
    var groupForm = $("#groupForm");
    if (groupForm) groupForm.addEventListener("submit", submitGroup);
    var postForm = $("#postForm");
    if (postForm) postForm.addEventListener("submit", submitPost);
    var postText = $("#postText");
    if (postText) postText.addEventListener("input", updatePostCount);
    var storyForm = $("#storyForm");
    if (storyForm) storyForm.addEventListener("submit", submitStory);
    document.addEventListener("submit", function (e) {
      var commentForm = e.target.closest("[data-comment-form]");
      if (!commentForm) return;
      e.preventDefault();
      submitComment(commentForm.getAttribute("data-comment-form"), commentForm);
    });

    // Newsletter
    var newsletter = $("#newsletterForm");
    if (newsletter) newsletter.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#newsletterEmail");
      if (!email || !email.value || email.value.indexOf("@") === -1) {
        toast("الإيميل مش صحيح", "اكتب بريداً إلكترونياً صالحاً.");
        return;
      }
      state.email = email.value.trim();
      save();
      email.value = "";
      var note = $("#newsletterNote");
      if (note) note.textContent = "تم تسجيل " + state.email + " — هنبعتلك أول ما تنزل النسخة.";
      toast("تم الانضمام لقائمة الإطلاق", "شكراً! هنبعتلك التحديثات.", 10);
    });

    // Close onboarding marks as seen
    var onboarding = $("#onboardingModal");
    if (onboarding) {
      onboarding.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) {
          if (!state.profile.onboarded) {
            state.profile.onboarded = true;
            save();
          }
        }
      });
    }
  }

  function onScroll() {
    var header = $("#appHeader");
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 18);
    var bar = $("#scrollBar");
    if (bar) {
      var doc = document.documentElement;
      var height = doc.scrollHeight - window.innerHeight;
      bar.style.width = (height > 0 ? (window.scrollY / height) * 100 : 0) + "%";
    }
  }

  function handleAction(action) {
    if (action === "start-journey") {
      openOnboarding(false);
    } else if (action === "suggest-group") {
      openGroupModal();
    } else if (action === "share-story") {
      openStoryModal();
    } else if (action === "open-suggest") {
      openSuggest();
    } else if (action === "switch-university") {
      navigate("landing");
    } else if (action === "edit-profile") {
      openOnboarding(true);
    } else if (action === "export-data") {
      exportData();
    } else if (action === "reset-demo") {
      resetDemo();
    }
  }

  /* ======================================================================
     ONBOARDING
     ====================================================================== */
  var obDraft = { name: state.profile.name, campus: state.profile.campus, degree: state.profile.degree };
  var selectedObCampus = state.profile.campus;
  var selectedObDegree = state.profile.degree;

  function openOnboarding(edit) {
    selectedObCampus = state.profile.campus;
    selectedObDegree = state.profile.degree;
    obDraft = { name: state.profile.name, campus: selectedObCampus, degree: selectedObDegree };
    var nameInput = $("#obName");
    if (nameInput) nameInput.value = state.profile.name || "";
    renderObOptions();
    showObStep(1);
    openModal("onboardingModal");
    if (edit) {
      var title = $("#onboardingTitle");
      if (title) title.innerHTML = 'ملفك الشخصي… <span class="text-grad">حدّثه في أي وقت.</span>';
    }
  }

  function renderObOptions() {
    var chips = $("#obCampusChips");
    if (chips) {
      chips.innerHTML = CAMPUSES.map(function (c) {
        return '<button type="button" class="chip-option' + (c.id === selectedObCampus ? " is-active" : "") + '" data-ob-campus="' + c.id + '"><b>' + esc(c.name + " · " + c.ar) + "</b><small>" + esc(c.faculty) + "</small></button>";
      }).join("");
    }
    var degrees = $("#obDegreeCards");
    if (degrees) {
      degrees.innerHTML = DEGREES.map(function (d) {
        return '<button type="button" class="degree-option' + (d.id === selectedObDegree ? " is-active" : "") + '" data-ob-degree="' + d.id + '">' +
          '<span class="bento-ic ic-' + d.color + '">' + ic(d.icon) + "</span>" +
          "<div><b>" + esc(d.name) + "</b><small>" + esc(d.it + " · 180 CFU") + "</small></div>" +
          '<span class="check-dot">' + ic("check") + "</span></button>";
      }).join("");
    }
  }

  function showObStep(step) {
    $$(".ob-step").forEach(function (el) {
      el.classList.toggle("is-active", parseInt(el.getAttribute("data-step"), 10) === step);
    });
    $$(".ob-steps span").forEach(function (dot) {
      dot.classList.toggle("is-active", parseInt(dot.getAttribute("data-step-dot"), 10) <= step);
    });
  }

  function finishOnboarding() {
    state.profile.name = (obDraft.name || "").trim();
    state.profile.campus = selectedObCampus;
    state.profile.degree = selectedObDegree;
    state.profile.onboarded = true;
    save();
    closeModal("onboardingModal");
    renderAll();
    confetti();
    awardXP(20, "أهلاً بيك في UniAtlas", "ملفك جاهز — رحلتك بدأت.", 20);
  }

  /* ======================================================================
     COMMAND PALETTE
     ====================================================================== */
  var commandIndex = [];
  var currentCmdResults = [];
  var cmdSelected = 0;

  function renderCommandIndex() {
    commandIndex = [];
    NAV.forEach(function (n) {
      commandIndex.push({ kind: "route", type: "قسم", title: n.label, sub: "انتقل للقسم", icon: n.icon, value: n.route });
    });
    PLACES.forEach(function (p) {
      commandIndex.push({ kind: "place", type: "مكان", title: p.name, sub: p.it + " · " + campusById(p.campus).name, icon: TYPES[p.type].icon, value: p.id });
    });
    DEGREES.forEach(function (d) {
      allCourses(d).forEach(function (item) {
        commandIndex.push({ kind: "course", type: "مادة", title: item.course.name, sub: item.course.it + " · " + d.name, icon: "book", value: item.course.id, degree: d.id });
      });
    });
    PROCEDURES.forEach(function (p) {
      commandIndex.push({ kind: "procedure", type: "إجراء", title: p.title, sub: p.it, icon: p.icon, value: p.id });
    });
    PROFS.forEach(function (p) {
      commandIndex.push({ kind: "prof", type: "بروفيسور", title: p.name, sub: p.course + " · " + campusById(p.campus).name, icon: "messages", value: p.id });
    });
  }

  function openCommand() {
    openModal("commandModal");
    var input = $("#commandInput");
    if (input) { input.value = ""; input.focus(); }
    renderCommandResults("");
  }

  function renderCommandResults(query) {
    var q = (query || "").trim().toLowerCase();
    var list = commandIndex.filter(function (item) {
      if (!q) return item.kind === "route" || item.kind === "procedure" || item.kind === "place";
      return (item.title + " " + item.sub + " " + item.type).toLowerCase().indexOf(q) !== -1;
    });
    if (!q) {
      list = commandIndex.filter(function (item) { return item.kind === "route"; })
        .concat(commandIndex.filter(function (item) { return item.kind === "procedure"; }))
        .concat(commandIndex.filter(function (item) { return item.kind === "place"; }).slice(0, 8));
    }
    currentCmdResults = list.slice(0, 30);
    cmdSelected = 0;
    var results = $("#commandResults");
    if (!results) return;
    if (!currentCmdResults.length) {
      results.innerHTML = '<div class="command-empty">مفيش نتائج لـ «' + esc(query) + '» — جرّب كلمة تانية.</div>';
      return;
    }
    var html = "";
    var lastType = "";
    currentCmdResults.forEach(function (item, i) {
      if (item.type !== lastType) {
        html += '<div class="cmd-group-label">' + esc(item.type) + "</div>";
        lastType = item.type;
      }
      html += '<button class="cmd-item' + (i === 0 ? " is-selected" : "") + '" data-cmd-index="' + i + '">' +
        '<span class="cmd-ic">' + ic(item.icon) + "</span>" +
        "<div><b>" + esc(item.title) + "</b><small>" + esc(item.sub) + "</small></div>" +
        '<span class="cmd-type">' + esc(item.type) + "</span></button>";
    });
    results.innerHTML = html;
  }

  function moveCommandSelection(dir) {
    if (!currentCmdResults.length) return;
    cmdSelected = (cmdSelected + dir + currentCmdResults.length) % currentCmdResults.length;
    $$(".cmd-item", $("#commandResults")).forEach(function (el, i) {
      el.classList.toggle("is-selected", i === cmdSelected);
      if (i === cmdSelected) el.scrollIntoView({ block: "nearest" });
    });
  }

  function runCommand(item) {
    if (!item) return;
    closeModal("commandModal");
    if (item.kind === "route") {
      navigate(item.value);
    } else if (item.kind === "place") {
      var place = placeById(item.value);
      if (place) {
        navigate("map");
        state.activeCampus = place.campus;
        save();
        renderCampusChips();
        renderCampusInfo();
        renderMapList();
        window.setTimeout(function () { focusCampus(place.campus, place.id); }, 180);
      }
    } else if (item.kind === "course") {
      if (state.profile.degree !== item.degree) {
        state.profile.degree = item.degree;
        save();
        renderProfile();
        renderHero();
        renderPlanner();
      }
      navigate("planner");
      window.setTimeout(function () { openCourseModal(item.value); }, 180);
    } else if (item.kind === "procedure") {
      state.selectedProc = item.value;
      save();
      navigate("guide");
      renderGuide();
      window.setTimeout(function () {
        var detail = $("#guideDetail");
        if (detail) detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    } else if (item.kind === "prof") {
      navigate("exams");
      window.setTimeout(function () { openProfModal(item.value); }, 180);
    }
  }

  /* ======================================================================
     MAP
     ====================================================================== */
  var mapInstance = null;
  var mapTileLayer = null;
  var mapLabelLayer = null;
  var mapLabelsOn = false;

  function initMap() {
    var el = $("#leafletMap");
    if (!el) return;
    if (mapInstance) {
      window.setTimeout(function () { mapInstance.invalidateSize(); }, 120);
      return;
    }
    if (typeof window.L === "undefined") {
      var fallback = $("#mapFallback");
      if (fallback) fallback.hidden = false;
      return;
    }
    var fallbackEl = $("#mapFallback");
    if (fallbackEl) fallbackEl.hidden = true;

    mapInstance = window.L.map(el, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      minZoom: 2,
      maxZoom: 19,
      zoomSnap: 0.5
    }).setView([45.68, 9.66], 11.5);

    mapTileLayer = window.L.tileLayer(tileUrl(state.theme), {
      attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> — Esri, DeLorme, NAVTEQ',
      maxZoom: 19,
      maxNativeZoom: 16
    }).addTo(mapInstance);

    mapLabelLayer = window.L.tileLayer(tileLabelUrl(state.theme), {
      maxZoom: 19,
      maxNativeZoom: 16,
      pane: "tilePane"
    }).addTo(mapInstance);

    var campusLayer = window.L.layerGroup().addTo(mapInstance);
    var globalLayer = window.L.layerGroup().addTo(mapInstance);

    CAMPUSES.forEach(function (campus) {
      var icon = window.L.divIcon({
        className: "map-pin-wrap",
        html: '<div class="ub-pin" style="--type:' + campus.color + '">' + ic("grad") + "</div>",
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });
      var marker = window.L.marker(campus.coords, { icon: icon, title: campus.name }).addTo(campusLayer);
      marker.bindPopup(
        '<div class="map-pop"><b>' + esc(campus.name + " — " + campus.ar) + "</b><small>" + esc(campus.faculty + " · " + campus.address) + "</small>" +
        '<div class="pop-meta"><span>' + placesForCampus(campus.id).length + " أماكن</span><span>" + esc(campus.blurb) + "</span></div>" +
        '<button type="button" data-map-campus="' + campus.id + '">اعرض المباني ' + ic("arrow-left") + "</button></div>",
        { maxWidth: 250, closeButton: true }
      );
    });

    PLACES.forEach(function (place) {
      var type = TYPES[place.type];
      var icon = window.L.divIcon({
        className: "map-pin-wrap",
        html: '<div class="ub-pin" style="--type:' + type.color + '">' + ic(type.icon) + "</div>",
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });
      var marker = window.L.marker(place.coords, { icon: icon, title: place.name }).addTo(campusLayer);
      marker.bindPopup(
        '<div class="map-pop"><b>' + esc(place.name) + "</b><small>" + esc(place.it + " · " + campusById(place.campus).name) + "</small>" +
        '<div class="pop-meta"><span>' + esc(type.label) + "</span><span>" + esc(place.room) + "</span><span>" + esc(place.hours) + "</span></div>" +
        '<button type="button" data-map-place-detail="' + place.id + '">التفاصيل ' + ic("arrow-left") + "</button></div>",
        { maxWidth: 250, closeButton: true }
      );
      marker.bindTooltip(esc(place.name), {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "building-tip",
        opacity: 1
      });
    });

    UNIVERSITIES.filter(function (u) { return u.id !== "unibg"; }).forEach(function (uni) {
      var icon = window.L.divIcon({
        className: "map-pin-wrap",
        html: '<div class="ub-global">' + ic("globe") + "</div>",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      var marker = window.L.marker(uni.coords, { icon: icon, title: uni.short + " — " + uni.city }).addTo(globalLayer);
      marker.bindPopup(
        '<div class="map-pop"><b>' + esc(uni.short + " · " + uni.ar) + "</b><small>" + esc(uni.city + " · " + uni.country) + "</small>" +
        '<div class="pop-meta"><span>' + esc(uni.eta || "قريباً على UniAtlas") + "</span></div></div>",
        { maxWidth: 220 }
      );
    });

    var bounds = window.L.latLngBounds(CAMPUSES.map(function (c) { return c.coords; }));
    mapInstance.fitBounds(bounds, { padding: [42, 42], maxZoom: 12 });

    mapInstance.on("zoomend", function () {
      var on = mapInstance.getZoom() >= 15;
      if (on !== mapLabelsOn) {
        mapLabelsOn = on;
        el.classList.toggle("labels-on", on);
      }
    });

    el.addEventListener("click", function (e) {
      var detailBtn = e.target.closest("[data-map-place-detail]");
      if (detailBtn) { openPlaceModal(detailBtn.getAttribute("data-map-place-detail")); return; }
      var campusBtn = e.target.closest("[data-map-campus]");
      if (campusBtn) { focusCampus(campusBtn.getAttribute("data-map-campus")); }
    });

    window.UniBgMap = {
      setTheme: function (theme) {
        if (mapTileLayer) mapTileLayer.setUrl(tileUrl(theme));
        if (mapLabelLayer) mapLabelLayer.setUrl(tileLabelUrl(theme));
      },
      getZoom: function () { return mapInstance ? mapInstance.getZoom() : null; },
      invalidate: function () { if (mapInstance) mapInstance.invalidateSize(); },
      world: function () {
        if (!mapInstance) return;
        mapInstance.flyTo([32, 18], 2.4, { duration: 1.5 });
        window.setTimeout(function () {
          mapInstance.eachLayer(function (layer) {
            if (layer instanceof window.L.Marker && layer.getLatLng && !CAMPUSES.some(function (c) { return c.coords[0] === layer.getLatLng().lat && c.coords[1] === layer.getLatLng().lng; })) {
              // global marker; nothing to do
            }
          });
        }, 100);
      },
      fitBergamo: function () {
        if (!mapInstance) return;
        var b = window.L.latLngBounds(CAMPUSES.map(function (c) { return c.coords; }));
        mapInstance.flyToBounds(b, { padding: [42, 42], maxZoom: 12, duration: 1.2 });
        el.classList.remove("labels-on");
        mapLabelsOn = false;
      },
      locate: function () {
        if (!mapInstance || !navigator.geolocation) {
          toast("الموقع مش متاح", "المتصفح مش بيدعم تحديد الموقع.");
          return;
        }
        toast("بندور على موقعك", "اسمح بالوصول للموقع لو ظهرت رسالة.");
        navigator.geolocation.getCurrentPosition(function (pos) {
          var ll = [pos.coords.latitude, pos.coords.longitude];
          mapInstance.flyTo(ll, 14, { duration: 1.2 });
          window.L.circleMarker(ll, {
            radius: 8, color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.9, weight: 3
          }).addTo(mapInstance).bindPopup("إنت هنا").openPopup();
        }, function () {
          toast("مقدرناش نحدد موقعك", "تأكد من صلاحيات الموقع في المتصفح.");
        }, { timeout: 8000 });
      }
    };

    window.setTimeout(function () {
      mapInstance.invalidateSize();
      var mapView = document.getElementById("view-map");
      if (mapView && !mapView.hidden) {
        var active = campusById(state.activeCampus);
        mapInstance.setView(active.coords, 14.5);
      }
    }, 180);
  }

  function tileUrl(theme) {
    var style = theme === "light" ? "World_Light_Gray_Base" : "World_Dark_Gray_Base";
    return "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/" + style + "/MapServer/tile/{z}/{y}/{x}";
  }

  function tileLabelUrl(theme) {
    var style = theme === "light" ? "World_Light_Gray_Reference" : "World_Dark_Gray_Reference";
    return "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/" + style + "/MapServer/tile/{z}/{y}/{x}";
  }

  function focusCampus(id, placeId) {
    var campus = campusById(id);
    state.activeCampus = id;
    save();
    renderCampusChips();
    renderCampusInfo();
    renderMapList();
    initMap();
    if (mapInstance) {
      mapInstance.flyTo(campus.coords, 16, { duration: 1.15 });
      window.setTimeout(function () {
        if (placeId) {
          var place = placeById(placeId);
          if (place) {
            mapInstance.setView(place.coords, 17, { animate: true });
            mapInstance.eachLayer(function (layer) {
              if (layer instanceof window.L.Marker && layer.getLatLng) {
                var ll = layer.getLatLng();
                if (Math.abs(ll.lat - place.coords[0]) < 0.0001 && Math.abs(ll.lng - place.coords[1]) < 0.0001 && layer.openPopup) {
                  layer.openPopup();
                }
              }
            });
          }
        }
      }, 700);
    }
  }

  function renderCampusChips() {
    var wrap = $("#campusChips");
    if (!wrap) return;
    wrap.innerHTML = CAMPUSES.map(function (c) {
      return '<button type="button" class="campus-chip' + (c.id === state.activeCampus ? " is-active" : "") + '" data-campus="' + c.id + '" role="tab" aria-selected="' + (c.id === state.activeCampus) + '">' +
        "<b>" + esc(c.name) + "</b><small>" + esc(c.faculty) + "</small></button>";
    }).join("");
  }

  function renderCampusInfo() {
    var info = $("#campusInfo");
    if (!info) return;
    var c = campusById(state.activeCampus);
    info.innerHTML = "<b>" + ic("pin") + esc(c.name + " — " + c.ar) + "</b><p>" + esc(c.address) + " · " + esc(c.blurb) + "</p>";
  }

  function renderMapList() {
    var list = $("#mapPlaceList");
    var title = $("#mapListTitle");
    var count = $("#mapListCount");
    if (!list) return;
    var input = $("#mapSearch");
    var q = input ? input.value.trim().toLowerCase() : "";
    var campus = campusById(state.activeCampus);
    var places;
    if (q) {
      places = PLACES.filter(function (p) {
        return (p.name + " " + p.it + " " + TYPES[p.type].label + " " + campusById(p.campus).name).toLowerCase().indexOf(q) !== -1;
      });
    } else {
      places = placesForCampus(state.activeCampus);
    }
    if (title) title.textContent = q ? "نتائج البحث" : "أماكن في " + campus.name;
    if (count) count.textContent = places.length + " مكان";
    if (!places.length) {
      list.innerHTML = '<div class="map-empty">مفيش مكان مطابق. جرّب كلمة تانية.</div>';
      return;
    }
    list.innerHTML = places.map(function (p) {
      var type = TYPES[p.type];
      return '<button type="button" class="map-place-item" data-focus-place="' + p.id + '">' +
        '<span class="mpi-ic" style="--type:' + type.color + ";--type-soft:" + type.soft + '">' + ic(type.icon) + "</span>" +
        '<span class="mpi-copy"><b>' + esc(p.name) + "</b><small>" + esc(campusById(p.campus).name + " · " + type.label + " · " + p.room) + "</small></span>" +
        '<span class="mpi-arrow">' + ic("arrow-left") + "</span></button>";
    }).join("");
  }

  function openPlaceOnMap(id) {
    var place = placeById(id);
    if (!place) return;
    navigate("map");
    state.activeCampus = place.campus;
    save();
    renderCampusChips();
    renderCampusInfo();
    renderMapList();
    window.setTimeout(function () { focusCampus(place.campus, place.id); }, 250);
  }

  /* ======================================================================
     DIRECTORY
     ====================================================================== */
  var favOnly = false;

  function amenity(label, value, iconName) {
    var pct = Math.max(0, Math.min(100, (value / 5) * 100));
    return '<div class="amenity"><span>' + ic(iconName) + esc(label) + "</span><b>" + value + "/5</b><i><em style=\"width:" + pct + '%"></em></i></div>';
  }

  function renderDirectory() {
    var grid = $("#placeGrid");
    if (!grid) return;
    var q = ($("#dirSearch") && $("#dirSearch").value ? $("#dirSearch").value : "").trim().toLowerCase();
    var campusFilter = $("#dirCampus") ? $("#dirCampus").value : "all";
    var typeFilter = $("#dirType") ? $("#dirType").value : "all";

    var list = PLACES.filter(function (p) {
      if (campusFilter !== "all" && p.campus !== campusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (favOnly && state.favorites.indexOf(p.id) === -1) return false;
      if (q) {
        var hay = (p.name + " " + p.it + " " + campusById(p.campus).name + " " + TYPES[p.type].label + " " + p.features.join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      var af = state.favorites.indexOf(a.id) !== -1 ? 1 : 0;
      var bf = state.favorites.indexOf(b.id) !== -1 ? 1 : 0;
      if (af !== bf) return bf - af;
      return b.rating - a.rating;
    });

    var countEl = $("#dirResultCount");
    if (countEl) countEl.textContent = list.length + " مكان" + (favOnly ? " في المفضلة" : "");
    var favCount = $("#favCount");
    if (favCount) favCount.textContent = state.favorites.length;
    var favToggle = $("#favToggle");
    if (favToggle) favToggle.classList.toggle("is-active", favOnly);

    var empty = $("#dirEmpty");
    if (empty) empty.hidden = list.length > 0;
    if (!list.length) { grid.innerHTML = ""; return; }

    grid.innerHTML = list.map(function (p) {
      var type = TYPES[p.type];
      var campus = campusById(p.campus);
      var isFav = state.favorites.indexOf(p.id) !== -1;
      return '<article class="place-card" style="--type:' + type.color + ";--type-soft:" + type.soft + '">' +
        '<div class="pc-top"><span class="pc-ic">' + ic(type.icon) + "</span>" +
        '<button type="button" class="pc-fav' + (isFav ? " is-active" : "") + '" data-fav="' + p.id + '" aria-label="' + (isFav ? "إزالة من المفضلة" : "أضف للمفضلة") + '" aria-pressed="' + isFav + '">' + ic("heart") + "</button></div>" +
        '<span class="pc-type">' + esc(type.label) + "</span>" +
        "<h3>" + esc(p.name) + "</h3>" +
        '<span class="pc-it">' + esc(p.it) + "</span>" +
        '<span class="pc-campus">' + ic("pin") + esc(campus.name + " · " + p.room) + "</span>" +
        '<div class="pc-tags">' + p.features.slice(0, 3).map(function (f) { return "<span>" + esc(f) + "</span>"; }).join("") + "</div>" +
        '<div class="pc-amenities"><span>' + ic("wifi") + " " + p.wifi + "/5</span><span>" + ic("zap") + " " + p.outlets + "/5</span><span>" + ic("armchair") + " " + (6 - p.noise) + '/5</span><span class="pc-rating">' + ic("star") + p.rating.toFixed(1) + "</span></div>" +
        '<div class="pc-foot"><span class="pc-hours">' + ic("clock") + esc(p.hours) + "</span>" +
        '<span class="pc-foot-actions"><button type="button" class="pc-open" data-open-place="' + p.id + '">' + ic("info") + " التفاصيل</button>" +
        '<button type="button" class="pc-open" data-map-place="' + p.id + '" aria-label="افتح على الخريطة">' + ic("pin") + "</button></span></div></article>";
    }).join("");
  }

  function resetDirectory() {
    var s = $("#dirSearch");
    if (s) s.value = "";
    var c = $("#dirCampus");
    if (c) c.value = "all";
    var t = $("#dirType");
    if (t) t.value = "all";
    favOnly = false;
    renderDirectory();
  }

  function toggleFavorite(id) {
    var i = state.favorites.indexOf(id);
    if (i === -1) {
      state.favorites.push(id);
      awardXP(2, "أضفت مكان للمفضلة", placeById(id) ? placeById(id).name : "", 2);
    } else {
      state.favorites.splice(i, 1);
      toast("تمت الإزالة من المفضلة", placeById(id) ? placeById(id).name : "");
    }
    save();
    renderDirectory();
    var modal = document.getElementById("placeModal");
    if (modal && modal.classList.contains("is-open")) openPlaceModal(id, true);
  }

  function openPlaceModal(id, keepOpen) {
    var p = placeById(id);
    if (!p) return;
    var type = TYPES[p.type];
    var campus = campusById(p.campus);
    var isFav = state.favorites.indexOf(p.id) !== -1;
    var body = $("#placeModalBody");
    if (!body) return;
    body.innerHTML =
      '<div class="detail-hero"><span class="bento-ic" style="color:' + type.color + ";background:" + type.soft + '">' + ic(type.icon) + "</span>" +
      '<div><h2 id="placeModalTitle">' + esc(p.name) + "</h2><small>" + esc(p.it) + "</small>" +
      '<p>' + esc(campus.name + " · " + campus.address) + "</p>" +
      '<div class="detail-chips"><span>' + esc(type.label) + "</span><span>" + esc(p.room) + "</span><span>" + esc(p.hours) + "</span><span>" + p.capacity + " شخص</span></div></div></div>" +
      '<div class="detail-section"><h4>ليه تروح هناك؟</h4><p>' + esc(p.tip) + "</p></div>" +
      '<div class="detail-section"><h4>مستوى المكان</h4><div class="amenity-grid">' +
      amenity("قوة الواي فاي", p.wifi, "wifi") +
      amenity("مقابس الكهرباء", p.outlets, "zap") +
      amenity("الهدوء", 6 - p.noise, "armchair") +
      "</div></div>" +
      '<div class="detail-section"><h4>المرافق</h4><div class="detail-chips">' + p.features.map(function (f) { return "<span>" + esc(f) + "</span>"; }).join("") + "</div></div>" +
      '<div class="detail-section"><h4>تقييم الطلاب</h4><div class="place-score">' + ic("star") + "<b>" + p.rating.toFixed(1) + "</b><span>/ 5 · بيانات تجريبية</span></div></div>" +
      '<div class="detail-actions">' +
      '<button type="button" class="btn btn-primary" data-modal-map="' + p.id + '">' + ic("map") + " افتح على الخريطة</button>" +
      '<button type="button" class="btn btn-ghost" data-modal-fav="' + p.id + '">' + ic("heart") + " " + (isFav ? "إزالة من المفضلة" : "أضف للمفضلة") + "</button></div>";
    if (!keepOpen) openModal("placeModal");
  }

  /* ======================================================================
     PLANNER
     ====================================================================== */
  function renderPlanner() {
    var degree = currentDegree();
    var degreeSelect = $("#degreeSelect");
    if (degreeSelect) degreeSelect.value = degree.id;
    var timeline = $("#plannerTimeline");
    if (!timeline) return;

    timeline.innerHTML = degree.years.map(function (year) {
      var yearCfu = year.courses.reduce(function (sum, c) { return sum + c.cfu; }, 0);
      var yearDone = year.courses.reduce(function (sum, c) { return sum + (statusOf(c.id) === "done" ? c.cfu : 0); }, 0);
      var yearPct = yearCfu ? Math.round((yearDone / yearCfu) * 100) : 0;
      return '<div class="year-block"><div class="year-head"><span class="year-num">0' + year.n + "</span>" +
        "<div><h3>" + esc(year.label) + "</h3><small>" + esc(year.sub) + " · " + yearCfu + " CFU</small></div>" +
        '<div class="year-progress"><span>' + yearDone + " / " + yearCfu + ' CFU</span><div class="bar"><i style="width:' + yearPct + '%"></i></div></div></div>' +
        '<div class="course-list">' + year.courses.map(function (c) {
          var status = statusOf(c.id);
          var statusIcon = status === "done" ? ic("check") : status === "progress" ? ic("clock") : "";
          var prereq = c.prereq.length ? '<span class="prereq-chip">' + ic("lock") + " " + esc(courseNameById(degree, c.prereq[0])) + (c.prereq.length > 1 ? " +" + (c.prereq.length - 1) : "") + "</span>" : "";
          return '<div class="course-row" data-course-row="' + c.id + '" data-status="' + status + '" role="button" tabindex="0" aria-label="' + esc(c.name) + '">' +
            '<button type="button" class="course-status" data-cycle-course="' + c.id + '" aria-label="تغيير حالة ' + esc(c.name) + '">' + statusIcon + "</button>" +
            '<span class="course-name"><b>' + esc(c.name) + "</b><small>" + esc(c.it) + "</small></span>" +
            '<div class="course-meta">' + prereq + '<span class="cfu-chip">' + c.cfu + ' CFU</span><span class="sem-chip">ف' + c.sem + "</span></div>" +
            '<span class="course-open">' + ic("chevron-left") + "</span></div>";
        }).join("") + "</div></div>";
    }).join("");

    var done = cfuDone();
    var pct = progressPercent();
    var ring = $("#plannerRing");
    if (ring) ring.style.setProperty("--p", pct);
    var percentEl = $("#plannerPercent");
    if (percentEl) percentEl.textContent = pct + "%";
    var cfuEl = $("#plannerCfu");
    if (cfuEl) cfuEl.textContent = done;
    var remainEl = $("#plannerRemaining");
    if (remainEl) remainEl.textContent = Math.max(0, degree.total - done);
    var doneEl = $("#plannerDone");
    if (doneEl) doneEl.textContent = coursesDone();
    renderNextCourse();
    updateGpa();
    renderHero();
    renderProfile();
  }

  function renderNextCourse() {
    var degree = currentDegree();
    var items = allCourses(degree);
    var next = null;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (statusOf(item.course.id) === "done") continue;
      var ready = item.course.prereq.every(function (p) { return statusOf(p) === "done"; });
      if (ready) { next = item; break; }
      if (!next) next = item;
    }
    var body = $("#nextCourseBody");
    if (!body) return;
    if (!next) {
      body.innerHTML = '<b>مبروك! خلّصت كل المواد 🎉</b><p>وقت الاحتفال… وبعدها حدّث تخصصك أو شارك تجربتك مع الطلاب.</p>';
      return;
    }
    var prereqText = next.course.prereq.length
      ? "المتطلبات: " + next.course.prereq.map(function (p) { return courseNameById(degree, p); }).join(" + ")
      : "مفيش متطلبات سابقة — تقدر تبدأ فوراً.";
    body.innerHTML = '<small>السنة ' + next.year + " · الفصل " + next.course.sem + " · " + next.course.cfu + " CFU</small>" +
      "<b>" + esc(next.course.name) + "</b><p>" + esc(prereqText) + "</p>" +
      '<button type="button" class="btn btn-primary btn-sm" data-open-course="' + next.course.id + '">افتح المادة ' + ic("arrow-left") + "</button>";
  }

  function cycleCourse(id) {
    var current = statusOf(id);
    var next = current === "todo" ? "progress" : current === "progress" ? "done" : "todo";
    state.courseStatus[id] = next;
    save();
    if (next === "done" && state.courseAwards.indexOf(id) === -1) {
      state.courseAwards.push(id);
      save();
      var course = courseById(currentDegree(), id);
      awardXP(15, "مادة مكتملة: " + (course ? course.name : ""), "تقدمك الأكاديمي اتحدّث.", 15);
      var degree = currentDegree();
      if (coursesDone() === allCourses(degree).length) confetti();
    } else if (next === "progress") {
      toast("بدأت المادة", "هنفكرك تعلّمها كمكتملة لما تخلص.");
    } else if (next === "todo") {
      toast("رجعت لحالة «لم تبدأ»", "مفيش مشكلة — التنظيم بيبدأ من جديد.");
    }
    renderPlanner();
    renderHero();
    var modal = document.getElementById("courseModal");
    if (modal && modal.classList.contains("is-open")) openCourseModal(id, true);
  }

  function updateGpa() {
    var avg = $("#avgRange") ? parseFloat($("#avgRange").value) : 26;
    var thesis = $("#thesisRange") ? parseFloat($("#thesisRange").value) : 4;
    var outAvg = $("#avgOut");
    if (outAvg) outAvg.textContent = avg;
    var outThesis = $("#thesisOut");
    if (outThesis) outThesis.textContent = thesis;
    var grade = Math.min(110, Math.round((avg / 30) * 110 + thesis));
    var value = $("#gpaValue");
    if (value) {
      value.textContent = grade >= 110 ? "110" : grade;
      value.title = grade >= 110 ? "110 e Lode" : "";
    }
  }

  function mindmapHTML(course) {
    var concepts = (course.concepts || []).slice(0, 6);
    if (!concepts.length) concepts = ["المفاهيم الأساسية", "التطبيقات", "المراجعة"];
    var n = concepts.length;
    var nodes = concepts.map(function (concept, i) {
      var angle = (-90 + (360 / n) * i) * Math.PI / 180;
      var x = 50 + Math.cos(angle) * 37;
      var y = 50 + Math.sin(angle) * 35;
      return { text: concept, x: x, y: y };
    });
    var lines = nodes.map(function (node) {
      return '<line x1="50" y1="50" x2="' + node.x.toFixed(2) + '" y2="' + node.y.toFixed(2) + '"></line>';
    }).join("");
    var nodeHTML = nodes.map(function (node, i) {
      return '<span class="mm-node" style="left:' + node.x.toFixed(2) + "%;top:" + node.y.toFixed(2) + "%;animation-delay:" + (i * 0.08) + 's">' + esc(node.text) + "</span>";
    }).join("");
    return '<div class="mindmap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + lines + "</svg>" +
      '<span class="mm-node center" style="left:50%;top:50%;animation-delay:0s">' + esc(course.name) + "</span>" + nodeHTML +
      '<span class="mindmap-hint">خريطة مفاهيم مبسطة — ابدأ من المركز واربط كل فرع بمثال.</span></div>';
  }

  function openCourseModal(id, keepOpen) {
    var degree = currentDegree();
    var course = courseById(degree, id);
    if (!course) return;
    var itemYear = 1;
    allCourses(degree).forEach(function (it) { if (it.course.id === id) itemYear = it.year; });
    var status = statusOf(id);
    var statusLabel = status === "done" ? "مكتملة" : status === "progress" ? "بتدرسها" : "لم تبدأ";
    var statusClass = status === "done" ? "ic-lime" : status === "progress" ? "ic-coral" : "ic-violet";
    var prereqHTML = course.prereq.length
      ? '<div class="prereq-note">' + ic("lock") + "<span>قبلها: " + course.prereq.map(function (p) { return esc(courseNameById(degree, p)); }).join(" · ") + "</span></div>"
      : "";
    var tips = course.tips && course.tips.length ? course.tips : [
      "اقرأ عناوين المحاضرات قبل الحصة — 10 دقائق بتفرق.",
      "لخّص كل مفهوم في 3 جمل واشرحه بصوت عالٍ.",
      "حل أسئلة سنوات سابقة، وركّز على الأخطاء المتكررة."
    ];
    var body = $("#courseModalBody");
    if (!body) return;
    body.innerHTML =
      '<div class="detail-hero"><span class="bento-ic ' + statusClass + '">' + ic("book") + "</span>" +
      '<div><h2 id="courseModalTitle">' + esc(course.name) + "</h2><small>" + esc(course.it) + "</small>" +
      "<p>" + esc(course.desc) + "</p>" +
      '<div class="detail-chips"><span>السنة ' + itemYear + "</span><span>الفصل " + course.sem + "</span><span>" + course.cfu + " CFU</span><span>" + esc(course.exam) + "</span><span>" + esc(statusLabel) + "</span></div></div></div>" +
      '<div class="detail-tabs"><button type="button" class="detail-tab is-active" data-detail-tab="overview">نظرة عامة</button><button type="button" class="detail-tab" data-detail-tab="mindmap">الخريطة الذهنية</button><button type="button" class="detail-tab" data-detail-tab="tips">نصائح المراجعة</button></div>' +
      '<div class="detail-pane is-active" data-pane="overview">' +
      (prereqHTML ? '<div class="detail-section"><h4>المتطلبات السابقة</h4>' + prereqHTML + "</div>" : "") +
      '<div class="detail-section"><h4>هتتعلم إيه؟</h4><ul class="detail-list">' + (course.concepts || []).map(function (c) { return "<li>" + ic("check") + esc(c) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="detail-section"><h4>شكل الامتحان</h4><p>' + esc(course.exam) + " — راجع وصف المادة الرسمي للتأكد من التفاصيل.</p></div></div>" +
      '<div class="detail-pane" data-pane="mindmap"><div class="detail-section"><h4>اربط الأفكار</h4>' + mindmapHTML(course) + "</div></div>" +
      '<div class="detail-pane" data-pane="tips"><div class="detail-section"><h4>خطة سريعة</h4><ul class="detail-list">' + tips.map(function (t) { return "<li>" + ic("sparkles") + esc(t) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="detail-section"><h4>قبل الامتحان بـ 48 ساعة</h4><ul class="detail-list"><li>' + ic("clock") + "راجع الخريطة الذهنية مرة واحدة، بدون فتح الكتاب.</li><li>" + ic("target") + "حل سؤال شفهي بصوت عالٍ كأنك قدام اللجنة.</li><li>" + ic("heart") + "نام كفاية — الذاكرة بتثبت أثناء النوم.</li></ul></div></div>" +
      '<div class="detail-actions"><button type="button" class="btn btn-primary" data-modal-cycle="' + course.id + '">' + ic(status === "done" ? "refresh" : "check") + " " + (status === "done" ? "إرجاعها لغير مكتملة" : status === "progress" ? "علّمها كمكتملة" : "ابدأ المادة") + "</button>" +
      '<span class="status-note">الحالة: ' + esc(statusLabel) + " · بتتحفظ تلقائياً</span></div>";
    if (!keepOpen) openModal("courseModal");
  }

  /* ======================================================================
     GUIDE
     ====================================================================== */
  function renderGuide() {
    var selected = null;
    PROCEDURES.forEach(function (p) { if (p.id === state.selectedProc) selected = p; });
    if (!selected) selected = PROCEDURES[0];
    state.selectedProc = selected.id;

    var overall = overallGuidePercent();
    var completed = completedProcedures();
    var title = $("#guideOverviewTitle");
    if (title) title.textContent = completed + " من " + PROCEDURES.length + " إجراءات مكتملة";
    var text = $("#guideOverviewText");
    if (text) {
      text.textContent = completed === 0
        ? "ابدأ بـ Codice Fiscale، وبعده ISEE… خطوة واحدة كل يوم وهتخلص."
        : completed === PROCEDURES.length
          ? "كل الإجراءات خلصت! احتفظ بالنسخ الرقمية وحدّثها قبل كل سنة دراسية."
          : "كمّل الخطوات الناقصة — كل خطوة بتقرّبك من يوم أخف.";
    }
    var bar = $("#guideBar");
    if (bar) bar.style.width = overall + "%";
    var pct = $("#guidePercent");
    if (pct) pct.textContent = overall + "%";

    var grid = $("#procedureGrid");
    if (grid) {
      grid.innerHTML = PROCEDURES.map(function (p) {
        var pp = procPercent(p);
        var done = procDoneCount(p) === p.steps.length;
        return '<button type="button" class="procedure-card' + (p.id === selected.id ? " is-active" : "") + '" data-proc="' + p.id + '" style="--proc:' + p.color + ";--proc-soft:" + p.soft + '">' +
          '<span class="proc-top"><span class="proc-ic">' + ic(p.icon) + "</span>" + (done ? '<span class="proc-done">' + ic("check") + " مكتمل</span>" : '<span class="tag">' + esc(p.tag) + "</span>") + "</span>" +
          "<h3>" + esc(p.title) + '</h3><span class="proc-it">' + esc(p.it) + "</span>" +
          '<span class="proc-meta"><span>' + ic("clock") + esc(p.duration) + "</span><span>" + ic("wallet") + esc(p.cost) + "</span></span>" +
          '<span class="proc-bar"><i style="width:' + pp + '%"></i></span>' +
          '<span class="proc-foot"><span>' + procDoneCount(p) + " / " + p.steps.length + " خطوة</span><span>" + pp + "% " + ic("chevron-left") + "</span></span></button>";
      }).join("");
    }
    renderGuideDetail(selected);
  }

  function renderGuideDetail(proc) {
    var head = $("#guideDetailHead");
    var steps = $("#guideSteps");
    var docs = $("#guideDocs");
    if (!head || !steps || !docs) return;
    var checks = procChecks(proc);
    head.innerHTML = '<span class="gdh-ic" style="--proc:' + proc.color + ";--proc-soft:" + proc.soft + '">' + ic(proc.icon) + "</span>" +
      '<div class="gdh-copy"><h3>' + esc(proc.title) + "</h3><p>" + esc(proc.desc) + "</p></div>" +
      '<div class="gdh-links">' + proc.links.map(function (l) {
        return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + ic("external") + "</a>";
      }).join("") + "</div>";
    steps.innerHTML = proc.steps.map(function (step, i) {
      return '<div class="guide-step' + (checks[i] ? " is-done" : "") + '" data-proc-step="' + i + '" role="button" tabindex="0">' +
        '<span class="gs-check">' + ic("check") + "<span>" + (i + 1) + "</span></span>" +
        '<span class="gs-copy"><b>' + esc(step.t) + "</b><p>" + esc(step.d) + "</p>" +
        (step.tip ? '<span class="gs-tip">' + ic("sparkles") + esc(step.tip) + "</span>" : "") + "</span>" +
        '<span class="gs-toggle">' + ic("check") + "</span></div>";
    }).join("");
    docs.innerHTML = "<span>المستندات المطلوبة:</span>" + proc.docs.map(function (d) {
      return '<span class="doc-chip">' + ic("check") + esc(d) + "</span>";
    }).join("");
  }

  function toggleProcStep(index) {
    var proc = null;
    PROCEDURES.forEach(function (p) { if (p.id === state.selectedProc) proc = p; });
    if (!proc || isNaN(index) || !proc.steps[index]) return;
    var arr = procChecks(proc);
    var wasDone = arr[index];
    arr[index] = !arr[index];
    state.procChecks[proc.id] = arr;
    save();
    if (!wasDone) {
      var nowComplete = arr.every(Boolean);
      state.procAwards = Array.isArray(state.procAwards) ? state.procAwards : [];
      if (nowComplete && state.procAwards.indexOf(proc.id) === -1) {
        state.procAwards.push(proc.id);
        save();
        awardXP(15, "إجراء مكتمل: " + proc.title, "خطوة كبيرة خلصت.", 15);
        confetti();
      } else {
        awardXP(3, "خطوة مكتملة", proc.steps[index].t, 3);
      }
    }
    renderGuide();
    var detail = $("#guideDetail");
    if (detail) detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  var activeEmail = "prof";

  function renderEmails() {
    var tabs = $("#emailTabs");
    var note = $("#emailNote");
    var text = $("#emailText");
    var email = null;
    EMAILS.forEach(function (e) { if (e.id === activeEmail) email = e; });
    if (!email) email = EMAILS[0];
    if (tabs) {
      tabs.innerHTML = EMAILS.map(function (e) {
        return '<button type="button" class="email-tab' + (e.id === activeEmail ? " is-active" : "") + '" data-email="' + e.id + '">' + esc(e.label) + "</button>";
      }).join("");
    }
    if (note) note.textContent = email.note;
    if (text) text.textContent = email.text;
  }

  function copyEmailText() {
    var text = $("#emailText");
    if (!text) return;
    var value = text.textContent || "";
    function done() { toast("تم نسخ الإيميل", "الصقه في بريدك وعدّل البيانات بين الأقواس.", 2); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(fallback);
    } else fallback();
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done();
      } catch (e) {
        toast("النسخ مش متاح", "حدد النص وانسخه يدوياً.");
      }
    }
  }

  function renderFaqs() {
    var list = $("#faqList");
    if (!list) return;
    list.innerHTML = FAQS.map(function (f, i) {
      return '<div class="faq-item"><button type="button" class="faq-q" data-faq="' + i + '" aria-expanded="false">' + esc(f.q) + ic("chevron-down") + '</button><div class="faq-a"><div><p>' + esc(f.a) + "</p></div></div></div>";
    }).join("");
  }

  /* ======================================================================
     EXAMS
     ====================================================================== */
  var examSortByRating = true;

  function renderProfs() {
    var grid = $("#profGrid");
    if (!grid) return;
    var q = ($("#examSearch") && $("#examSearch").value ? $("#examSearch").value : "").trim().toLowerCase();
    var campusFilter = $("#examCampus") ? $("#examCampus").value : "all";
    var list = PROFS.filter(function (p) {
      if (campusFilter !== "all" && p.campus !== campusFilter) return false;
      if (q) {
        var hay = (p.name + " " + p.course + " " + p.tags.join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      return examSortByRating ? b.rating - a.rating : b.difficulty - a.difficulty;
    });
    var count = $("#examResultCount");
    if (count) count.textContent = list.length + " مادة";
    grid.innerHTML = list.map(function (p) {
      var campus = campusById(p.campus);
      var stars = "";
      for (var i = 1; i <= 5; i++) stars += '<i class="' + (i <= p.difficulty ? "on" : "") + '"></i>';
      var userRating = state.ratings[p.id];
      return '<article class="prof-card" data-prof="' + p.id + '" role="button" tabindex="0">' +
        '<div class="prof-top"><span class="prof-avatar">' + esc(p.name.replace("Prof.ssa ", "").replace("Prof. ", "").charAt(0)) + "</span>" +
        '<div class="prof-id"><h3>' + esc(p.name) + "</h3><small>" + esc(p.course) + " · " + esc(campus.name) + "</small></div>" +
        '<span class="prof-rating">' + ic("star") + p.rating.toFixed(1) + "</span></div>" +
        '<span class="prof-course">' + ic("book") + esc(p.course) + "</span>" +
        '<div class="prof-meta"><span>' + ic("messages") + p.questions.length + " أسئلة</span><span>" + ic("download") + p.notes + " ملخص</span>" +
        '<span class="difficulty" title="صعوبة ' + p.difficulty + '/5">' + stars + "</span></div>" +
        '<div class="prof-tags">' + p.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
        '<div class="prof-foot"><span class="q-count">' + ic("messages") + (userRating ? "تقييمك " + userRating + "/5" : p.votes + " تقييم") + "</span>" +
        '<span class="btn btn-ghost btn-sm">شوف الأسئلة ' + ic("arrow-left") + "</span></div></article>";
    }).join("");
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-ic">' + ic("search") + "</span><h3>مفيش مادة مطابقة</h3><p>جرّب اسم تاني أو غيّر المقر.</p></div>";
    }
    renderContributions();
  }

  function openProfModal(id, keepOpen) {
    var p = null;
    PROFS.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    var body = $("#profModalBody");
    if (!body) return;
    var campus = campusById(p.campus);
    var userRating = state.ratings[p.id] || 0;
    body.innerHTML =
      '<div class="prof-modal-head"><span class="prof-avatar">' + esc(p.name.replace("Prof.ssa ", "").replace("Prof. ", "").charAt(0)) + "</span>" +
      '<div><h2 id="profModalTitle">' + esc(p.name) + "</h2><small>" + esc(p.course + " · " + campus.name) + "</small></div>" +
      '<span class="prof-rating" style="margin-inline-start:auto">' + ic("star") + p.rating.toFixed(1) + "</span></div>" +
      '<div class="detail-chips" style="margin-bottom:14px"><span>' + esc(p.course) + "</span><span>صعوبة " + p.difficulty + "/5</span><span>" + p.notes + " ملخص</span><span>" + p.votes + " تقييم</span></div>" +
      '<div class="detail-section"><h4>أسلوب الامتحان</h4><p>' + esc(p.style) + "</p></div>" +
      '<div class="detail-section"><h4>أسئلة شفهية متكررة</h4><div class="question-list">' + p.questions.map(function (q, i) {
        return '<div class="question-item"><span class="q-num">' + (i + 1) + '</span><span class="q-text">' + esc(q) + "</span></div>";
      }).join("") + "</div></div>" +
      '<div class="rating-row"><span>قيّم تجربتك:</span><div class="rating-stars">' + [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" class="' + (n <= userRating ? "on" : "") + '" data-rate="' + p.id + ":" + n + '" aria-label="' + n + ' من 5">' + ic("star") + "</button>";
      }).join("") + "</div></div>" +
      '<div class="detail-actions"><button type="button" class="btn btn-primary" data-download-notes="' + p.id + '">' + ic("download") + " حمّل ملخص الأسئلة</button>" +
      '<button type="button" class="btn btn-ghost" data-prefill-contrib="' + esc(p.course) + '">' + ic("plus") + " شارك سؤالاً</button></div>";
    if (!keepOpen) openModal("profModal");
  }

  function downloadNotes(id) {
    var p = null;
    PROFS.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    var lines = ["UniAtlas — " + p.course, p.name, "أسلوب الامتحان: " + p.style, "", "الأسئلة الشفهية:"];
    p.questions.forEach(function (q, i) { lines.push((i + 1) + ". " + q); });
    lines.push("", "ملاحظة: بيانات تجريبية للعرض — تحقق من المصادر الرسمية.");
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "unibg-" + p.course.replace(/\s+/g, "-").toLowerCase() + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("تم تحميل الملخص", "ملف نصي فيه الأسئلة وأسلوب الامتحان.", 5);
  }

  function rateProf(id, stars) {
    var first = !state.ratings[id];
    state.ratings[id] = stars;
    save();
    if (first) awardXP(3, "شكراً لتقييمك", "رأيك بيساعد الطلاب الجدد.", 3);
    else toast("تم تحديث تقييمك", stars + " من 5");
    renderProfs();
    var modal = document.getElementById("profModal");
    if (modal && modal.classList.contains("is-open")) openProfModal(id, true);
  }

  var flashIndex = 0;

  function renderFlashcard() {
    var card = FLASHCARDS[flashIndex % FLASHCARDS.length];
    var q = $("#fcQuestion");
    var a = $("#fcAnswer");
    var idx = $("#fcIndex");
    if (q) { q.textContent = card.q; q.setAttribute("dir", "ltr"); q.setAttribute("lang", "it"); }
    if (a) a.textContent = card.a;
    if (idx) idx.textContent = (flashIndex + 1) + " / " + FLASHCARDS.length;
    var fc = $("#flashcard");
    if (fc) fc.classList.remove("is-flipped");
  }

  function changeFlashcard(dir) {
    flashIndex = (flashIndex + dir + FLASHCARDS.length) % FLASHCARDS.length;
    renderFlashcard();
  }

  function submitContribution() {
    var course = $("#contribCourse");
    var question = $("#contribQuestion");
    var name = $("#contribName");
    var campus = $("#contribCampus");
    if (!course || !question || !course.value.trim() || !question.value.trim()) {
      toast("ناقص بيانات", "اكتب المادة والسؤال الأول.");
      return;
    }
    state.contributions.unshift({
      course: course.value.trim(),
      question: question.value.trim(),
      name: name && name.value.trim() ? name.value.trim() : "طالب مجهول",
      campus: campus ? campus.value : "dalmine",
      date: new Date().toISOString()
    });
    save();
    course.value = "";
    question.value = "";
    if (name) name.value = "";
    awardXP(20, "شكراً لمشاركتك", "السؤال اتحفظ محلياً في نسخة العرض.", 20);
    renderContributions();
  }

  function renderContributions() {
    var card = $(".contribute-card");
    if (!card) return;
    var box = $("#yourContribs");
    if (!box) {
      box = document.createElement("div");
      box.id = "yourContribs";
      box.className = "your-contribs";
      card.appendChild(box);
    }
    if (!state.contributions.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = '<h4>مساهماتك (' + state.contributions.length + ")</h4>" + state.contributions.slice(0, 3).map(function (c) {
      return '<div class="contrib-item"><b>' + esc(c.course) + "</b><p>" + esc(c.question) + "</p><small>" + esc(c.name) + " · " + esc(campusById(c.campus).name) + "</small></div>";
    }).join("");
  }

  /* ======================================================================
     COMMUNITY
     ====================================================================== */
  var communityGroupFilter = "all";
  var communityGroupQuery = "";
  var communityEventFilter = "all";
  var communityPostFilter = "all";
  var communityStoryFilter = "all";
  var openPostComments = {};

  function countLabel(n, one, few, many) {
    if (n === 1) return one;
    if (n >= 2 && n <= 10) return few;
    return many;
  }

  function spotsLabel(n) {
    if (n <= 0) return "المجموعة مكتملة";
    if (n === 1) return "مكان واحد متبقي";
    if (n === 2) return "مكانين متبقيين";
    if (n <= 10) return n + " أماكن متبقية";
    return "باقي " + n + " مكان";
  }

  function allGroups() {
    return state.customGroups.concat(GROUPS);
  }

  function allPosts() {
    return state.communityPosts.concat(COMMUNITY_POSTS);
  }

  function allStories() {
    return state.communityStories.concat(STORIES);
  }

  function commentsForPost(id) {
    var seed = POST_COMMENTS[id] || [];
    var custom = state.postComments[id] || [];
    return seed.concat(custom);
  }

  function groupMemberCount(group, joined) {
    var base = Math.max(0, parseInt(group.members, 10) || 0);
    return base + (joined && !group.custom ? 1 : 0);
  }

  function groupCategory(category) {
    return GROUP_CATEGORIES[category] || GROUP_CATEGORIES.study;
  }

  function eventCategory(category) {
    return EVENT_CATEGORIES[category] || EVENT_CATEGORIES.social;
  }

  function whenLabel(date) {
    var n = daysUntil(date);
    if (n === 0) return "النهارده";
    if (n === 1) return "بكرة";
    if (n === 2) return "بعد بكرة";
    if (n < 7) return "بعد " + n + " أيام";
    var weeks = Math.round(n / 7);
    if (weeks === 1) return "بعد أسبوع";
    if (weeks === 2) return "بعد أسبوعين";
    return "بعد " + weeks + " أسابيع";
  }

  function relativeTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return "الآن";
    var mins = Math.floor(Math.max(0, Date.now() - then) / 60000);
    if (mins < 1) return "دلوقتي";
    if (mins === 1) return "من دقيقة";
    if (mins === 2) return "من دقيقتين";
    if (mins < 60) return "من " + mins + " " + (mins <= 10 ? "دقائق" : "دقيقة");
    var hours = Math.floor(mins / 60);
    if (hours === 1) return "من ساعة";
    if (hours === 2) return "من ساعتين";
    if (hours < 24) return "من " + hours + " " + (hours <= 10 ? "ساعات" : "ساعة");
    var days = Math.floor(hours / 24);
    if (days === 1) return "من يوم";
    if (days === 2) return "من يومين";
    return "من " + days + " " + (days <= 10 ? "أيام" : "يوم");
  }

  function renderCommunity() {
    renderCommunityStats();
    renderGroups();
    renderEvents();
    renderPosts();
    renderStories();
    renderDeals();
    renderTransport();
    renderLife();
    renderQuotes();
    renderBoardAvatar();
    updatePostCount();
  }

  function renderCommunityStats() {
    var groups = allGroups();
    var members = groups.reduce(function (sum, g) {
      return sum + groupMemberCount(g, state.joined.indexOf(g.id) !== -1);
    }, 0);
    var set = function (sel, value) {
      var el = $(sel);
      if (el) el.textContent = value;
    };
    set("#communityGroupCount", groups.length);
    set("#communityEventCount", EVENTS.length);
    set("#communityMemberCount", members);
    set("#communityDealCount", DEALS.length);
    set("#heroMembers", "+" + members);
    set("#heroPosts", countLabel(allPosts().length, "منشور", "منشورات", "منشور"));
    var next = EVENTS[0];
    if (next) {
      set("#heroEventDay", next.date.getDate());
      set("#heroEventMonth", MONTHS_AR[next.date.getMonth()]);
      set("#heroEventTitle", next.title);
      set("#heroEventMeta", next.place + " · " + next.time);
    }
  }

  function renderGroups() {
    var grid = $("#groupGrid");
    if (!grid) return;
    var all = allGroups();
    var q = communityGroupQuery.trim().toLowerCase();
    var filtered = all.filter(function (g) {
      var joined = state.joined.indexOf(g.id) !== -1;
      if (communityGroupFilter === "mine" && !joined) return false;
      if (communityGroupFilter !== "all" && communityGroupFilter !== "mine" && g.category !== communityGroupFilter) return false;
      if (!q) return true;
      var hay = [g.course, g.campus, g.place, g.desc || "", (g.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    grid.innerHTML = filtered.map(function (g) {
      var joined = state.joined.indexOf(g.id) !== -1;
      var max = Math.max(1, parseInt(g.max, 10) || 10);
      var count = groupMemberCount(g, joined);
      var full = count >= max;
      var cat = groupCategory(g.category);
      var avatars = (g.avatars && g.avatars.length ? g.avatars : [profileInitial()]).slice(0, 4);
      var extra = Math.max(0, count - avatars.length);
      var pct = Math.min(100, Math.round((count / max) * 100));
      var tags = (g.tags || []).slice(0, 3).map(function (t) {
        return '<span class="group-tag">' + esc(t) + "</span>";
      }).join("");
      return '<article class="group-card' + (g.custom ? " is-custom" : "") + '" style="--group-soft:' + (g.soft || cat.soft) + ';--group-color:' + (g.color || cat.color) + '">' +
        '<div class="group-top"><span class="group-cat" style="--gc:' + cat.color + ";--gc-soft:" + cat.soft + '">' + ic(cat.icon) + esc(cat.label) + "</span>" +
        (joined ? '<span class="tag tag-live"><i></i> منضم</span>' : (g.custom ? '<span class="tag tag-custom">مجموعتك</span>' : "")) + "</div>" +
        "<h3>" + esc(g.course) + "</h3>" +
        (g.desc ? '<p class="group-desc">' + esc(g.desc) + "</p>" : "") +
        (tags ? '<div class="group-tags">' + tags + "</div>" : "") +
        '<div class="group-meta"><span>' + ic("pin") + esc(g.campus) + "</span><span>" + ic("users") + '<bdi dir="ltr">' + count + " / " + max + "</bdi> عضو</span></div>" +
        '<div class="group-people">' + avatars.map(function (a, i) {
          return '<span class="avatar avatar-xs" style="--a:' + ["#7c5cff", "#22d3ee", "#c6ff5e", "#ff7a59"][i % 4] + '">' + esc(a) + "</span>";
        }).join("") + (extra ? "<small>" + (extra === 1 ? "وشخص آخر" : "و" + extra + " آخرين") + "</small>" : "") + "</div>" +
        '<div class="group-cap" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
        '<div class="group-next">' + ic("calendar") + esc(g.next) + " · " + esc(g.place) + "</div>" +
        '<div class="group-foot"><span class="spots">' + esc(spotsLabel(max - count)) + "</span>" +
        '<button type="button" class="join-btn' + (joined ? " is-joined" : "") + '" data-join="' + esc(g.id) + '"' + (full && !joined ? " disabled" : "") + ">" + ic(joined ? "check" : "plus") + (joined ? " منضم" : (full ? " مكتمل" : " انضم")) + "</button></div></article>";
    }).join("");
    var countEl = $("#groupCount");
    if (countEl) {
      var joinedCount = all.filter(function (g) { return state.joined.indexOf(g.id) !== -1; }).length;
      countEl.textContent = filtered.length + " " + countLabel(filtered.length, "مجموعة", "مجموعات", "مجموعة") + (joinedCount ? " · " + joinedCount + " منضم" : "");
    }
    var empty = $("#groupEmpty");
    if (empty) {
      empty.hidden = filtered.length > 0;
      if (!filtered.length) {
        var title = communityGroupFilter === "mine" ? "لسه مش منضم لمجموعة" : (q ? "مفيش نتائج للبحث ده" : "مفيش مجموعات في التصنيف ده");
        var sub = communityGroupFilter === "mine" ? "اختار مجموعة مناسبة وابدأ بسلام." : "جرّب كلمة تانية أو شوف كل المجموعات.";
        empty.innerHTML = '<span class="empty-ic">' + ic("users") + "</span><h3>" + esc(title) + "</h3><p>" + esc(sub) + '</p><button type="button" class="btn btn-ghost btn-sm" data-group-reset><svg class="i"><use href="#i-refresh"/></svg> شوف كل المجموعات</button>';
      }
    }
    $$("#groupFilters [data-group-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-group-filter") === communityGroupFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function toggleJoin(id) {
    var i = state.joined.indexOf(id);
    if (i === -1) {
      state.joined.push(id);
      save();
      awardXP(5, "انضممت لمجموعة", "مجموعة المذاكرة بقت أقرب.");
    } else {
      state.joined.splice(i, 1);
      save();
      toast("خرجت من المجموعة", "تقدر ترجع في أي وقت.");
    }
    renderGroups();
    renderCommunityStats();
  }

  function seatsLabel(n) {
    if (n <= 0) return "مكتمل";
    if (n === 1) return "باقي مقعد واحد";
    if (n === 2) return "باقي مقعدين";
    if (n <= 10) return "باقي " + n + " مقاعد";
    return "باقي " + n + " مقعد";
  }

  function renderEvents() {
    var grid = $("#eventGrid");
    if (!grid) return;
    var filtered = EVENTS.filter(function (ev) {
      return communityEventFilter === "all" || ev.category === communityEventFilter;
    });
    grid.innerHTML = filtered.map(function (ev) {
      var rsvp = state.rsvps.indexOf(ev.id) !== -1;
      var capacity = Math.max(1, parseInt(ev.capacity, 10) || 1);
      var attendees = Math.max(0, parseInt(ev.attendees, 10) || 0);
      var count = attendees + (rsvp ? 1 : 0);
      var seats = Math.max(0, capacity - count);
      var full = seats === 0 && !rsvp;
      var cat = eventCategory(ev.category);
      var pct = Math.min(100, Math.round((count / capacity) * 100));
      return '<article class="event-card" style="--ev:' + (ev.color || cat.color) + ";--ev-soft:" + (ev.soft || cat.soft) + '">' +
        '<div class="event-top"><div class="event-date"><b>' + ev.date.getDate() + "</b><small>" + esc(MONTHS_AR[ev.date.getMonth()]) + "</small></div>" +
        '<div class="event-top-meta"><span class="event-cat" style="--ec:' + cat.color + ";--ec-soft:" + cat.soft + '">' + ic(cat.icon) + esc(cat.label) + '</span><span class="event-when">' + esc(whenLabel(ev.date)) + "</span></div></div>" +
        "<h3>" + esc(ev.title) + "</h3><p>" + esc(ev.desc) + "</p>" +
        '<div class="event-meta"><span>' + ic("pin") + esc(ev.place) + "</span><span>" + ic("clock") + '<bdi dir="ltr">' + esc(ev.time) + "</bdi></span></div>" +
        '<div class="event-seats"><div class="event-seats-copy"><span>' + seatsLabel(seats) + '</span><small><bdi dir="ltr">' + count + " / " + capacity + "</bdi> مسجل</small></div><div class=\"event-cap\" aria-hidden=\"true\"><span style=\"width:" + pct + '%"></span></div></div>' +
        '<div class="event-foot"><button type="button" class="join-btn' + (rsvp ? " is-joined" : "") + '" data-rsvp="' + esc(ev.id) + '"' + (full ? " disabled" : "") + ">" + ic(rsvp ? "check" : "ticket") + (rsvp ? " مسجّل" : (full ? " مكتمل" : " سجّل حضورك")) + "</button>" +
        '<button type="button" class="event-cal" data-ics="' + esc(ev.id) + '" title="أضف للتقويم" aria-label="أضف ' + esc(ev.title) + ' للتقويم">' + ic("calendar") + "</button></div></article>";
    }).join("");
    var countEl = $("#eventCount");
    if (countEl) countEl.textContent = filtered.length + " " + countLabel(filtered.length, "فعالية", "فعاليات", "فعالية");
    var empty = $("#eventEmpty");
    if (empty) {
      empty.hidden = filtered.length > 0;
      if (!filtered.length) empty.innerHTML = '<span class="empty-ic">' + ic("calendar") + '</span><h3>مفيش فعاليات في التصنيف ده</h3><p>شوف كل الفعاليات أو جرّب تصنيف تاني.</p><button type="button" class="btn btn-ghost btn-sm" data-event-reset><svg class="i"><use href="#i-refresh"/></svg> كل الفعاليات</button>';
    }
    $$("#eventFilters [data-event-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-event-filter") === communityEventFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function toggleRsvp(id) {
    var ev = EVENTS.filter(function (e) { return e.id === id; })[0];
    if (!ev) return;
    var i = state.rsvps.indexOf(id);
    if (i === -1) {
      var capacity = Math.max(1, parseInt(ev.capacity, 10) || 1);
      var attendees = Math.max(0, parseInt(ev.attendees, 10) || 0);
      if (attendees + 1 > capacity) {
        toast("الفعالية مكتملة", "جرّب فعالية تانية.");
        return;
      }
      state.rsvps.push(id);
      save();
      awardXP(5, "تم تسجيل حضورك", "هنفكرك قبل الفعالية.");
    } else {
      state.rsvps.splice(i, 1);
      save();
      toast("تم إلغاء التسجيل", "تقدر تسجل تاني في أي وقت.");
    }
    renderEvents();
  }

  function renderPosts() {
    var list = $("#postList");
    if (!list) return;
    var filtered = allPosts().filter(function (p) {
      return communityPostFilter === "all" || p.category === communityPostFilter;
    });
    list.innerHTML = filtered.map(function (p) {
      var cat = POST_CATEGORIES[p.category] || POST_CATEGORIES.question;
      var liked = !!state.postLikes[p.id];
      var likes = (parseInt(p.likes, 10) || 0) + (liked ? 1 : 0);
      var mine = !!p.mine;
      var comments = commentsForPost(p.id);
      var commentsOpen = !!openPostComments[p.id];
      var commentLabel = comments.length ? '<bdi dir="ltr">' + comments.length + "</bdi> " + countLabel(comments.length, "رد", "ردود", "رد") : "ردّ";
      return '<article class="post-card' + (mine ? " is-mine" : "") + '">' +
        '<div class="post-head"><span class="avatar avatar-xs" style="--a:' + (p.color || "#7c5cff") + '">' + esc((p.name || "ط").charAt(0)) + "</span>" +
        '<div class="post-author"><b>' + esc(p.name || profileName()) + "</b><small>" + esc(p.meta || "") + " · " + esc(relativeTime(p.createdAt)) + "</small></div>" +
        '<span class="post-cat" style="--pc:' + cat.color + '">' + esc(cat.label) + "</span>" +
        (mine ? '<button type="button" class="post-delete" data-delete-post="' + esc(p.id) + '" aria-label="حذف المنشور">' + ic("trash") + "</button>" : "") + "</div>" +
        "<p>" + esc(p.text) + "</p>" +
        '<div class="post-foot"><button type="button" class="post-like' + (liked ? " is-liked" : "") + '" data-like-post="' + esc(p.id) + '" aria-pressed="' + (liked ? "true" : "false") + '">' + ic("thumbs-up") + "<span>" + likes + "</span></button>" +
        '<button type="button" class="post-comment-toggle' + (commentsOpen ? " is-open" : "") + '" data-toggle-comments="' + esc(p.id) + '" aria-expanded="' + (commentsOpen ? "true" : "false") + '" aria-controls="post-comments-' + esc(p.id) + '">' + ic("message-circle") + "<span>" + commentLabel + "</span></button>" +
        (mine ? '<span class="post-note">منشورك</span>' : '<span class="post-note">عرض تجريبي</span>') + "</div>" +
        (commentsOpen ? renderPostComments(p.id, comments) : "") + "</article>";
    }).join("");
    var countEl = $("#postCount");
    if (countEl) countEl.textContent = filtered.length + " " + countLabel(filtered.length, "منشور", "منشورات", "منشور");
    var empty = $("#postEmpty");
    if (empty) {
      empty.hidden = filtered.length > 0;
      if (!filtered.length) empty.innerHTML = '<span class="empty-ic">' + ic("message-circle") + '</span><h3>مفيش منشورات هنا لسه</h3><p>ابدأ النقاش أو شوف كل المنشورات.</p><button type="button" class="btn btn-ghost btn-sm" data-post-reset><svg class="i"><use href="#i-refresh"/></svg> كل المنشورات</button>';
    }
    $$("#postFilters [data-post-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-post-filter") === communityPostFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderPostComments(postId, comments) {
    var items = comments.map(function (c) {
      return '<div class="post-comment"><span class="avatar avatar-xxs" style="--a:' + (c.color || "#22d3ee") + '">' + esc((c.name || "ط").charAt(0)) + "</span>" +
        '<div class="post-comment-body"><div class="post-comment-head"><b>' + esc(c.name || "طالب") + "</b><small>" + esc(relativeTime(c.createdAt)) + "</small></div><p>" + esc(c.text) + "</p></div></div>";
    }).join("");
    return '<div class="post-comments" id="post-comments-' + esc(postId) + '">' +
      (items || '<p class="post-comments-empty">لسه مفيش ردود — ابدأ النقاش.</p>') +
      '<form class="post-comment-form" data-comment-form="' + esc(postId) + '">' +
      '<input type="text" data-comment-input="' + esc(postId) + '" maxlength="220" placeholder="اكتب رد قصير ومفيد…" aria-label="اكتب رد على المنشور" required>' +
      '<button type="submit" aria-label="إرسال الرد">' + ic("send") + "</button></form></div>";
  }

  function storyHelpfulMarkup(s, active, helpful) {
    return '<button type="button" class="story-helpful' + (active ? " is-active" : "") + '" data-help-story="' + esc(s.id) + '" aria-pressed="' + (active ? "true" : "false") + '">' + ic("thumbs-up") + '<span>مفيد <bdi dir="ltr">' + helpful + "</bdi></span></button>";
  }

  function storyAuthorMarkup(s, cat) {
    return '<div class="story-author"><span class="avatar avatar-xxs" style="--a:' + (s.color || cat.color) + '">' + esc((s.name || "ط").charAt(0)) + "</span><div><b>" + esc(s.name || "طالب") + "</b><small>" + esc(s.meta || "") + "</small></div></div>";
  }

  function storyTimeMarkup(s, mine) {
    return mine
      ? '<button type="button" class="story-delete" data-delete-story="' + esc(s.id) + '" aria-label="حذف التجربة">' + ic("trash") + "</button>"
      : '<span class="story-time">' + esc(relativeTime(s.createdAt)) + "</span>";
  }

  function renderStoryCard(s) {
    var cat = STORY_CATEGORIES[s.category] || STORY_CATEGORIES.housing;
    var active = !!state.storyHelpful[s.id];
    var helpful = (parseInt(s.helpful, 10) || 0) + (active ? 1 : 0);
    return '<article class="story-card" style="--sc:' + cat.color + ";--sc-soft:" + cat.soft + '">' +
      '<div class="story-top"><span class="story-cat">' + ic(cat.icon) + esc(cat.label) + "</span>" + storyTimeMarkup(s, !!s.mine) + "</div>" +
      "<h3>" + esc(s.title) + "</h3>" +
      '<div class="story-block story-problem"><span class="story-label">' + ic("info") + " المشكلة</span><p>" + esc(s.problem) + "</p></div>" +
      '<div class="story-block story-solution"><span class="story-label">' + ic("check") + " الحل اللي نفع</span><p>" + esc(s.solution) + "</p></div>" +
      (s.advice ? '<p class="story-advice">' + ic("sparkles") + "<span>" + esc(s.advice) + "</span></p>" : "") +
      '<div class="story-foot">' + storyAuthorMarkup(s, cat) + storyHelpfulMarkup(s, active, helpful) + "</div></article>";
  }

  function renderFeaturedStory(s) {
    var cat = STORY_CATEGORIES[s.category] || STORY_CATEGORIES.housing;
    var active = !!state.storyHelpful[s.id];
    var helpful = (parseInt(s.helpful, 10) || 0) + (active ? 1 : 0);
    return '<article class="story-card story-featured" style="--sc:' + cat.color + ";--sc-soft:" + cat.soft + '">' +
      '<div class="story-top"><span class="story-cat">' + ic(cat.icon) + esc(cat.label) + '</span><span class="story-feature-tag">' + ic("sparkles") + " تجربة مميزة</span>" + storyTimeMarkup(s, !!s.mine) + "</div>" +
      "<h3>" + esc(s.title) + "</h3>" +
      '<div class="story-feature-grid">' +
      '<div class="story-block story-problem"><span class="story-label">' + ic("info") + " المشكلة</span><p>" + esc(s.problem) + "</p></div>" +
      '<div class="story-block story-solution"><span class="story-label">' + ic("check") + " الحل اللي نفع</span><p>" + esc(s.solution) + "</p></div></div>" +
      (s.advice ? '<p class="story-advice">' + ic("sparkles") + "<span>" + esc(s.advice) + "</span></p>" : "") +
      '<div class="story-foot">' + storyAuthorMarkup(s, cat) + storyHelpfulMarkup(s, active, helpful) + "</div></article>";
  }

  function renderStoryCTA(span) {
    var layout = span === 2 ? " is-wide" : span === 3 ? " is-full" : "";
    return '<article class="story-cta-card' + layout + '">' +
      '<span class="story-cta-ic">' + ic("sparkles") + "</span>" +
      '<div class="story-cta-copy"><h3>عندك تجربة تستاهل تتحكي؟</h3>' +
      "<p>اكتب المشكلة اللي عديت بيها وإزاي حليتها — يمكن تجربتك توفر على طالب تاني أسبوع توهان.</p></div>" +
      '<button type="button" class="btn btn-primary btn-sm" data-action="share-story">' + ic("plus") + " شارك تجربتك</button></article>";
  }

  function renderStories() {
    var grid = $("#storyGrid");
    if (!grid) return;
    var filtered = allStories().filter(function (s) {
      return communityStoryFilter === "all" || s.category === communityStoryFilter;
    });
    var featured = filtered[0];
    var rest = filtered.slice(1);
    var ctaSpan = 3 - (rest.length % 3);
    grid.innerHTML = (featured ? renderFeaturedStory(featured) : "") +
      rest.map(renderStoryCard).join("") +
      (filtered.length ? renderStoryCTA(ctaSpan) : "");
    var countEl = $("#storyCount");
    if (countEl) countEl.textContent = filtered.length + " " + countLabel(filtered.length, "تجربة", "تجارب", "تجربة");
    var empty = $("#storyEmpty");
    if (empty) {
      empty.hidden = filtered.length > 0;
      if (!filtered.length) {
        empty.innerHTML = '<span class="empty-ic">' + ic("sparkles") + '</span><h3>مفيش تجارب في التصنيف ده</h3><p>جرّب تصنيف تاني أو شارك تجربتك عشان تساعد غيرك.</p><div class="empty-actions"><button type="button" class="btn btn-primary btn-sm" data-action="share-story"><svg class="i"><use href="#i-plus"/></svg> شارك تجربتك</button><button type="button" class="btn btn-ghost btn-sm" data-story-reset><svg class="i"><use href="#i-refresh"/></svg> كل التجارب</button></div>';
      }
    }
    $$("#storyFilters [data-story-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-story-filter") === communityStoryFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updatePostCount() {
    var input = $("#postText");
    var count = $("#postCharCount");
    if (!input || !count) return;
    var len = input.value.length;
    count.textContent = len + " / 280";
    count.classList.toggle("is-near", len > 240);
  }

  function submitPost(e) {
    if (e) e.preventDefault();
    var input = $("#postText");
    var category = $("#postCategory");
    if (!input) return;
    var text = input.value.trim();
    if (text.length < 10) {
      toast("المنشور قصير", "اكتب 10 حروف على الأقل عشان المجتمع يفهمك.");
      return;
    }
    state.communityPosts.unshift({
      id: "cp-" + Date.now(),
      name: profileName(),
      meta: currentDegree().name + " · " + campusById(state.profile.campus).name,
      category: category ? category.value : "question",
      text: text,
      createdAt: new Date().toISOString(),
      likes: 0,
      color: "#7c5cff",
      mine: true
    });
    save();
    input.value = "";
    updatePostCount();
    communityPostFilter = "all";
    renderPosts();
    renderCommunityStats();
    awardXP(5, "منشورك اتنشر", "شكراً إنك بتخلي المجتمع أحسن.");
  }

  function togglePostLike(id) {
    if (state.postLikes[id]) delete state.postLikes[id];
    else state.postLikes[id] = true;
    save();
    renderPosts();
  }

  function deletePost(id) {
    var post = state.communityPosts.filter(function (p) { return p.id === id; })[0];
    if (!post) return;
    if (!window.confirm("تحذف المنشور ده؟")) return;
    state.communityPosts = state.communityPosts.filter(function (p) { return p.id !== id; });
    delete state.postComments[id];
    delete openPostComments[id];
    save();
    renderPosts();
    renderCommunityStats();
    toast("اتحذف المنشور", "تقدر تنشر تاني في أي وقت.");
  }

  function togglePostComments(id) {
    openPostComments[id] = !openPostComments[id];
    renderPosts();
    if (openPostComments[id]) {
      window.setTimeout(function () {
        var input = $('[data-comment-input="' + id + '"]');
        if (input) {
          try { input.focus({ preventScroll: true }); } catch (e) {}
        }
      }, 80);
    }
  }

  function submitComment(postId, form) {
    var input = form ? form.querySelector("[data-comment-input]") : null;
    var text = input ? input.value.trim() : "";
    if (text.length < 2) {
      toast("الرد قصير", "اكتب كلمتين على الأقل عشان الرد يكون مفيد.");
      return;
    }
    if (!state.postComments[postId]) state.postComments[postId] = [];
    state.postComments[postId].push({
      id: "pc-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      name: profileName(),
      text: text,
      createdAt: new Date().toISOString(),
      color: "#7c5cff",
      mine: true
    });
    openPostComments[postId] = true;
    save();
    renderPosts();
    toast("تم إضافة ردك", "شكراً إنك بتخلي النقاش أحسن.");
    window.setTimeout(function () {
      var next = $('[data-comment-input="' + postId + '"]');
      if (next) {
        try { next.focus({ preventScroll: true }); } catch (e) {}
      }
    }, 60);
  }

  function openStoryModal() {
    var form = $("#storyForm");
    if (form) form.reset();
    openModal("storyModal");
    var title = $("#storyTitle");
    if (title) window.setTimeout(function () { try { title.focus({ preventScroll: true }); } catch (e) {} }, 180);
  }

  function submitStory(e) {
    if (e) e.preventDefault();
    var title = $("#storyTitle");
    var category = $("#storyCategory");
    var problem = $("#storyProblem");
    var solution = $("#storySolution");
    var advice = $("#storyAdvice");
    if (!title || !title.value.trim() || !problem || !problem.value.trim() || !solution || !solution.value.trim()) {
      toast("ناقص تفاصيل", "اكتب عنوان التجربة، المشكلة، والحل اللي نفع.");
      return;
    }
    var catKey = category ? category.value : "housing";
    var cat = STORY_CATEGORIES[catKey] || STORY_CATEGORIES.housing;
    state.communityStories.unshift({
      id: "cs-" + Date.now(),
      category: catKey,
      title: title.value.trim(),
      problem: problem.value.trim(),
      solution: solution.value.trim(),
      advice: advice ? advice.value.trim() : "",
      name: profileName(),
      meta: currentDegree().name + " · " + campusById(state.profile.campus).name,
      createdAt: new Date().toISOString(),
      helpful: 0,
      color: cat.color,
      mine: true
    });
    save();
    closeModal("storyModal");
    communityStoryFilter = "all";
    renderStories();
    awardXP(10, "تجربتك اتنشرت", "شكراً إنك بتساعد طالب تاني.");
    window.setTimeout(function () { scrollToCommunity("community-stories"); }, 140);
  }

  function toggleStoryHelpful(id) {
    if (state.storyHelpful[id]) delete state.storyHelpful[id];
    else state.storyHelpful[id] = true;
    save();
    renderStories();
  }

  function deleteStory(id) {
    var story = state.communityStories.filter(function (s) { return s.id === id; })[0];
    if (!story) return;
    if (!window.confirm("تحذف التجربة دي؟")) return;
    state.communityStories = state.communityStories.filter(function (s) { return s.id !== id; });
    delete state.storyHelpful[id];
    save();
    renderStories();
    toast("اتحذفت التجربة", "تقدر تشارك تجربة جديدة في أي وقت.");
  }

  function renderBoardAvatar() {
    var avatar = $("#boardAvatar");
    if (avatar) avatar.textContent = profileInitial();
  }

  function renderDeals() {
    var list = $("#dealList");
    if (!list) return;
    list.innerHTML = DEALS.map(function (d) {
      var saved = state.savedDeals.indexOf(d.id) !== -1;
      return '<div class="deal-row' + (saved ? " is-saved" : "") + '"><span class="deal-ic" style="--deal:' + d.color + ";--deal-soft:" + d.soft + '">' + ic(d.icon) + "</span>" +
        '<div class="deal-copy"><b>' + esc(d.name) + "</b><small>" + esc(d.area) + "</small>" +
        '<button type="button" class="deal-code" data-copy-deal="' + esc(d.id) + '" title="انسخ كود الخصم"><span dir="ltr">' + esc(d.code) + "</span>" + ic("copy") + "</button></div>" +
        '<span class="deal-offer">' + esc(d.offer) + "</span>" +
        '<button type="button" class="deal-save' + (saved ? " is-saved" : "") + '" data-save-deal="' + esc(d.id) + '" aria-pressed="' + (saved ? "true" : "false") + '" aria-label="' + (saved ? "شيل العرض من المحفوظات" : "احفظ العرض") + '">' + ic("heart") + "</button></div>";
    }).join("");
  }

  function toggleDealSave(id) {
    var i = state.savedDeals.indexOf(id);
    if (i === -1) {
      state.savedDeals.push(id);
      save();
      renderDeals();
      toast("حفظت العرض", "محفوظ عندك على الجهاز.");
    } else {
      state.savedDeals.splice(i, 1);
      save();
      renderDeals();
      toast("شيلنا العرض", "تقدر تحفظه تاني في أي وقت.");
    }
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(); }).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    } catch (e) {}
  }

  function copyDealCode(id) {
    var deal = DEALS.filter(function (d) { return d.id === id; })[0];
    if (!deal) return;
    copyText(deal.code, function () {
      toast("اتنسخ كود الخصم", deal.code + " — استخدمه قبل الدفع.", 0);
    });
  }

  function renderTransport() {
    var list = $("#transportList");
    if (!list) return;
    list.innerHTML = TRANSPORT.map(function (t) {
      return '<div class="transport-row"><span class="line-badge" style="--line-color:' + t.color + '">' + esc(t.line) + "</span>" +
        '<span class="transport-copy"><b>' + esc(t.from) + "</b><small>" + esc(t.note) + "</small></span>" +
        '<span class="transport-freq">' + esc(t.freq) + "</span></div>";
    }).join("");
  }

  function renderLife() {
    var grid = $("#lifeGrid");
    if (!grid) return;
    grid.innerHTML = LIFE_SPOTS.map(function (spot) {
      var inner = '<span class="life-ic" style="--lc:' + spot.color + ";--lc-soft:" + spot.soft + '">' + ic(spot.icon) + "</span>" +
        '<span class="life-copy"><small>' + esc(spot.title) + "</small><b>" + esc(spot.name) + "</b><p>" + esc(spot.note) + "</p></span>" +
        '<span class="life-arrow">' + ic(spot.internal ? "arrow-left" : "external") + "</span>";
      if (spot.internal) {
        return '<button type="button" class="life-card" data-community-jump="' + esc(spot.internal) + '">' + inner + "</button>";
      }
      return '<a class="life-card" href="' + esc(spot.link) + '" target="_blank" rel="noopener">' + inner + "</a>";
    }).join("");
  }

  function renderQuotes() {
    var track = $("#quoteTrack");
    if (!track) return;
    var html = QUOTES.map(function (q) {
      return '<article class="quote-card"><p>«' + esc(q.text) + '»</p><div class="quote-author"><span class="avatar avatar-xs" style="--a:' + q.color + '">' + esc(q.name.charAt(0)) + "</span><div><b>" + esc(q.name) + "</b><small>" + esc(q.meta) + "</small></div></div></article>";
    }).join("");
    track.innerHTML = html + html;
  }

  function openGroupModal() {
    var form = $("#groupForm");
    if (form) form.reset();
    var max = $("#groupMax");
    if (max) max.value = "10";
    var campus = $("#groupCampus");
    if (campus) campus.value = campusById(state.profile.campus).name;
    openModal("groupModal");
    var title = $("#groupTitle");
    if (title) window.setTimeout(function () { try { title.focus({ preventScroll: true }); } catch (e) {} }, 180);
  }

  function submitGroup(e) {
    if (e) e.preventDefault();
    var title = $("#groupTitle");
    var category = $("#groupCategory");
    var campus = $("#groupCampus");
    var when = $("#groupWhen");
    var place = $("#groupPlace");
    var max = $("#groupMax");
    var desc = $("#groupDesc");
    if (!title || !title.value.trim() || !when || !when.value.trim() || !place || !place.value.trim()) {
      toast("ناقص بيانات", "اكتب اسم المجموعة، الوقت، والمكان.");
      return;
    }
    var maxValue = Math.max(2, Math.min(30, parseInt(max && max.value, 10) || 10));
    var catKey = category ? category.value : "study";
    var cat = groupCategory(catKey);
    var id = "cg-" + Date.now();
    state.customGroups.unshift({
      id: id,
      course: title.value.trim(),
      category: catKey,
      campus: campus ? campus.value : "Dalmine",
      members: 1,
      max: maxValue,
      next: when.value.trim(),
      place: place.value.trim(),
      tags: ["جديد", "مجموعتك"],
      desc: desc ? desc.value.trim() : "",
      color: cat.color,
      soft: cat.soft,
      avatars: [profileInitial()],
      custom: true
    });
    if (state.joined.indexOf(id) === -1) state.joined.push(id);
    save();
    closeModal("groupModal");
    communityGroupFilter = "all";
    communityGroupQuery = "";
    var search = $("#groupSearch");
    if (search) search.value = "";
    renderGroups();
    renderCommunityStats();
    awardXP(15, "مجموعتك اتضافت", "دعوة المجتمع جاهزة — ابدأ بأول لقاء.");
    window.setTimeout(function () { scrollToCommunity("community-groups"); }, 120);
  }

  function scrollToCommunity(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var header = $("#appHeader");
    var offset = header ? header.offsetHeight + 16 : 80;
    var top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    $$(".community-jump [data-community-jump]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-community-jump") === id);
    });
  }

  function icsText(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function downloadIcs(id) {
    var ev = EVENTS.filter(function (e) { return e.id === id; })[0];
    if (!ev) return;
    var start = new Date(ev.date.getTime());
    var parts = String(ev.time || "18:00").split(":");
    start.setHours(parseInt(parts[0], 10) || 18, parseInt(parts[1], 10) || 0, 0, 0);
    var end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var fmt = function (d) {
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
    };
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//UniAtlas//Community//AR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + ev.id + "@uniatlas.demo",
      "DTSTAMP:" + stamp,
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(end),
      "SUMMARY:" + icsText(ev.title),
      "LOCATION:" + icsText(ev.place),
      "DESCRIPTION:" + icsText(ev.desc + " — بيانات تجريبية من UniAtlas."),
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "uniatlas-" + ev.id + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("الموعد جاهز", "افتح الملف وهيتضاف لتقويمك.", 0);
  }

  /* ======================================================================
     UNIATLAS LANDING — WORLD MAP & UNIVERSITY PICKER
     ====================================================================== */
  var worldMapInstance = null;
  var worldTileLayer = null;
  var worldLabelLayer = null;
  var worldMarkers = {};
  var worldLocateMarker = null;
  var uniFilter = { q: "", country: "all" };

  function initWorldMap() {
    var el = $("#worldMap");
    if (!el) return;
    if (worldMapInstance) {
      window.setTimeout(function () { worldMapInstance.invalidateSize(); }, 140);
      return;
    }
    var fallback = $("#worldMapFallback");
    if (typeof window.L === "undefined") {
      if (fallback) fallback.hidden = false;
      return;
    }
    if (fallback) fallback.hidden = true;

    worldMapInstance = window.L.map(el, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 9,
      zoomSnap: 0.5,
      worldCopyJump: true,
      scrollWheelZoom: true,
      dragging: true,
      tap: true
    }).setView([26, 12], 2);

    worldTileLayer = window.L.tileLayer(tileUrl(state.theme), {
      attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>',
      maxZoom: 9,
      maxNativeZoom: 8
    }).addTo(worldMapInstance);

    worldLabelLayer = window.L.tileLayer(tileLabelUrl(state.theme), {
      maxZoom: 9,
      maxNativeZoom: 8,
      pane: "tilePane"
    }).addTo(worldMapInstance);

    UNIVERSITIES.forEach(function (u) {
      var live = isEnterable(u);
      var icon = window.L.divIcon({
        className: "world-pin-wrap",
        html: '<span class="world-pin ' + (live ? "is-active" : "is-coming") + '" data-pin="' + esc(u.id) + '"><span>' + ic(live ? "grad" : "building-2") + "</span></span>",
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -32]
      });
      var marker = window.L.marker(u.coords, { icon: icon, title: u.short + " — " + u.city, riseOnHover: true }).addTo(worldMapInstance);
      marker.bindTooltip(u.short + " · " + u.city, { className: "uni-tip", direction: "top", offset: [0, -32] });
      marker.on("click", function () { selectUniversity(u.id, true); });
      worldMarkers[u.id] = marker;
    });

    window.setTimeout(function () {
      if (worldMapInstance) worldMapInstance.invalidateSize();
      renderUniversityList();
    }, 260);
  }

  function updateWorldMapTheme() {
    if (worldTileLayer) worldTileLayer.setUrl(tileUrl(state.theme));
    if (worldLabelLayer) worldLabelLayer.setUrl(tileLabelUrl(state.theme));
  }

  function filteredUniversities() {
    var q = uniFilter.q.trim().toLowerCase();
    return UNIVERSITIES.filter(function (u) {
      if (uniFilter.country !== "all" && u.country !== uniFilter.country) return false;
      if (!q) return true;
      var hay = [u.name, u.short, u.ar, u.city, u.cityIt, u.country, u.tagline, (u.highlights || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderCountryFilters() {
    var wrap = $("#uniCountryFilters");
    if (!wrap) return;
    var countries = [];
    UNIVERSITIES.forEach(function (u) {
      if (u.country && countries.indexOf(u.country) === -1) countries.push(u.country);
    });
    var buttons = [{ value: "all", label: "الكل" }].concat(countries.map(function (c) { return { value: c, label: c }; }));
    wrap.innerHTML = buttons.map(function (b) {
      return '<button type="button" class="' + (uniFilter.country === b.value ? "is-active" : "") + '" data-uni-country="' + esc(b.value) + '">' + esc(b.label) + "</button>";
    }).join("");
  }

  function renderUniversityList() {
    var list = $("#uniList");
    if (!list) return;
    var items = filteredUniversities();
    var count = $("#uniCount");
    if (count) count.textContent = String(items.length);
    var totalLabel = $("#uniTotalLabel");
    if (totalLabel) totalLabel.textContent = String(UNIVERSITIES.length);
    var comingLabel = $("#uniComingLabel");
    if (comingLabel) {
      var coming = UNIVERSITIES.filter(function (u) { return !isEnterable(u); }).length;
      comingLabel.textContent = coming === 1 ? "جامعة واحدة قريباً" : coming + " جامعات قريباً";
    }
    var clear = $("#uniSearchClear");
    var input = $("#uniSearch");
    if (clear) clear.hidden = !(input && input.value);
    renderCountryFilters();

    if (!items.length) {
      list.innerHTML = '<div class="uni-list-empty">مفيش جامعة بالاسم ده… جرّب مدينة أو دولة تانية.</div>';
    } else {
      list.innerHTML = items.map(function (u) {
        var active = u.id === state.selectedUniversity;
        return '<button type="button" class="uni-row' + (active ? " is-active" : "") + '" data-uni-id="' + esc(u.id) + '">' +
          '<span class="ur-flag">' + esc(u.flag) + "</span>" +
          '<span class="ur-copy"><b>' + esc(u.short) + " · " + esc(u.ar) + "</b><small>" + esc(u.city + " · " + u.country) + "</small></span>" +
          '<span class="ur-status ' + (isEnterable(u) ? "is-live" : "is-soon") + '">' + (isEnterable(u) ? "متاحة" : "قريباً") + "</span>" +
          "</button>";
      }).join("");
    }

    Object.keys(worldMarkers).forEach(function (id) {
      var inList = items.some(function (u) { return u.id === id; });
      var markerEl = worldMarkers[id].getElement();
      if (markerEl) {
        var pin = markerEl.querySelector(".world-pin");
        if (pin) pin.classList.toggle("is-dimmed", !inList);
      }
    });
    updateWorldMarkerSelection();
    renderUniversityPreview();
  }

  function updateWorldMarkerSelection() {
    Object.keys(worldMarkers).forEach(function (id) {
      var markerEl = worldMarkers[id].getElement();
      if (!markerEl) return;
      var pin = markerEl.querySelector(".world-pin");
      if (!pin) return;
      pin.classList.toggle("is-selected", id === state.selectedUniversity);
    });
  }

  function renderUniversityPreview() {
    var box = $("#uniPreview");
    if (!box) return;
    var u = selectedUniversity();
    var live = isEnterable(u);
    var interested = state.interests.indexOf(u.id) !== -1;
    var interestCount = (u.baseInterest || 0) + (interested ? 1 : 0) + state.suggestions.filter(function (s) {
      return (s.name || "").toLowerCase().indexOf(u.short.toLowerCase()) !== -1;
    }).length;
    var action = live
      ? '<button type="button" class="btn btn-primary" data-enter-uni="' + esc(u.id) + '">' + ic("play") + " ابدأ " + esc(u.short) + "</button>"
      : '<button type="button" class="btn ' + (interested ? "btn-ghost" : "btn-primary") + '" data-interest-uni="' + esc(u.id) + '">' + ic(interested ? "check" : "plus") + " " + (interested ? "مهتم — هنبلغك" : "سجّل اهتمامك") + "</button>";
    var official = u.official
      ? '<a class="btn btn-ghost up-official" href="' + esc(u.official) + '" target="_blank" rel="noopener" aria-label="الموقع الرسمي">' + ic("external") + "</a>"
      : "";

    box.style.setProperty("--accent", u.accent);
    box.innerHTML =
      '<div class="up-top">' +
        '<span class="up-flag">' + esc(u.flag) + "</span>" +
        '<span class="up-id"><small>' + esc(u.country + " · " + u.city) + "</small><h3>" + esc(u.short) + " · " + esc(u.ar) + "</h3><span>" + esc(u.name) + "</span></span>" +
        '<span class="up-status ' + (live ? "is-live" : "is-soon") + '">' + (live ? "متاحة الآن" : esc(u.eta || "قريباً")) + "</span>" +
      "</div>" +
      '<p class="up-tagline">' + esc(u.tagline) + "</p>" +
      '<div class="up-stats">' +
        "<div><b>" + esc(String(u.established || "—")) + "</b><small>سنة التأسيس</small></div>" +
        "<div><b>" + esc(String(u.students || "—")) + "</b><small>طلاب</small></div>" +
        "<div><b>" + esc(String(u.programs || "—")) + "</b><small>برنامج</small></div>" +
      "</div>" +
      '<div class="up-highlights">' + (u.highlights || []).map(function (h) { return "<span>" + esc(h) + "</span>"; }).join("") + "</div>" +
      '<div class="up-actions">' + action + official + "</div>" +
      '<span class="up-interest-count">' + ic("heart") + interestCount.toLocaleString("en-US") + " طالب مهتم" + (live ? " · بيانات تعريفية" : " · انضم للقائمة") + "</span>";
  }

  function selectUniversity(id, fly) {
    var u = universityById(id);
    state.selectedUniversity = u.id;
    save();
    renderUniversityList();
    if (fly && worldMapInstance) {
      worldMapInstance.flyTo(u.coords, isEnterable(u) ? 7 : 5.5, { duration: 1.05 });
    }
  }

  function enterUniversity(id) {
    var u = universityById(id);
    if (!isEnterable(u)) {
      toast("لسه بنجهّزها", "سجّل اهتمامك وهنبلغك أول ما الجامعة تنزل على UniAtlas.");
      return;
    }
    var first = !state.enteredUniBg;
    state.enteredUniBg = true;
    state.selectedUniversity = id;
    save();
    navigate("home");
    if (first) awardXP(15, "أهلاً بيك في UniBg", "اختارت جامعتك — نبدأ من هنا.", 15);
    else toast("رجعت لـ UniBg", "جامعتك جاهزة — اختار القسم اللي محتاجه.");
    if (!state.profile.onboarded) {
      window.setTimeout(function () { if (!openModals.length) openOnboarding(false); }, 1100);
    }
  }

  function toggleInterest(id) {
    var u = universityById(id);
    if (!u) return;
    var i = state.interests.indexOf(id);
    if (i === -1) {
      state.interests.push(id);
      save();
      renderUniversityList();
      awardXP(5, "اهتمامك اتسجل", "هنبلغك أول ما " + u.short + " تنزل على UniAtlas.", 5);
    } else {
      state.interests.splice(i, 1);
      save();
      renderUniversityList();
      toast("شيلنا اهتمامك", "تقدر ترجع تسجله في أي وقت.");
    }
    renderSpace();
  }

  function worldView() {
    if (!worldMapInstance) return;
    worldMapInstance.setView([24, 12], 2, { animate: true });
  }

  function europeView() {
    if (!worldMapInstance) return;
    var coords = UNIVERSITIES.map(function (u) { return u.coords; });
    worldMapInstance.fitBounds(window.L.latLngBounds(coords), { padding: [50, 50], maxZoom: 4.5, animate: true });
  }

  function locateMe() {
    if (!navigator.geolocation) {
      toast("الموقع مش متاح", "المتصفح مش بيدعم تحديد الموقع.");
      return;
    }
    toast("بندوّر على موقعك", "وافق على إذن الموقع لو ظهرلك.");
    navigator.geolocation.getCurrentPosition(function (pos) {
      var latlng = [pos.coords.latitude, pos.coords.longitude];
      if (!worldMapInstance) return;
      if (worldLocateMarker) worldMapInstance.removeLayer(worldLocateMarker);
      worldLocateMarker = window.L.circleMarker(latlng, {
        radius: 8, color: "#22d3ee", weight: 2, fillColor: "#22d3ee", fillOpacity: 0.25
      }).addTo(worldMapInstance).bindTooltip("موقعك التقريبي", { className: "uni-tip", direction: "top" });
      worldMapInstance.flyTo(latlng, 6, { duration: 1.2 });
      toast("وصلنا لموقعك", "أقرب جامعة على الخريطة هي UniBg في بيرغامو.");
    }, function () {
      toast("مش قدرنا نحدد موقعك", "تقدر تختار جامعتك من القائمة أو زرار أوروبا.");
    }, { timeout: 9000, maximumAge: 600000 });
  }

  function toggleSheet() {
    var panel = $("#landingPanel");
    var handle = $("#sheetHandle");
    if (!panel) return;
    var open = panel.classList.toggle("is-expanded");
    if (handle) handle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* ======================================================================
     HOUSING
     ====================================================================== */
  var housingSavedOnly = false;

  function housingTypeLabel(type) {
    return type === "room" ? "غرفة" : type === "studio" ? "ستوديو" : "شقة مشتركة";
  }

  function renderHousing() {
    var grid = $("#housingGrid");
    if (!grid) return;
    var q = ($("#housingSearch") && $("#housingSearch").value ? $("#housingSearch").value : "").trim().toLowerCase();
    var zone = $("#housingZone") ? $("#housingZone").value : "all";
    var type = $("#housingType") ? $("#housingType").value : "all";
    var budget = $("#housingBudget") ? $("#housingBudget").value : "all";
    var list = HOUSING.filter(function (h) {
      if (zone !== "all" && h.zone !== zone) return false;
      if (type !== "all" && h.type !== type) return false;
      if (budget === "low" && h.price > 450) return false;
      if (budget === "mid" && (h.price < 450 || h.price > 600)) return false;
      if (budget === "high" && h.price <= 600) return false;
      if (housingSavedOnly && state.savedHousing.indexOf(h.id) === -1) return false;
      if (q) {
        var hay = [h.title, h.zoneLabel, housingTypeLabel(h.type), h.amenities.join(" "), h.badge].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var count = $("#housingCount");
    if (count) count.textContent = list.length + (list.length === 1 ? " خيار سكن" : " خيارات سكن");
    var empty = $("#housingEmpty");
    if (empty) empty.hidden = list.length > 0;
    var savedCount = $("#housingSavedCount");
    if (savedCount) savedCount.textContent = String(state.savedHousing.length);
    var toggle = $("#housingSavedToggle");
    if (toggle) toggle.classList.toggle("is-active", housingSavedOnly);

    grid.innerHTML = list.map(function (h) {
      var saved = state.savedHousing.indexOf(h.id) !== -1;
      return '<article class="housing-card" style="--hc:' + h.color + ";--hc-soft:" + h.soft + '">' +
        '<div class="hc-media">' +
          '<span class="hc-media-ic">' + ic(h.icon) + "</span>" +
          '<span class="hc-media-tag">' + esc(h.badge) + "</span>" +
          '<span class="hc-price"><b>€' + h.price.toLocaleString("en-US") + "</b><small>/ شهر</small></span>" +
        "</div>" +
        '<div class="hc-body">' +
          '<span class="hc-zone">' + ic("pin") + esc(h.zoneLabel) + "</span>" +
          "<h3>" + esc(h.title) + "</h3>" +
          '<span class="hc-distance">' + ic("navigation") + esc(h.distance) + "</span>" +
          '<div class="hc-amenities">' + h.amenities.map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("") + "</div>" +
          '<div class="hc-deposit"><span>تأمين تقريبي</span><b>€' + h.deposit.toLocaleString("en-US") + "</b></div>" +
          '<div class="hc-foot">' +
            '<button type="button" class="btn btn-primary" data-housing-detail="' + esc(h.id) + '">التفاصيل ' + ic("arrow-left") + "</button>" +
            '<button type="button" class="hc-save' + (saved ? " is-active" : "") + '" data-save-housing="' + esc(h.id) + '" aria-label="حفظ السكن" aria-pressed="' + saved + '">' + ic("bookmark") + "</button>" +
          "</div>" +
        "</div></article>";
    }).join("");
  }

  function resetHousingFilters() {
    var s = $("#housingSearch");
    if (s) s.value = "";
    var z = $("#housingZone");
    if (z) z.value = "all";
    var t = $("#housingType");
    if (t) t.value = "all";
    var b = $("#housingBudget");
    if (b) b.value = "all";
    housingSavedOnly = false;
    renderHousing();
  }

  function toggleHousingSave(id) {
    var i = state.savedHousing.indexOf(id);
    if (i === -1) {
      state.savedHousing.push(id);
      save();
      toast("السكن اتحفظ", "هتلاقيه في مساحتي — مع باقي محفوظاتك.", 3);
    } else {
      state.savedHousing.splice(i, 1);
      save();
      toast("شيلنا السكن من المحفوظات", "");
    }
    renderHousing();
    renderSpace();
    var modal = document.getElementById("housingModal");
    if (modal && modal.classList.contains("is-open")) openHousingModal(id);
  }

  function openHousingModal(id) {
    var h = null;
    HOUSING.forEach(function (x) { if (x.id === id) h = x; });
    if (!h) return;
    var body = $("#housingModalBody");
    if (!body) return;
    var saved = state.savedHousing.indexOf(h.id) !== -1;
    body.innerHTML =
      '<div class="career-modal-head"><span class="job-logo" style="--job:' + h.color + ";--job-soft:" + h.soft + '">' + ic(h.icon) + "</span>" +
        "<div><h2 id=\"housingModalTitle\">" + esc(h.title) + "</h2><small>" + esc(h.zoneLabel) + " · " + esc(h.distance) + "</small></div>" +
        '<span class="job-type">' + esc(housingTypeLabel(h.type)) + "</span></div>" +
      '<div class="detail-chips"><span>€' + h.price.toLocaleString("en-US") + " / شهر</span><span>تأمين ~€" + h.deposit.toLocaleString("en-US") + "</span><span>" + esc(h.badge) + "</span></div>" +
      '<div class="detail-section"><h4>إيه اللي في المكان؟</h4><div class="doc-cloud">' + h.amenities.map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("") + "</div></div>" +
      '<div class="detail-section"><h4>نصيحة قبل التعاقد</h4><p>' + esc(h.tip) + "</p></div>" +
      '<div class="detail-section"><h4>تشيك ليست سريعة</h4><div class="question-list">' +
        ["شوف المكان بنفسك قبل أي دفع.", "اطلب عقد إيجار مسجّل عند Agenzia delle Entrate.", "اتأكد من الإيجار والتأمين والمرافق مكتوبين.", "احفظ إيصال كل دفعة."].map(function (t, i) {
          return '<div class="question-item"><span class="q-num">' + (i + 1) + '</span><span class="q-text">' + esc(t) + "</span></div>";
        }).join("") + "</div></div>" +
      '<div class="detail-actions"><button type="button" class="btn ' + (saved ? "btn-ghost" : "btn-primary") + '" data-save-housing="' + esc(h.id) + '">' + ic("bookmark") + " " + (saved ? "شيل من المحفوظات" : "احفظ السكن") + "</button>" +
        '<a class="btn btn-ghost" href="https://www.unibg.it" target="_blank" rel="noopener">' + ic("external") + " خدمات الطلاب</a></div>" +
      '<p class="form-note">' + ic("info") + " بيانات تجريبية للعرض — الأسعار والمسافات تقريبية.</p>";
    openModal("housingModal");
  }

  /* ======================================================================
     SCHOLARSHIPS & FEES
     ====================================================================== */
  function feeLabelHtml(label) {
    return esc(label).replace(/(€[\d.,]+(?:\s*[–-]\s*€[\d.,]+)?)/g, '<bdi dir="ltr">$1</bdi>');
  }

  function renderFeeBrackets() {
    var box = $("#feeBrackets");
    if (!box) return;
    box.innerHTML = FEE_BRACKETS.map(function (b, i) {
      var sample = i === 0 ? 10000 : Math.min(50000, Math.round((FEE_BRACKETS[i - 1].max + (b.max === Infinity ? 60000 : b.max)) / 2));
      return '<button type="button" class="fee-row" data-fee-set="' + sample + '"><span>' + feeLabelHtml(b.label) + "</span><b>" + (b.fee === 0 ? "€0" : "~€" + b.fee.toLocaleString("en-US")) + "</b></button>";
    }).join("");
  }

  function updateFeeCalculator() {
    var range = $("#iseeRange");
    if (!range) return;
    range.value = String(state.isee);
    var isee = parseInt(range.value, 10) || 0;
    var bracket = FEE_BRACKETS[FEE_BRACKETS.length - 1];
    var index = FEE_BRACKETS.length - 1;
    for (var i = 0; i < FEE_BRACKETS.length; i++) {
      if (isee <= FEE_BRACKETS[i].max) { bracket = FEE_BRACKETS[i]; index = i; break; }
    }
    var out = $("#iseeOut");
    if (out) out.textContent = "€" + isee.toLocaleString("en-US");
    var fee = $("#feeEstimate");
    if (fee) fee.textContent = bracket.fee === 0 ? "€0" : "~€" + bracket.fee.toLocaleString("en-US");
    var band = $("#feeBandLabel");
    if (band) band.innerHTML = esc(bracket.note) + ' · ' + feeLabelHtml(bracket.label);
    var elig = $("#scholarshipEligibility");
    if (elig) {
      if (isee <= 20000) {
        elig.className = "eligibility is-good";
        elig.innerHTML = ic("check") + " مرشح قوي لمنحة DSU — جهّز ISEE والمستندات بدري.";
      } else if (isee <= 30000) {
        elig.className = "eligibility is-mid";
        elig.innerHTML = ic("info") + " ممكن تكون مؤهل جزئياً — راجع شروط DSU للسنة.";
      } else {
        elig.className = "eligibility is-warn";
        elig.innerHTML = ic("shield") + " فوق نطاق منحة DSU غالباً — لكن جوائز التفوق ممكن تنطبق عليك.";
      }
    }
    $$("#feeBrackets .fee-row").forEach(function (row, i) {
      row.classList.toggle("is-active", i === index);
    });
  }

  function renderDeadlines() {
    var list = $("#deadlineList");
    if (!list) return;
    list.innerHTML = DEADLINES.map(function (d) {
      return '<div class="deadline-row"><small>' + esc(d.label) + "</small><b>" + esc(d.date) + "</b><span>" + esc(d.tag) + "</span><p>" + esc(d.note) + "</p></div>";
    }).join("");
  }

  function renderScholarships() {
    renderFeeBrackets();
    renderDeadlines();
    var range = $("#iseeRange");
    if (range) range.value = String(state.isee);
    updateFeeCalculator();
  }

  /* ======================================================================
     CAREERS
     ====================================================================== */
  var careerSavedOnly = false;

  function careerPayHtml(pay) {
    return esc(pay).replace(/(€[\d.,]+(?:\s*\/\s*)?)/g, '<bdi dir="ltr">$1</bdi>');
  }

  function renderCareers() {
    var grid = $("#careerGrid");
    if (!grid) return;
    var q = ($("#careerSearch") && $("#careerSearch").value ? $("#careerSearch").value : "").trim().toLowerCase();
    var type = $("#careerType") ? $("#careerType").value : "all";
    var list = CAREERS.filter(function (c) {
      if (type !== "all" && c.type !== type) return false;
      if (careerSavedOnly && state.savedJobs.indexOf(c.id) === -1) return false;
      if (q) {
        var hay = [c.role, c.company, c.location, c.summary, c.tags.join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var count = $("#careerCount");
    if (count) count.textContent = list.length + (list.length === 1 ? " فرصة" : " فرص");
    var empty = $("#careerEmpty");
    if (empty) empty.hidden = list.length > 0;
    var savedCount = $("#careerSavedCount");
    if (savedCount) savedCount.textContent = String(state.savedJobs.length);
    var toggle = $("#careerSavedToggle");
    if (toggle) toggle.classList.toggle("is-active", careerSavedOnly);

    grid.innerHTML = list.map(function (c) {
      var t = CAREER_TYPES[c.type] || CAREER_TYPES.job;
      var saved = state.savedJobs.indexOf(c.id) !== -1;
      return '<article class="career-card">' +
        '<div class="job-top"><span class="job-logo" style="--job:' + t.color + ";--job-soft:" + t.soft + '">' + esc(c.logo) + "</span>" +
          '<span class="job-id"><small>' + esc(c.company) + "</small><h3>" + esc(c.role) + "</h3></span>" +
          '<span class="job-type">' + esc(t.label) + "</span></div>" +
        '<div class="job-meta"><span>' + ic("pin") + esc(c.location) + "</span><span>" + ic("clock") + esc(c.posted) + "</span></div>" +
        '<div class="job-tags">' + c.tags.map(function (tag) { return "<span>" + esc(tag) + "</span>"; }).join("") + "</div>" +
        '<div class="job-foot"><span class="job-pay"><b>' + careerPayHtml(c.pay) + "</b><small>تقدير تجريبي</small></span>" +
          '<button type="button" class="btn btn-primary" data-career-detail="' + esc(c.id) + '">التفاصيل</button>' +
          '<button type="button" class="job-save' + (saved ? " is-active" : "") + '" data-save-job="' + esc(c.id) + '" aria-label="حفظ الفرصة" aria-pressed="' + saved + '">' + ic("bookmark") + "</button>" +
        "</div></article>";
    }).join("");
  }

  function resetCareerFilters() {
    var s = $("#careerSearch");
    if (s) s.value = "";
    var t = $("#careerType");
    if (t) t.value = "all";
    careerSavedOnly = false;
    renderCareers();
  }

  function toggleJobSave(id) {
    var i = state.savedJobs.indexOf(id);
    if (i === -1) {
      state.savedJobs.push(id);
      save();
      toast("الفرصة اتحفظت", "هتلاقيها في مساحتي مع محفوظاتك.", 3);
    } else {
      state.savedJobs.splice(i, 1);
      save();
      toast("شيلنا الفرصة من المحفوظات", "");
    }
    renderCareers();
    renderSpace();
    var modal = document.getElementById("careerModal");
    if (modal && modal.classList.contains("is-open")) openCareerModal(id);
  }

  function openCareerModal(id) {
    var c = null;
    CAREERS.forEach(function (x) { if (x.id === id) c = x; });
    if (!c) return;
    var body = $("#careerModalBody");
    if (!body) return;
    var t = CAREER_TYPES[c.type] || CAREER_TYPES.job;
    var saved = state.savedJobs.indexOf(c.id) !== -1;
    body.innerHTML =
      '<div class="career-modal-head"><span class="job-logo" style="--job:' + t.color + ";--job-soft:" + t.soft + '">' + esc(c.logo) + "</span>" +
        '<div><h2 id="careerModalTitle">' + esc(c.role) + '</h2><small>' + esc(c.company) + " · " + esc(c.location) + "</small></div>" +
        '<span class="job-type">' + esc(t.label) + "</span></div>" +
      '<div class="detail-chips"><span>' + careerPayHtml(c.pay) + "</span><span>" + esc(c.posted) + "</span>" + c.tags.map(function (tag) { return "<span>" + esc(tag) + "</span>"; }).join("") + "</div>" +
      '<div class="detail-section"><h4>عن الفرصة</h4><p>' + esc(c.summary) + "</p></div>" +
      '<div class="detail-section"><h4>المتطلبات</h4><div class="question-list">' + c.requirements.map(function (r, i) {
        return '<div class="question-item"><span class="q-num">' + (i + 1) + '</span><span class="q-text">' + esc(r) + "</span></div>";
      }).join("") + "</div></div>" +
      '<div class="detail-actions"><a class="btn btn-primary" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + ic("external") + " قدّم من المصدر الرسمي</a>" +
        '<button type="button" class="btn ' + (saved ? "btn-ghost" : "btn-ghost") + '" data-save-job="' + esc(c.id) + '">' + ic("bookmark") + " " + (saved ? "محفوظة" : "احفظ الفرصة") + "</button></div>" +
      '<p class="form-note">' + ic("info") + " فرصة تجريبية للعرض — التقديم الفعلي من الموقع الرسمي فقط.</p>";
    openModal("careerModal");
  }

  function downloadCvChecklist() {
    var lines = [
      "UniAtlas — قائمة تجهيز CV",
      "",
      "1. صفحة واحدة فقط، واسمك وبيانات التواصل فوق.",
      "2. اكتب النتائج مش المهام: أرقام ونِسب لو ممكن.",
      "3. استخدم كلمات الوظيفة نفسها (ATS).",
      "4. رتّب الخبرات من الأحدث للأقدم.",
      "5. أضف مشاريع جامعية لو الخبرة قليلة.",
      "6. راجع الإملاء واسم الشركة قبل الإرسال.",
      "7. صدّر PDF وسمّ الملف: Name-Role-CV.pdf",
      "",
      "نصيحة: خلي LinkedIn متطابق مع CV.",
      "بيانات تجريبية — UniAtlas"
    ];
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "uniatlas-cv-checklist.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("نزّلنا قائمة CV", "7 خطوات سريعة قبل ما تبعت أي طلب.", 5);
  }

  /* ======================================================================
     MY SPACE
     ====================================================================== */
  function renderSpace() {
    var name = profileName();
    var degree = currentDegree();
    var info = levelInfo();
    var initial = profileInitial();
    var nameEl = $("#spaceName");
    if (nameEl) nameEl.textContent = name;
    var initialEl = $("#spaceInitial");
    if (initialEl) initialEl.textContent = initial;
    var degreeEl = $("#spaceDegree");
    if (degreeEl) degreeEl.textContent = degree.name + " · " + degree.it;
    var uniEl = $("#spaceUni");
    if (uniEl) uniEl.textContent = "UniBg · بيرغامو";

    var xpEl = $("#spaceXp");
    if (xpEl) xpEl.textContent = String(state.xp);
    var levelEl = $("#spaceLevel");
    if (levelEl) levelEl.textContent = info.level.name;
    var xpBar = $("#spaceXpBar");
    if (xpBar) {
      var pct = info.next
        ? Math.round(((state.xp - info.level.min) / Math.max(1, info.next.min - info.level.min)) * 100)
        : 100;
      xpBar.style.width = Math.max(2, Math.min(100, pct)) + "%";
    }

    var progress = progressPercent();
    var progEl = $("#spaceProgress");
    if (progEl) progEl.textContent = progress + "%";
    var cfuBar = $("#spaceCfuBar");
    if (cfuBar) cfuBar.style.width = Math.max(2, progress) + "%";
    var cfuEl = $("#spaceCfu");
    if (cfuEl) cfuEl.textContent = String(cfuDone());
    var coursesEl = $("#spaceCourses");
    if (coursesEl) coursesEl.textContent = String(coursesDone());

    var guidePct = overallGuidePercent();
    var guideEl = $("#spaceGuide");
    if (guideEl) guideEl.textContent = guidePct + "%";
    var guideBar = $("#spaceGuideBar");
    if (guideBar) guideBar.style.width = Math.max(2, guidePct) + "%";
    var procDone = $("#spaceProcDone");
    if (procDone) procDone.textContent = String(completedProcedures());
    var procTotal = $("#spaceProcTotal");
    if (procTotal) procTotal.textContent = String(PROCEDURES.length);

    renderSpaceSaved();
    renderSpaceInterests();
    renderSpaceContribs();
    renderSpaceSuggestions();
  }

  function renderSpaceSaved() {
    var box = $("#spaceSavedList");
    if (!box) return;
    var rows = [];
    state.favorites.forEach(function (id) {
      var p = placeById(id);
      if (p) rows.push({ icon: "pin", label: p.name, kind: "مكان" });
    });
    state.savedHousing.forEach(function (id) {
      HOUSING.forEach(function (h) { if (h.id === id) rows.push({ icon: "key", label: h.title, kind: "سكن" }); });
    });
    state.savedJobs.forEach(function (id) {
      CAREERS.forEach(function (c) { if (c.id === id) rows.push({ icon: "briefcase", label: c.role, kind: "فرصة" }); });
    });
    if (!rows.length) {
      box.innerHTML = '<div class="space-list-empty">لسه مفيش محفوظات… احفظ مكان أو سكن أو فرصة وهتلاقيها هنا.</div>';
      return;
    }
    box.innerHTML = rows.slice(0, 5).map(function (r) {
      return '<div class="space-list-row">' + ic(r.icon) + "<span>" + esc(r.label) + "</span><b>" + esc(r.kind) + "</b></div>";
    }).join("") + (rows.length > 5 ? '<div class="space-list-empty">+ ' + (rows.length - 5) + " محفوظات تانية</div>" : "");
  }

  function renderSpaceInterests() {
    var box = $("#spaceInterestsList");
    if (!box) return;
    if (!state.interests.length) {
      box.innerHTML = '<div class="space-list-empty">لسه مسجلتش اهتمام بأي جامعة. افتح الخريطة واختار اللي بعد UniBg.</div>';
      return;
    }
    box.innerHTML = state.interests.map(function (id) {
      var u = universityById(id);
      return '<div class="space-interest-row"><span>' + esc(u.flag) + "</span><b>" + esc(u.short + " · " + u.ar) + "</b><small>" + esc(u.eta || "قريباً") + "</small></div>";
    }).join("");
  }

  function renderSpaceContribs() {
    var box = $("#spaceContribList");
    if (!box) return;
    if (!state.contributions.length) {
      box.innerHTML = '<div class="space-list-empty">لسه مفيش مساهمات. شارك سؤال من بنك الأسئلة وساعد زميل.</div>';
      return;
    }
    box.innerHTML = state.contributions.slice(0, 3).map(function (c) {
      return '<div class="space-contrib-row"><b>' + esc(c.course) + "</b><p>" + esc(c.question) + "</p></div>";
    }).join("");
  }

  function renderSpaceSuggestions() {
    var box = $("#spaceSuggestions");
    if (!box) return;
    if (!state.suggestions.length) {
      box.innerHTML = '<div class="space-list-empty">لسه مفيش اقتراحات. لو عندك جامعة نفسك تشوفها على UniAtlas، قولنا عليها.</div>';
      return;
    }
    box.innerHTML = state.suggestions.map(function (s) {
      var date = "";
      try { date = new Date(s.date).toLocaleDateString("ar-EG"); } catch (e) {}
      return '<div class="space-suggestion-row">' + ic("sparkles") +
        "<div><b>" + esc(s.name) + " · " + esc(s.city) + "</b>" +
        "<p>" + esc(s.country) + (s.note ? " — " + esc(s.note) : "") + "</p>" +
        "<small>اتسجلت " + esc(date || "محلياً") + "</small></div></div>";
    }).join("");
  }

  function openSuggest() {
    var form = $("#suggestForm");
    if (form) form.reset();
    openModal("suggestModal");
    var name = $("#suggestName");
    if (name) window.setTimeout(function () { name.focus(); }, 180);
  }

  function submitSuggestion(e) {
    if (e) e.preventDefault();
    var name = $("#suggestName");
    var city = $("#suggestCity");
    var country = $("#suggestCountry");
    var note = $("#suggestNote");
    if (!name || !city || !country || !name.value.trim() || !city.value.trim() || !country.value.trim()) {
      toast("ناقص بيانات", "اكتب اسم الجامعة والمدينة والدولة.");
      return;
    }
    state.suggestions.unshift({
      name: name.value.trim(),
      city: city.value.trim(),
      country: country.value.trim(),
      note: note ? note.value.trim() : "",
      date: new Date().toISOString()
    });
    save();
    closeModal("suggestModal");
    renderSpaceSuggestions();
    renderUniversityPreview();
    awardXP(10, "شكراً على اقتراحك", "هنراجع " + name.value.trim() + " ضمن خطة UniAtlas.", 10);
  }

  function exportData() {
    var payload = {
      app: "UniAtlas",
      exportedAt: new Date().toISOString(),
      note: "Demo data — stored locally in your browser.",
      state: state
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "uniatlas-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("صدّرنا بياناتك", "ملف JSON فيه كل تقدمك ومحفوظاتك.", 3);
  }

  function resetDemo() {
    if (!window.confirm("هتصفّر كل بيانات UniAtlas المحفوظة على الجهاز. متأكد؟")) return;
    try {
      window.localStorage.removeItem(LS_KEY);
      LEGACY_KEYS.forEach(function (key) { window.localStorage.removeItem(key); });
    } catch (e) {}
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    window.location.reload();
  }

  /* ======================================================================
     GLOBAL DYNAMIC CONTROLS
     ====================================================================== */
  document.addEventListener("click", function (e) {
    var communityJump = e.target.closest("[data-community-jump]");
    if (communityJump) { e.preventDefault(); scrollToCommunity(communityJump.getAttribute("data-community-jump")); return; }

    var groupFilter = e.target.closest("[data-group-filter]");
    if (groupFilter) { communityGroupFilter = groupFilter.getAttribute("data-group-filter"); renderGroups(); return; }

    var eventFilter = e.target.closest("[data-event-filter]");
    if (eventFilter) { communityEventFilter = eventFilter.getAttribute("data-event-filter"); renderEvents(); return; }

    var postFilter = e.target.closest("[data-post-filter]");
    if (postFilter) { communityPostFilter = postFilter.getAttribute("data-post-filter"); renderPosts(); return; }

    var groupReset = e.target.closest("[data-group-reset]");
    if (groupReset) {
      communityGroupFilter = "all";
      communityGroupQuery = "";
      var groupSearch = $("#groupSearch");
      if (groupSearch) groupSearch.value = "";
      renderGroups();
      return;
    }

    var eventReset = e.target.closest("[data-event-reset]");
    if (eventReset) { communityEventFilter = "all"; renderEvents(); return; }

    var postReset = e.target.closest("[data-post-reset]");
    if (postReset) { communityPostFilter = "all"; renderPosts(); return; }

    var storyFilter = e.target.closest("[data-story-filter]");
    if (storyFilter) { communityStoryFilter = storyFilter.getAttribute("data-story-filter"); renderStories(); return; }

    var storyReset = e.target.closest("[data-story-reset]");
    if (storyReset) { communityStoryFilter = "all"; renderStories(); return; }

    var helpStory = e.target.closest("[data-help-story]");
    if (helpStory) { toggleStoryHelpful(helpStory.getAttribute("data-help-story")); return; }

    var deleteStoryBtn = e.target.closest("[data-delete-story]");
    if (deleteStoryBtn) { deleteStory(deleteStoryBtn.getAttribute("data-delete-story")); return; }

    var toggleComments = e.target.closest("[data-toggle-comments]");
    if (toggleComments) { togglePostComments(toggleComments.getAttribute("data-toggle-comments")); return; }

    var copyDeal = e.target.closest("[data-copy-deal]");
    if (copyDeal) { copyDealCode(copyDeal.getAttribute("data-copy-deal")); return; }

    var saveDeal = e.target.closest("[data-save-deal]");
    if (saveDeal) { toggleDealSave(saveDeal.getAttribute("data-save-deal")); return; }

    var likePost = e.target.closest("[data-like-post]");
    if (likePost) { togglePostLike(likePost.getAttribute("data-like-post")); return; }

    var deletePostBtn = e.target.closest("[data-delete-post]");
    if (deletePostBtn) { deletePost(deletePostBtn.getAttribute("data-delete-post")); return; }

    var saveHousing = e.target.closest("[data-save-housing]");
    if (saveHousing) { toggleHousingSave(saveHousing.getAttribute("data-save-housing")); return; }

    var housingDetail = e.target.closest("[data-housing-detail]");
    if (housingDetail) { openHousingModal(housingDetail.getAttribute("data-housing-detail")); return; }

    var saveJob = e.target.closest("[data-save-job]");
    if (saveJob) { toggleJobSave(saveJob.getAttribute("data-save-job")); return; }

    var careerDetail = e.target.closest("[data-career-detail]");
    if (careerDetail) { openCareerModal(careerDetail.getAttribute("data-career-detail")); return; }

    var interest = e.target.closest("[data-interest-uni]");
    if (interest) { toggleInterest(interest.getAttribute("data-interest-uni")); return; }

    var enterUni = e.target.closest("[data-enter-uni]");
    if (enterUni) { enterUniversity(enterUni.getAttribute("data-enter-uni")); return; }

    var suggestBtn = e.target.closest("[data-open-suggest]");
    if (suggestBtn) { openSuggest(); return; }

    var openCourse = e.target.closest("[data-open-course]");
    if (openCourse) { openCourseModal(openCourse.getAttribute("data-open-course")); return; }

    var cycle = e.target.closest("[data-modal-cycle]");
    if (cycle) { cycleCourse(cycle.getAttribute("data-modal-cycle")); return; }

    var tab = e.target.closest("[data-detail-tab]");
    if (tab) {
      var modal = tab.closest(".detail-box");
      if (modal) {
        var name = tab.getAttribute("data-detail-tab");
        $$(".detail-tab", modal).forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        $$(".detail-pane", modal).forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-pane") === name); });
      }
      return;
    }

    var rate = e.target.closest("[data-rate]");
    if (rate) {
      var parts = rate.getAttribute("data-rate").split(":");
      rateProf(parts[0], parseInt(parts[1], 10));
      return;
    }

    var notes = e.target.closest("[data-download-notes]");
    if (notes) { downloadNotes(notes.getAttribute("data-download-notes")); return; }

    var prefill = e.target.closest("[data-prefill-contrib]");
    if (prefill) {
      closeModal("profModal");
      navigate("exams");
      var input = $("#contribCourse");
      if (input) {
        input.value = prefill.getAttribute("data-prefill-contrib");
        var q = $("#contribQuestion");
        if (q) q.focus();
      }
      window.setTimeout(function () {
        var form = $("#contributeForm");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
      return;
    }

    var modalMap = e.target.closest("[data-modal-map]");
    if (modalMap) {
      closeModal("placeModal");
      openPlaceOnMap(modalMap.getAttribute("data-modal-map"));
      return;
    }

    var modalFav = e.target.closest("[data-modal-fav]");
    if (modalFav) { toggleFavorite(modalFav.getAttribute("data-modal-fav")); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var step = e.target.closest("[data-proc-step]");
    if (step) {
      e.preventDefault();
      toggleProcStep(parseInt(step.getAttribute("data-proc-step"), 10));
      return;
    }
    var prof = e.target.closest("[data-prof]");
    if (prof && e.target === prof) {
      e.preventDefault();
      openProfModal(prof.getAttribute("data-prof"));
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();



