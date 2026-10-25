"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/server/catalog";

/** Galerie en polaroid scotché, légendé à la main ; les miniatures sont de petits tirages. */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function go(index: number) {
    setActive(index);
    const el = track.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div className="md:sticky md:top-24 md:self-start">
      <figure className="relative -rotate-[1.5deg] bg-white p-3 pb-14 shadow-[var(--shadow-lift)] sm:p-4 sm:pb-16">
        <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rotate-2 rounded-sm bg-lilac/80" />
        {images.length === 0 ? (
          <div className="aspect-[4/5] bg-mist" aria-hidden />
        ) : (
          <div
            ref={track}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(event) => {
              const el = event.currentTarget;
              setActive(Math.round(el.scrollLeft / el.clientWidth));
            }}
            aria-label={`Photos de ${name}`}
            role="region"
            tabIndex={0}
          >
            {images.map((image, index) => (
              <div key={image.id} className="relative aspect-[4/5] w-full shrink-0 snap-start bg-mist">
                <Image
                  src={image.url}
                  alt={image.alt || name}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 768px) 34rem, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <figcaption className="hand absolute bottom-3 left-5 text-3xl text-night/80 sm:bottom-4 sm:left-6">{name.toLowerCase()}</figcaption>
        {images.length > 1 ? (
          <span aria-hidden className="hand absolute right-5 bottom-4 text-xl text-muted sm:right-6 sm:bottom-5">
            {active + 1}/{images.length}
          </span>
        ) : null}
      </figure>

      {images.length > 1 ? (
        <div className="mt-6 flex gap-3 pl-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => go(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-current={active === index}
              className={`bg-white p-1 pb-3 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 aria-[current=true]:ring-2 aria-[current=true]:ring-violet ${
                index % 2 ? "rotate-3" : "-rotate-2"
              }`}
            >
              <span className="relative block size-14 overflow-hidden opacity-75 [[aria-current=true]>&]:opacity-100">
                <Image src={image.url} alt="" fill sizes="3.5rem" className="object-cover" />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
