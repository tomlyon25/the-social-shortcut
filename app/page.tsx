"use client";

import { useState } from "react";

type Analysis = {
  tone: string;
  intention: string;
  emotion: string;
  need: string;
  risk: string;
};

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
    } catch (err) {
      console.error(err);
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyInfo("Réponse copiée ✅");
      setTimeout(() => setCopyInfo(null), 2000);
    } catch {
      setCopyInfo("Impossible de copier 😕");
      setTimeout(() => setCopyInfo(null), 2000);
    }
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
          boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
          border: "1px solid #1e293b",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600 }}>
            The Social Shortcut
          </h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>
            Analyse un message délicat et obtiens des réponses intelligentes,
            humaines et adaptées.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Colle ici le message reçu…"
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "white",
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
              border: "none",
              background: loading
                ? "#64748b"
                : "linear-gradient(90deg,#38bdf8,#22c55e)",
              color: "black",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Analyse en cours…" : "Analyser & proposer des réponses"}
          </button>
        </form>

        {error && (
          <div style={{ background: "#7f1d1d", padding: 10, borderRadius: 8 }}>
            {error}
          </div>
        )}

        {analysis && (
          <section style={{ marginTop: 16 }}>
            <h2>Analyse</h2>
            <ul style={{ fontSize: 14, opacity: 0.85 }}>
              <li><b>Ton :</b> {analysis.tone}</li>
              <li><b>Intention :</b> {analysis.intention}</li>
              <li><b>Émotion :</b> {analysis.emotion}</li>
              <li><b>Besoin :</b> {analysis.need}</li>
              <li><b>Risque :</b> {analysis.risk}</li>
            </ul>
          </section>
        )}

        {answers.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <h2>Réponses possibles</h2>
            {answers.map((rep, i) => (
              <div
                key={i}
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 10,
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Option {i + 1}</span>
                  <button onClick={() => handleCopy(rep)}>Copier</button>
                </div>
                <p>{rep}</p>
              </div>
            ))}
          </section>
        )}

        {copyInfo && <div style={{ marginTop: 8 }}>{copyInfo}</div>}
      </div>
    </main>
  );
}
