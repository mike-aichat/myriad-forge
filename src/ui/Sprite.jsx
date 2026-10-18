import React, { useMemo } from "react";
import { spriteUrl } from "../art/sprites.js";

export function Sprite({ element, size = 48, className = "", silhouette = false, alt = "" }) {
  const url = useMemo(() => spriteUrl(element), [element.id]);
  return (
    <img
      className={`sprite ${silhouette ? "sprite--silhouette" : ""} ${className}`.trim()}
      src={url}
      width={size}
      height={size}
      alt={alt || element.name}
      draggable={false}
      style={{ width: size, height: size }}
    />
  );
}
