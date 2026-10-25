// Modèles d'e-mails KALIMA. HTML en tableaux et styles en ligne pour rester
// lisible dans les messageries mobiles ; une version texte accompagne chaque envoi.

import { formatPrice } from "../format";

const C = {
  night: "#0E1236",
  violet: "#4B4992",
  lilac: "#DCBFDB",
  cloud: "#F6F5FD",
  kraft: "#C9A57B",
  paper: "#FFFDF8",
  muted: "#5B5B7A",
};

export type EmailContext = {
  appUrl: string;
  contactPhone: string;
  whatsappUrl: string | null;
  instagram: string;
};

export type OrderEmailData = {
  firstName: string;
  reference: string;
  trackingUrl: string;
  fulfillment: "delivery" | "pickup";
  kind: "standard" | "reward";
  total: number;
  paidAmount: number | null;
  items: {
    product_name: string;
    format_label: string;
    units: number | null;
    unit_label: string | null;
    supplements: { name: string; price: number }[];
    box_price: number;
    boxes: number;
    line_total: number;
  }[];
  pickupArea: string;
  pickupDetails: string;
  pickupMapUrl?: string;
  giftMessage: string | null;
};

export type RenderedEmail = { subject: string; html: string; text: string };

function escape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(ctx: EmailContext, opts: { preheader: string; title: string; note: string; body: string; cta?: { label: string; url: string } }) {
  const contact = [
    ctx.contactPhone && `Téléphone et WhatsApp : ${escape(ctx.contactPhone)}`,
    ctx.instagram && `Instagram : @${escape(ctx.instagram)}`,
  ]
    .filter(Boolean)
    .join("<br>");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escape(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cloud};font-family:Helvetica,Arial,sans-serif;color:${C.night};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cloud};">
<tr><td align="center" style="padding:28px 14px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td align="center" style="padding-bottom:20px;">
      <img src="${ctx.appUrl}/brand/logo-kalima.png" width="150" alt="Kalima! Cake and bakery" style="display:block;width:150px;height:auto;border:0;">
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:20px;padding:30px 26px;">
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${C.night};">${escape(opts.title)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr><td style="background:${C.paper};border:1px solid #EFE6D6;border-left:4px solid ${C.lilac};border-radius:10px;padding:12px 16px;font-family:'Comic Sans MS','Segoe Print',cursive;font-size:17px;line-height:1.4;color:${C.violet};">
          ${escape(opts.note)}
        </td></tr>
      </table>
      ${opts.body}
      ${
        opts.cta
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;"><tr><td style="border-radius:999px;background:${C.night};">
        <a href="${opts.cta.url}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">${escape(opts.cta.label)}</a>
      </td></tr></table>`
          : ""
      }
    </td></tr>
    <tr><td align="center" style="padding:22px 10px;font-size:13px;line-height:1.6;color:${C.muted};">
      Une question ? Écrivez-nous, on vous répond avec plaisir.<br>
      ${contact}
      ${ctx.whatsappUrl ? `<br><a href="${ctx.whatsappUrl}" style="color:${C.violet};">Nous écrire sur WhatsApp</a>` : ""}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function textFooter(ctx: EmailContext) {
  const lines = ["", "Une question ? Écrivez-nous :"];
  if (ctx.contactPhone) lines.push(`Téléphone et WhatsApp : ${ctx.contactPhone}`);
  if (ctx.instagram) lines.push(`Instagram : @${ctx.instagram}`);
  lines.push("", "KALIMA · Cake and bakery");
  return lines.join("\n");
}

function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;">${text}</p>`;
}

function refLine(reference: string) {
  return p(`Référence : <strong style="letter-spacing:.04em;">${escape(reference)}</strong>`);
}

function itemDescription(item: OrderEmailData["items"][number]) {
  const format = item.units ? `${item.format_label} · ${item.units} ${item.unit_label ?? "pièce"}${item.units > 1 ? "s" : ""}` : item.format_label;
  const supplements = item.supplements.length ? ` · ${item.supplements.map((s) => s.name).join(", ")}` : "";
  return { title: item.product_name, detail: `${format}${supplements}` };
}

function recap(data: OrderEmailData) {
  const rows = data.items
    .map((item) => {
      const d = itemDescription(item);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #EEEAF6;font-size:15px;line-height:1.4;">
          <strong>${item.boxes} × ${escape(d.title)}</strong><br>
          <span style="color:${C.muted};font-size:13px;">${escape(d.detail)}</span>
        </td>
        <td align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid #EEEAF6;font-size:15px;white-space:nowrap;">${formatPrice(item.line_total)}</td>
      </tr>`;
    })
    .join("");
  const totalLabel = data.kind === "reward" ? "Box offerte" : "Montant payé";
  const totalValue = data.kind === "reward" ? formatPrice(0) : formatPrice(data.paidAmount ?? data.total);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;">
    ${rows}
    <tr><td style="padding:12px 0 0;font-size:16px;"><strong>${totalLabel}</strong></td>
    <td align="right" style="padding:12px 0 0;font-size:16px;"><strong>${totalValue}</strong></td></tr>
  </table>
  <p style="margin:0 0 14px;font-size:13px;color:${C.muted};">Livraison non comprise : ses modalités se règlent avec nous sur WhatsApp.</p>`;
}

function recapText(data: OrderEmailData) {
  const lines = data.items.map((item) => {
    const d = itemDescription(item);
    return `- ${item.boxes} × ${d.title} (${d.detail}) : ${formatPrice(item.line_total)}`;
  });
  const total = data.kind === "reward" ? "Box offerte" : `Montant payé : ${formatPrice(data.paidAmount ?? data.total)}`;
  return [...lines, total, "Livraison non comprise : ses modalités se règlent avec nous sur WhatsApp."].join("\n");
}

function pickupText(data: OrderEmailData) {
  const where = data.pickupArea ? `Retrait à ${data.pickupArea}.` : "";
  return [where, data.pickupDetails, data.pickupMapUrl ? `Itinéraire : ${data.pickupMapUrl}` : ""].filter(Boolean).join(" ");
}

export type OrderEmailKind =
  | "payment_confirmed"
  | "production_started"
  | "out_for_delivery"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up";

export function renderOrderEmail(kind: OrderEmailKind, data: OrderEmailData, ctx: EmailContext): RenderedEmail {
  const hello = `Bonjour ${escape(data.firstName)},`;
  const helloText = `Bonjour ${data.firstName},`;
  const cta = { label: "Suivre ma commande", url: data.trackingUrl };

  switch (kind) {
    case "payment_confirmed": {
      const isReward = data.kind === "reward";
      const subject = isReward
        ? `Votre box offerte est confirmée · ${data.reference}`
        : `Paiement reçu, commande confirmée · ${data.reference}`;
      const intro = isReward
        ? "Votre box ambassadeur est validée. Merci de faire découvrir KALIMA autour de vous !"
        : "Nous avons bien reçu votre paiement : votre commande est confirmée et prise en charge par l'équipe.";
      const next =
        data.fulfillment === "delivery"
          ? "Nous vous écrivons sur WhatsApp pour convenir de la livraison."
          : "Nous vous prévenons dès que votre commande est prête à être retirée.";
      return {
        subject,
        html: layout(ctx, {
          preheader: intro,
          title: isReward ? "Votre box offerte est confirmée" : "Merci, c'est confirmé !",
          note: "Votre commande est entre de bonnes mains.",
          body: p(hello) + p(intro) + refLine(data.reference) + recap(data) + p(next),
          cta,
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, "", recapText(data), "", next, "", `Suivre ma commande : ${data.trackingUrl}`, textFooter(ctx)].join("\n"),
      };
    }
    case "production_started": {
      const intro = "Bonne nouvelle : la confection de votre commande vient de commencer.";
      return {
        subject: `On prépare votre commande · ${data.reference}`,
        html: layout(ctx, {
          preheader: intro,
          title: "C'est parti en cuisine",
          note: "Ça sent déjà bon par ici.",
          body: p(hello) + p(intro) + refLine(data.reference) + (data.giftMessage ? p("Votre petit mot sera glissé dans la boîte.") : ""),
          cta,
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, ...(data.giftMessage ? ["Votre petit mot sera glissé dans la boîte."] : []), "", `Suivre ma commande : ${data.trackingUrl}`, textFooter(ctx)].join("\n"),
      };
    }
    case "out_for_delivery": {
      const intro = "Votre commande vient d'être remise au livreur. Elle est en route !";
      return {
        subject: `Votre commande est en route · ${data.reference}`,
        html: layout(ctx, {
          preheader: intro,
          title: "En route vers vous",
          note: "Encore un petit peu de patience…",
          body: p(hello) + p(intro) + refLine(data.reference) + p("Pour toute précision sur la livraison, écrivez-nous sur WhatsApp."),
          cta,
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, "Pour toute précision sur la livraison, écrivez-nous sur WhatsApp.", "", `Suivre ma commande : ${data.trackingUrl}`, textFooter(ctx)].join("\n"),
      };
    }
    case "delivered": {
      const intro = "Votre commande a bien été livrée. Merci de votre confiance !";
      return {
        subject: `Commande livrée, merci ! · ${data.reference}`,
        html: layout(ctx, {
          preheader: intro,
          title: "Bonne dégustation !",
          note: "Merci d'avoir choisi KALIMA.",
          body: p(hello) + p(intro) + refLine(data.reference) + p("On espère que chaque bouchée vous plaira. À très bientôt !"),
          cta: { label: "Commander à nouveau", url: `${ctx.appUrl}/gourmandises` },
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, "On espère que chaque bouchée vous plaira. À très bientôt !", textFooter(ctx)].join("\n"),
      };
    }
    case "ready_for_pickup": {
      const intro = "Votre commande est prête : vous pouvez venir la récupérer.";
      const where = pickupText(data);
      return {
        subject: `Votre commande est prête à être retirée · ${data.reference}`,
        html: layout(ctx, {
          preheader: intro,
          title: "Prête à être récupérée",
          note: "Elle vous attend !",
          body:
            p(hello) +
            p(intro) +
            refLine(data.reference) +
            (where ? p(escape(where)) : "") +
            p("Écrivez-nous sur WhatsApp pour convenir du moment du retrait."),
          cta,
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, where, "Écrivez-nous sur WhatsApp pour convenir du moment du retrait.", "", `Suivre ma commande : ${data.trackingUrl}`, textFooter(ctx)].join("\n"),
      };
    }
    case "picked_up": {
      const intro = "Votre commande vous a bien été remise. Merci de votre confiance !";
      return {
        subject: `Merci pour votre visite · ${data.reference}`,
        html: layout(ctx, {
          preheader: intro,
          title: "Bonne dégustation !",
          note: "Merci d'être passé·e nous voir.",
          body: p(hello) + p(intro) + refLine(data.reference) + p("On espère que chaque bouchée vous plaira. À très bientôt !"),
          cta: { label: "Commander à nouveau", url: `${ctx.appUrl}/gourmandises` },
        }),
        text: [helloText, "", intro, `Référence : ${data.reference}`, "On espère que chaque bouchée vous plaira. À très bientôt !", textFooter(ctx)].join("\n"),
      };
    }
  }
}

export function renderLoginCodeEmail(code: string, ctx: EmailContext): RenderedEmail {
  const intro = "Voici votre code pour vous connecter à votre espace KALIMA. Il est valable 10 minutes.";
  return {
    subject: `Votre code de connexion KALIMA : ${code}`,
    html: layout(ctx, {
      preheader: intro,
      title: "Votre code de connexion",
      note: "Un petit code, et c'est parti.",
      body:
        p(intro) +
        `<p style="margin:8px 0 20px;font-size:34px;font-weight:bold;letter-spacing:.3em;color:${C.night};">${escape(code)}</p>` +
        p(`<span style="color:${C.muted};font-size:14px;">Si vous n'avez pas demandé ce code, ignorez simplement cet e-mail.</span>`),
    }),
    text: [intro, "", code, "", "Si vous n'avez pas demandé ce code, ignorez simplement cet e-mail.", textFooter(ctx)].join("\n"),
  };
}
