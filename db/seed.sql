-- KALIMA — données initiales (catalogue communiqué et paramètres).
-- Idempotent : peut être relancé sans dupliquer les données.

insert into supplements (name, price, sort_order) values
  ('Caramel', 500, 1),
  ('Sauce blanche', 500, 2),
  ('Banane', 500, 3),
  ('Chocolat supplémentaire', 500, 4),
  ('Spéculoos', 500, 5),
  ('Kinder Bueno', 500, 6),
  ('Chantilly', 500, 7)
on conflict (name) do nothing;

-- Produits publiés -----------------------------------------------------------

insert into products (slug, name, tagline, description, included_note, status, sort_order, published_at)
values (
  'gaufres', 'Gaufres',
  'Dorées, nappées de chocolat, à composer selon vos envies.',
  'Des gaufres préparées à la commande et nappées de sauce chocolat. Choisissez le nombre de gaufres dans votre boîte, puis ajoutez les suppléments qui vous font envie.',
  'Sauce chocolat comprise dans le prix.',
  'published', 1, now()
), (
  'mini-pancakes', 'Mini pancakes',
  'De petites bouchées moelleuses, en boîte de 10 ou de 20.',
  'Des mini pancakes préparés à la commande et nappés de sauce chocolat. Choisissez votre boîte, puis ajoutez les suppléments de votre choix.',
  'Sauce chocolat comprise dans le prix.',
  'published', 2, now()
)
on conflict (slug) do nothing;

insert into product_formats (product_id, label, pricing, price, min_units, unit_label, sort_order)
select id, 'Boîte de gaufres', 'per_unit', 500, 2, 'gaufre', 1 from products
where slug = 'gaufres' and not exists (select 1 from product_formats f where f.product_id = products.id);

insert into product_formats (product_id, label, pricing, price, sort_order)
select p.id, v.label, 'fixed', v.price, v.sort_order
from products p, (values ('Boîte de 10', 2000, 1), ('Boîte de 20', 3000, 2)) as v(label, price, sort_order)
where p.slug = 'mini-pancakes'
  and not exists (select 1 from product_formats f where f.product_id = p.id);

insert into product_supplements (product_id, supplement_id)
select p.id, s.id from products p cross join supplements s
where p.slug in ('gaufres', 'mini-pancakes')
on conflict do nothing;

insert into product_images (product_id, url, alt, width, height, sort_order)
select p.id, v.url, v.alt, 1080, v.h, v.sort_order
from products p
join (values
  ('gaufres', '/photos/gaufre-chocolat.jpg', 'Gaufre nappée de sauce chocolat dans une boîte kraft KALIMA', 1350, 1),
  ('gaufres', '/photos/gaufres-chantilly.jpg', 'Gaufres au chocolat avec supplément chantilly dans une boîte kraft', 1350, 2),
  ('mini-pancakes', '/photos/mini-pancakes-chocolat.jpg', 'Mini pancakes nappés de sauce chocolat dans un pot kraft', 1350, 1),
  ('mini-pancakes', '/photos/mini-pancakes-chantilly.jpg', 'Mini pancakes au chocolat avec supplément chantilly', 1350, 2),
  ('mini-pancakes', '/photos/mini-pancakes-speculoos.jpg', 'Mini pancakes avec supplément spéculoos', 1600, 3)
) as v(slug, url, alt, h, sort_order) on v.slug = p.slug
where not exists (select 1 from product_images i where i.product_id = p.id);

-- Brouillons (informations à compléter par la gérante) -------------------------

insert into products (slug, name, tagline, description, status, sort_order, internal_note)
values
  ('brownies', 'Brownies', '', '', 'draft', 10,
   'Prix communiqué : 1 500 FCFA, topping 500 FCFA. À compléter : format, description et photos.'),
  ('cinnamon-rolls', 'Cinnamon rolls', '', '', 'draft', 11,
   'À compléter : formats, prix, description et photos.')
on conflict (slug) do nothing;


insert into product_formats (product_id, label, pricing, price, active, sort_order)
select id, 'Format à préciser', 'fixed', 1500, false, 1 from products
where slug = 'brownies' and not exists (select 1 from product_formats f where f.product_id = products.id);

-- Paramètres -------------------------------------------------------------------

insert into settings (key, value) values
  ('contact', '{"phone": "+221 70 926 22 07", "whatsapp_number": "221709262207", "whatsapp_link": "https://wa.me/message/AJA24FCTUXOXE1", "instagram": "kalimaaa_0", "snapchat": "kalimaaa_00", "email": ""}'),
  ('hours', '"Tous les jours, de 9 h à 21 h"'),
  ('pickup', '{"area": "Dalifort", "details": ""}'),
  ('payment', '{"provider": "manual_link", "link": "", "label": "", "instructions": ""}'),
  ('reservation_minutes', '120'),
  ('orders_open', 'true'),
  ('announcement', '""'),
  ('home_note', '"Chaque commande part avec un petit mot. Dites-nous pour qui c''est, on s''occupe du reste."'),
  ('reward_supplements_policy', '"undecided"'),
  ('food_info', '""'),
  ('sales_terms', '""'),
  ('legal_notice', '""'),
  ('family_box', '{"sweet": ["Gaufres", "Mini pancakes", "Brownies"], "salty": ["Croque-monsieur", "Frites", "Nems", "Mini tortillas"]}')
on conflict (key) do nothing;
