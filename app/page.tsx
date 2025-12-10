"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!message.trim()) {
      setError("Colle un message d'abord 😉");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shortcut", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur inconnue.");
      } else {
        setResult(data.text || null);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau ou serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          background: "#020617",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          border: "1px solid #1e293b",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>
          The Social Shortcut
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "16px" }}>
          Colle un message compliqué, je t’aide à le comprendre et à répondre intelligemment.
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Colle ici le message que tu as reçu (WhatsApp, Insta, SMS...)"
            rows={5}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #1e293b",
              background: "#020617",
              color: "white",
              resize: "vertical",
              marginBottom: "12px",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#64748b" : "#38bdf8",
              color: "black",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Analyse en cours..." : "Analyser & proposer des réponses"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "#7f1d1d",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1e293b",
              whiteSpace: "pre-wrap",
              fontSize: "14px",
            }}
          >
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
