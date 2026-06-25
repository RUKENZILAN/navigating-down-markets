import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Investment Scenario Advisor" },
      {
        name: "description",
        content:
          "Enter macro conditions and your profile to get expert-style asset allocation guidance.",
      },
      { property: "og:title", content: "Investment Scenario Advisor" },
      {
        property: "og:description",
        content:
          "Get tailored asset-class suggestions based on rates, inflation, growth, risk and horizon.",
      },
    ],
  }),
  component: Index,
});

type Risk = "conservative" | "balanced" | "aggressive";

type Market = "global" | "tr";

interface Inputs {
  market: Market;
  policyRate: number; // central bank rate %
  inflation: number; // CPI YoY %
  gdpGrowth: number; // real GDP %
  equityValuation: "cheap" | "fair" | "expensive";
  usdTrend: "weak" | "neutral" | "strong";
  horizonYears: number;
  risk: Risk;
}

interface Allocation {
  cash: number;
  shortBonds: number;
  longBonds: number;
  ig: number; // investment grade credit
  hy: number; // high yield
  equityDev: number;
  equityEm: number;
  equityValue: number;
  reits: number;
  gold: number;
  commodities: number;
  bitcoin: number;
}

const RISK_BASE: Record<Risk, Allocation> = {
  conservative: {
    cash: 15,
    shortBonds: 25,
    longBonds: 15,
    ig: 15,
    hy: 3,
    equityDev: 12,
    equityEm: 3,
    equityValue: 5,
    reits: 3,
    gold: 4,
    commodities: 0,
    bitcoin: 0,
  },
  balanced: {
    cash: 8,
    shortBonds: 15,
    longBonds: 12,
    ig: 10,
    hy: 5,
    equityDev: 22,
    equityEm: 7,
    equityValue: 8,
    reits: 5,
    gold: 5,
    commodities: 2,
    bitcoin: 1,
  },
  aggressive: {
    cash: 3,
    shortBonds: 5,
    longBonds: 5,
    ig: 5,
    hy: 7,
    equityDev: 32,
    equityEm: 12,
    equityValue: 12,
    reits: 7,
    gold: 5,
    commodities: 4,
    bitcoin: 3,
  },
};

const LABELS: Record<keyof Allocation, string> = {
  cash: "Cash & T-Bills",
  shortBonds: "Short-Duration Gov Bonds",
  longBonds: "Long-Duration Gov Bonds",
  ig: "Investment-Grade Credit",
  hy: "High-Yield Credit",
  equityDev: "Developed Equities",
  equityEm: "Emerging Markets Equities",
  equityValue: "Value & Dividend Equities",
  reits: "REITs / Infrastructure",
  gold: "Gold",
  commodities: "Broad Commodities",
  bitcoin: "Bitcoin / Crypto",
};

function tilt(alloc: Allocation, key: keyof Allocation, delta: number) {
  alloc[key] = Math.max(0, alloc[key] + delta);
}

function normalize(alloc: Allocation): Allocation {
  const total = Object.values(alloc).reduce((a, b) => a + b, 0);
  if (total === 0) return alloc;
  const factor = 100 / total;
  const out = { ...alloc };
  (Object.keys(out) as (keyof Allocation)[]).forEach((k) => {
    out[k] = Math.round(out[k] * factor * 10) / 10;
  });
  return out;
}

function buildAllocation(i: Inputs): { allocation: Allocation; reasoning: string[] } {
  const a: Allocation = { ...RISK_BASE[i.risk] };
  const reasoning: string[] = [];
  const realRate = i.policyRate - i.inflation;

  // Rates regime
  if (i.policyRate >= 4.5) {
    tilt(a, "cash", 4);
    tilt(a, "shortBonds", 6);
    tilt(a, "ig", 3);
    tilt(a, "longBonds", -3);
    tilt(a, "hy", -2);
    reasoning.push(
      "Policy rates are high: cash and short-duration bonds lock in attractive risk-free yields while you wait for better entry points in risk assets.",
    );
  } else if (i.policyRate <= 1.5) {
    tilt(a, "cash", -3);
    tilt(a, "shortBonds", -3);
    tilt(a, "longBonds", 3);
    tilt(a, "equityDev", 3);
    tilt(a, "reits", 2);
    tilt(a, "gold", 2);
    reasoning.push(
      "Rates are low: cash is unrewarding. Duration, equities, REITs and gold typically benefit from cheap money.",
    );
  }

  // Inflation regime
  if (i.inflation >= 4) {
    tilt(a, "gold", 3);
    tilt(a, "commodities", 3);
    tilt(a, "reits", 2);
    tilt(a, "equityValue", 3);
    tilt(a, "longBonds", -4);
    reasoning.push(
      "Inflation is hot: real assets (gold, commodities, REITs) and value/dividend equities historically outperform; long-duration bonds suffer.",
    );
  } else if (i.inflation <= 1.5) {
    tilt(a, "longBonds", 3);
    tilt(a, "ig", 2);
    tilt(a, "commodities", -2);
    tilt(a, "gold", -1);
    reasoning.push(
      "Disinflation favours duration and quality credit; commodities lose their tailwind.",
    );
  }

  // Real rates
  if (realRate >= 2) {
    tilt(a, "shortBonds", 3);
    tilt(a, "ig", 2);
    reasoning.push(
      `Real yields are positive (~${realRate.toFixed(1)}%). High-quality bonds pay you to wait — historically a strong setup for fixed income.`,
    );
  } else if (realRate <= -1) {
    tilt(a, "gold", 2);
    tilt(a, "equityDev", 2);
    tilt(a, "bitcoin", 1);
    reasoning.push(
      `Real yields are negative (~${realRate.toFixed(1)}%). Hard assets and equities hedge financial repression.`,
    );
  }

  // Growth regime
  if (i.gdpGrowth <= 0) {
    tilt(a, "longBonds", 4);
    tilt(a, "ig", 3);
    tilt(a, "hy", -3);
    tilt(a, "equityEm", -2);
    tilt(a, "equityDev", -3);
    tilt(a, "equityValue", 2);
    tilt(a, "gold", 2);
    reasoning.push(
      "Growth is contracting: tilt to quality — government bonds, IG credit, defensive/value equities, and gold. Trim cyclicals and high yield.",
    );
  } else if (i.gdpGrowth >= 3) {
    tilt(a, "equityDev", 3);
    tilt(a, "equityEm", 3);
    tilt(a, "hy", 2);
    tilt(a, "commodities", 2);
    tilt(a, "longBonds", -2);
    reasoning.push(
      "Growth is robust: cyclicals, EM, high yield and commodities are favoured.",
    );
  }

  // Valuation
  if (i.equityValuation === "expensive") {
    tilt(a, "equityDev", -4);
    tilt(a, "equityValue", 3);
    tilt(a, "equityEm", 2);
    tilt(a, "cash", 2);
    reasoning.push(
      "Developed equities look expensive — rotate toward value, EM (cheaper on most measures), and keep dry powder.",
    );
  } else if (i.equityValuation === "cheap") {
    tilt(a, "equityDev", 4);
    tilt(a, "equityValue", 2);
    tilt(a, "cash", -2);
    reasoning.push("Equities are cheap — bias toward deploying capital broadly.");
  }

  // USD trend → EM exposure
  if (i.usdTrend === "strong") {
    tilt(a, "equityEm", -3);
    tilt(a, "gold", -1);
    tilt(a, "equityDev", 2);
    reasoning.push("A strong USD is a headwind for EM and gold; bias to USD-denominated assets.");
  } else if (i.usdTrend === "weak") {
    tilt(a, "equityEm", 3);
    tilt(a, "gold", 2);
    tilt(a, "commodities", 2);
    reasoning.push("A weak USD is a structural tailwind for EM, gold and commodities.");
  }

  // Horizon
  if (i.horizonYears < 3) {
    tilt(a, "cash", 8);
    tilt(a, "shortBonds", 5);
    tilt(a, "equityDev", -6);
    tilt(a, "equityEm", -3);
    tilt(a, "bitcoin", -2);
    tilt(a, "commodities", -2);
    reasoning.push(
      "Short horizon: capital preservation dominates. Equity drawdowns can take 3–5 years to recover.",
    );
  } else if (i.horizonYears >= 10) {
    tilt(a, "equityDev", 4);
    tilt(a, "equityEm", 2);
    tilt(a, "cash", -3);
    reasoning.push(
      "Long horizon: equities compound — short-term volatility is the price of long-term returns.",
    );
  }

  return { allocation: normalize(a), reasoning };
}

function topIdeas(i: Inputs): { title: string; detail: string }[] {
  const ideas: { title: string; detail: string }[] = [];
  const realRate = i.policyRate - i.inflation;

  if (i.policyRate >= 4) {
    ideas.push({
      title: "Lock in yield with short-duration government bonds",
      detail:
        "1–3 year Treasuries / Bunds / Gilts via ETFs (e.g. SHY, IB01) pay near peak-cycle yields with minimal duration risk. Ladder maturities to roll into whatever comes next.",
    });
  }
  if (realRate >= 1.5) {
    ideas.push({
      title: "Build a TIPS / inflation-linked sleeve",
      detail:
        "Positive real yields on inflation-linked bonds are rare. Locking in a real return above inflation is a high-quality, low-stress trade.",
    });
  }
  if (i.inflation >= 3.5) {
    ideas.push({
      title: "Add real-asset hedges",
      detail:
        "Gold (PHAU/IAU), broad commodities (DBC/BCOM), and quality REITs with pricing power preserve purchasing power when CPI runs hot.",
    });
  }
  if (i.equityValuation === "expensive" && i.risk !== "conservative") {
    ideas.push({
      title: "Rotate from cap-weighted indices toward value & quality",
      detail:
        "Equal-weight S&P, global value, and dividend-aristocrat ETFs reduce concentration risk when megacaps are stretched.",
    });
  }
  if (i.usdTrend === "weak" && i.risk !== "conservative") {
    ideas.push({
      title: "Increase EM and international exposure",
      detail:
        "EM equities and local-currency EM debt benefit from a weak USD and tend to trade at cheaper multiples than US large-caps.",
    });
  }
  if (i.gdpGrowth <= 0.5) {
    ideas.push({
      title: "Barbell: long-duration Treasuries + defensive equity",
      detail:
        "If growth disappoints, long bonds rally as rates fall. Pair with healthcare, staples and utilities for defensive carry.",
    });
  }
  if (i.horizonYears >= 10 && i.risk === "aggressive") {
    ideas.push({
      title: "Systematic DCA into global equities",
      detail:
        "Monthly contributions into a global equity ETF (VWCE/VT) remove timing risk. Over 10+ years the entry point matters far less than the discipline.",
    });
  }
  if (i.market === "tr") {
    ideas.push({
      title: "TL mevduat & KKM yerine kısa vadeli DİBS / TLREF fonları",
      detail:
        "TCMB politika faizi yüksekken kısa vadeli Hazine bonoları, TLREF endeksli para piyasası fonları (örn. AFA, ZTM) ve likit fonlar mevduata göre genelde daha avantajlı net getiri sağlar; vergi avantajı için ≥1 yıl tutulan fonlara dikkat.",
    });
    if (i.inflation >= 25) {
      ideas.push({
        title: "TÜFE'ye Endeksli Devlet Tahvili (TÜFEX) sleeve'i",
        detail:
          "Yüksek enflasyon rejiminde TÜFE'ye endeksli DİBS'ler reel getiriyi koruyan en temiz araç. Doğrudan ihaleden veya TÜFEX ağırlıklı yatırım fonları üzerinden erişilebilir.",
      });
    }
    ideas.push({
      title: "Altın: gram altın, Ziraat Kulpsuz / BIST altın fonları (GLD, GAU)",
      detail:
        "TL'nin yapısal değer kaybı ve negatif reel faiz dönemlerinde altın hem enflasyon hem kur hedge'i. Fiziki yerine BIST'te işlem gören altın ETF'leri (GLD, GAU) likidite ve saklama açısından pratiktir.",
    });
    ideas.push({
      title: "Eurobond ve döviz cinsi fonlar ile kur koruması",
      detail:
        "Hazine USD eurobondları veya eurobond fonları (örn. AK Eurobond, QNB Finans Eurobond) hem USD getirisi hem TL bazında kur kazancı sunar. Portföyün %20-40'ı döviz bazlı tutulması tipik bir TR çözümü.",
    });
    if (i.risk !== "conservative") {
      ideas.push({
        title: "BIST: temettü ve ihracatçı ağırlıklı seçici hisse",
        detail:
          "Enflasyon ortamında pricing power'ı olan ihracatçılar (otomotiv, beyaz eşya, demir-çelik) ve istikrarlı temettü ödeyenler tercih edilir. BIST Temettü 25 (DJIST) veya BIST 30 (XU030 / ZPX30 fonu) ile geniş erişim.",
      });
    }
    if (i.horizonYears >= 5) {
      ideas.push({
        title: "Bireysel Emeklilik Sistemi (BES) %30 devlet katkısı",
        detail:
          "BES katkı paylarına %30 devlet katkısı + uzun vadede stopaj avantajı, TR'ye özgü en yüksek risksiz alpha kaynaklarından biri. Fon seçimini agresif/dengeli profile göre kendin belirleyebilirsin.",
      });
    }
    ideas.push({
      title: "Gayrimenkul yerine GYO ve gayrimenkul yatırım fonları",
      detail:
        "Doğrudan konut alımının likidite ve vergi yükü yüksek. BIST'teki GYO'lar (örn. EKGYO, ISGYO) ve nitelikli yatırımcı gayrimenkul fonları daha esnek bir reel varlık ekspozürü sağlar.",
    });
  }

  if (ideas.length === 0) {
    ideas.push({
      title: "Stay diversified and rebalance annually",
      detail:
        "Conditions are mixed — no single trade dominates. Stick to your target allocation and rebalance back to weights once a year.",
    });
  }
  return ideas;
}

function defaultsFor(market: Market): Inputs {
  if (market === "tr") {
    return {
      market: "tr",
      policyRate: 42.5,
      inflation: 38,
      gdpGrowth: 2.5,
      equityValuation: "fair",
      usdTrend: "strong",
      horizonYears: 5,
      risk: "balanced",
    };
  }
  return {
    market: "global",
    policyRate: 4.5,
    inflation: 3.0,
    gdpGrowth: 1.5,
    equityValuation: "expensive",
    usdTrend: "neutral",
    horizonYears: 7,
    risk: "balanced",
  };
}

type Lang = "en" | "tr";

const I18N = {
  en: {
    eyebrow: "Scenario Advisor",
    title: "What can I invest in under today's conditions?",
    intro:
      "Set the macro regime and your profile. The model returns an expert-style allocation with the reasoning behind every tilt — the way a portfolio manager would explain it.",
    conditions: "Conditions",
    market: "Market",
    marketGlobal: "Global",
    marketTr: "Türkiye",
    trNote:
      "Türkiye mode: ideas include TL instruments, TÜFEX, BES, eurobond and gold funds, and BIST equities.",
    policyRate: "Central bank policy rate",
    inflation: "Inflation (CPI YoY)",
    gdp: "Real GDP growth",
    realRate: "Real policy rate ≈",
    valuation: "Equity valuation",
    cheap: "Cheap",
    fair: "Fair",
    expensive: "Expensive",
    usd: "USD trend",
    weak: "Weak",
    neutral: "Neutral",
    strong: "Strong",
    horizon: "Investment horizon",
    yrs: " yrs",
    risk: "Risk profile",
    conservative: "Conservative",
    balanced: "Balanced",
    aggressive: "Aggressive",
    allocation: "Suggested allocation",
    allocationNote: "Normalised to 100%. Treat as a starting framework, not personal advice.",
    expertRead: "How an expert reads this regime",
    balancedRegime:
      "Conditions look balanced — no strong macro tilt. Stick to your strategic allocation and avoid hero trades.",
    ideas: "Concrete ideas to execute",
    legalTitle: "Important legal notice — please read",
    legalP1Pre:
      "This tool is a software program that generates illustrative, rules-based output for general educational and informational purposes only. It is ",
    legalP1Strong: "not investment, financial, tax, legal or accounting advice",
    legalP1Post:
      ", not a recommendation, solicitation or offer to buy or sell any security, fund, cryptocurrency, derivative or other financial instrument, and does not constitute portfolio management, investment advisory or brokerage services under any jurisdiction (including SPK/CMB in Türkiye, SEC/FINRA in the U.S., MiFID II in the EU/UK, or equivalent regimes elsewhere).",
    legalP2:
      "Outputs are produced by deterministic logic from the values you enter, may be incomplete, outdated or incorrect, and do not take into account your personal financial situation, objectives, tax position or risk tolerance. Ticker symbols, fund names and instruments shown are illustrative examples only, not endorsements.",
    legalP3Pre:
      "All investments carry risk, including the possible loss of principal. Past performance does not guarantee future results. ",
    legalP3Strong: "You are solely responsible for your own investment decisions",
    legalP3Post:
      " and for any resulting gains or losses. Before acting on anything shown here, consult a licensed financial advisor and verify all information with primary sources. By using this tool you acknowledge and accept these terms and agree that the authors and operators accept no liability for any loss or damage arising from its use.",
  },
  tr: {
    eyebrow: "Senaryo Danışmanı",
    title: "Bugünün koşullarında neye yatırım yapabilirim?",
    intro:
      "Makro rejimi ve profilini ayarla. Model, her ağırlık kayması için gerekçesiyle birlikte uzman tarzında bir varlık dağılımı sunar — bir portföy yöneticisinin anlatacağı gibi.",
    conditions: "Koşullar",
    market: "Piyasa",
    marketGlobal: "Global",
    marketTr: "Türkiye",
    trNote:
      "Türkiye modu: öneriler TL araçlarını, TÜFEX, BES, eurobond ve altın fonlarını, BIST hisselerini içerir.",
    policyRate: "Merkez bankası politika faizi",
    inflation: "Enflasyon (TÜFE, yıllık)",
    gdp: "Reel GSYH büyümesi",
    realRate: "Reel politika faizi ≈",
    valuation: "Hisse değerlemesi",
    cheap: "Ucuz",
    fair: "Makul",
    expensive: "Pahalı",
    usd: "USD trendi",
    weak: "Zayıf",
    neutral: "Nötr",
    strong: "Güçlü",
    horizon: "Yatırım vadesi",
    yrs: " yıl",
    risk: "Risk profili",
    conservative: "Korumacı",
    balanced: "Dengeli",
    aggressive: "Agresif",
    allocation: "Önerilen dağılım",
    allocationNote:
      "%100'e normalize edilmiştir. Başlangıç çerçevesi olarak değerlendir — kişisel tavsiye değildir.",
    expertRead: "Bir uzman bu rejimi nasıl okur",
    balancedRegime:
      "Koşullar dengeli görünüyor — güçlü bir makro eğilim yok. Stratejik dağılımına bağlı kal, kahraman işlemlerden uzak dur.",
    ideas: "Uygulanabilir somut fikirler",
    legalTitle: "Önemli yasal uyarı — lütfen okuyun",
    legalP1Pre:
      "Bu araç, yalnızca genel eğitim ve bilgilendirme amacıyla illüstratif, kural tabanlı çıktı üreten bir yazılım programıdır. ",
    legalP1Strong: "Yatırım, finans, vergi, hukuk veya muhasebe tavsiyesi değildir",
    legalP1Post:
      "; herhangi bir menkul kıymet, fon, kripto varlık, türev veya başka bir finansal enstrümanın alınıp satılması için tavsiye, telkin veya teklif niteliği taşımaz ve hiçbir yetki alanında (Türkiye'de SPK, ABD'de SEC/FINRA, AB/Birleşik Krallık'ta MiFID II veya başka eşdeğer rejimler dahil) portföy yönetimi, yatırım danışmanlığı veya aracılık hizmeti oluşturmaz.",
    legalP2:
      "Çıktılar, girdiğin değerlerden deterministik mantıkla üretilir; eksik, güncel olmayan veya yanlış olabilir ve kişisel finansal durumunu, hedeflerini, vergi pozisyonunu veya risk toleransını dikkate almaz. Gösterilen kod/sembol, fon adı ve enstrümanlar yalnızca örnek niteliğindedir; onay değildir.",
    legalP3Pre:
      "Tüm yatırımlar, anaparanın kaybı dahil risk içerir. Geçmiş performans gelecekteki sonuçları garanti etmez. ",
    legalP3Strong: "Yatırım kararlarından yalnızca sen sorumlusun",
    legalP3Post:
      " ve doğacak kâr veya zararlar sana aittir. Burada gösterilen herhangi bir şeye göre hareket etmeden önce lisanslı bir finansal danışmana başvur ve tüm bilgileri birincil kaynaklardan doğrula. Bu aracı kullanarak bu şartları kabul ettiğini ve yazarların ile işletenlerin kullanımından doğan herhangi bir zarardan sorumlu olmadığını kabul etmiş sayılırsın.",
  },
} as const;

function Index() {
  const [inputs, setInputs] = useState<Inputs>(() => defaultsFor("global"));
  const [lang, setLang] = useState<Lang>("en");
  const t = I18N[lang];

  const { allocation, reasoning } = useMemo(() => buildAllocation(inputs), [inputs]);
  const ideas = useMemo(() => topIdeas(inputs), [inputs]);
  const realRate = inputs.policyRate - inputs.inflation;

  const sorted = (Object.keys(allocation) as (keyof Allocation)[])
    .map((k) => ({ key: k, label: LABELS[k], pct: allocation[k] }))
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t.eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {t.title}
              </h1>
            </div>
            <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-border">
              {(["en", "tr"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={
                    "px-3 py-1.5 text-xs font-medium transition-colors " +
                    (lang === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted")
                  }
                >
                  {l === "en" ? "EN" : "TR"}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {t.intro}
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_1.4fr]">
        {/* Inputs */}
        <section className="space-y-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{t.conditions}</h2>

          <SelectRow
            label={t.market}
            value={inputs.market}
            options={[
              { value: "global", label: t.marketGlobal },
              { value: "tr", label: t.marketTr },
            ]}
            onChange={(v) => setInputs(defaultsFor(v as Market))}
          />
          {inputs.market === "tr" && (
            <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {t.trNote}
            </p>
          )}

          <SliderRow
            label={t.policyRate}
            value={inputs.policyRate}
            min={0}
            max={10}
            step={0.25}
            unit="%"
            onChange={(v) => update("policyRate", v)}
          />
          <SliderRow
            label={t.inflation}
            value={inputs.inflation}
            min={-2}
            max={12}
            step={0.1}
            unit="%"
            onChange={(v) => update("inflation", v)}
          />
          <SliderRow
            label={t.gdp}
            value={inputs.gdpGrowth}
            min={-4}
            max={6}
            step={0.1}
            unit="%"
            onChange={(v) => update("gdpGrowth", v)}
          />
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.realRate} <span className="font-mono">{realRate.toFixed(2)}%</span>
          </div>

          <SelectRow
            label={t.valuation}
            value={inputs.equityValuation}
            options={[
              { value: "cheap", label: t.cheap },
              { value: "fair", label: t.fair },
              { value: "expensive", label: t.expensive },
            ]}
            onChange={(v) => update("equityValuation", v as Inputs["equityValuation"])}
          />
          <SelectRow
            label={t.usd}
            value={inputs.usdTrend}
            options={[
              { value: "weak", label: t.weak },
              { value: "neutral", label: t.neutral },
              { value: "strong", label: t.strong },
            ]}
            onChange={(v) => update("usdTrend", v as Inputs["usdTrend"])}
          />

          <SliderRow
            label={t.horizon}
            value={inputs.horizonYears}
            min={1}
            max={30}
            step={1}
            unit={t.yrs}
            onChange={(v) => update("horizonYears", v)}
          />

          <SelectRow
            label={t.risk}
            value={inputs.risk}
            options={[
              { value: "conservative", label: t.conservative },
              { value: "balanced", label: t.balanced },
              { value: "aggressive", label: t.aggressive },
            ]}
            onChange={(v) => update("risk", v as Risk)}
          />
        </section>

        {/* Output */}
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">{t.allocation}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.allocationNote}</p>
            <div className="mt-5 space-y-2">
              {sorted.map((row) => (
                <div key={row.key}>
                  <div className="flex justify-between text-sm">
                    <span>{row.label}</span>
                    <span className="font-mono tabular-nums">{row.pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, row.pct * 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">{t.expertRead}</h2>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {reasoning.length === 0 ? (
                <li>{t.balancedRegime}</li>
              ) : (
                reasoning.map((r, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{r}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">{t.ideas}</h2>
            <div className="mt-4 space-y-4">
              {ideas.map((idea, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4">
                  <p className="text-sm font-medium">{idea.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{idea.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-relaxed">
            <p className="font-semibold text-foreground">{t.legalTitle}</p>
            <p className="mt-2 text-muted-foreground">
              {t.legalP1Pre}
              <span className="font-medium text-foreground">{t.legalP1Strong}</span>
              {t.legalP1Post}
            </p>
            <p className="mt-2 text-muted-foreground">{t.legalP2}</p>
            <p className="mt-2 text-muted-foreground">
              {t.legalP3Pre}
              <span className="font-medium text-foreground">{t.legalP3Strong}</span>
              {t.legalP3Post}
            </p>
          </div>

        </section>
      </main>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium">{label}</label>
        <span className="font-mono tabular-nums text-muted-foreground">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "rounded-md border px-3 py-2 text-sm transition-colors " +
              (value === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
