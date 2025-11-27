"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return (
    <main style={{ padding: 40 }}>
      <h1>Yarmotek GuardCloud</h1>
      <p>Redirection vers la page de connexion...</p>
    </main>
  );
}
