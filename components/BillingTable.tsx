"use client";

import { useMemo, useState } from "react";

export type InvoiceStatus = "UNPAID" | "PAID" | "EXPIRED";

export type Invoice = {
  id: string;
  clientId: string;
  clientName: string;
  resellerId?: string | null;

  deviceCount: number;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";

  amountXof: number;
  usdRate: number;
  createdAt: string;
  dueDate: string;
  paidAt?: string | null;

  status: InvoiceStatus;
};

// 🔗 Ton lien MoneyFusion (base)
const MONEYFUSION_BASE =
  "https://my.moneyfusion.net/691dad6b622fa841bbe4b0a8";

// 📌 Bilingue simple FR / EN
type Lang = "fr" | "en";

const labels = {
  fr: {
    title: "Factures & Abonnements",
    period: "Période",
    client: "Client",
    devices: "Appareils",
    amount: "Montant",
    status: "Statut",
    created: "Créée le",
    due: "Échéance",
    paidAt: "Payée le",
    actions: "Actions",
    payNow: "Payer en ligne",
    viewReceipt: "Voir reçu",
    downloadReceipt: "Télécharger reçu",
    unpaid: "Non payée",
    paid: "Payée",
    expired: "Expirée",
    xof: "XOF",
    usd: "USD",
    weekly: "Semaine",
    monthly: "Mois",
    yearly: "Année",
  },
  en: {
    title: "Invoices & Subscriptions",
    period: "Period",
    client: "Client",
    devices: "Devices",
    amount: "Amount",
    status: "Status",
    created: "Created at",
    due: "Due date",
    paidAt: "Paid at",
    actions: "Actions",
    payNow: "Pay online",
    viewReceipt: "View receipt",
    downloadReceipt: "Download receipt",
    unpaid: "Unpaid",
    paid: "Paid",
    expired: "Expired",
    xof: "XOF",
    usd: "USD",
    weekly: "Week",
    monthly: "Month",
    yearly: "Year",
  },
};

function formatMoney(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function periodLabel(period: Invoice["period"], lang: Lang) {
  if (lang === "fr") {
    if (period === "WEEKLY") return labels.fr.weekly;
    if (period === "MONTHLY") return labels.fr.monthly;
    return labels.fr.yearly;
  } else {
    if (period === "WEEKLY") return labels.en.weekly;
    if (period === "MONTHLY") return labels.en.monthly;
    return labels.en.yearly;
  }
}

function buildPaymentUrl(invoice: Invoice): string {
  // On encode les infos de suivi dans l’URL de paiement
  const params = new URLSearchParams({
    amount: invoice.amountXof.toString(),
    currency: "XOF",
    ref: invoice.id,
    clientId: invoice.clientId,
  });

  return `${MONEYFUSION_BASE}?${params.toString()}`;
}

function statusBadge(status: InvoiceStatus, lang: Lang) {
  const base =
    "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border";

  if (status === "PAID") {
    return (
      <span className={`${base} border-emerald-500 text-emerald-400`}>
        {lang === "fr" ? labels.fr.paid : labels.en.paid}
      </span>
    );
  }
  if (status === "EXPIRED") {
    return (
      <span className={`${base} border-red-500 text-red-400`}>
        {lang === "fr" ? labels.fr.expired : labels.en.expired}
      </span>
    );
  }
  return (
    <span className={`${base} border-amber-500 text-amber-400`}>
      {lang === "fr" ? labels.fr.unpaid : labels.en.unpaid}
    </span>
  );
}

type BillingTableProps = {
  invoices: Invoice[];
  lang?: Lang;
};

export default function BillingTable({ invoices, lang = "fr" }: BillingTableProps) {
  const t = labels[lang];

  const totals = useMemo(() => {
    const unpaid = invoices
      .filter((f) => f.status === "UNPAID")
      .reduce((sum, f) => sum + f.amountXof, 0);
    const paid = invoices
      .filter((f) => f.status === "PAID")
      .reduce((sum, f) => sum + f.amountXof, 0);
    return { unpaid, paid };
  }, [invoices]);

  return (
    <section className="space-y-4">
      {/* Header + résumé */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
            {lang === "fr" ? "Total payé :" : "Total paid:"}{" "}
            <span className="font-semibold text-emerald-400">
              {formatMoney(totals.paid)} {t.xof}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
            {lang === "fr" ? "En attente :" : "Pending:"}{" "}
            <span className="font-semibold text-amber-400">
              {formatMoney(totals.unpaid)} {t.xof}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-lg shadow-emerald-500/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-4 py-2 text-left">{t.client}</th>
                <th className="px-4 py-2 text-left">{t.period}</th>
                <th className="px-4 py-2 text-left">{t.devices}</th>
                <th className="px-4 py-2 text-left">{t.amount}</th>
                <th className="px-4 py-2 text-left">{t.status}</th>
                <th className="px-4 py-2 text-left">{t.created}</th>
                <th className="px-4 py-2 text-left">{t.due}</th>
                <th className="px-4 py-2 text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => {
                const usd = inv.amountXof / (inv.usdRate || 600); // 600 = valeur par défaut
                return (
                  <tr
                    key={inv.id}
                    className={
                      idx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/80"
                    }
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-semibold">{inv.clientName}</div>
                      <div className="text-xs text-slate-400">
                        {inv.clientId}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {periodLabel(inv.period, lang)}
                    </td>
                    <td className="px-4 py-2">{inv.deviceCount}</td>
                    <td className="px-4 py-2">
                      <div>
                        <span className="font-semibold">
                          {formatMoney(inv.amountXof)} {t.xof}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        ≈ {usd.toFixed(2)} {t.usd}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {statusBadge(inv.status, lang)}
                    </td>
                    <td className="px-4 py-2">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-2">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-2 space-y-2">
                      {inv.status === "UNPAID" && (
                        <button
                          onClick={() =>
                            window.open(buildPaymentUrl(inv), "_blank")
                          }
                          className="w-full px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold"
                        >
                          {t.payNow}
                        </button>
                      )}
                      {inv.status === "PAID" && (
                        <button
                          onClick={() =>
                            alert(
                              "TODO: génération du reçu PDF + envoi email côté API."
                            )
                          }
                          className="w-full px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs"
                        >
                          {t.downloadReceipt}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    {lang === "fr"
                      ? "Aucune facture pour le moment."
                      : "No invoices yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
