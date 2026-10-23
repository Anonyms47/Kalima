"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/server/catalog";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function go(index: number) {
    setActive(index);
    const el = track.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  if (images.length === 0) {
    return <div className="aspect-[4/5] rounded-[2rem] bg-mist" aria-hidden />;
  }

  return (
    <div className="md:sticky md:top-24 md:self-start">
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[2rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => go(index)}
              aria-label={`Voir la photo ${index + 1}`}
              aria-current={active === index}
              className="relative aspect-square w-16 overflow-hidden rounded-xl border-2 border-transparent opacity-70 transition hover:opacity-100 aria-[current=true]:border-violet aria-[current=true]:opacity-100"
            >
              <Image src={image.url} alt="" fill sizes="4rem" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
