"use client";

import { useMemo, type ReactNode } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";

interface JobMarkerProps {
  position: [number, number];
  label: string;
  color: string;
  children?: ReactNode;
}

export default function JobMarker({
  position,
  label,
  color,
  children,
}: JobMarkerProps) {
  const icon = useMemo(() => {
    return L.divIcon({
      className: "vhd-map-marker",
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          border: 2px solid white;
          background: ${color};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        ">
          ${label}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }, [color, label]);

  return (
    <Marker position={position} icon={icon}>
      {children ? <Popup>{children}</Popup> : null}
    </Marker>
  );
}
