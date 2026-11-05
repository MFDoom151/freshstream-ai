import { Locale } from '@/types/i18n';

export interface LocalizedText {
  en: string;
  ru: string;
  kz: string;
}

export interface TITRWaypointNode {
  id: string;
  code: string;
  svgX: number;
  svgY: number;
  lat: string;
  lng: string;
  name: LocalizedText;
  country: LocalizedText;
  type: 'gauge-break' | 'seaport' | 'rail-hub' | 'consolidation-depot' | 'customs-gateway';
  typeBadge: LocalizedText;
  gauge: string;
  annualThroughputTeu: string;
  coldStorageCapacityM3: string;
  averageDwellHours: number;
  ambientTempC: string;
  shorePowerPlugs: string;
  primaryRiskFactor: LocalizedText;
  activeBottleneckAlert?: {
    severity: 'CRITICAL' | 'WARNING' | 'OPTIMAL';
    title: LocalizedText;
    detail: LocalizedText;
  };
}

export interface LiveContainerPin {
  id: string;
  shipmentRouteId: string;
  svgX: number;
  svgY: number;
  commodityKey: 'beef' | 'cherries' | 'dairy' | 'apples-pears';
  commodityName: LocalizedText;
  exporter: string;
  carrier: string;
  origin: LocalizedText;
  destination: LocalizedText;
  currentHubId: string;
  currentLocationLabel: LocalizedText;
  transportMode: 'RAIL_1520' | 'CASPIAN_FERRY' | 'RAIL_1435' | 'TIR_TRUCK';
  transportModeLabel: LocalizedText;
  assetValueUsd: number;
  bhi: number;
  predictedRulHours: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  rescueWindowHours?: number;
  telemetry: {
    tempC: number;
    setpointC: number;
    rhPct: number;
    ethanolPpm: number;
    co2Ppm: number;
    ethylenePpm: number;
    vibrationG: number;
    batteryVolts: number;
  };
  activeAction: LocalizedText;
}

export interface ReeferSensorCallout {
  id: string;
  code: string;
  number: string;
  svgX: number;
  svgY: number;
  leaderEndX: number;
  leaderEndY: number;
  colorHex: string;
  badgeClass: string;
  modelName: string;
  title: LocalizedText;
  PlacementZone: LocalizedText;
  measurementRange: string;
  accuracySpec: string;
  responseTimeT90: string;
  samplingInterval: string;
  protocolInterface: string;
  liveReadoutValue: string;
  liveReadoutStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  engineeringPrinciple: LocalizedText;
  coldChainImpact: LocalizedText;
}

export interface PerishableCargoClass {
  id: 'beef' | 'apples-pears' | 'cherries' | 'dairy';
  code: string;
  hsCode: string;
  name: LocalizedText;
  regionalOrigin: LocalizedText;
  spoilageMechanism: LocalizedText;
  eaJoules: number;
  eaKj: number;
  q10Coeff: number;
  tRefC: number;
  tOptMinC: number;
  tOptMaxC: number;
  tFreezeC: number;
  rhOptMinPct: number;
  rhOptMaxPct: number;
  vocBaselinePpm: number;
  vocWarningPpm: number;
  vocCriticalPpm: number;
  baselineShelfLifeHours: number;
  baselineShelfLifeDays: number;
  defaultCargoValueUsd: number;
  gammaEth: number;
  kappaVib: number;
  packagingSpec: LocalizedText;
}

export const TITR_WAYPOINTS: TITRWaypointNode[] = [
  {
    id: 'dostyk',
    code: 'KZDST',
    svgX: 980,
    svgY: 165,
    lat: '45.2500° N',
    lng: '82.4833° E',
    name: {
      en: 'Dostyk — Alashankou Gauge-Break Gateway',
      ru: 'Достык — Алашанькоу (Смена колеи)',
      kz: 'Достық — Алашанькоу (Табан ауыстыру торабы)',
    },
    country: {
      en: 'Kazakhstan / China Border',
      ru: 'Казахстан / Граница КНР',
      kz: 'Қазақстан / ҚХР шекарасы',
    },
    type: 'gauge-break',
    typeBadge: {
      en: 'GAUGE BREAK 1435⇄1520',
      ru: 'СМЕНА КОЛЕИ 1435⇄1520',
      kz: 'ТАБАН АУЫСТЫРУ 1435⇄1520',
    },
    gauge: '1435 mm (UIC) ⇄ 1520 mm (KTZ Broad)',
    annualThroughputTeu: '420,000 TEU/yr',
    coldStorageCapacityM3: '32,000 m³',
    averageDwellHours: 18.5,
    ambientTempC: '+14.2°C',
    shorePowerPlugs: '128 Reefer Racks',
    primaryRiskFactor: {
      en: 'Gantry crane container transshipment between 1435mm and 1520mm flatcars; 2.5–4h shore-power disconnection window.',
      ru: 'Крановая перегрузка рефконтейнеров между платформами 1435 мм и 1520 мм; окно отключения питания 2.5–4 часа.',
      kz: '1435 мм және 1520 мм платформалар арасында рефконтейнерлерді кранмен қайта тиеу; 2.5–4 сағат қуаттан ажырату.',
    },
  },
  {
    id: 'almaty',
    code: 'KZALA',
    svgX: 855,
    svgY: 275,
    lat: '43.2389° N',
    lng: '76.8897° E',
    name: {
      en: 'Almaty Zhetysu Agro-Consolidation Hub',
      ru: 'Агрологистический хаб Алматы (Жетысу)',
      kz: 'Алматы (Жетісу) агрологистикалық хабы',
    },
    country: {
      en: 'Kazakhstan (Almaty Region)',
      ru: 'Казахстан (Алматинская обл.)',
      kz: 'Қазақстан (Алматы облысы)',
    },
    type: 'consolidation-depot',
    typeBadge: {
      en: 'ORIGIN COLD DEPOT',
      ru: 'ТЕРМИНАЛ ПРЕДОХЛАЖДЕНИЯ',
      kz: 'АЛДЫН АЛА САЛҚЫНДАТУ ХАБЫ',
    },
    gauge: '1520 mm KTZ Electrified Mainline',
    annualThroughputTeu: '450,000 TEU/yr',
    coldStorageCapacityM3: '95,000 m³',
    averageDwellHours: 11.0,
    ambientTempC: '+19.8°C',
    shorePowerPlugs: '240 Reefer Racks',
    primaryRiskFactor: {
      en: 'Incomplete hydro-cooling of orchard fruit prior to container stuffing causes high initial field heat load.',
      ru: 'Неполное гидроохлаждение плодов перед загрузкой в контейнер создает избыточную стартовую тепловую нагрузку.',
      kz: 'Контейнерге тиеу алдында жемістерді толық салқындатпау бастапқы жылу жүктемесін арттырады.',
    },
  },
  {
    id: 'kuryk-aktau',
    code: 'KZKRK',
    svgX: 545,
    svgY: 280,
    lat: '43.1800° N',
    lng: '51.6500° E',
    name: {
      en: 'Port Kuryk & Aktau Caspian Ferry Terminal',
      ru: 'Паромный комплекс Курык и порт Актау',
      kz: 'Құрық паром кешені және Ақтау порты',
    },
    country: {
      en: 'Kazakhstan (Mangystau)',
      ru: 'Казахстан (Мангистау)',
      kz: 'Қазақстан (Маңғыстау)',
    },
    type: 'seaport',
    typeBadge: {
      en: 'PRIMARY CASPIAN CHOKEPOINT',
      ru: 'ГЛАВНЫЙ УЗЕЛ РИСКА КАСПИЯ',
      kz: 'КАСПИЙ НЕГІЗГІ ТӘУЕКЕЛ ТОРАБЫ',
    },
    gauge: '1520 mm Rail-to-Ro-Pax Linkspan',
    annualThroughputTeu: '260,000 TEU/yr',
    coldStorageCapacityM3: '40,000 m³',
    averageDwellHours: 42.0,
    ambientTempC: '+28.6°C',
    shorePowerPlugs: '64 Pier Receptacles',
    primaryRiskFactor: {
      en: 'Severe rail yard staging bottleneck; shore-power disconnection during shunting; Caspian gale storms halting Ro-Pax ferry berthing.',
      ru: 'Длительный отстой на путях ожидания; отключение питания при маневрах; штормы на Каспии, останавливающие паромную погрузку.',
      kz: 'Күту жолдарында ұзақ тұрып қалу; маневр кезінде қуаттың өшуі; паром тиеуді тоқтататын Каспий дауылдары.',
    },
    activeBottleneckAlert: {
      severity: 'CRITICAL',
      title: {
        en: '42h Staging Queue • Caspian Gale Sea State 5',
        ru: 'Очередь 42ч на накопителе • Шторм на Каспии 5 баллов',
        kz: 'Тұрақта 42 сағат кезек • Каспийде 5 балдық дауыл',
      },
      detail: {
        en: 'Wind gusts 24 m/s delaying Ro-Pax vessel berthing. Siding #4 shore-power feeder overloaded; FreshStream Edge AI switched 14 reefers to pulse pre-cooling.',
        ru: 'Порывы ветра 24 м/с задерживают швартовку парома. Фидер питания пути №4 перегружен; AI перевел 14 рефов в режим импульсного переохлаждения.',
        kz: 'Жел екпіні 24 м/с паромды кешіктіруде. №4 жол фидері шамадан тыс жүктелген; AI 14 рефконтейнерді импульстік салқындатуға ауыстырды.',
      },
    },
  },
  {
    id: 'caspian-ferry',
    code: 'X-CASP',
    svgX: 465,
    svgY: 325,
    lat: '41.5000° N',
    lng: '50.4000° E',
    name: {
      en: 'Caspian Sea Maritime Ro-Pax Fairway',
      ru: 'Каспийский морской паромный переход',
      kz: 'Каспий теңіз паром өткелі',
    },
    country: {
      en: 'Caspian International Sector (260 NM)',
      ru: 'Каспийский морской сектор (260 миль)',
      kz: 'Каспий теңіз секторы (260 теңіз милі)',
    },
    type: 'seaport',
    typeBadge: {
      en: 'MARITIME RO-PAX DECK',
      ru: 'МОРСКОЙ ПАРОМ РО-ПАКС',
      kz: 'ТЕҢІЗ РО-ПАКС ПАРОМЫ',
    },
    gauge: '1520 mm Twin-Deck Rail Ferry',
    annualThroughputTeu: '185,000 TEU/yr',
    coldStorageCapacityM3: '54 Plugs / Vessel',
    averageDwellHours: 22.0,
    ambientTempC: '+24.1°C',
    shorePowerPlugs: '54 Marine 440V/60Hz',
    primaryRiskFactor: {
      en: 'Closed steel deck cellular blackout (solved by 868MHz LoRaWAN + Iridium satellite mesh) and ship generator voltage sag.',
      ru: 'Отсутствие сотовой связи в стальном трюме (решается LoRaWAN 868 МГц + спутником Iridium) и просадки судового генератора.',
      kz: 'Болат палубада ұялы байланыстың болмауы (LoRaWAN 868 МГц + Iridium спутнигі арқылы шешіледі) және генератор кернеуінің ауытқуы.',
    },
  },
  {
    id: 'baku-alat',
    code: 'AZBAK',
    svgX: 385,
    svgY: 355,
    lat: '39.9950° N',
    lng: '49.4100° E',
    name: {
      en: 'Port of Baku (Alat Intermodal Terminal)',
      ru: 'Бакинский порт (Интермодальный терминал Алят)',
      kz: 'Баку порты (Әләт интермодальді терминалы)',
    },
    country: {
      en: 'Azerbaijan',
      ru: 'Азербайджан',
      kz: 'Әзербайжан',
    },
    type: 'seaport',
    typeBadge: {
      en: 'WEST CASPIAN PORT HUB',
      ru: 'ЗАПАДНЫЙ ПОРТ КАСПИЯ',
      kz: 'БАТЫС КАСПИЙ ПОРТ ХАБЫ',
    },
    gauge: '1520 mm ADY Rail Consist',
    annualThroughputTeu: '550,000 TEU/yr',
    coldStorageCapacityM3: '75,000 m³',
    averageDwellHours: 19.5,
    ambientTempC: '+26.4°C',
    shorePowerPlugs: '160 Terminal Plugs',
    primaryRiskFactor: {
      en: 'Disembarkation ramp queue and customs transit manifest validation before Baku–Tbilisi–Kars (BTK) rail dispatch.',
      ru: 'Очередь при выкатке с аппарели парома и оформление транзитных деклараций перед отправкой по ж/д Баку — Тбилиси — Карс.',
      kz: 'Паромнан түсіру кезегі және Баку — Тбилиси — Карс теміржолына жөнелту алдындағы кедендік рәсімдеу.',
    },
    activeBottleneckAlert: {
      severity: 'WARNING',
      title: {
        en: '4.5h Shore-Power Reconnection Queue at Alat Pier',
        ru: 'Очередь 4.5ч на подключение к береговой сети в порту Алят',
        kz: 'Әләт пирсінде жағалау желісіне қосылу кезегі (4.5 сағат)',
      },
      detail: {
        en: 'Disembarked ferry block awaiting crane transfer to ADY express flatcars under +26.4°C solar radiation.',
        ru: 'Партия с парома ожидает крановой перегрузки на скоростные платформы ADY при солнечном нагреве +26.4°C.',
        kz: 'Паромнан түскен партия +26.4°C күн ыстығында ADY платформаларына кранмен тиеуді күтуде.',
      },
    },
  },
  {
    id: 'tbilisi-poti',
    code: 'GETBS',
    svgX: 270,
    svgY: 295,
    lat: '41.7151° N',
    lng: '44.8271° E',
    name: {
      en: 'Tbilisi Node, Akhalkalaki & Port of Poti',
      ru: 'Тбилисский узел, Ахалкалаки и порт Поти',
      kz: 'Тбилиси торабы, Ахалкалаки және Поти порты',
    },
    country: {
      en: 'Georgia (Caucasus Transit)',
      ru: 'Грузия (Кавказский транзит)',
      kz: 'Грузия (Кавказ транзиті)',
    },
    type: 'gauge-break',
    typeBadge: {
      en: 'CAUCASUS GAUGE BREAK 1520⇄1435',
      ru: 'КАВКАЗ: СМЕНА КОЛЕИ 1520⇄1435',
      kz: 'КАВКАЗ: ТАБАН АУЫСТЫРУ 1520⇄1435',
    },
    gauge: '1520 mm (GR) ⇄ 1435 mm (BTK Standard)',
    annualThroughputTeu: '480,000 TEU/yr',
    coldStorageCapacityM3: '60,000 m³',
    averageDwellHours: 14.0,
    ambientTempC: '+21.0°C',
    shorePowerPlugs: '110 Yard Plugs',
    primaryRiskFactor: {
      en: 'Bogie exchange at Akhalkalaki (1520mm to 1435mm) and dynamic shock vibrations (>1.2g) across Caucasus mountain grades.',
      ru: 'Смена колесных пар в Ахалкалаки (1520 -> 1435 мм) и продольно-динамические удары (>1.2g) на горных перевалах Кавказа.',
      kz: 'Ахалкалакиде доңғалақ жұптарын ауыстыру (1520 -> 1435 мм) және Кавказ тау асуларындағы динамикалық соққылар (>1.2g).',
    },
  },
  {
    id: 'istanbul-halkali',
    code: 'TRIST',
    svgX: 110,
    svgY: 250,
    lat: '40.9833° N',
    lng: '28.8167° E',
    name: {
      en: 'Istanbul Halkali & Marmaray European Gateway',
      ru: 'Стамбул Халкалы и тоннель Мармарай (ЕС)',
      kz: 'Ыстанбұл Халқалы және Мармарай терминалы (ЕО)',
    },
    country: {
      en: 'Turkey / European Union Corridor',
      ru: 'Турция / Коридор в ЕС',
      kz: 'Түркия / ЕО логистикалық дәлізі',
    },
    type: 'customs-gateway',
    typeBadge: {
      en: 'EU PHYTOSANITARY GATEWAY',
      ru: 'ФИТОСАНИТАРНЫЙ ШЛЮЗ ЕС',
      kz: 'ЕО ФИТОСАНИТАРЛЫҚ ШЛЮЗІ',
    },
    gauge: '1435 mm European Standard UIC',
    annualThroughputTeu: '1,400,000 TEU/yr',
    coldStorageCapacityM3: '220,000 m³',
    averageDwellHours: 8.5,
    ambientTempC: '+22.5°C',
    shorePowerPlugs: '380 Terminal Plugs',
    primaryRiskFactor: {
      en: 'Marmaray subsea Bosphorus night freight slot synchronization and automated DCSA e-Phytosanitary certificate audit.',
      ru: 'Синхронизация с ночным окном прохода через подводный тоннель Босфора (Мармарай) и электронный фитосанитарный аудит DCSA.',
      kz: 'Босфор астындағы Мармарай тоннелінің түнгі жүк терезесімен үйлестіру және DCSA электрондық фитосанитарлық аудиті.',
    },
  },
];

export const LIVE_CONTAINER_PINS: LiveContainerPin[] = [
  {
    id: 'FS-8821',
    shipmentRouteId: 'FS-8821',
    svgX: 600,
    svgY: 265,
    commodityKey: 'beef',
    commodityName: {
      en: 'KazBeef Organic Chilled Grass-Fed Beef',
      ru: 'Охлажденная мраморная говядина KazBeef',
      kz: 'KazBeef салқындатылған мәрмәр сиыр еті',
    },
    exporter: 'KazBeef Processing LLP (Kostanay)',
    carrier: 'KTZ Express / ADY Container',
    origin: {
      en: 'Astana / Kostanay, Kazakhstan',
      ru: 'Астана / Костанай, Казахстан',
      kz: 'Астана / Қостанай, Қазақстан',
    },
    destination: {
      en: 'Istanbul & Dubai Cold Hub',
      ru: 'Стамбул / Логистический хаб Дубай',
      kz: 'Ыстанбұл / Дубай логистикалық хабы',
    },
    currentHubId: 'kuryk-aktau',
    currentLocationLabel: {
      en: 'Approaching Port Kuryk Rail Terminal (Mangystau)',
      ru: 'Подход к паромному комплексу Курык (Мангистау)',
      kz: 'Құрық паром кешеніне жақындау (Маңғыстау)',
    },
    transportMode: 'RAIL_1520',
    transportModeLabel: {
      en: '1520mm Refrigerated Rail Block',
      ru: 'Ж/д рефсекция (колея 1520 мм)',
      kz: '1520 мм теміржол рефсекциясы',
    },
    assetValueUsd: 72000,
    bhi: 96.5,
    predictedRulHours: 440,
    status: 'OPTIMAL',
    telemetry: {
      tempC: 1.2,
      setpointC: 1.0,
      rhPct: 84,
      ethanolPpm: 3.2,
      co2Ppm: 1420,
      ethylenePpm: 0.04,
      vibrationG: 0.25,
      batteryVolts: 13.4,
    },
    activeAction: {
      en: 'Cold-chain integrity optimal (+1.2°C core). 15-min LoRaWAN telemetry heartbeat synced with KTZ locomotive gateway.',
      ru: 'Холодовая цепь в эталонной норме (+1.2°C в толще). Пакеты LoRaWAN каждые 15 мин синхронизированы со шлюзом локомотива КТЖ.',
      kz: 'Суық тізбегі қалыпты (+1.2°C). 15 минуттық LoRaWAN телеметриясы ҚТЖ локомотив шлюзімен синхрондалған.',
    },
  },
  {
    id: 'FS-9042',
    shipmentRouteId: 'FS-9042',
    svgX: 525,
    svgY: 298,
    commodityKey: 'cherries',
    commodityName: {
      en: 'Altyn Dan Sweet Cherries & Mountain Berries',
      ru: 'Свежая черешня и горные ягоды Altyn Dan',
      kz: 'Altyn Dan тәтті шиесі мен тау жидектері',
    },
    exporter: 'Altyn Dan Agro Holdings (Almaty)',
    carrier: 'Caspian Bosphorus Reefer Line',
    origin: {
      en: 'Almaty Agri-Valley, Kazakhstan',
      ru: 'Алматинская аграрная долина, РК',
      kz: 'Алматы аграрлық алқабы, ҚР',
    },
    destination: {
      en: 'Baku Agromarket, Azerbaijan',
      ru: 'Бакинский агрохаб, Азербайджан',
      kz: 'Баку агрохабы, Әзербайжан',
    },
    currentHubId: 'kuryk-aktau',
    currentLocationLabel: {
      en: 'Port Kuryk Staging Buffer Siding #4',
      ru: 'Порт Курык • Накопительный путь №4',
      kz: 'Құрық порты • №4 жинақтау жолы',
    },
    transportMode: 'CASPIAN_FERRY',
    transportModeLabel: {
      en: 'Rail-to-Ferry Staging Buffer',
      ru: 'Накопитель перед паромом Ро-Пакс',
      kz: 'Ро-Пакс паромы алдындағы жинақтаушы',
    },
    assetValueUsd: 48000,
    bhi: 48.2,
    predictedRulHours: 28,
    status: 'CRITICAL',
    rescueWindowHours: 14.7,
    telemetry: {
      tempC: 7.8,
      setpointC: 1.0,
      rhPct: 92,
      ethanolPpm: 38.4,
      co2Ppm: 4850,
      ethylenePpm: 4.2,
      vibrationG: 0.82,
      batteryVolts: 13.1,
    },
    activeAction: {
      en: 'CRITICAL VOLATILE ETHANOL SURGE (38.4 ppm > 35 ppm threshold). Anaerobic fermentation detected. Priority Ro-Pax boarding or immediate transfer to Aktau Cold Depot within 14.7h rescue window.',
      ru: 'КРИТИЧЕСКИЙ ВЫБРОС ЭТАНОЛА (38.4 ppm > порога 35 ppm). Началось анаэробное брожение. Приоритетная погрузка на паром либо перегрузка в камеры Актау в течение 14.7 ч.',
      kz: 'ЭТАНОЛДЫҢ КРИТИКАЛЫҚ АРТУЫ (38.4 ppm > 35 ppm шегі). Анаэробты ашу анықталды. 14.7 сағат құтқару терезесінде паромға шұғыл тиеу немесе Ақтау қоймасына ауыстыру қажет.',
    },
  },
  {
    id: 'FS-7710',
    shipmentRouteId: 'FS-4103',
    svgX: 375,
    svgY: 368,
    commodityKey: 'dairy',
    commodityName: {
      en: 'Saumal Bio-Kefir & Cultured Probiotic Dairy',
      ru: 'Органический биокефир и молочная продукция Saumal',
      kz: 'Saumal органикалық биокефирі мен сүт өнімдері',
    },
    exporter: 'Eurasia Bio-Dairy LLC',
    carrier: 'Georgian Railways / Silk Road Trans',
    origin: {
      en: 'Kostanay Region, Kazakhstan',
      ru: 'Костанайская область, Казахстан',
      kz: 'Қостанай облысы, Қазақстан',
    },
    destination: {
      en: 'Tbilisi & Poti Terminal, Georgia',
      ru: 'Тбилиси и терминал Поти, Грузия',
      kz: 'Тбилиси және Поти терминалы, Грузия',
    },
    currentHubId: 'baku-alat',
    currentLocationLabel: {
      en: 'Port of Baku (Alat Intermodal Berth #2)',
      ru: 'Бакинский порт (Терминал Алят, причал №2)',
      kz: 'Баку порты (Әләт терминалы, №2 айлақ)',
    },
    transportMode: 'CASPIAN_FERRY',
    transportModeLabel: {
      en: 'Ferry Disembarkation Ramp',
      ru: 'Выкатка с морского парома',
      kz: 'Теңіз паромынан түсіру аппарелі',
    },
    assetValueUsd: 36000,
    bhi: 68.4,
    predictedRulHours: 72,
    status: 'WARNING',
    telemetry: {
      tempC: 5.6,
      setpointC: 2.5,
      rhPct: 79,
      ethanolPpm: 16.2,
      co2Ppm: 2310,
      ethylenePpm: 0.18,
      vibrationG: 0.58,
      batteryVolts: 13.2,
    },
    activeAction: {
      en: 'Thermal drift (+5.6°C) after marine generator voltage sag. Conductor AI engaged secondary evaporator fan cycle and flagged priority shore-power plug at Alat Terminal.',
      ru: 'Тепловой дрейф (+5.6°C) после просадки судового генератора. AI включил продувку испарителя и назначил приоритетное подключение к розетке терминала Алят.',
      kz: 'Кеме генераторының кернеуі түскеннен кейін жылу ауытқуы (+5.6°C). AI қосымша желдеткішті қосып, Әләт терминалында бірінші кезекте қуатқа қосуды белгіледі.',
    },
  },
  {
    id: 'FS-6104',
    shipmentRouteId: 'FS-6218',
    svgX: 255,
    svgY: 280,
    commodityKey: 'apples-pears',
    commodityName: {
      en: 'Zhetysu Reserve Aport Apples & Mountain Pears',
      ru: 'Алматинский яблочный апорт и горные груши Жетысу',
      kz: 'Жетісу апорт алмасы мен тау алмұрттары',
    },
    exporter: 'Zhetysu Orchards Consortium',
    carrier: 'Trans-Caucasus Intermodal Rail',
    origin: {
      en: 'Ile-Alatau Foothills, Kazakhstan',
      ru: 'Предгорья Заилийского Алатау, РК',
      kz: 'Іле Алатауының бөктері, ҚР',
    },
    destination: {
      en: 'Istanbul Halkali Distribution Hub, Turkey',
      ru: 'Распределительный хаб Халкалы, Стамбул',
      kz: 'Халқалы логистикалық хабы, Ыстанбұл',
    },
    currentHubId: 'tbilisi-poti',
    currentLocationLabel: {
      en: 'Akhalkalaki Gauge-Break Yard (Georgia)',
      ru: 'Станция смены колеи Ахалкалаки (Грузия)',
      kz: 'Ахалкалаки табан ауыстыру станциясы (Грузия)',
    },
    transportMode: 'RAIL_1435',
    transportModeLabel: {
      en: '1435mm BTK Express Rail Consist',
      ru: 'Экспресс-состав БТК (колея 1435 мм)',
      kz: '1435 мм БТК экспресс-құрамы',
    },
    assetValueUsd: 54000,
    bhi: 91.4,
    predictedRulHours: 685,
    status: 'OPTIMAL',
    telemetry: {
      tempC: 1.1,
      setpointC: 0.8,
      rhPct: 91,
      ethanolPpm: 4.8,
      co2Ppm: 1650,
      ethylenePpm: 0.35,
      vibrationG: 0.38,
      batteryVolts: 13.5,
    },
    activeAction: {
      en: 'Bogie exchange (1520mm -> 1435mm) completed in 1.8h. Climacteric ethylene suppressed below 0.4 ppm via fresh-air damper modulation.',
      ru: 'Перестановка на колею 1435 мм завершена за 1.8 ч. Климактерический этилен удерживается ниже 0.4 ppm модуляцией приточного клапана.',
      kz: '1435 мм табанға ауыстыру 1.8 сағатта аяқталды. Климактериялық этилен ауа клапанын реттеу арқылы 0.4 ppm-нен төмен деңгейде сақталуда.',
    },
  },
];

export const REEFER_SENSOR_CALLOUTS: ReeferSensorCallout[] = [
  {
    id: 'sensor-mq303a',
    code: 'SNS-01 • VOC-ETH',
    number: '01',
    svgX: 255,
    svgY: 162,
    leaderEndX: 145,
    leaderEndY: 86,
    colorHex: '#F43F5E',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
    modelName: 'MQ-303A / SGP41 Heated Tin-Dioxide Micro-Array',
    title: {
      en: 'Volatile Ethanol (C₂H₅OH) & Fermentation Gas Sensor',
      ru: 'Датчик летучего этанола (C₂H₅OH) и газов брожения',
      kz: 'Ұшпа этанол (C₂H₅OH) және ашу газдарының датчигі',
    },
    PlacementZone: {
      en: 'Evaporator Return Air Plenum (Top Front Bulkhead)',
      ru: 'Обратный воздуховод испарителя (верхняя переборка)',
      kz: 'Буландырғыштың қайтымды ауа арнасы (жоғарғы бөлік)',
    },
    measurementRange: '0.5 – 100.0 ppm C₂H₅OH',
    accuracySpec: '±0.4 ppm (at 0–20 ppm)',
    responseTimeT90: '< 11.5 sec',
    samplingInterval: 'Every 30 sec (Continuous)',
    protocolInterface: 'I²C / RS-485 Modbus RTU',
    liveReadoutValue: '3.2 ppm (Nominal < 12 ppm)',
    liveReadoutStatus: 'OPTIMAL',
    engineeringPrinciple: {
      en: 'Mounted in the low-pressure return airstream where volatile organic compounds from all 22 pallet bays converge, eliminating localized dead-zone blind spots.',
      ru: 'Установлен в зоне разрежения возвратного воздушного потока, куда сходятся летучие соединения от всех 22 паллет, исключая «слепые зоны» внутри штабеля.',
      kz: 'Барлық 22 паллеттен шығатын ұшпа қосылыстар жиналатын қайтымды ауа ағынында орнатылған, бұл контейнер ішіндегі «соқыр аймақтарды» жояды.',
    },
    coldChainImpact: {
      en: 'Detects anaerobic cellular respiration and microbial spoilage 14 to 18 hours BEFORE metabolic heat raises ambient container air temperature.',
      ru: 'Фиксирует начало анаэробного клеточного дыхания и микробиологической порчи за 14–18 часов ДО того, как метаболическое тепло поднимет температуру воздуха.',
      kz: 'Анаэробты жасушалық тыныс алу мен микробиологиялық бұзылуды ауа температурасы көтерілгенге дейін 14–18 сағат БҰРЫН анықтайды.',
    },
  },
  {
    id: 'sensor-pt1000',
    code: 'SNS-02 • RTD-CORE',
    number: '02',
    svgX: 575,
    svgY: 295,
    leaderEndX: 575,
    leaderEndY: 86,
    colorHex: '#38BDF8',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
    modelName: 'PT1000 Class-A 4-Wire Platinum RTD Spear Probe',
    title: {
      en: 'Class-A PT1000 Deep Pulp Thermal Core Probe',
      ru: 'Платиновый щуп PT1000 (Класс А) температуры толщи груза',
      kz: 'Жүк қалыңдығын өлшейтін PT1000 (А класы) платина сүңгісі',
    },
    PlacementZone: {
      en: 'Geometric Center of Pallet Bay #6 (Thermal Lag Core)',
      ru: 'Геометрический центр паллеты №6 (ядро тепловой инерции)',
      kz: '№6 паллеттің геометриялық орталығы (жылу инерциясының өзегі)',
    },
    measurementRange: '-40.0°C to +65.0°C',
    accuracySpec: '±0.08°C (IEC 60751 Class A)',
    responseTimeT90: '4.2 sec in tissue',
    samplingInterval: 'Every 60 sec',
    protocolInterface: '24-bit Sigma-Delta ADC Bridge',
    liveReadoutValue: '+1.18°C (T_K = 274.33 K)',
    liveReadoutStatus: 'OPTIMAL',
    engineeringPrinciple: {
      en: 'Standard reefer loggers only measure supply/return wall air. Our food-grade 316L stainless spear measures true biological flesh temperature inside the densest pallet.',
      ru: 'Обычные логгеры меряют лишь воздух у стенки. Пищевой зонд из стали AISI 316L измеряет истинную температуру мякоти внутри самой плотной паллеты.',
      kz: 'Кәдімгі логгерлер тек қабырға маңындағы ауаны өлшейді. AISI 316L болат зонды ең тығыз паллет ішіндегі өнімнің нақты температурасын өлшейді.',
    },
    coldChainImpact: {
      en: 'Directly feeds absolute Kelvin temperature (T_K) into the non-linear Arrhenius integral k(T) = A·exp(-Ea / R·T) for exact RUL calculation.',
      ru: 'Напрямую передает абсолютную температуру (T_K) в нелинейный интеграл Аррениуса k(T) = A·exp(-Ea / R·T) для точного расчета остаточного срока (RUL).',
      kz: 'Қалған сақталу мерзімін (RUL) дәл есептеу үшін абсолютті температураны (T_K) тікелей Аррениус теңдеуіне береді.',
    },
  },
  {
    id: 'sensor-ndir',
    code: 'SNS-03 • NDIR-GAS',
    number: '03',
    svgX: 790,
    svgY: 225,
    leaderEndX: 880,
    leaderEndY: 86,
    colorHex: '#34D399',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    modelName: 'Senseair Dual-Channel Optical NDIR + Electrochemical Cell',
    title: {
      en: 'Optical NDIR CO₂ & Climacteric Ethylene (C₂H₄) Analyzer',
      ru: 'Оптический NDIR-газоанализатор CO₂ и этилена (C₂H₄)',
      kz: 'Оптикалық NDIR CO₂ және климактериялық этилен (C₂H₄) анализаторы',
    },
    PlacementZone: {
      en: 'Upper Headspace Channel (Pallet Bays #8–#10)',
      ru: 'Верхний дыхательный коридор (секции паллет №8–10)',
      kz: 'Жоғарғы тыныс алу дәлізі (№8–10 паллет секциялары)',
    },
    measurementRange: '0–50,000 ppm CO₂ / 0–50 ppm C₂H₄',
    accuracySpec: '±30 ppm CO₂ / ±0.15 ppm C₂H₄',
    responseTimeT90: '< 18.0 sec',
    samplingInterval: 'Every 120 sec',
    protocolInterface: 'UART / Sub-GHz Internal Mesh',
    liveReadoutValue: '1,420 ppm CO₂ • 0.35 ppm C₂H₄',
    liveReadoutStatus: 'OPTIMAL',
    engineeringPrinciple: {
      en: 'Non-dispersive infrared (NDIR) gold-plated optical waveguide with auto-zero calibration prevents sensor drift under 95% relative humidity.',
      ru: 'Недисперсионный инфракрасный (NDIR) позолоченный оптический тракт с автокалибровкой нуля исключает дрейф при влажности до 95% RH.',
      kz: 'Автоматты калибрлеуі бар алтын жалатылған NDIR оптикалық арнасы 95% ылғалдылық жағдайында да ауытқуды болдырмайды.',
    },
    coldChainImpact: {
      en: 'Captures the autocatalytic ethylene ripening burst in apples, pears, and stone fruit so fresh-air ventilation dampers open automatically.',
      ru: 'Улавливает автокаталитический всплеск этилена в яблоках, грушах и косточковых, автоматически открывая заслонки приточной вентиляции.',
      kz: 'Алма, алмұрт және сүйекті жемістердегі этиленнің күрт бөлінуін анықтап, таза ауа желдеткіш клапандарын автоматты түрде ашады.',
    },
  },
  {
    id: 'sensor-mems',
    code: 'SNS-04 • MEMS-3AX',
    number: '04',
    svgX: 430,
    svgY: 392,
    leaderEndX: 390,
    leaderEndY: 472,
    colorHex: '#FBBF24',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    modelName: 'ADXL372 Ultralow-Power 3-Axis MEMS Impact Accelerometer',
    title: {
      en: '3-Axis MEMS Rail Bogie Shock & T-Floor Vibration Sensor',
      ru: '3-осевой MEMS-акселерометр ударов ж/д сцепки и вибрации пола',
      kz: '3 осьті MEMS теміржол соққысы мен діріл акселерометрі',
    },
    PlacementZone: {
      en: 'Extruded Aluminum T-Bar Floor Sill (Above Bogie Pivot)',
      ru: 'Алюминиевый Т-образный профиль пола (над шкворнем тележки)',
      kz: 'Алюминий Т-тәрізді еден профилі (арба тірегінің үстінде)',
    },
    measurementRange: '±200g Peak Impact / 0.01–16g RMS',
    accuracySpec: '±0.02g RMS (10 Hz – 1,600 Hz)',
    responseTimeT90: '0.31 ms (3.2 kHz ODR)',
    samplingInterval: 'Continuous Hardware Interrupt',
    protocolInterface: 'SPI High-Speed FIFO Buffer',
    liveReadoutValue: '0.28g RMS (Max Peak: 0.94g)',
    liveReadoutStatus: 'OPTIMAL',
    engineeringPrinciple: {
      en: 'Continuously computes Power Spectral Density (PSD) of vertical and longitudinal shocks during rail shunting at Dostyk, Kuryk, and Akhalkalaki.',
      ru: 'Непрерывно вычисляет спектральную плотность мощности (PSD) продольных и вертикальных ударов при маневрах и смене тележек в Достыке и Ахалкалаки.',
      kz: 'Достық, Құрық және Ахалкалаки станцияларында маневр мен арба ауыстыру кезіндегі соққылардың спектрлік тығыздығын (PSD) есептейді.',
    },
    coldChainImpact: {
      en: 'Mechanical bruising ruptures fruit cell vacuoles, accelerating enzymatic browning by factor φ_vib = 1 + κ_vib·(G - 0.4)^1.2.',
      ru: 'Механический бой разрушает вакуоли клеток плодов, ускоряя ферментативное побурение и гниение с коэффициентом φ_vib = 1 + κ_vib·(G - 0.4)^1.2.',
      kz: 'Механикалық соққы жеміс жасушаларын зақымдап, ферментативті бұзылуды φ_vib = 1 + κ_vib·(G - 0.4)^1.2 есе жылдамдатады.',
    },
  },
  {
    id: 'sensor-sat',
    code: 'SNS-05 • SAT-LORA',
    number: '05',
    svgX: 192,
    svgY: 118,
    leaderEndX: 165,
    leaderEndY: 472,
    colorHex: '#818CF8',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40',
    modelName: 'SX1262 Sub-GHz LoRaWAN + Iridium 9603N LEO Satellite Modem',
    title: {
      en: 'Dual-Band LoRaWAN 868MHz + Iridium LEO Satellite Transceiver',
      ru: 'Двухрежимный трансивер LoRaWAN 868 МГц + спутник Iridium LEO',
      kz: 'Қос диапазонды LoRaWAN 868 МГц + Iridium LEO спутниктік трансивері',
    },
    PlacementZone: {
      en: 'External ISO Top Corner Casting Radome (IP68 Hermetic)',
      ru: 'Внешний угловой фитинг ISO (герметичный купол IP68)',
      kz: 'Сыртқы ISO бұрыштық фитингі (IP68 герметикалық күмбезі)',
    },
    measurementRange: '868 MHz LoRa Mesh (15 km) / 1616 MHz L-Band Sat',
    accuracySpec: '99.94% Packet Delivery across TITR',
    responseTimeT90: 'Sub-8 sec Sat Short-Burst Data',
    samplingInterval: '15-min Heartbeat / Instant Alert',
    protocolInterface: 'DCSA IoT v2.1 Encrypted Payload',
    liveReadoutValue: 'LoRa SF9 -84 dBm • Sat Lock: 7 SV',
    liveReadoutStatus: 'OPTIMAL',
    engineeringPrinciple: {
      en: 'Containers inside Ro-Pax ferry holds form a peer-to-peer 868 MHz sub-GHz mesh that routes packets to the upper deck Iridium satellite gateway, backed by an 18.5 Ah LiFePO₄ (-40°C) battery.',
      ru: 'Контейнеры в стальном трюме парома образуют ячеистую сеть 868 МГц, передающую пакеты на верхнепалубный спутниковый шлюз Iridium; питание от морозостойкой батареи LiFePO₄ (-40°C, 18.5 А·ч).',
      kz: 'Паром трюміндегі контейнерлер 868 МГц торлы желі құрып, деректерді жоғарғы палубадағы Iridium спутниктік шлюзіне береді; -40°C-қа төзімді LiFePO₄ (18.5 А·сағ) батареясымен жабдықталған.',
    },
    coldChainImpact: {
      en: 'Eliminates the 22-hour Caspian Sea telemetry blackout and unpowered rail siding blind spots, guaranteeing continuous live twin visibility.',
      ru: 'Полностью устраняет 22-часовую «черную дыру» связи при пересечении Каспийского моря и на необесточенных путях отстоя.',
      kz: 'Каспий теңізін кесіп өту кезіндегі 22 сағаттық байланыс үзілісін жойып, үздіксіз бақылауды қамтамасыз етеді.',
    },
  },
];

export const CARGO_CLASSES_MATRIX: PerishableCargoClass[] = [
  {
    id: 'beef',
    code: 'CARGO-01 • KZ-BEEF',
    hsCode: 'HS 0201.30',
    name: {
      en: 'Kazakhstan Chilled Grass-Fed Beef',
      ru: 'Охлажденная говядина травяного откорма (РК)',
      kz: 'Қазақстанның салқындатылған мәрмәр сиыр еті',
    },
    regionalOrigin: {
      en: 'Kostanay & Akmola Steppes (KazBeef Export Standard)',
      ru: 'Костанайская и Акмолинская области (Экспортный стандарт)',
      kz: 'Қостанай және Ақмола облыстары (Экспорттық стандарт)',
    },
    spoilageMechanism: {
      en: 'Psychrotrophic Pseudomonas fragi proliferation, metmyoglobin oxidation (surface discoloration), and enzymatic proteolysis releasing volatile amines & ethanol.',
      ru: 'Размножение психротрофных бактерий Pseudomonas fragi, окисление метмиоглобина (потемнение отруба) и протеолиз белка с выделением летучих аминов и этанола.',
      kz: 'Pseudomonas fragi психротрофты бактерияларының көбеюі, метмиоглобиннің тотығуы (ет түсінің қараюы) және ұшпа аминдер мен этанол бөлетін белок протеолизі.',
    },
    eaJoules: 81500,
    eaKj: 81.5,
    q10Coeff: 3.22,
    tRefC: 1.0,
    tOptMinC: -1.0,
    tOptMaxC: 1.5,
    tFreezeC: -1.7,
    rhOptMinPct: 82,
    rhOptMaxPct: 88,
    vocBaselinePpm: 3.0,
    vocWarningPpm: 12.0,
    vocCriticalPpm: 25.0,
    baselineShelfLifeHours: 504,
    baselineShelfLifeDays: 21,
    defaultCargoValueUsd: 72000,
    gammaEth: 1.8,
    kappaVib: 0.15,
    packagingSpec: {
      en: 'Vacuum-sealed multilayer barrier shrink bags in waxed export cartons',
      ru: 'Многослойные барьерные вакуумные пакеты в влагостойких коробах',
      kz: 'Ылғалға төзімді қораптардағы көпқабатты вакуумдық пакеттер',
    },
  },
  {
    id: 'apples-pears',
    code: 'CARGO-02 • ZHETYSU-POM',
    hsCode: 'HS 0808.10 / 0808.30',
    name: {
      en: 'Almaty Reserve Aport Apples & Mountain Pears',
      ru: 'Алматинский яблочный апорт и горные груши',
      kz: 'Алматы апорт алмасы мен тау алмұрттары',
    },
    regionalOrigin: {
      en: 'Ile-Alatau Foothills & Zhetysu Orchards (Almaty)',
      ru: 'Предгорья Заилийского Алатау и сады Жетысу',
      kz: 'Іле Алатауының бөктері мен Жетісу бақтары',
    },
    spoilageMechanism: {
      en: 'Autocatalytic climacteric ethylene (C₂H₄) burst, polygalacturonase cell-wall pectin softening, internal core browning, and Penicillium expansum rot.',
      ru: 'Автокаталитический всплеск этилена (C₂H₄), гидролиз пектина клеточных стенок (размягчение), побурение сердцевины и плесень Penicillium expansum.',
      kz: 'Автокаталитикалық этилен (C₂H₄) бөлінуі, жасуша қабырғасындағы пектиннің жұмсаруы, өзектің қараюы және Penicillium expansum зеңі.',
    },
    eaJoules: 72000,
    eaKj: 72.0,
    q10Coeff: 2.74,
    tRefC: 0.8,
    tOptMinC: -0.5,
    tOptMaxC: 1.5,
    tFreezeC: -1.8,
    rhOptMinPct: 90,
    rhOptMaxPct: 95,
    vocBaselinePpm: 4.0,
    vocWarningPpm: 15.0,
    vocCriticalPpm: 35.0,
    baselineShelfLifeHours: 840,
    baselineShelfLifeDays: 35,
    defaultCargoValueUsd: 54000,
    gammaEth: 1.6,
    kappaVib: 0.28,
    packagingSpec: {
      en: 'Ventilated telescopic fiberboard trays with molded pulp cell dividers',
      ru: 'Вентилируемые телескопические гофролотки с ячеистыми ложементами',
      kz: 'Ұяшықты төсемдері бар желдетілетін телескопиялық гофронауалар',
    },
  },
  {
    id: 'cherries',
    code: 'CARGO-03 • SOUTH-STONE',
    hsCode: 'HS 0809.29',
    name: {
      en: 'Southern Sweet Cherries & Stone Fruit',
      ru: 'Свежая черешня и косточковые плоды Юга РК',
      kz: 'Оңтүстік Қазақстанның тәтті шиесі мен сүйекті жемістері',
    },
    regionalOrigin: {
      en: 'Shymkent, Turkestan & Saryagash Agro-Valleys',
      ru: 'Шымкент, Туркестан и Сарыагашская долина',
      kz: 'Шымкент, Түркістан және Сарыағаш агроалқабы',
    },
    spoilageMechanism: {
      en: 'Hyper-intense cellular respiration, rapid pedicel (stem) dehydration, Botrytis cinerea gray mold, and anaerobic ethanol fermentation above +5°C.',
      ru: 'Сверхинтенсивное клеточное дыхание, дегидратация плодоножки, серая гниль Botrytis cinerea и анаэробное спиртовое брожение при температуре выше +5°C.',
      kz: 'Жоғары қарқынды жасушалық тыныс алу, жеміс сабағының кебуі, Botrytis cinerea сұр шірігі және +5°C-тан жоғары температурада анаэробты ашу.',
    },
    eaJoules: 68500,
    eaKj: 68.5,
    q10Coeff: 2.58,
    tRefC: 1.0,
    tOptMinC: 0.0,
    tOptMaxC: 2.0,
    tFreezeC: -1.1,
    rhOptMinPct: 90,
    rhOptMaxPct: 95,
    vocBaselinePpm: 3.5,
    vocWarningPpm: 11.0,
    vocCriticalPpm: 24.0,
    baselineShelfLifeHours: 216,
    baselineShelfLifeDays: 9,
    defaultCargoValueUsd: 48000,
    gammaEth: 1.75,
    kappaVib: 0.55,
    packagingSpec: {
      en: 'Modified Atmosphere Packaging (MAP 5 kg liners) on shock-damped Euro pallets',
      ru: 'Пакеты с модифицированной газовой средой (MAP 5 кг) на виброгасящих паллетах',
      kz: 'Дірілді басатын паллеттердегі модификацияланған газ ортасы бар (MAP 5 кг) пакеттер',
    },
  },
  {
    id: 'dairy',
    code: 'CARGO-04 • BIO-DAIRY',
    hsCode: 'HS 0403.90',
    name: {
      en: 'Cultured Bio-Kefir, Saumal & Probiotic Dairy',
      ru: 'Органический биокефир, саумал и кисломолочная продукция',
      kz: 'Саумал, органикалық биокефир және сүт өнімдері',
    },
    regionalOrigin: {
      en: 'Almaty & Central Kazakhstan Bio-Creameries',
      ru: 'Молочные комплексы Алматы и Центрального Казахстана',
      kz: 'Алматы және Орталық Қазақстан сүт кешендері',
    },
    spoilageMechanism: {
      en: 'Steep thermal sensitivity (Ea = 92 kJ/mol): lactic acid hyper-acidification, psychrotrophic Bacillus proteolysis, whey syneresis, and foil lid bloat.',
      ru: 'Высокая термочувствительность (Ea = 92 кДж/моль): перекисание молочной кислотой, протеолиз бациллами Bacillus, отделение сыворотки и бомбаж упаковки.',
      kz: 'Жоғары термосезімталдық (Ea = 92 кДж/моль): сүт қышқылының шамадан тыс артуы, Bacillus протеолизі, сарысудың бөлінуі және қаптаманың ісінуі.',
    },
    eaJoules: 92000,
    eaKj: 92.0,
    q10Coeff: 3.78,
    tRefC: 2.5,
    tOptMinC: 1.0,
    tOptMaxC: 4.0,
    tFreezeC: -0.5,
    rhOptMinPct: 75,
    rhOptMaxPct: 85,
    vocBaselinePpm: 2.5,
    vocWarningPpm: 12.0,
    vocCriticalPpm: 28.0,
    baselineShelfLifeHours: 336,
    baselineShelfLifeDays: 14,
    defaultCargoValueUsd: 38000,
    gammaEth: 1.5,
    kappaVib: 0.22,
    packagingSpec: {
      en: 'Aseptic HDPE & glass cold-chain crates in thermal-insulated pallet shrouds',
      ru: 'Асептическая тара HDPE и стекло в кассетах с термоизолирующим контуром',
      kz: 'Термооқшаулағыш контуры бар кассеталардағы асептикалық HDPE және шыны ыдыстар',
    },
  },
];

export interface LandingCopy {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondaryAnalytics: string;
  jumpMap: string;
  jumpSensors: string;
  jumpCargo: string;
  kpiCorridorLength: string;
  kpiActiveFleet: string;
  kpiEarlyDetection: string;
  kpiSpoilageReduction: string;
  // Pillar 1: Map
  p1Eyebrow: string;
  p1Title: string;
  p1Sub: string;
  p1FilterAll: string;
  p1FilterRail: string;
  p1FilterFerry: string;
  p1FilterHighway: string;
  p1LegendBroad: string;
  p1LegendFerry: string;
  p1LegendStandard: string;
  p1LegendBottleneck: string;
  p1SelectHubHeader: string;
  p1SelectContainerHeader: string;
  p1InspectorNodeTab: string;
  p1InspectorContainerTab: string;
  p1DwellLabel: string;
  p1ColdStorageLabel: string;
  p1ShorePowerLabel: string;
  p1ThroughputLabel: string;
  p1RiskTitle: string;
  p1OpenShipmentBtn: string;
  // Pillar 2: Sensors
  p2Eyebrow: string;
  p2Title: string;
  p2Sub: string;
  p2ViewBlueprint: string;
  p2ViewMatrix: string;
  p2BlueprintTitle: string;
  p2BlueprintScale: string;
  p2AirflowSupply: string;
  p2AirflowReturn: string;
  p2ClickPinHint: string;
  p2SpecRange: string;
  p2SpecAccuracy: string;
  p2SpecResponse: string;
  p2SpecSampling: string;
  p2SpecInterface: string;
  p2SpecPlacement: string;
  p2PrincipleHeader: string;
  p2BioImpactHeader: string;
  // Pillar 3: Cargo & Arrhenius
  p3Eyebrow: string;
  p3Title: string;
  p3Sub: string;
  p3SimHeader: string;
  p3PresetNominal: string;
  p3PresetKurykStorm: string;
  p3PresetPowerSag: string;
  p3SliderTemp: string;
  p3SliderEthanol: string;
  p3SliderDwell: string;
  p3OutAccel: string;
  p3OutRul: string;
  p3OutBhi: string;
  p3OutSaved: string;
  p3ChartTitle: string;
  p3ChartBaseline: string;
  p3ChartExcursion: string;
  p3FormulaTitle: string;
  p3SpoilageMechTitle: string;
  p3PackagingTitle: string;
  // Footer / Bottom CTA
  bottomCtaBadge: string;
  bottomCtaTitle: string;
  bottomCtaDesc: string;
  bottomCtaBtnDashboard: string;
  bottomCtaBtnSupport: string;
}

export const LANDING_COPY: Record<Locale, LandingCopy> = {
  en: {
    heroBadge: 'TRANS-CASPIAN COLD-CHAIN DIGITAL TWIN • DCSA IoT v2.1',
    heroTitle: 'Industrial Cold-Chain Telemetry, Sensor Blueprints & Arrhenius Cargo Kinetics',
    heroSubtitle:
      'Engineered for the 4,500 km Trans-Caspian International Transport Route (TITR). FreshStream AI fuses sub-GHz LoRaWAN + Iridium satellite reefer sensors with non-linear Arrhenius biochemical kinetics to prevent perishable cargo loss across rail gauge breaks and Caspian Sea ferry bottlenecks.',
    ctaPrimary: 'Open Live Fleet Dashboard',
    ctaSecondaryAnalytics: 'Corridor ESG & Financial Analytics',
    jumpMap: '01 • TITR Corridor Map',
    jumpSensors: '02 • Reefer & IoT Sensors',
    jumpCargo: '03 • Cargo Kinetics Matrix',
    kpiCorridorLength: '4,500 km Multimodal Route',
    kpiActiveFleet: '7 Corridor Hubs • 5 Sensor Channels',
    kpiEarlyDetection: '14–18h Early Fermentation Lead',
    kpiSpoilageReduction: 'Up to 78% At-Risk Cargo Salvaged',

    p1Eyebrow: 'PILLAR 01 // GEOSPATIAL CORRIDOR & CHOKEPOINT ARCHITECTURE',
    p1Title: 'Trans-Caspian Middle Corridor (TITR) Route & Live Fleet Map',
    p1Sub: 'Inspect all 7 intermodal rail/sea hubs from Dostyk and Almaty through Port Kuryk and Baku to Istanbul. Click any waypoint node or live reefer container pin to inspect bottleneck dwell times, rail gauge transitions (1520mm ⇄ 1435mm), and real-time biochemical telemetry.',
    p1FilterAll: 'All Multimodal Layers',
    p1FilterRail: '1520mm / 1435mm Heavy Rail',
    p1FilterFerry: 'Caspian Ro-Pax Ferry',
    p1FilterHighway: 'TIR Reefer Corridor',
    p1LegendBroad: '1520mm CIS Broad Gauge Rail',
    p1LegendFerry: 'Caspian Sea Ro-Pax Ferry (260 NM)',
    p1LegendStandard: '1435mm UIC Standard Gauge (BTK)',
    p1LegendBottleneck: 'Active Bottleneck / Gauge Break',
    p1SelectHubHeader: 'Corridor Infrastructure Hubs (Click to Inspect)',
    p1SelectContainerHeader: 'Active Monitored Reefer Containers',
    p1InspectorNodeTab: 'Hub Infrastructure & Bottleneck',
    p1InspectorContainerTab: 'Live Container Telemetry',
    p1DwellLabel: 'Avg Terminal Dwell',
    p1ColdStorageLabel: 'Cold Storage Capacity',
    p1ShorePowerLabel: 'Reefer Power Plugs',
    p1ThroughputLabel: 'Annual Throughput',
    p1RiskTitle: 'Engineering Bottleneck & Thermal Risk Profile',
    p1OpenShipmentBtn: 'Inspect Container in Fleet Dashboard',

    p2Eyebrow: 'PILLAR 02 // ISO 668 1AAA HARDWARE & SENSOR PLACEMENT SCHEMATIC',
    p2Title: '40ft High-Cube Reefer Cutaway & 5-Channel Edge IoT Sensor Array',
    p2Sub: 'Standard wall-mounted loggers miss core pallet fermentation during Port Kuryk power cutoffs. Inspect our orthographic engineering blueprint showing exact physical mounting coordinates, T-bar airflow circulation loops, and sensor tolerances.',
    p2ViewBlueprint: 'Orthographic Cutaway Blueprint',
    p2ViewMatrix: 'Full Hardware Tolerance Matrix',
    p2BlueprintTitle: 'ISO 668 1AAA 40FT HIGH-CUBE REEFER • LONGITUDINAL SECTION VIEW (SCALE 1:25)',
    p2BlueprintScale: 'DIMENSIONS: 12,192 × 2,438 × 2,896 mm • T-BAR FLOOR • 22 EURO PALLET CAPACITY',
    p2AirflowSupply: 'Bottom T-Floor Cold Supply Air (+0.8°C)',
    p2AirflowReturn: 'Top Evaporator Return Plenum + VOC Sampling',
    p2ClickPinHint: 'Click callouts 01–05 on the schematic or list to inspect hardware specifications',
    p2SpecRange: 'Measurement Range',
    p2SpecAccuracy: 'Calibration Accuracy',
    p2SpecResponse: 'Response Time (T90)',
    p2SpecSampling: 'Sampling Cadence',
    p2SpecInterface: 'Bus & Telemetry Protocol',
    p2SpecPlacement: 'Physical Mounting Coordinate',
    p2PrincipleHeader: 'Sensor Placement & Physical Engineering Principle',
    p2BioImpactHeader: 'Role in Predictive Cold-Chain Protection',

    p3Eyebrow: 'PILLAR 03 // PERISHABLE COMMODITY PROFILES & ARRHENIUS KINETICS',
    p3Title: 'Perishable Cargo Matrix & Interactive Thermal Excursion Simulator',
    p3Sub: 'Every biological cargo class obeys a distinct activation energy (Ea) and Q10 temperature coefficient. Select a cargo class below and adjust core temperature, headspace ethanol (ppm), and port dwell delay to compute live Remaining Useful Life (RUL).',
    p3SimHeader: 'Interactive Excursion & Bottleneck Stress-Test',
    p3PresetNominal: 'Nominal Setpoint Transit',
    p3PresetKurykStorm: 'Port Kuryk 42h Gale Delay',
    p3PresetPowerSag: 'Ferry Hold Power Cutoff (+9.5°C)',
    p3SliderTemp: 'Core Pulp Temperature (T_core)',
    p3SliderEthanol: 'Volatile Ethanol Headspace (C₂H₅OH)',
    p3SliderDwell: 'Port Staging Dwell Delay',
    p3OutAccel: 'Spoilage Acceleration (α_total)',
    p3OutRul: 'Predicted Remaining Shelf Life',
    p3OutBhi: 'Biological Health Index (BHI)',
    p3OutSaved: 'At-Risk Value Preserved',
    p3ChartTitle: 'Real-Time Exponential Quality Decay Trajectory (480h Horizon)',
    p3ChartBaseline: 'Nominal Setpoint Baseline Curve',
    p3ChartExcursion: 'Simulated Excursion Decay Curve',
    p3FormulaTitle: 'Active Physics-Informed Arrhenius Kinetics Model',
    p3SpoilageMechTitle: 'Biochemical Spoilage Mechanism',
    p3PackagingTitle: 'Standard Export Packaging & Palletization',

    bottomCtaBadge: 'PRODUCTION READY • VERCEL MULTI-SERVICE DEPLOYMENT',
    bottomCtaTitle: 'Ready to Monitor Your Active Reefer Fleet Across the Middle Corridor?',
    bottomCtaDesc:
      'Transition from post-mortem temperature PDFs to real-time biological shelf-life prediction, automated Telegram dispatcher alerts, and DCSA-compliant customs reporting.',
    bottomCtaBtnDashboard: 'Launch Fleet Operations Dashboard',
    bottomCtaBtnSupport: 'Contact Engineering & Dispatch Support',
  },
  ru: {
    heroBadge: 'ЦИФРОВОЙ ДВОЙНИК ХОЛОДОВОЙ ЦЕПИ ТМТМ • DCSA IoT v2.1',
    heroTitle: 'Инженерная телеметрия маршрутов, схема датчиков и биохимическая матрица грузов',
    heroSubtitle:
      'Разработано специально для Транскаспийского международного транспортного маршрута (ТМТМ / Средний коридор, 4 500 км). FreshStream AI объединяет датчики рефконтейнеров (LoRaWAN + спутник Iridium) с нелинейной кинетикой Аррениуса для предотвращения порчи скоропортящихся грузов на стыках ж/д колеи и паромных переправах Каспия.',
    ctaPrimary: 'Открыть панель управления флотом',
    ctaSecondaryAnalytics: 'Аналитика коридора и финансовый ROI',
    jumpMap: '01 • Карта Среднего коридора',
    jumpSensors: '02 • Схема датчиков и рефа',
    jumpCargo: '03 • Матрица грузов Аррениуса',
    kpiCorridorLength: '4 500 км мультимодального пути',
    kpiActiveFleet: '7 узлов ТМТМ • 5 каналов датчиков',
    kpiEarlyDetection: 'За 14–18ч ранний детект брожения',
    kpiSpoilageReduction: 'До 78% спасение грузов в зоне риска',

    p1Eyebrow: 'РАЗДЕЛ 01 // ГЕОПРОСТРАНСТВЕННАЯ КАРТА МАРШРУТОВ И УЗЛОВ РИСКА ТМТМ',
    p1Title: 'Интерактивная карта Транскаспийского коридора (TITR) и мониторинг контейнеров',
    p1Sub: 'Исследуйте все 7 ключевых интермодальных узлов от Достыка и Алматы через порт Курык и Баку до Стамбула. Нажмите на любой терминал или рефконтейнер на схеме, чтобы увидеть время простоя, точки смены колеи (1520 ⇄ 1435 мм) и живую телеметрию.',
    p1FilterAll: 'Все виды транспорта',
    p1FilterRail: 'Ж/д колея 1520 / 1435 мм',
    p1FilterFerry: 'Морской паром Каспия Ро-Пакс',
    p1FilterHighway: 'Автокоридор TIR Реф',
    p1LegendBroad: 'Ж/д широкая колея 1520 мм (КТЖ / ADY / GR)',
    p1LegendFerry: 'Морской паром Курык ⇄ Алят (260 морских миль)',
    p1LegendStandard: 'Европейская колея 1435 мм UIC (магистраль БТК)',
    p1LegendBottleneck: 'Узел смены колеи / Штормовой накопитель',
    p1SelectHubHeader: 'Инфраструктурные узлы маршрута (нажмите для обзора)',
    p1SelectContainerHeader: 'Активные рефконтейнеры на линии',
    p1InspectorNodeTab: 'Паспорт терминала и риски',
    p1InspectorContainerTab: 'Телеметрия рефконтейнера',
    p1DwellLabel: 'Средний простой',
    p1ColdStorageLabel: 'Объем хладоскладов',
    p1ShorePowerLabel: 'Розетки рефконтейнеров',
    p1ThroughputLabel: 'Годовой грузопоток',
    p1RiskTitle: 'Инженерный профиль узкого места и тепловых рисков',
    p1OpenShipmentBtn: 'Открыть карточку контейнера в дашборде',

    p2Eyebrow: 'РАЗДЕЛ 02 // ИНЖЕНЕРНЫЙ ЧЕРТЕЖ ISO 668 И СХЕМА РАЗМЕЩЕНИЯ ДАТЧИКОВ IoT',
    p2Title: 'Разрез 40-футового рефрижератора и 5-канальная матрица датчиков FreshStream',
    p2Sub: 'Обычные настенные логгеры не видят начала брожения внутри паллет при отключении питания в порту Курык. Изучите инженерный чертеж в разрезе с точными координатами монтажа датчиков, контуром циркуляции холодного воздуха и метрологическими допусками.',
    p2ViewBlueprint: 'Инженерный чертеж в разрезе (SVG)',
    p2ViewMatrix: 'Сводная таблица характеристик датчиков',
    p2BlueprintTitle: 'РЕФКОНТЕЙНЕР ISO 668 1AAA 40FT HIGH-CUBE • ПРОДОЛЬНЫЙ РАЗРЕЗ (МАСШТАБ 1:25)',
    p2BlueprintScale: 'ГАБАРИТЫ: 12 192 × 2 438 × 2 896 мм • Т-ОБРАЗНЫЙ ПОЛ • ВМЕСТИМОСТЬ 22 ЕВРОПАЛЛЕТЫ',
    p2AirflowSupply: 'Нижний приток холодного воздуха по Т-профилю пола (+0.8°C)',
    p2AirflowReturn: 'Верхний возвратный коллектор испарителя + забор проб летучих газов',
    p2ClickPinHint: 'Нажимайте на выноски 01–05 на чертеже или в списке справа для просмотра спецификаций датчика',
    p2SpecRange: 'Диапазон измерений',
    p2SpecAccuracy: 'Точность калибровки',
    p2SpecResponse: 'Время отклика (T90)',
    p2SpecSampling: 'Частота опроса',
    p2SpecInterface: 'Интерфейс и протокол',
    p2SpecPlacement: 'Координата монтажа в контейнере',
    p2PrincipleHeader: 'Инженерный принцип размещения и физика измерений',
    p2BioImpactHeader: 'Значение датчика для защиты груза в холодовой цепи',

    p3Eyebrow: 'РАЗДЕЛ 03 // МАТРИЦА СКОРОПОРТЯЩИХСЯ ГРУЗОВ И КИНЕТИКА АРРЕНИУСА',
    p3Title: 'Биохимическая матрица грузов и интерактивный симулятор теплового сбоя',
    p3Sub: 'Каждый класс скоропортящейся продукции имеет собственную энергию активации (Ea), температурный коэффициент Q10 и порог летучего этанола. Выберите тип груза и меняйте температуру толщи, уровень этанола (ppm) и простой в порту для мгновенного расчета остаточного срока годности (RUL).',
    p3SimHeader: 'Интерактивный стресс-тест теплового эксцесса и простоя',
    p3PresetNominal: 'Штатный режим перевозки',
    p3PresetKurykStorm: 'Шторм в порту Курык (простой 42ч)',
    p3PresetPowerSag: 'Отключение питания в трюме (+9.5°C)',
    p3SliderTemp: 'Температура в толще груза (T_core)',
    p3SliderEthanol: 'Летучий этанол в контейнере (C₂H₅OH)',
    p3SliderDwell: 'Время простоя на терминале',
    p3OutAccel: 'Ускорение порчи (α_total)',
    p3OutRul: 'Остаточный срок годности (RUL)',
    p3OutBhi: 'Индекс био-сохранности (BHI)',
    p3OutSaved: 'Спасенная стоимость груза',
    p3ChartTitle: 'Экспоненциальная кривая деградации качества груза (горизонт 480 часов)',
    p3ChartBaseline: 'Эталонная кривая при оптимальной уставке',
    p3ChartExcursion: 'Прогноз деградации при текущем режиме',
    p3FormulaTitle: 'Физико-химическая модель кинетики Аррениуса',
    p3SpoilageMechTitle: 'Биохимический механизм порчи груза',
    p3PackagingTitle: 'Стандарт экспортной упаковки и паллетирования',

    bottomCtaBadge: 'ГОТОВО К ПРОМЫШЛЕННОЙ ЭКСПЛУАТАЦИИ • VERCEL SERVICES',
    bottomCtaTitle: 'Готовы подключить мониторинг рефрижераторного парка на Среднем коридоре?',
    bottomCtaDesc:
      'Переходите от посмертных PDF-распечаток термографов к предиктивному контролю остаточного срока годности, мгновенным Telegram-оповещениям диспетчеров и стандарту DCSA.',
    bottomCtaBtnDashboard: 'Запустить панель управления флотом',
    bottomCtaBtnSupport: 'Связаться с инженерной поддержкой',
  },
  kz: {
    heroBadge: 'ТХКБ СУЫҚ ТІЗБЕГІНІҢ ЦИФРЛЫҚ СЫҢАРЫ • DCSA IoT v2.1',
    heroTitle: 'Инженерлік маршруттар картасы, датчиктер сызбасы және Аррениус жүк матрицасы',
    heroSubtitle:
      '4 500 км Транскаспий халықаралық көлік бағыты (ТХКБ / Орта дәліз) үшін арнайы әзірленген. FreshStream AI теміржол табаны ауысатын станциялар мен Каспий теңізі паромдарында тез бұзылатын жүктерді сақтау үшін LoRaWAN + Iridium спутниктік датчиктерін Аррениус биохимиялық кинетикасымен біріктіреді.',
    ctaPrimary: 'Флотты басқару панелін ашу',
    ctaSecondaryAnalytics: 'Дәліз аналитикасы және қаржылық ROI',
    jumpMap: '01 • Орта дәліз картасы',
    jumpSensors: '02 • Реф және IoT датчиктері',
    jumpCargo: '03 • Аррениус жүк матрицасы',
    kpiCorridorLength: '4 500 км мультимодальді бағыт',
    kpiActiveFleet: '7 ТХКБ торабы • 5 датчик арнасы',
    kpiEarlyDetection: '14–18 сағ ерте ашуды анықтау',
    kpiSpoilageReduction: '78%-ға дейін тәуекелдегі жүкті құтқару',

    p1Eyebrow: '01-БӨЛІМ // ТХКБ ГЕОКЕҢІСТІКТІК БАҒЫТТАР МЕН ТӘУЕКЕЛ ТОРАПТАРЫНЫҢ КАРТАСЫ',
    p1Title: 'Транскаспий Орта дәлізінің (TITR) интерактивті картасы және контейнерлер мониторингі',
    p1Sub: 'Достық пен Алматыдан бастап Құрық порты мен Баку арқылы Ыстанбұлға дейінгі барлық 7 интермодальді торапты зерттеңіз. Кідіріс уақытын, теміржол табанын ауыстыру бекеттерін (1520 ⇄ 1435 мм) және нақты уақыттағы телеметрияны көру үшін кез келген терминалды немесе контейнерді басыңыз.',
    p1FilterAll: 'Барлық көлік түрлері',
    p1FilterRail: '1520 / 1435 мм теміржол',
    p1FilterFerry: 'Каспий Ро-Пакс паромы',
    p1FilterHighway: 'TIR автокөлік дәлізі',
    p1LegendBroad: '1520 мм кең табанды теміржол (ҚТЖ / ADY / GR)',
    p1LegendFerry: 'Құрық ⇄ Әләт теңіз паромы (260 теңіз милі)',
    p1LegendStandard: '1435 мм еуропалық UIC теміржолы (БТК)',
    p1LegendBottleneck: 'Табан ауыстыру / Дауылды кідіріс торабы',
    p1SelectHubHeader: 'Дәліздің инфрақұрылымдық тораптары (таңдау үшін басыңыз)',
    p1SelectContainerHeader: 'Желідегі белсенді рефконтейнерлер',
    p1InspectorNodeTab: 'Терминал төлқұжаты мен тәуекелдер',
    p1InspectorContainerTab: 'Контейнер телеметриясы',
    p1DwellLabel: 'Орташа кідіріс уақыты',
    p1ColdStorageLabel: 'Тоңазытқыш қойма сыйымдылығы',
    p1ShorePowerLabel: 'Рефконтейнер розеткалары',
    p1ThroughputLabel: 'Жылдық жүк айналымы',
    p1RiskTitle: 'Инженерлік тар орын және жылулық тәуекел профилі',
    p1OpenShipmentBtn: 'Контейнерді басқару панелінде ашу',

    p2Eyebrow: '02-БӨЛІМ // ISO 668 ИНЖЕНЕРЛІК СЫЗБАСЫ ЖӘНЕ IoT ДАТЧИКТЕРІН ОРНАЛАСТЫРУ СХЕМАСЫ',
    p2Title: '40 футтық рефрижератор қимасы және FreshStream 5 арналы IoT датчиктер жүйесі',
    p2Sub: 'Қабырғаға орнатылатын кәдімгі логгерлер Құрық портында қуат өшкен кезде паллет ішіндегі ашу процесін байқамайды. Датчиктердің нақты орнату координаттарын, суық ауа айналымын және метрологиялық дәлдігін көрсететін инженерлік сызбаны қараңыз.',
    p2ViewBlueprint: 'Инженерлік қима сызбасы (SVG)',
    p2ViewMatrix: 'Датчиктердің техникалық кестесі',
    p2BlueprintTitle: 'ISO 668 1AAA 40FT HIGH-CUBE РЕФКОНТЕЙНЕРІ • БОЙЛЫҚ ҚИМА (МАСШТАБ 1:25)',
    p2BlueprintScale: 'ӨЛШЕМДЕРІ: 12 192 × 2 438 × 2 896 мм • Т-ТӘРІЗДІ ЕДЕН • 22 ЕУРОПАЛЛЕТ СЫЙЫМДЫЛЫҒЫ',
    p2AirflowSupply: 'Т-профильді еден арқылы суық ауа беру (+0.8°C)',
    p2AirflowReturn: 'Буландырғыштың жоғарғы қайтымды арнасы + ұшпа газдарды талдау',
    p2ClickPinHint: 'Датчик сипаттамаларын көру үшін сызбадағы немесе тізімдегі 01–05 нүктелерін басыңыз',
    p2SpecRange: 'Өлшеу диапазоны',
    p2SpecAccuracy: 'Калибрлеу дәлдігі',
    p2SpecResponse: 'Жауап беру уақыты (T90)',
    p2SpecSampling: 'Тексеру жиілігі',
    p2SpecInterface: 'Интерфейс және хаттама',
    p2SpecPlacement: 'Контейнердегі орнату нүктесі',
    p2PrincipleHeader: 'Орналастырудың инженерлік принципі және өлшеу физикасы',
    p2BioImpactHeader: 'Суық тізбегіндегі жүкті қорғаудағы рөлі',

    p3Eyebrow: '03-БӨЛІМ // ТЕЗ БҰЗЫЛАТЫН ЖҮКТЕР МАТРИЦАСЫ ЖӘНЕ АРРЕНИУС КИНЕТИКАСЫ',
    p3Title: 'Жүктердің биохимиялық матрицасы және жылулық ауытқу симуляторы',
    p3Sub: 'Тез бұзылатын өнімдердің әрбір класы өзіндік активтену энергиясымен (Ea), Q10 температуралық коэффициентімен және ұшпа этанол шегімен сипатталады. Қалған сақталу мерзімін (RUL) есептеу үшін жүк түрін таңдап, температураны, этанол деңгейін және порттағы кідірісті өзгертіп көріңіз.',
    p3SimHeader: 'Жылулық ауытқу мен порттағы кідірістің интерактивті стресс-тесті',
    p3PresetNominal: 'Қалыпты тасымалдау режимі',
    p3PresetKurykStorm: 'Құрық портындағы дауыл (42 сағ кідіріс)',
    p3PresetPowerSag: 'Паром трюмінде қуаттың өшуі (+9.5°C)',
    p3SliderTemp: 'Жүк қалыңдығындағы температура (T_core)',
    p3SliderEthanol: 'Контейнердегі ұшпа этанол (C₂H₅OH)',
    p3SliderDwell: 'Терминалдағы кідіріс уақыты',
    p3OutAccel: 'Бұзылудың үдеуі (α_total)',
    p3OutRul: 'Қалған сақталу мерзімі (RUL)',
    p3OutBhi: 'Био-сақталу индексі (BHI)',
    p3OutSaved: 'Сақталған жүк құны',
    p3ChartTitle: 'Жүк сапасының экспоненциалды төмендеу қисығы (480 сағаттық көкжиек)',
    p3ChartBaseline: 'Оңтайлы температурадағы эталондық қисық',
    p3ChartExcursion: 'Ағымдағы режимдегі сапаның төмендеу болжамы',
    p3FormulaTitle: 'Аррениус физика-химиялық кинетика моделі',
    p3SpoilageMechTitle: 'Жүктің биохимиялық бұзылу механизмі',
    p3PackagingTitle: 'Экспорттық қаптама және паллеттеу стандарты',

    bottomCtaBadge: 'ӨНДІРІСТІК ПАЙДАЛАНУҒА ДАЙЫН • VERCEL SERVICES',
    bottomCtaTitle: 'Орта дәліздегі рефрижераторлар паркін бақылауға қосуға дайынсыз ба?',
    bottomCtaDesc:
      'Ескірген қағаз термограф есептерінен нақты уақыттағы биологиялық сақталу мерзімін болжауға, жедел Telegram хабарламаларына және DCSA стандартына көшіңіз.',
    bottomCtaBtnDashboard: 'Флотты басқару панелін іске қосу',
    bottomCtaBtnSupport: 'Инженерлік қолдау қызметіне хабарласу',
  },
};
