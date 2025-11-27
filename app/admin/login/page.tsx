"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Identifiants incorrects");
      }

      // Token admin
      if (data.token) {
        localStorage.setItem("gc_token", data.token);
      }

      // Redirection vers tableau de bord
      router.push("/map/devices");
    } catch (e: any) {
      setError(e.message ?? "Erreur de connexion");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "white",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          borderRadius: 12,
          background: "#0b1120",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 12, fontWeight: 600 }}>
          Yarmotek GuardCloud
        </h1>

        <p style={{ marginBottom: 20, fontSize: 14, opacity: 0.8 }}>
          Admin login (YGC-ADMIN ou compte client)
        </p>

        <form onSubmit={handleSubmit}>
          {/* Champ identifiant */}
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Identifiant
          </label>
          <input
            type="text"     // ✔ Correction ici
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "white",
            }}
            placeholder="YGC-ADMIN"
          />

          {/* Champ mot de passe */}
          <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 16,
              borderRadius: 6,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "white",
            }}
            placeholder="Mot de passe"
          />

          {error && (
            <div
              style={{
                marginBottom: 12,
                fontSize: 13,
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 6,
              border: "none",
              background: "#22c55e",
              color: "#0f172a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
