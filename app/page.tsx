"use client";

import { useEffect, useMemo, useState } from "react";

type Analysis = {
  tone: string;
  intention: string;
  emotion: string;
  need: string;
  risk: string;
};

type ApiResponse = {
  analysis: Analysis;
  answers: string[];
  recommended_index?: number; // 0,1,2
};

type HistoryItem = {
  id: string;
  createdAt: number;
  message: string;
  relation: string;
  objective: string;
  pronoun: string;
  length: string;
  style: string;
  response: ApiResponse;
};

const ANSWER_TAGS = ["Apaiser", "Clarifier", "Poser une limite"] as const;
const HISTORY_KEY = "tss_history_v1";
const HISTORY_MAX = 10;

export default function Home() {
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState("ami");
  const [objective, setObjective] = useState("apaiser");
  const [pronoun, setPronoun] = useState("tu"); // tu | vous
  const [length, setLength] = useState("court"); // court | normal
  const [style, setStyle] = useState("calme");

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recommendedIndex, setRecommendedIndex] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [copyInfo, setCopyInfo] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- history load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  function saveToHistory(item: HistoryItem) {
    const next = [item, ...history].slice(0, HISTORY_MAX);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function clearUi() {
    setError("");
    setAnalysis(null);
    setAnswers([]);
    setRecommendedIndex(null);
    setCopyInfo(null);
  }

  async function callApi(payload: {
    message: string;
    relation: string;
    objective: string;
    pronoun: string;
    length: string;
    style: string;
  }) {
    const res = await fetch("/api/shortcut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erreur inconnue.");
    return data as ApiResponse;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearUi();

    if (!message.trim()) {
      setError("Colle un message d'abord 😉");
      return;
    }

    setLoading(true);
    try {
      const data = await callApi({ message, relation, objective, pronoun, length, style });

      setAnalysis(data.analysis || null);
      setAnswers(Array.isArray(data.answers) ? data.answers : []);
      setRecommendedIndex(
        typeof data.recommended_index === "number" ? data.recommended_index : null
      );

      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        message,
        relation,
        objective,
        pronoun,
        length,
        style,
        response: data,
      };
      saveToHistory(item);
    } catch (err: any) {
      setError(err?.message || "Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    clearUi();

    if (!message.trim()) {
      setError("Colle un message d'abord 😉");
      return;
    }

    setLoading(true);
    try {
      const data = await callApi({ message, relation, objective, pronoun, length, style });
      setAnalysis(data.analysis || null);
      setAnswers(Array.isArray(data.answers) ? data.answers : []);
      setRecommendedIndex(
        typeof data.recommended_index === "number" ? data.recommended_index : null
      );
    } catch (err: any) {
      setError(err?.message || "Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyInfo("Copié ✅");
      setTimeout(() => setCopyInfo(null), 1500);
    } catch {
      setCopyInfo("Impossible 😕");
      setTimeout(() => setCopyInfo(null), 1500);
    }
  }

  function loadHistoryItem(item: HistoryItem) {
    clearUi();
    setMessage(item.message);
    setRelation(item.relation);
    setObjective(item.objective);
    setPronoun(item.pronoun);
    setLength(item.length);
    setStyle(item.style);

    setAnalysis(item.response.analysis || null);
    setAnswers(item.response.answers || []);
    setRecommendedIndex(
      typeof item.response.recommended_index === "number" ? item.response.recommended_index : null
    );
  }

  const analysisText = useMemo(() => {
    if (!analysis) return null;

    const a = analysis.tone?.trim();
    const b = analysis.intention?.trim();
    const c = analysis.emotion?.trim();
    const d = analysis.need?.trim();
    const e = analysis.risk?.trim();

    const parts = [
      a ? `À la lecture, ${lowerFirst(a)}` : null,
      b ? `Ça laisse penser que ${lowerFirst(b)}` : null,
      c ? `L’émotion qui ressort le plus : ${lowerFirst(c)}` : null,
      d ? `En dessous, le besoin semble être : ${lowerFirst(d)}` : null,
      e ? `Le piège à éviter : ${lowerFirst(e)}` : null,
    ].filter(Boolean);

    return parts.join(". ") + (parts.length ? "." : "");
  }, [analysis]);

  const riskBadge = useMemo(() => {
    if (!analysis?.risk) return null;
    const r = analysis.risk.toLowerCase();
    if (r.includes("fort") || r.includes("élev") || r.includes("explos") || r.includes("envenim"))
      return "Risque élevé";
    if (r.includes("moyen") || r.includes("attention") || r.includes("tendu") || r.includes("malent"))
      return "Risque moyen";
    return "Risque faible";
  }, [analysis]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "radial-gradient(circle at top, #1e293b 0, #020617 55%, #000 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: history.length ? "320px 1fr" : "1fr",
          gap: 14,
        }}
      >
        {/* Sidebar history */}
        {history.length > 0 && (
          <aside
            style={{
              borderRadius: 18,
              border: "1px solid #1e293b",
              background: "rgba(15,23,42,0.92)",
              padding: 14,
              height: "fit-content",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>Historique</h3>
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  try {
                    localStorage.removeItem(HISTORY_KEY);
                  } catch {}
                }}
                style={btnGhostSmall}
              >
                Effacer
              </button>
            </div>

            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => loadHistoryItem(h)}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid #1f2937",
                    background: "#020617",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.35, opacity: 0.92 }}>
                    {truncate(h.message, 110)}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <Tag text={h.relation} />
                    <Tag text={h.objective} />
                    <Tag text={h.pronoun.toUpperCase()} />
                    <Tag text={h.length} />
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main card */}
        <div
          style={{
            borderRadius: 24,
            border: "1px solid #1e293b",
            background: "rgba(15,23,42,0.95)",
            padding: 22,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          <header style={{ marginBottom: 14 }}>
            <div style={pill}>
              <span style={{ fontSize: 9 }}>●</span> Assistant social IA
            </div>
            <h1 style={{ margin: "10px 0 6px", fontSize: 26, fontWeight: 650 }}>
              The Social Shortcut
            </h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.78, maxWidth: 640 }}>
              Colle un message délicat. Choisis le contexte et l’objectif. L’IA te propose 3 réponses
              prêtes à envoyer (humaines et crédibles).
            </p>
          </header>

          <form onSubmit={handleSubmit}>
            <label style={label}>Message reçu</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: “Franchement tu réponds jamais… j’en ai marre.”"
              rows={4}
              style={textarea}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div>
                <label style={label}>Relation</label>
                <select value={relation} onChange={(e) => setRelation(e.target.value)} style={select}>
                  <option value="ami">Ami / proche</option>
                  <option value="couple">Couple</option>
                  <option value="ex">Ex</option>
                  <option value="collegue">Collègue</option>
                  <option value="manager">Manager</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label style={label}>Objectif</label>
                <select value={objective} onChange={(e) => setObjective(e.target.value)} style={select}>
                  <option value="apaiser">Apaiser</option>
                  <option value="clarifier">Clarifier</option>
                  <option value="recadrer">Poser une limite</option>
                  <option value="refuser">Refuser</option>
                  <option value="relancer">Relancer</option>
                  <option value="conclure">Clore la discussion</option>
                </select>
              </div>

              <div>
                <label style={label}>Tu / Vous</label>
                <select value={pronoun} onChange={(e) => setPronoun(e.target.value)} style={select}>
                  <option value="tu">Tu</option>
                  <option value="vous">Vous</option>
                </select>
              </div>

              <div>
                <label style={label}>Longueur</label>
                <select value={length} onChange={(e) => setLength(e.target.value)} style={select}>
                  <option value="court">Court (SMS)</option>
                  <option value="normal">Normal (WhatsApp)</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} style={select}>
                  <option value="calme">Calme</option>
                  <option value="pro">Professionnel</option>
                  <option value="empathique">Empathique</option>
                  <option value="direct">Direct</option>
                  <option value="flirty">Flirty</option>
                  <option value="humour">Humour</option>
                  <option value="agressif">Agressif soft</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button type="submit" disabled={loading} style={btnPrimary}>
                {loading ? "Analyse…" : "Analyser & proposer"}
              </button>
              <button type="button" disabled={loading} onClick={handleRegenerate} style={btnGhost}>
                Régénérer
              </button>
            </div>
          </form>

          {error && (
            <div style={errorBox}>
              {error}
            </div>
          )}

          {copyInfo && (
            <div style={okBox}>
              {copyInfo}
            </div>
          )}

          {/* Analyse */}
          {analysis && (
            <section style={cardSection}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <h2 style={h2}>Lecture du message</h2>
                {riskBadge && <span style={badge}>{riskBadge}</span>}
              </div>
              {analysisText && <p style={analysisP}>{analysisText}</p>}
            </section>
          )}

          {/* Answers */}
          {answers.length > 0 && (
            <section style={{ marginTop: 14 }}>
              {answers.map((rep, i) => {
                const isRecommended = recommendedIndex === i;
                return (
                  <div key={i} style={{ ...answerCard, borderColor: isRecommended ? "rgba(34,197,94,0.45)" : "#1f2937" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={optText}>Option {i + 1}</span>
                        <span style={tagPill}>{ANSWER_TAGS[i] ?? "Réponse"}</span>
                        {isRecommended && <span style={recPill}>Recommandée</span>}
                      </div>

                      <button type="button" onClick={() => handleCopy(rep)} style={btnGhostSmall}>
                        Copier
                      </button>
                    </div>

                    <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, opacity: 0.95 }}>
                      {rep}
                    </p>
                  </div>
                );
              })}
            </section>
          )}

          <footer style={{ marginTop: 16, fontSize: 11, opacity: 0.55, textAlign: "right" }}>
            Prototype — adapte avec ton jugement.
          </footer>
        </div>
      </div>
    </main>
  );
}

function lowerFirst(s: string) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function truncate(s: string, n: number) {
  const t = (s || "").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trim() + "…";
}

function Tag({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.35)",
        background: "rgba(148,163,184,0.12)",
        opacity: 0.9,
      }}
    >
      {text}
    </span>
  );
}

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(56,189,248,0.10)",
  border: "1px solid rgba(56,189,248,0.25)",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#7dd3fc",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  opacity: 0.8,
  marginBottom: 6,
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #1f2937",
  background: "#020617",
  color: "white",
  resize: "vertical",
  fontSize: 14,
};

const select: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 999,
  border: "1px solid #1f2937",
  background: "#020617",
  color: "white",
  fontSize: 13,
};

const btnPrimary: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(90deg,#38bdf8,#22c55e)",
  color: "black",
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  width: 160,
  padding: 12,
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(148,163,184,0.12)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhostSmall: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "6px 10px",
  background: "rgba(148,163,184,0.15)",
  color: "white",
  cursor: "pointer",
  fontSize: 12,
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  background: "#7f1d1d",
  fontSize: 13,
};

const okBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.25)",
  fontSize: 13,
  color: "#bbf7d0",
};

const cardSection: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  background: "rgba(2,6,23,0.55)",
  border: "1px solid #1f2937",
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  opacity: 0.95,
};

const badge: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(148,163,184,0.12)",
  whiteSpace: "nowrap",
  opacity: 0.9,
  height: "fit-content",
};

const analysisP: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  opacity: 0.88,
  lineHeight: 1.55,
  fontSize: 14,
};

const answerCard: React.CSSProperties = {
  marginBottom: 10,
  padding: 12,
  borderRadius: 14,
  background: "#020617",
  border: "1px solid #1f2937",
};

const optText: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.7,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const tagPill: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(148,163,184,0.15)",
  border: "1px solid rgba(148,163,184,0.35)",
  whiteSpace: "nowrap",
};

const recPill: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.16)",
  border: "1px solid rgba(34,197,94,0.35)",
  whiteSpace: "nowrap",
};
