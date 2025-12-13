"use client";

import React, { useState } from "react";

type StyleKey =
  | "calme"
  | "pro"
  | "flirty"
  | "direct"
  | "empathique"
  | "agressif"
  | "humour"
  | "seduction";

const STYLE_LABELS: Record<StyleKey, string> = {
  calme: "Calme & posé",
  pro: "Professionnel",
  flirty: "Flirty",
  direct: "Direct / concis",
  empathique: "Gentil & empathique",
  agressif: "Agressif soft",
  humour: "Humoristique",
  seduction: "Séduction subtile",
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState<StyleKey>("calme");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copyInfo, setCopyInfo] = useState<string | null>(null);

  // Parser : sépare analyse et réponses à partir du texte brut (tolérant)
  function parseResult(raw: string) {
    const split = raw.split(/RÉPONSES PROPOSÉES\s*:/i);
    const analysisPart = split[0]?.trim() || null;
    const answersPart = split[1] || "";

    // 1) Cas standard : réponses sur lignes "1) ...", "2) ...", "3) ..."
    const lines = answersPart.split("\n").map((l) => l.trim()).filter(Boolean);
    const numbered = lines
      .filter((line) => /^[0-9]+\)/.test(line))
      .map((line) => line.replace(/^[0-9]+\)\s*/, "").trim())
      .filter(Boolean);

    // 2) Fallback : parfois le modèle renvoie "1." au lieu de "1)"
    const dotted = numbered.length
      ? []
      : lines
          .filter((line) => /^[0-9]+\./.test(line))
          .map((line) => line.replace(/^[0-9]+\.\s*/, "").trim())
          .filter(Boolean);

    const parsedAnswers = numbered.length ? numbered : dotted;

    setAnalysis(analysisPart);
    setAnswers(parsedAnswers);
  }

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
        body: JSON.stringify({ message, style }), // ✅ on envoie le style
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur inconnue.");
      } else if (data.text) {
        parseResult(data.text);
      } else {
        setError("Réponse vide de l'IA.");
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
    } catch (e) {
      console.error(e);
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
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          width: "100%",
          background: "rgba(15,23,42,0.95)",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
          border: "1px solid #1e293b",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              background: "rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.3)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#7dd3fc",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "9px" }}>●</span>
            Assistant social IA
          </div>

          <h1 style={{ fontSize: "26px", fontWeight: 600, marginBottom: "6px" }}>
            The Social Shortcut
          </h1>

          <p style={{ fontSize: "14px", opacity: 0.78, maxWidth: "560px" }}>
            Colle un message délicat (WhatsApp, Insta, SMS...) et laisse l’IA analyser le ton,
            l’intention, l’émotion — puis te proposer plusieurs réponses intelligentes.
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "6px",
              opacity: 0.8,
            }}
          >
            Message reçu
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Exemple : “Franchement je trouve que tu abuses, tu ne prends jamais le temps de répondre et ça me saoule.”'
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "white",
              resize: "vertical",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          />

          {/* Select style */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              marginBottom: "6px",
              opacity: 0.8,
              marginTop: "6px",
            }}
          >
            Style souhaité
          </label>

          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleKey)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "white",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          >
            {(Object.keys(STYLE_LABELS) as StyleKey[]).map((k) => (
              <option key={k} value={k}>
                {STYLE_LABELS[k]}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "999px",
              border: "none",
              background: loading
                ? "#64748b"
                : "linear-gradient(90deg,#38bdf8,#22c55e)",
              color: "black",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    border: "2px solid rgba(15,23,42,0.3)",
                    borderTopColor: "#0f172a",
                    borderRightColor: "#0f172a",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Analyse en cours…
              </>
            ) : (
              `Analyser & répondre (${STYLE_LABELS[style]})`
            )}
          </button>
        </form>

        {/* Messages d'erreur / info */}
        {error && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "10px",
              background: "#7f1d1d",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {copyInfo && (
          <div
            style={{
              marginBottom: "12px",
              padding: "6px 9px",
              borderRadius: "10px",
              background: "#022c22",
              fontSize: "12px",
              color: "#6ee7b7",
              border: "1px solid #065f46",
            }}
          >
            {copyInfo}
          </div>
        )}

        {/* Résultats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: answers.length
              ? "minmax(0, 1.3fr) minmax(0, 1.2fr)"
              : "minmax(0,1fr)",
            gap: "16px",
            marginTop: analysis || answers.length ? 4 : 0,
          }}
        >
          {/* Carte Analyse */}
          {analysis && (
            <section
              style={{
                padding: "14px",
                borderRadius: "16px",
                background: "rgba(15,23,42,0.9)",
                border: "1px solid #1f2937",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  marginBottom: "8px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#38bdf8",
                  }}
                />
                Analyse du message
              </h2>

              <p
                style={{
                  fontSize: "13px",
                  opacity: 0.86,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
                {analysis}
              </p>
            </section>
          )}

          {/* Carte Réponses */}
          {answers.length > 0 && (
            <section
              style={{
                padding: "14px",
                borderRadius: "16px",
                background: "rgba(15,23,42,0.9)",
                border: "1px solid #1f2937",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  marginBottom: "8px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "999px",
                      background: "#22c55e",
                    }}
                  />
                  Réponses possibles
                </span>

                <span
                  style={{
                    fontSize: "11px",
                    opacity: 0.7,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {STYLE_LABELS[style]}
                </span>
              </h2>

              {answers.length === 0 ? (
                <p style={{ fontSize: "13px", opacity: 0.8 }}>
                  Je n’ai pas réussi à extraire les 3 réponses automatiquement. (On peut renforcer le format ensuite.)
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {answers.map((rep, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "9px 10px",
                        borderRadius: "12px",
                        background: "#020617",
                        border: "1px solid #1f2937",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            opacity: 0.7,
                          }}
                        >
                          Option {i + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(rep)}
                          style={{
                            border: "none",
                            borderRadius: "999px",
                            padding: "4px 9px",
                            fontSize: "11px",
                            cursor: "pointer",
                            background: "rgba(148,163,184,0.2)",
                            color: "#e5e7eb",
                          }}
                        >
                          Copier
                        </button>
                      </div>

                      <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{rep}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: "18px",
            fontSize: "11px",
            opacity: 0.5,
            textAlign: "right",
          }}
        >
          Prototype personnel – réponses à adapter avec ton propre jugement.
        </footer>
      </div>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </main>
  );
}
