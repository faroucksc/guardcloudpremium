"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://yarmotek-guardcloud-api.myarbanga.workers.dev";

const DEFAULT_PHONE =
  process.env.NEXT_PUBLIC_BILLING_DEFAULT_PHONE ?? "22675255416";

type BillingEstimate = {
  ok: boolean;
  clientId: string;
  clientName: string | null;
  role: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
  devicesCount: number;
  unitXof: number;
  totalXof: number;
  approxUsd: number;
  currency: string;
  createdAt: string;
};

type BillingInfo = {
  period: string;
  devicesCount: number;
  role: string;
  unitXof: number;
  totalXof: number;
  approxUsd: number;
};

type Invoice = {
  invoiceId: string;
  clientId: string;
  clientName: string | null;
  billing: BillingInfo;
  phone?: string | null;
  checkoutUrl: string;
  status: string;
  createdAt: string;
  paidAt?: string;
};

type CreatePaymentResponse = {
  ok: boolean;
  invoiceId: string;
  checkoutUrl: string;
  billing: BillingInfo;
  message: string;
};

const CLIENT_ID = "CLIENT-TEST";
const CLIENT_NAME = "Client Démo";
const ROLE = "CLIENT";
const PERIOD: BillingEstimate["period"] = "MONTHLY";
const DEVICES = 1;

export default function BillingPage() {
  const [estimate, setEstimate] = useState<BillingEstimate | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidBanner, setPaidBanner] = useState<string | null>(null);

  // 1) Récupérer l'estimation de base
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/billing/estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: CLIENT_ID,
            clientName: CLIENT_NAME,
            role: ROLE,
            period: PERIOD,
            devicesCount: DEVICES,
          }),
        });

        const data = (await res.json()) as BillingEstimate & { error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${res.status.toString()}`);
        }
        setEstimate(data);
      } catch (e: any) {
        console.error(e);
        setError(
          e.message || "Erreur lors du chargement de la facturation (estimate)"
        );
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // 2) Récupérer la facture la plus récente pour ce client
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setInvoiceLoading(true);
        const res = await fetch(
          `${API_BASE}/billing/invoices/by-client?clientId=${encodeURIComponent(
            CLIENT_ID
          )}`
        );
        if (!res.ok) {
          setInvoice(null);
          return;
        }
        const data = (await res.json()) as {
          ok: boolean;
          invoices?: Invoice[];
        };
        if (!data.ok || !data.invoices || data.invoices.length === 0) {
          setInvoice(null);
          return;
        }
        setInvoice(data.invoices[0]);
      } catch (e) {
        console.error(e);
        // on laisse invoice à null, pas bloquant
      } finally {
        setInvoiceLoading(false);
      }
    };
    loadInvoice();
  }, []);

  // 3) Lire les paramètres d'URL ?paid=1&invoice=XXXX (callback MoneyFusion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const inv = params.get("invoice");
    if (paid === "1") {
      setPaidBanner(
        inv
          ? `Paiement confirmé pour la facture ${inv}. Merci !`
          : "Paiement confirmé. Merci !"
      );
      // on pourrait nettoyer l'URL ici avec history.replaceState si besoin
    }
  }, []);

  const periodLabel = (p: string) => {
    if (p === "YEARLY") return "Année";
    if (p === "WEEKLY") return "Semaine";
    return "Mois";
  };

  const effectiveBilling: BillingInfo | null =
    (invoice && invoice.billing) ||
    (estimate && {
      period: estimate.period,
      devicesCount: estimate.devicesCount,
      role: estimate.role,
      unitXof: estimate.unitXof,
      totalXof: estimate.totalXof,
      approxUsd: estimate.approxUsd,
    }) ||
    null;

  const statusLabel = (() => {
    if (!invoice) return "Non payée";
    if ((invoice.status || "").toUpperCase() === "PAID") return "Payée";
    return "Non payée";
  })();

  const isPaid =
    invoice && (invoice.status || "").toUpperCase() === "PAID" ? true : false;

  const createdAt =
    invoice?.createdAt || estimate?.createdAt || new Date().toISOString();

  const dueDate = new Date(
    new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // 4) Quand on clique sur “Payer en ligne”
  const handlePayOnline = async () => {
    if (!effectiveBilling) return;
    try {
      setPayLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/billing/create-payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: CLIENT_ID,
          clientName: CLIENT_NAME,
          role: effectiveBilling.role,
          period: effectiveBilling.period,
          devicesCount: effectiveBilling.devicesCount,
          phone: DEFAULT_PHONE,
        }),
      });

      const data = (await res.json()) as CreatePaymentResponse & {
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status.toString()}`);
      }

      // On met localement l'info de facture
      setInvoice({
        invoiceId: data.invoiceId,
        clientId: CLIENT_ID,
        clientName: CLIENT_NAME,
        billing: data.billing,
        phone: DEFAULT_PHONE,
        checkoutUrl: data.checkoutUrl,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      });

      // Redirection vers MoneyFusion (Fusion Link)
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erreur lors de la création du paiement");
    } finally {
      setPayLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!invoice) return;
    window.open(`/api/invoices/${invoice.invoiceId}/pdf`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Yarmotek GuardCloud</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">Facturation</span>
          <button className="rounded-md bg-red-600 px-4 py-1 text-sm font-medium hover:bg-red-700">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">
          Factures &amp; Abonnements
        </h1>
        <p className="text-sm text-gray-300 mb-4">
          Suivez vos abonnements GuardCloud et payez en ligne via MoneyFusion.
        </p>

        {paidBanner && (
          <div className="mb-4 rounded-md bg-emerald-900/70 px-4 py-2 text-sm text-emerald-100 border border-emerald-500/50">
            {paidBanner}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-900/60 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading || !effectiveBilling ? (
          <div className="text-gray-300">Chargement des données…</div>
        ) : (
          <div className="rounded-xl bg-[#050816] border border-gray-800 overflow-hidden">
            <div className="flex justify-end gap-3 px-6 pt-4">
              <div className="rounded-full bg-emerald-900/60 px-4 py-1 text-xs">
                <span className="text-gray-300 mr-1">Total payé</span>
                <span className="font-semibold text-emerald-300">
                  {isPaid
                    ? effectiveBilling.totalXof.toLocaleString("fr-FR")
                    : 0}{" "}
                  XOF
                </span>
              </div>
              <div className="rounded-full bg-amber-900/60 px-4 py-1 text-xs">
                <span className="text-gray-300 mr-1">En attente</span>
                <span className="font-semibold text-amber-300">
                  {isPaid
                    ? 0
                    : effectiveBilling.totalXof.toLocaleString("fr-FR")}{" "}
                  XOF
                </span>
              </div>
            </div>

            <table className="w-full text-sm mt-4">
              <thead className="bg-[#060b1a] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Facture
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Appareils
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Créée le
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Échéance
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-800">
                  <td className="px-6 py-3 align-middle">
                    <div className="font-semibold">
                      {invoice?.invoiceId ?? "—"}
                    </div>
                    {isPaid && invoice?.paidAt && (
                      <div className="text-xs text-emerald-300">
                        Payée le{" "}
                        {new Date(invoice.paidAt).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <div className="font-semibold">
                      {invoice?.clientName ?? CLIENT_NAME}
                    </div>
                    <div className="text-xs text-gray-400">
                      {invoice?.clientId ?? CLIENT_ID}
                    </div>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {periodLabel(effectiveBilling.period)}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {effectiveBilling.devicesCount}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <div className="font-semibold text-emerald-400">
                      {effectiveBilling.totalXof.toLocaleString("fr-FR")} XOF
                    </div>
                    <div className="text-xs text-gray-400">
                      ≈ {effectiveBilling.approxUsd.toFixed(2)} USD
                    </div>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {statusLabel === "Payée" ? (
                      <span className="inline-flex rounded-full bg-emerald-900/80 px-3 py-1 text-xs font-medium text-emerald-200">
                        Payée
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-900/70 px-3 py-1 text-xs font-medium text-amber-200">
                        Non payée
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {new Date(createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {new Date(dueDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-3 align-middle space-x-2">
                    {!isPaid && (
                      <button
                        onClick={handlePayOnline}
                        disabled={payLoading}
                        className="mb-1 rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
                      >
                        {payLoading ? "Redirection…" : "Payer en ligne"}
                      </button>
                    )}
                    {isPaid && invoice && (
                      <button
                        onClick={handleDownloadReceipt}
                        className="rounded-full bg-sky-500 px-4 py-1 text-xs font-semibold text-black hover:bg-sky-400"
                      >
                        Télécharger le reçu (PDF)
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="px-6 py-4 text-xs text-gray-400 border-t border-gray-800">
              Remarque : les paiements sont traités de façon sécurisée par
              MoneyFusion. Le statut “Payée” est mis à jour dès réception du
              webhook sur l’API GuardCloud.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
