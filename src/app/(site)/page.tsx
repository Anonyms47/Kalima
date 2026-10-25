import Image from "next/image";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { ArrowIcon, CheckIcon, GiftIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { ProductCard } from "@/components/product-card";
import { formatPrice } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import { listPublishedProducts, listSupplements } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

const STEPS = [
  { title: "Composez votre boîte", text: "Format, nombre de boîtes, suppléments… et, si vous le souhaitez, le petit mot à glisser dedans." },
  { title: "Réglez la totalité", text: "Le paiement se fait en une fois. KALIMA vérifie sa réception avant de lancer la commande." },
  { title: "On prépare", text: "Chaque commande est préparée à la demande. Vous êtes prévenu·e par e-mail à chaque étape." },
  { title: "Livraison ou retrait", text: "On s'organise ensemble sur WhatsApp. La livraison n'est pas comprise dans le prix." },
];

export default async function HomePage() {
  const [products, supplements, settings] = await Promise.all([listPublishedProducts(), listSupplements(), getSettings()]);
  const activeSupplements = supplements.filter((s) => s.active);
  const wa = whatsappUrl(settings.contact.whatsapp_number, "Bonjour KALIMA !");
  // Prix d'appel : la boîte la moins chère du catalogue publié.
  const prices = products.flatMap((p) => p.formats.map(startingPrice));
  const fromPrice = prices.length ? Math.min(...prices) : null;

  return (
    <>
      {/* Accueil ----------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-lilac-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-9 px-4 pt-6 pb-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-8 md:pt-16 md:pb-20">
          <div className="rise">
            <p className="eyebrow">
              <Bang className="h-4 w-2.5 text-lilac" /> Gaufres · Mini pancakes
            </p>
            <h1 className="display mt-3 text-[2.55rem] text-night sm:mt-4 sm:text-6xl lg:text-[4.4rem]">
              Des douceurs préparées à la commande
              <Bang className="ml-1 inline-block h-[0.8em] w-[0.42em] translate-y-[0.06em] text-lilac" />
            </h1>
            <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-muted sm:mt-5 sm:text-lg">
              Choisissez votre boîte, ajoutez vos suppléments préférés : on y glisse un petit mot, et on s&apos;occupe du reste.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center [&>*]:sm:whitespace-nowrap">
              <Link href="/gourmandises" className="btn-primary px-7 text-base">
                Composer ma commande
                <ArrowIcon />
              </Link>
              {fromPrice ? (
                <p className="text-center text-sm text-muted sm:text-left">
                  Dès <strong className="display text-lg text-night">{formatPrice(fromPrice)}</strong> la boîte
                </p>
              ) : null}
            </div>
            <ul className="mt-6 flex flex-wrap gap-1.5 text-[0.82rem] font-semibold text-night/80 sm:gap-2 sm:text-sm">
              {["Préparé à la commande", "Sauce chocolat comprise", "Un petit mot dans chaque boîte"].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-line sm:px-3 sm:py-1.5">
                  <CheckIcon className="size-4 text-violet" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[26rem] md:max-w-none">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)] md:ml-10 md:aspect-[4/5]">
              <Image
                src="/photos/gamme-boites-et-pot.jpg"
                alt="Boîtes kraft de gaufres et pot de mini pancakes KALIMA, avec chantilly et sauce chocolat"
                fill
                priority
                sizes="(min-width: 768px) 32rem, 92vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -left-2 w-[42%] rotate-[-6deg] rounded-[1.1rem] bg-white p-2 pb-3 shadow-[var(--shadow-lift)] sm:-left-6">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[0.8rem]">
                <Image src="/photos/mini-pancakes-speculoos.jpg" alt="Mini pancakes avec supplément spéculoos" fill sizes="12rem" className="object-cover" />
              </div>
            </div>
            <Note tilt="rotate-[4deg]" className="absolute -right-1 -bottom-10 w-[52%] max-w-[15rem] !px-4 !pt-5 !pb-3 sm:-right-4">
              <span className="text-[1.35rem] leading-[1.7rem]">Avec un petit mot, toujours.</span>
            </Note>
          </div>
        </div>
      </section>

      {/* Bandeau des suppléments ---------------------------------------- */}
      {activeSupplements.length ? (
        <section aria-label="Suppléments proposés" className="mt-10 overflow-hidden border-y border-kraft/30 bg-kraft-soft py-3.5 md:mt-6">
          <div className="marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
                {activeSupplements.map((s) => (
                  <li key={s.id} className="flex items-center gap-5 px-5 text-[0.95rem] font-semibold whitespace-nowrap text-kraft-deep">
                    <Bang className="h-4 w-2.5 text-violet/70" />
                    {s.name}
                  </li>
                ))}
                <li className="px-5 text-[0.95rem] font-bold whitespace-nowrap text-night">+ 500 FCFA par supplément et par boîte</li>
              </ul>
            ))}
          </div>
        </section>
      ) : null}

      {/* Gourmandises ------------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Nos gourmandises</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Choisissez votre boîte</h2>
          </div>
          <Link href="/gourmandises" className="inline-flex items-center gap-2 font-semibold text-violet hover:underline">
            Tout voir <ArrowIcon />
          </Link>
        </div>
        {/* Téléphone : carrousel horizontal ; à partir de sm : grille. */}
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {products.map((product, index) => (
            <div key={product.id} className={`flex shrink-0 snap-start sm:w-auto [&>*]:w-full ${products.length > 1 ? "w-[82%]" : "w-full"}`}>
              <ProductCard product={product} priority={index === 0} index={index} />
            </div>
          ))}
        </div>
        {wa ? (
          <p className="mt-6 rounded-2xl border border-dashed border-kraft/60 bg-paper px-5 py-4 text-[0.97rem] text-night/85 sm:mt-8">
            Un mélange gaufres et pancakes, ou un emballage particulier ?{" "}
            <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet underline-offset-4 hover:underline">
              Demandez-nous sur WhatsApp
            </a>
            , on vous répond avec un prix adapté.
          </p>
        ) : null}
      </section>

      {/* Comment ça se passe --------------------------------------------- */}
      <section className="bg-night text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <p className="eyebrow !text-lilac"><Bang className="h-4 w-2.5" /> Comment ça se passe</p>
          <h2 className="display mt-3 max-w-xl text-[2.1rem] sm:text-5xl">De votre panier à votre première bouchée</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-9 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t border-white/15 pt-6">
                <span className="display absolute -top-5 left-0 grid size-10 place-items-center rounded-full bg-lilac text-lg text-night">
                  {index + 1}
                </span>
                <h3 className="display mt-3 text-2xl">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-white/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Le petit mot ------------------------------------------------------ */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-12 md:py-28">
        <div className="relative order-2 mx-auto w-full max-w-[17rem] md:order-1 md:max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image src="/photos/gaufres-chantilly.jpg" alt="Boîte kraft KALIMA de gaufres au chocolat et chantilly" fill sizes="(min-width: 768px) 24rem, 90vw" className="object-cover" />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Le petit mot KALIMA</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">Ce qui rend chaque boîte unique</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            Lors de la commande, vous pouvez nous dicter votre message. Sinon, c&apos;est nous qui choisissons le mot.
          </p>
          {settings.home_note ? (
            <Note className="mt-10 max-w-md" signature="KALIMA">
              {settings.home_note}
            </Note>
          ) : null}
        </div>
      </section>

      {/* Événements & ambassadeurs ---------------------------------------- */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-[2rem] bg-lilac-soft p-7 sm:p-9">
          <p className="eyebrow">Anniversaires & événements</p>
          <h2 className="display mt-3 text-[2.2rem]">Une fête en vue ?</h2>
          <p className="mt-3 max-w-sm leading-relaxed text-night/80">
            Envoyez-nous votre demande : nous vérifions la disponibilité, puis nous vous proposons un devis. Minimum 50 pièces par variété.
          </p>
          <Link href="/evenements" className="btn-primary mt-7">
            Demander une réservation <ArrowIcon />
          </Link>
          <div className="pointer-events-none absolute -right-10 -bottom-12 hidden size-52 rotate-6 overflow-hidden rounded-[1.5rem] border-4 border-white shadow-[var(--shadow-lift)] sm:block">
            <Image src="/photos/gamme-boites-ouvertes.jpg" alt="" fill sizes="13rem" className="object-cover object-bottom" />
          </div>
        </article>
        <article className="rounded-[2rem] border border-line bg-white p-7 sm:p-9">
          <p className="eyebrow">Programme ambassadeur</p>
          <h2 className="display mt-3 text-[2.2rem]">5 amis régalés, 1 box offerte</h2>
          <p className="mt-3 max-w-sm leading-relaxed text-muted">
            Partagez votre code personnel. Dès que cinq nouveaux clients ont été servis grâce à vous, une box individuelle vous attend.
          </p>
          <div className="mt-6 flex gap-2" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`grid size-10 place-items-center rounded-full ${i < 3 ? "bg-violet text-white" : "border-2 border-dashed border-line"}`}>
                {i < 3 ? <Bang className="h-5 w-3 text-lilac" /> : null}
              </span>
            ))}
            <span className="grid size-10 place-items-center rounded-full bg-kraft-soft text-kraft-deep">
              <GiftIcon />
            </span>
          </div>
          <Link href="/ambassadeurs" className="btn-ghost mt-7">
            Découvrir le programme
          </Link>
        </article>
      </section>

    </>
  );
}
