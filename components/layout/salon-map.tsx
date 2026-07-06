"use client";

import { useEffect, useState, useMemo, useRef, useCallback, type ComponentType, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useIsMobile } from "@/lib/use-motion-enabled";
import { cn } from "@/lib/utils";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  image?: string;
  logo?: string;
  images?: string[];
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string | null;
  facebook?: string | null;
  pinterest?: string | null;
  latitude?: number;
  longitude?: number;
  isBioDiamond?: boolean;
}

interface SalonWithCoords extends Salon {
  latitude: number;
  longitude: number;
}

interface SalonMapProps {
  salons: Salon[];
  selectedSalonId?: string | null;
  focusPaddingLeft?: number;
  onMarkerClick?: (salonId: string) => void;
  onMarkerHover?: (salonId: string | null) => void;
  onMapBackgroundClick?: () => void;
  fillContainer?: boolean;
  fullscreenPanelOpen?: boolean;
  fullscreenPanel?: ReactNode;
  onFullscreenChange?: (active: boolean) => void;
}

type DynamicMapProps = {
  selectedSalonId?: string | null;
  focusPaddingLeft?: number;
};

function isValidMapCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function saveMapViewIfNeeded(
  map: any,
  savedRef: { current: { lat: number; lng: number; zoom: number } | null }
) {
  if (savedRef.current) return;
  const center = map.getCenter();
  const zoom = map.getZoom();
  if (!isValidMapCoordinate(center?.lat, center?.lng) || !Number.isFinite(zoom)) return;
  savedRef.current = { lat: center.lat, lng: center.lng, zoom };
}

function getActiveFullscreenElement() {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    null
  );
}

function isMapFullscreenElement(element: HTMLElement | null) {
  if (!element) return false;
  return getActiveFullscreenElement() === element;
}

async function requestMapFullscreen(element: HTMLElement) {
  const request =
    element.requestFullscreen?.bind(element) ??
    (element as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(
      element
    );
  if (!request) {
    throw new Error("Fullscreen API is not available");
  }
  await request();
}

async function exitMapFullscreen() {
  const exit =
    document.exitFullscreen?.bind(document) ??
    (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.bind(
      document
    );
  if (!exit) {
    throw new Error("Fullscreen API is not available");
  }
  await exit();
}

export function SalonMap({
  salons,
  selectedSalonId = null,
  focusPaddingLeft = 0,
  onMarkerClick,
  onMarkerHover,
  onMapBackgroundClick,
  fillContainer = false,
  fullscreenPanelOpen = false,
  fullscreenPanel,
  onFullscreenChange,
}: SalonMapProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);
  const [browserFullscreen, setBrowserFullscreen] = useState(false);
  const [MapComponent, setMapComponent] = useState<ComponentType<DynamicMapProps> | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const savedMapViewRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const hasInitialFitRef = useRef(false);
  const prevSalonCountRef = useRef(0);

  const isFullscreen = browserFullscreen;

  const portugalCenter: [number, number] = [39.5, -8.0];

  const salonsWithCoords = useMemo((): SalonWithCoords[] => {
    return salons
      .map((salon) => {
        let lat = Number(salon.latitude);
        let lng = Number(salon.longitude);

        if (
          salon.latitude == null ||
          salon.longitude == null ||
          isNaN(lat) ||
          isNaN(lng) ||
          lat === 0 ||
          lng === 0 ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          return null;
        }

        const isLatInPortugalRange = lat >= 36 && lat <= 42;
        const isLngInPortugalRange = lng >= -10 && lng <= -6;
        const isLatInLngRange = Math.abs(lat) >= 6 && Math.abs(lat) <= 10;
        const isLngInLatRange = Math.abs(lng) >= 36 && Math.abs(lng) <= 42;

        if (!isLatInPortugalRange && !isLngInPortugalRange && isLatInLngRange && isLngInLatRange) {
          [lat, lng] = [lng, lat];
        }

        return { ...salon, latitude: lat, longitude: lng };
      })
      .filter((salon): salon is SalonWithCoords => salon !== null);
  }, [salons]);

  const toggleFullscreen = useCallback(async () => {
    if (isMobile) return;

    const el = mapWrapperRef.current;
    if (!el) return;

    try {
      if (isMapFullscreenElement(el)) {
        await exitMapFullscreen();
      } else {
        await requestMapFullscreen(el);
      }
    } catch (error) {
      console.error("Failed to toggle map fullscreen:", error);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;

    const handleFullscreenChange = () => {
      const active = isMapFullscreenElement(mapWrapperRef.current);
      setBrowserFullscreen(active);
      onFullscreenChange?.(active);
      window.setTimeout(() => {
        mapInstanceRef.current?.invalidateSize?.(true);
      }, 150);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isMobile, onFullscreenChange]);

  useEffect(() => {
    if (!isFullscreen) return;
    window.setTimeout(() => {
      mapInstanceRef.current?.invalidateSize?.(true);
    }, 150);
  }, [isFullscreen, fullscreenPanelOpen]);

  useEffect(() => {
    if (!fillContainer) return;

    const invalidate = () => {
      window.setTimeout(() => {
        mapInstanceRef.current?.invalidateSize?.(true);
      }, 100);
    };

    invalidate();
    window.addEventListener("resize", invalidate);

    const header = document.querySelector("[data-site-header]");
    const observer = header ? new ResizeObserver(invalidate) : null;
    if (header && observer) {
      observer.observe(header);
    }

    return () => {
      window.removeEventListener("resize", invalidate);
      observer?.disconnect();
    };
  }, [fillContainer, MapComponent]);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      Promise.all([
        import("react-leaflet"),
        import("leaflet"),
        // @ts-ignore - CSS import
        import("leaflet/dist/leaflet.css").catch(() => {}),
      ])
        .then(([reactLeaflet, L]) => {
          const pinkMarkerIcon = new L.default.Icon({
            iconUrl:
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41"><path fill="#EC4899" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 24.5 12.5 24.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/><circle cx="12.5" cy="12.5" r="5.5" fill="#ffffff"/></svg>`
              ),
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            shadowSize: [41, 41],
            shadowAnchor: [12, 41],
          });

          const selectedMarkerIcon = new L.default.Icon({
            iconUrl:
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41"><path fill="#1a1a1a" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 24.5 12.5 24.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/><circle cx="12.5" cy="12.5" r="5.5" fill="#C9A961"/></svg>`
              ),
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            shadowSize: [41, 41],
            shadowAnchor: [12, 41],
          });

          setMapComponent(() => {
            const { MapContainer, TileLayer, Marker, useMap, useMapEvents } = reactLeaflet;

            const currentSalons = salonsWithCoords;
            const handleMarkerClick = onMarkerClick;
            const handleMarkerHover = onMarkerHover;
            const handleMapBackgroundClick = onMapBackgroundClick;
            const fitPadding = 50;

            const focusSalonOnMap = (map: any, salon: SalonWithCoords, paddingLeft: number) => {
              saveMapViewIfNeeded(map, savedMapViewRef);

              const latlng = L.default.latLng(salon.latitude, salon.longitude);
              if (!latlng || !isValidMapCoordinate(latlng.lat, latlng.lng)) return;
              const targetZoom = Math.max(map.getZoom(), 12);

              const panForPanel = () => {
                if (paddingLeft > 0) {
                  map.panBy([paddingLeft / 2, 0], { animate: true, duration: 0.25 });
                }
              };

              if (map.getZoom() < targetZoom) {
                map.once("moveend", panForPanel);
                map.flyTo(latlng, targetZoom, { animate: true, duration: 0.35 });
              } else {
                map.flyTo(latlng, targetZoom, { animate: true, duration: 0.35 });
                map.once("moveend", panForPanel);
              }
            };

            const MapRefBridge = () => {
              const map = useMap();

              useEffect(() => {
                mapInstanceRef.current = map;
                return () => {
                  if (mapInstanceRef.current === map) {
                    mapInstanceRef.current = null;
                  }
                };
              }, [map]);

              return null;
            };
            MapRefBridge.displayName = "MapRefBridge";

            const SalonFocusBridge = ({
              salonId,
              paddingLeft,
            }: {
              salonId: string | null;
              paddingLeft: number;
            }) => {
              const map = useMap();

              useEffect(() => {
                if (salonId) {
                  const salon = currentSalons.find((item) => item.id === salonId);
                  if (!salon) return;
                  focusSalonOnMap(map, salon, paddingLeft);
                  return;
                }

                const savedView = savedMapViewRef.current;
                savedMapViewRef.current = null;
                if (!savedView || !isValidMapCoordinate(savedView.lat, savedView.lng)) return;

                const restore = () => {
                  map.invalidateSize();
                  if (!isValidMapCoordinate(savedView.lat, savedView.lng)) return;
                  map.flyTo([savedView.lat, savedView.lng], savedView.zoom, {
                    animate: true,
                    duration: 0.35,
                  });
                };

                window.setTimeout(restore, 120);
              }, [salonId, paddingLeft, map]);

              return null;
            };
            SalonFocusBridge.displayName = "SalonFocusBridge";

            const MapClickHandler = () => {
              useMapEvents({
                click: (event) => {
                  const target = event.originalEvent?.target;
                  if (target instanceof Element && target.closest(".leaflet-marker-icon")) {
                    return;
                  }
                  if (handleMapBackgroundClick) {
                    handleMapBackgroundClick();
                  }
                  if (handleMarkerHover) {
                    handleMarkerHover(null);
                  }
                },
              });

              return null;
            };

            const FitBounds = ({ skip }: { skip: boolean }) => {
              const map = useMap();

              useEffect(() => {
                if (skip || currentSalons.length === 0) return;

                const salonCountChanged = prevSalonCountRef.current !== currentSalons.length;
                prevSalonCountRef.current = currentSalons.length;

                if (hasInitialFitRef.current && !salonCountChanged) return;

                hasInitialFitRef.current = true;
                try {
                  const bounds = L.default.latLngBounds(
                    currentSalons.map((salon) => [salon.latitude, salon.longitude])
                  );
                  map.fitBounds(bounds, {
                    padding: [fitPadding, fitPadding],
                    maxZoom: 12,
                  });
                } catch (error) {
                  console.error("Error fitting bounds:", error);
                }
              }, [currentSalons.length, map, skip]);

              return null;
            };
            FitBounds.displayName = "FitBounds";

            function DynamicMapComponent({
              selectedSalonId: activeSalonId = null,
              focusPaddingLeft: activePaddingLeft = 0,
            }: DynamicMapProps) {
              return (
                <MapContainer
                  center={portugalCenter}
                  zoom={currentSalons.length > 0 ? 7 : 6}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                  dragging
                  touchZoom
                  doubleClickZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {currentSalons.map((salon) => {
                    const lat = Number(salon.latitude);
                    const lng = Number(salon.longitude);
                    const isSelected = activeSalonId === salon.id;

                    return (
                      <Marker
                        key={salon.id}
                        position={[lat, lng]}
                        icon={isSelected ? selectedMarkerIcon : pinkMarkerIcon}
                        eventHandlers={{
                          click: (event) => {
                            L.default.DomEvent.stopPropagation(event.originalEvent);
                            const map = event.target._map;
                            focusSalonOnMap(map, salon, activePaddingLeft);

                            if (handleMarkerHover) {
                              handleMarkerHover(salon.id);
                            }

                            if (handleMarkerClick) {
                              handleMarkerClick(salon.id);
                            }
                          },
                        }}
                      />
                    );
                  })}
                  <MapClickHandler />
                  <MapRefBridge />
                  <SalonFocusBridge salonId={activeSalonId} paddingLeft={activePaddingLeft} />
                  <FitBounds skip={Boolean(activeSalonId)} />
                </MapContainer>
              );
            }

            DynamicMapComponent.displayName = "DynamicMapComponent";
            return DynamicMapComponent;
          });
        })
        .catch((error) => {
          console.error("Failed to load map:", error);
        });
    }
  }, [salonsWithCoords, onMarkerClick, onMarkerHover, onMapBackgroundClick]);

  if (!isMounted || !MapComponent) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gray-100 touch-manipulation",
          !fillContainer && "min-h-[500px] rounded-lg"
        )}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const showDesktopFullscreenSplit =
    isFullscreen && fullscreenPanelOpen && Boolean(fullscreenPanel) && !isMobile;

  return (
    <div
      ref={mapWrapperRef}
      className={cn(
        "salon-map-shell relative z-0 h-full w-full touch-manipulation bg-brand-white",
        showDesktopFullscreenSplit && "flex min-h-0 flex-row overflow-hidden",
        !fillContainer && "min-h-[500px] overflow-hidden rounded-lg"
      )}
    >
      {showDesktopFullscreenSplit && (
        <div className="flex h-full w-[min(24rem,38vw)] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
          {fullscreenPanel}
        </div>
      )}

      <div className={cn("relative min-h-0", showDesktopFullscreenSplit ? "flex-1" : "h-full w-full")}>
        <MapComponent selectedSalonId={selectedSalonId} focusPaddingLeft={focusPaddingLeft} />
        {!isMobile && (
          <button
            type="button"
            onClick={toggleFullscreen}
            data-salon-map-fullscreen
            className="absolute right-3 top-3 z-[700] flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white/95 text-brand-black shadow-md"
            aria-label={isFullscreen ? t("header.exitFullscreen") : t("header.fullscreen")}
            title={isFullscreen ? t("header.exitFullscreen") : t("header.fullscreen")}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
        {salonsWithCoords.length === 0 && (
          <div className="absolute top-4 left-4 z-[700] rounded bg-white/90 px-4 py-2 shadow-lg">
            <p className="text-sm text-gray-600">
              No salon locations with coordinates. Add latitude and longitude to salons to see them on
              the map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
