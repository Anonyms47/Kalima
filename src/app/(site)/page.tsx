import Image from "next/image";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { CurlyArrow, ScribbleHeart, SketchArrow, Squiggle } from "@/components/doodles";
import { PetitMotWriter } from "@/components/home/petit-mot-writer";
import { ArrowIcon, GiftIcon, InstagramIcon, WhatsappIcon } from "@/components/icons";
import { availability } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { listPublishedProducts, listSupplements, type PublicProduct } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

/** Ligne de menu avec points de conduite, comme sur une ardoise. */
function MenuLine({ label, note, price }: { label: string; note?: string; price: string }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="shrink-0">
        {label}
        {note ? <span className="ml-2 text-sm text-cloud/55">{note}</span> : null}
      </span>
      <span aria-hidden className="min-w-6 flex-1 translate-y-[-0.3em] border-b-2 border-dotted border-cloud/25" />
      <span className="tabular shrink-0 font-semibold text-lilac">{price}</span>
    </li>
  );
}

function ProductBoard({ product }: { product: PublicProduct }) {
  const a = availability(product);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="display text-[1.9rem] text-white">{product.name}</h3>
        <Link href={`/gourmandises/${product.slug}`} className="hand shrink-0 text-xl text-lilac underline-offset-4 hover:underline">
          {a.orderable ? "je compose →" : "épuisé pour le moment"}
        </Link>
      </div>
      <ul className="mt-3 space-y-2 text-[1.05rem] text-cloud/90">
        {product.formats.map((format) =>
          format.pricing === "per_unit" ? (
            <MenuLine
              key={format.id}
              label={`La ${format.unit_label}`}
              note={format.min_units && format.min_units > 1 ? `${format.min_units} minimum par boîte` : undefined}
              price={formatPrice(format.price)}
            />
          ) : (
            <MenuLine key={format.id} label={format.label} price={formatPrice(format.price)} />
          ),
        )}
      </ul>
    </div>
  );
}

const TICKET = [
  { step: "Vous composez votre boîte", where: "en ligne" },
  { step: "Vous réglez la totalité", where: "par lien" },
  { step: "On vérifie et on prépare", where: "à la demande" },
  { step: "Livraison ou retrait", where: "WhatsApp" },
];

export default async function HomePage() {
  const [products, supplements, settings] = await Promise.all([listPublishedProducts(), listSupplements(), getSettings()]);
  const activeSupplements = supplements.filter((s) => s.active);
  const samePrice = activeSupplements.length > 0 && activeSupplements.every((s) => s.price === activeSupplements[0].price);
  const wa = whatsappUrl(settings.contact.whatsapp_number, "Bonjour KALIMA !");
  const [first, second] = products;

  return (
    <div data-hide-footer-cta className="overflow-x-clip">
      {/* Accueil : le titre, la gamme en polaroïd, les annotations au feutre ------ */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1fr_1.05fr] md:items-center md:pt-14 md:pb-24">
        <div className="rise">
          <h1 className="display text-[2.7rem] leading-[1.02] text-night sm:text-6xl lg:text-[4.6rem]">
            Gaufres,
            <br />
            mini pancakes
            <span className="hand mt-1 block text-[0.92em] leading-none font-bold text-violet">
              &amp; un petit mot.
              <Squiggle className="-mt-1 h-3 w-[7.5em] text-lilac" />
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-night/75">
            Préparés à la commande à Dakar, nappés de sauce chocolat, glissés dans une boîte kraft avec quelques mots pour la personne qui l&apos;ouvre.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/gourmandises" className="kraft-label">
              Commander <ArrowIcon className="size-5" />
            </Link>
            <Link href="/evenements" className="font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-[6px] hover:decoration-violet">
              Pour une fête, c&apos;est par ici
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md pb-10 md:max-w-none md:pb-0">
          <figure className="relative ml-auto w-[86%] rotate-[2.5deg] bg-white p-3 pb-14 shadow-[var(--shadow-lift)] sm:mt-16 sm:w-[78%]">
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-lilac/80" />
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/photos/gamme-boites-et-pot.jpg"
                alt="Boîtes kraft de gaufres et pot de mini pancakes KALIMA, avec chantilly et sauce chocolat"
                fill
                priority
                sizes="(min-width: 768px) 28rem, 80vw"
                className="object-cover"
              />
            </div>
            <figcaption className="hand absolute right-4 bottom-3 text-2xl text-night/80">la gamme, au complet</figcaption>
          </figure>

          <figure className="absolute bottom-0 -left-1 w-[42%] -rotate-[7deg] bg-white p-2 pb-8 shadow-[var(--shadow-lift)] sm:-left-4 sm:w-[36%] md:-bottom-6">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image src="/photos/mini-pancakes-speculoos.jpg" alt="Mini pancakes avec supplément spéculoos" fill sizes="12rem" className="object-cover" />
            </div>
            <figcaption className="hand absolute bottom-1 left-3 text-lg text-violet">+ spéculoos ?</figcaption>
          </figure>

          <p aria-hidden className="hand absolute top-0 left-0 hidden -rotate-6 text-[1.45rem] leading-tight text-violet sm:block md:-left-8">
            sauce chocolat
            <br />
            toujours comprise
            <CurlyArrow className="absolute top-6 left-full ml-1 h-12 w-16 text-violet/70" />
          </p>
        </div>
      </section>

      {/* La carte : ardoise bleu nuit avec les vrais prix -------------------------- */}
      <section aria-labelledby="la-carte" className="bg-night text-cloud">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.25fr_1fr] md:py-24">
          <div>
            <h2 id="la-carte" className="hand text-5xl text-lilac sm:text-6xl">
              La carte
            </h2>
            <p className="mt-2 max-w-md text-cloud/70">Une boîte, vos suppléments, et c&apos;est parti. Prix par boîte, sauce chocolat comprise.</p>

            <div className="mt-10 space-y-10">
              {products.map((product) => (
                <ProductBoard key={product.id} product={product} />
              ))}

              {activeSupplements.length ? (
                <div className="rounded-2xl border border-dashed border-cloud/25 p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="display text-xl text-white">Les suppléments</h3>
                    {samePrice ? (
                      <span className="tabular shrink-0 font-semibold text-lilac">+ {formatPrice(activeSupplements[0].price)}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 leading-relaxed text-cloud/80">
                    {activeSupplements.map((s, index) => (
                      <span key={s.id}>
                        {index ? <Bang className="mx-2 inline-block h-3.5 w-2 text-lilac/70" /> : null}
                        {s.name}
                        {samePrice ? null : <span className="text-lilac"> +{formatPrice(s.price)}</span>}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2 text-sm text-cloud/55">{samePrice ? "chacun, par boîte" : "par boîte"}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative hidden min-h-[30rem] md:block">
            {first?.images[0] ? (
              <Link
                href={`/gourmandises/${first.slug}`}
                className="absolute top-0 right-6 w-[62%] rotate-[4deg] bg-white p-2.5 pb-10 shadow-2xl transition hover:rotate-[1deg]"
              >
                <span className="relative block aspect-[4/5] overflow-hidden">
                  <Image src={first.images[0].url} alt={first.images[0].alt} fill sizes="18rem" className="object-cover" />
                </span>
                <span className="hand absolute bottom-2 left-3 text-xl text-night">{first.name}</span>
              </Link>
            ) : null}
            {second?.images[0] ? (
              <Link
                href={`/gourmandises/${second.slug}`}
                className="absolute bottom-0 left-0 w-[58%] -rotate-[5deg] bg-white p-2.5 pb-10 shadow-2xl transition hover:rotate-[-2deg]"
              >
                <span className="relative block aspect-[4/5] overflow-hidden">
                  <Image src={second.images[0].url} alt={second.images[0].alt} fill sizes="17rem" className="object-cover" />
                </span>
                <span className="hand absolute bottom-2 left-3 text-xl text-night">{second.name}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Le petit mot : on l'écrit ici, il est repris à la commande ---------------- */}
      <section aria-labelledby="petit-mot-titre" className="bg-kraft-soft">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.1fr] md:items-center md:py-24">
          <div>
            <h2 id="petit-mot-titre" className="display text-4xl text-night sm:text-5xl">
              Ce qu&apos;on glisse
              <br />
              dans chaque boîte
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-night/75">
              Un mot pour un anniversaire, un merci, un « je pense à toi ». Vous l&apos;écrivez, on le glisse dans la boîte. Pas d&apos;idée ? On s&apos;en charge.
            </p>
            <p className="hand mt-6 flex items-center gap-3 text-2xl text-kraft-deep">
              <ScribbleHeart className="size-7 shrink-0" /> essayez, juste là
              <SketchArrow className="hidden h-8 w-16 rotate-180 md:block" />
            </p>
          </div>
          <PetitMotWriter placeholder={settings.home_note || "Joyeux anniversaire Fatou !"} />
        </div>
      </section>

      {/* Comment ça se passe : le ticket ------------------------------------------- */}
      <section aria-labelledby="ticket-titre" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="order-2 mx-auto w-full max-w-sm drop-shadow-[0_18px_30px_rgb(14_18_54/0.18)]">
          <div className="receipt -rotate-1 px-6 pt-7 sm:px-8">
            <p className="display text-center text-2xl tracking-wide">KALIMA</p>
            <p className="text-center text-xs tracking-[0.2em] text-muted uppercase">Cake and bakery · Dakar</p>
            <h2 id="ticket-titre" className="mt-5 border-y border-dashed border-night/25 py-2 text-center text-sm font-semibold tracking-[0.14em] uppercase">
              Votre commande, pas à pas
            </h2>
            <ol className="mt-4 space-y-3">
              {TICKET.map((line, index) => (
                <li key={line.step} className="flex items-baseline gap-2 text-[0.95rem]">
                  <span className="tabular w-6 shrink-0 font-bold text-violet">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 font-semibold">{line.step}</span>
                  <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-night/30" />
                  <span className="shrink-0 text-right text-sm text-muted">{line.where}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-dashed border-night/25 pt-3 text-center text-sm text-muted">
              Livraison non comprise : on en parle sur WhatsApp après votre commande.
            </p>
            <p className="hand mt-3 text-center text-3xl text-violet">Merci !</p>
          </div>
        </div>

        <div className="order-1">
          <p className="hand text-3xl text-violet">Simple comme une boîte qu&apos;on ouvre.</p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-night/75">
            Tout est préparé à la demande : on ne lance votre commande qu&apos;une fois le paiement vérifié par l&apos;équipe. Vous recevez un e-mail à chaque étape, jusqu&apos;à la livraison ou au retrait
            {settings.pickup.area ? ` à ${settings.pickup.area}` : ""}.
          </p>
          <div className="relative mt-8 hidden aspect-[4/3] max-w-md overflow-hidden rounded-[1.5rem] md:block">
            <Image src="/photos/gamme-boites-ouvertes.jpg" alt="Boîtes KALIMA ouvertes, prêtes à partir" fill sizes="28rem" className="object-cover object-center" />
          </div>
        </div>
      </section>

      {/* Fêtes et ambassadeurs : le faire-part et la carte à tampons --------------- */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 sm:px-6 md:grid-cols-2 md:gap-10">
        <article className="relative rotate-[-0.8deg] bg-paper p-2 shadow-[var(--shadow-lift)]">
          <div className="h-full border-2 border-double border-kraft px-6 py-9 text-center sm:px-10">
            <p className="hand text-2xl text-kraft-deep">Vous êtes invité·e à…</p>
            <h2 className="display mt-2 text-4xl text-night">Nous confier votre fête</h2>
            <p className="mx-auto mt-4 max-w-xs leading-relaxed text-night/75">
              Anniversaire, baptême, réunion de famille : décrivez-nous l&apos;événement, on vous répond avec un devis. À partir de 50 pièces par variété.
            </p>
            <Link href="/evenements" className="btn-primary mt-7">
              Faire une demande <ArrowIcon />
            </Link>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[1.4rem] bg-violet p-7 text-white shadow-[var(--shadow-lift)] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-lilac uppercase">Carte ambassadeur</p>
              <h2 className="display mt-2 text-[2.1rem] leading-tight">5 amis servis, 1 box offerte</h2>
            </div>
            <Bang className="h-14 w-8 shrink-0 text-lilac/70" />
          </div>
          <p className="mt-3 max-w-sm leading-relaxed text-white/80">
            Partagez votre code. Chaque nouveau client servi grâce à vous ajoute un tampon ; au cinquième, une box individuelle vous attend.
          </p>
          <ol className="mt-7 flex flex-wrap items-center gap-2.5" aria-label="Exemple de carte : 3 tampons sur 5">
            {[0, 1, 2, 3, 4].map((i) => (
              <li
                key={i}
                className={`grid size-12 place-items-center rounded-full ${i < 3 ? "rotate-[-12deg] border-2 border-lilac text-lilac" : "border-2 border-dashed border-white/35"}`}
              >
                {i < 3 ? <span className="hand text-lg leading-none">K!</span> : <span className="sr-only">tampon à venir</span>}
              </li>
            ))}
            <li className="grid size-12 place-items-center rounded-full bg-kraft text-night" aria-label="box offerte">
              <GiftIcon />
            </li>
          </ol>
          <Link href="/ambassadeurs" className="mt-8 inline-flex items-center gap-2 font-semibold text-white underline decoration-lilac decoration-2 underline-offset-[6px]">
            Devenir ambassadeur <ArrowIcon />
          </Link>
        </article>
      </section>

      {/* Le mot de la fin ---------------------------------------------------------- */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="hand text-4xl text-night sm:text-5xl">
            À très vite <span className="text-violet">!</span>
            <span className="mt-1 block text-2xl text-night/60">— l&apos;équipe KALIMA</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                <WhatsappIcon /> Nous écrire
              </a>
            ) : null}
            {settings.contact.instagram ? (
              <a href={`https://instagram.com/${settings.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <InstagramIcon /> @{settings.contact.instagram}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
