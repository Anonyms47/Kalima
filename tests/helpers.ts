import { sql } from "@/lib/server/db";

let counter = 0;

export async function makeUser(label = "client") {
  counter += 1;
  const email = `test-${label}-${Date.now()}-${counter}@exemple.test`;
  const [user] = await sql<{ id: string; email: string }[]>`
    insert into users (email, first_name, email_verified_at) values (${email}, ${"Test"}, now()) returning id, email`;
  return user;
}

export async function makeStaff() {
  const user = await makeUser("equipe");
  await sql`insert into staff (user_id, display_name, role) values (${user.id}, 'Gérante (test)', 'owner')`;
  return { userId: user.id, label: "Gérante (test)" };
}

export async function product(slug: string) {
  const [p] = await sql<{ id: string }[]>`select id from products where slug = ${slug}`;
  const formats = await sql<{ id: string; label: string }[]>`select id, label from product_formats where product_id = ${p.id} order by sort_order`;
  const supplements = await sql<{ id: string; name: string }[]>`
    select s.id, s.name from supplements s join product_supplements ps on ps.supplement_id = s.id where ps.product_id = ${p.id} order by s.sort_order`;
  return { id: p.id, formats, supplements };
}

export async function setStock(slug: string, quantity: number | null, manual = false) {
  await sql`update products set stock_quantity = ${quantity}, manual_out_of_stock = ${manual} where slug = ${slug}`;
}

export const baseCheckout = {
  fulfillment: "delivery" as const,
  name: "Awa Test",
  phone: "77 000 00 01",
  deliveryArea: "Test",
  note: null,
  giftMessage: null,
  referralCode: null,
};
