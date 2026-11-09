import { afterAll, describe, expect, it } from "vitest";
import { renderOrderEmail } from "@/lib/emails/templates";
import { sql } from "@/lib/server/db";
import { deliverNotification, processNotificationQueue } from "@/lib/server/notifications";
import { createOrder, transitionOrder } from "@/lib/server/orders";
import { baseCheckout, makeStaff, makeUser, product } from "./helpers";

afterAll(async () => {
  await sql.end();
});

async function confirmedOrder() {
  const staff = await makeStaff();
  const user = await makeUser();
  const m = await product("mini-pancakes");
  const order = await createOrder(user, {
    ...baseCheckout,
    items: [{ productId: m.id, formatId: m.formats[1].id, units: null, boxes: 1, supplementIds: [m.supplements[6].id] }],
  });
  const result = await transitionOrder(order.id, "confirmed", staff, { paidAmount: 3500 });
  return { order, notificationId: result.notificationId! };
}

describe("notifications", () => {
  it("n'indique jamais « envoyé » si le service refuse, puis permet la relance", async () => {
    const { notificationId } = await confirmedOrder();
    const previous = process.env.EMAIL_PROVIDER;
    process.env.EMAIL_PROVIDER = "";
    const failed = await deliverNotification(notificationId);
    expect(failed.status).toBe("failed");
    let [row] = await sql`select status, last_error, sent_at from notifications where id = ${notificationId}`;
    expect(row.status).toBe("failed");
    expect(row.sent_at).toBeNull();
    expect(row.last_error).toMatch(/Aucun service/);

    process.env.EMAIL_PROVIDER = previous;
    const retried = await deliverNotification(notificationId, { manual: true });
    expect(retried.status).toBe("sent");
    [row] = await sql`select status, provider, attempts from notifications where id = ${notificationId}`;
    expect(row).toMatchObject({ status: "sent", provider: "log", attempts: 2 });

    // Un e-mail déjà envoyé n'est pas renvoyé par la file.
    expect((await deliverNotification(notificationId)).status).toBe("skipped");
  });

  it("traite la file des notifications en attente", async () => {
    const { notificationId } = await confirmedOrder();
    const outcomes = await processNotificationQueue(1000);
    expect(outcomes.find((o) => o.id === notificationId)?.status).toBe("sent");
  });

  it("rédige la confirmation avec le récapitulatif et le montant payé", () => {
    const email = renderOrderEmail(
      "payment_confirmed",
      {
        firstName: "Awa",
        reference: "KA-26-0001",
        trackingUrl: "http://localhost:3000/compte/commandes/KA-26-0001",
        fulfillment: "delivery",
        kind: "standard",
        total: 3500,
        paidAmount: 3500,
        items: [
          { product_name: "Mini pancakes", format_label: "Boîte de 20", units: null, unit_label: null, supplements: [{ name: "Chantilly", price: 500 }], box_price: 3500, boxes: 1, line_total: 3500 },
        ],
        pickupArea: "Dalifort",
        pickupDetails: "",
        giftMessage: null,
      },
      { appUrl: "http://localhost:3000", contactPhone: "+221 70 926 22 07", instagram: "kalimaaa_0", whatsappUrl: "https://wa.me/221709262207" },
    );
    expect(email.subject).toContain("KA-26-0001");
    expect(email.text).toContain("Bonjour Awa");
    expect(email.text).toContain("Montant payé : 3 500 FCFA");
    expect(email.text).toContain("Livraison non comprise");
    expect(email.html).toContain("Chantilly");
  });
});
