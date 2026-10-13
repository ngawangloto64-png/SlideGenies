"use client";

import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Slide } from "@/lib/schema";
import { FONT_STACKS, type ThemedTemplate } from "@/lib/templates";
import { H, W, layoutSlide, type El } from "@/lib/layout";
import { ChartSvg } from "./ChartSvg";

const hex = (c: string) => `#${c}`;

function renderEl(el: El, key: number) {
  const box: CSSProperties = { position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h };

  if (el.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={key} src={el.src} alt="" style={{ ...box, objectFit: el.cover ? "cover" : "contain", objectPosition: el.cover ? "center" : "left center" }} />
    );
  }

  if (el.kind === "chart") {
    return (
      <div key={key} style={box}>
        <ChartSvg el={el} />
      </div>
    );
  }

  if (el.kind === "rect" || el.kind === "ellipse") {
    return (
      <div
        key={key}
        style={{
          ...box,
          background: el.fill ? hex(el.fill) : "transparent",
          opacity: 1 - (el.transparency ?? 0),
          border: el.line ? `${el.lineWidth ?? 1}px solid ${hex(el.line)}` : undefined,
          borderRadius: el.kind === "ellipse" ? "50%" : el.radius,
          transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
          boxShadow: el.shadow ? "0 14px 30px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)" : undefined,
          backdropFilter: el.transparency && el.transparency > 0.5 ? "blur(6px)" : undefined,
          boxSizing: "border-box",
        }}
      />
    );
  }

  if (el.kind === "text") {
    return (
      <div
        key={key}
        style={{
          ...box,
          display: "flex",
          flexDirection: "column",
          justifyContent: el.valign === "middle" ? "center" : el.valign === "bottom" ? "flex-end" : "flex-start",
          textAlign: el.align ?? "left",
          fontFamily: FONT_STACKS[el.font],
          fontSize: el.size,
          fontWeight: el.bold ? 700 : 400,
          fontStyle: el.italic ? "italic" : "normal",
          color: hex(el.color),
          lineHeight: 1.18,
          whiteSpace: "pre-wrap",
          textShadow: el.shadow ? `0 3px 0 #${el.shadow}40, 0 8px 24px #${el.shadow}66` : undefined,
          overflow: "hidden",
        }}
      >
        {el.text}
      </div>
    );
  }

  if (el.kind !== "bullets") return null;
  return (
    <ul
      key={key}
      style={{
        ...box,
        margin: 0,
        padding: 0,
        listStyle: "none",
        fontFamily: FONT_STACKS[el.font],
        fontSize: el.size,
        color: hex(el.color),
        lineHeight: 1.22,
        overflow: "hidden",
      }}
    >
      {el.items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: el.size * 0.6, marginBottom: el.size * 0.7 }}>
          <span style={{ color: hex(el.bulletColor), fontSize: el.size * 0.7, lineHeight: `${el.size * 1.22}px` }}>●</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  slide: Slide;
  template: ThemedTemplate;
  index?: number;
  total?: number;
  /** Rendered width in CSS pixels. Omit to fill the parent's width. */
  width?: number;
};

export const SlideCanvas = memo(function SlideCanvas({ slide, template, index = 0, total = 1, width }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);
  useLayoutEffect(() => {
    if (width !== undefined || !ref.current) return;
    setMeasured(ref.current.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setMeasured(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [width]);

  const r = layoutSlide(slide, template, index, total);
  const scale = (width ?? measured) / W;
  return (
    <div
      ref={ref}
      style={{ width: width ?? "100%", aspectRatio: `${W} / ${H}`, overflow: "hidden", position: "relative", flexShrink: 0 }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          background: hex(r.bg),
          ["--slide-bg" as string]: hex(r.bg),
        }}
      >
        {r.els.map(renderEl)}
      </div>
    </div>
  );
});
