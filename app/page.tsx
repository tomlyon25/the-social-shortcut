"use client";

import { useState } from "react";

type Analysis = {
  tone: string;
  intention: string;
  emotion: string;
  need: string;
  risk: string;
};

const ANSWER_TAGS = ["Apaiser", "Clarifier", "Poser une limite"] as const;

export default function Home() {
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState("calme");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copyInfo, setCopyInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAnalysis(null);
    setAnswers([]);
    setCopyInfo(null);

    if (!message.trim()) {
      setError("Colle un message d'abord 😉");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shortcut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, style }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur inconnue.");
      } else {
        setAnalysis(data.analysis);
        setAnswers(data.answers || []);
      }
    } catch {
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopyInfo("Réponse copiée ✅");
    setTimeout(() => setCopyInfo(null), 2000);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #1e293b 0, #020617 55%, #000 100%)",
        color: "white",
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 850,
          width: "100%",
          background: "rgba(15,23,42,0.95)",
          borderRadius: 24,
          padding: 24,
          border: "1px solid #1e293b",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>
          The Social Shortcut
        </h1>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Colle le message reçu…"
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              background: "#020617",
              color: "white",
              border: "1px solid #1f2937",
              marginBottom: 10,
            }}
          />

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 999,
              marginBottom: 10,
              background: "#020617",
              color: "white",
              border: "1px solid #1f2937",
            }}
          >
            <option value="calme">Calme</option>
            <option value="pro">Professionnel</option>
            <option value="empathique">Empathique</option>
            <option value="direct">Direct</option>
            <option value="flirty">Flirty</option>
            <option value="humour">Humour</option>
            <option value="agressif">Agressif soft</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 999,
              background: loading
                ? "#64748b"
                : "linear-gradient(90deg,#38bdf8,#22c55e)",
              color: "black",
              fontWeight: 600,
              border: "none",
            }}
          >
            {loading ? "Analyse en cours…" : "Analyser & proposer"}
          </button>
        </form>

        {analysis && (
          <section style={{ marginTop: 20, fontSize: 14, opacity: 0.9 }}>
            <p><b>Lecture :</b> {analysis.tone}</p>
            <p><b>Ce que l’autre exprime :</b> {analysis.intention}</p>
            <p><b>Émotion probable :</b> {analysis.emotion}</p>
            <p><b>Besoin :</b> {analysis.need}</p>
            <p><b>Risque :</b> {analysis.risk}</p>
          </section>
        )}

        {answers.length > 0 && (
          <section style={{ marginTop: 20 }}>
            {answers.map((rep, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      Option {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "rgba(148,163,184,0.15)",
                        border: "1px solid rgba(148,163,184,0.35)",
                      }}
                    >
                      {ANSWER_TAGS[i]}
                    </span>
                  </div>
                  <button onClick={() => handleCopy(rep)}>Copier</button>
                </div>
                <p>{rep}</p>
              </div>
            ))}
          </section>
        )}

        {copyInfo && <div>{copyInfo}</div>}
        {error && <div style={{ color: "#f87171" }}>{error}</div>}
      </div>
    </main>
  );
}
