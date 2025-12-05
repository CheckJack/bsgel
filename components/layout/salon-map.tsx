"use client";

import { useEffect, useState, useMemo } from "react";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  isBioDiamond?: boolean;
}

interface SalonMapProps {
  salons: Salon[];
  onMarkerClick?: (salonId: string) => void;
}

export function SalonMap({ salons, onMarkerClick }: SalonMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [MapComponent, setMapComponent] = useState<any>(null);
  
  // Portugal center coordinates
  const portugalCenter: [number, number] = [39.5, -8.0];
  
  // Filter salons that have valid coordinates and fix swapped coordinates
  const salonsWithCoords = useMemo(() => {
    return salons
      .map((salon) => {
        let lat = Number(salon.latitude);
        let lng = Number(salon.longitude);
        
        // Check if coordinates are valid
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
        
        // Portugal coordinate ranges: lat ~36-42, lng ~-10 to -6
        const isLatInPortugalRange = lat >= 36 && lat <= 42;
        const isLngInPortugalRange = lng >= -10 && lng <= -6;
        
        // Check if coordinates might be swapped
        // If lat is in longitude range (6-10) and lng is in latitude range (36-42), swap them
        const isLatInLngRange = Math.abs(lat) >= 6 && Math.abs(lat) <= 10;
        const isLngInLatRange = Math.abs(lng) >= 36 && Math.abs(lng) <= 42;
        
        // If coordinates are NOT in Portugal range but would be if swapped, swap them
        if (!isLatInPortugalRange && !isLngInPortugalRange && isLatInLngRange && isLngInLatRange) {
          console.warn(`⚠️ Swapping coordinates for salon "${salon.name}" (${salon.city}): [${lat}, ${lng}] -> [${lng}, ${lat}]`);
          [lat, lng] = [lng, lat];
        } else if (!isLatInPortugalRange || !isLngInPortugalRange) {
          // Log if coordinates are outside Portugal range (might indicate wrong coordinates)
          console.warn(`⚠️ Salon "${salon.name}" (${salon.city}) coordinates [${lat}, ${lng}] are outside Portugal range (lat: 36-42, lng: -10 to -6)`);
        }
        
        return {
          ...salon,
          latitude: lat,
          longitude: lng,
        };
      })
      .filter((salon): salon is Salon => salon !== null);
  }, [salons]);
  
  // Debug: Log all salons and their coordinates
  useEffect(() => {
    if (isMounted) {
      console.log("All salons:", salons);
      console.log("Salons with valid coordinates:", salonsWithCoords);
      salons.forEach((salon) => {
        if (!salonsWithCoords.find(s => s.id === salon.id)) {
          console.warn(`Salon "${salon.name}" excluded from map:`, {
            latitude: salon.latitude,
            longitude: salon.longitude,
            latType: typeof salon.latitude,
            lngType: typeof salon.longitude
          });
        }
      });
    }
  }, [salons, salonsWithCoords, isMounted]);

  useEffect(() => {
    setIsMounted(true);
    
    // Dynamically import Leaflet and react-leaflet only on client side
    if (typeof window !== "undefined") {
      import("leaflet/dist/leaflet.css");
      
      Promise.all([
        import("react-leaflet"),
        import("leaflet")
      ]).then(([reactLeaflet, L]) => {
        // Fix for default marker icons
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
        
        setMapComponent(() => {
          const { MapContainer, TileLayer, Marker, useMap } = reactLeaflet;
          
          // Store salons and callback in variables accessible to components
          const currentSalons = salonsWithCoords;
          const handleMarkerClick = onMarkerClick;
          
          // Component to fit map bounds to all markers
          const FitBounds = () => {
            const map = useMap();
            
            useEffect(() => {
              if (currentSalons.length > 0) {
                try {
                  const bounds = L.default.latLngBounds(
                    currentSalons.map((salon) => [
                      Number(salon.latitude),
                      Number(salon.longitude),
                    ])
                  );
                  
                  // Add padding to bounds and fit the map
                  map.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 12,
                  });
                } catch (error) {
                  console.error("Error fitting bounds:", error);
                }
              }
            }, [currentSalons.length, map]);
            
            return null;
          };
          
          return () => (
            <MapContainer
              center={portugalCenter}
              zoom={currentSalons.length > 0 ? 7 : 6}
              style={{ height: "100%", width: "100%", minHeight: "500px" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {currentSalons.map((salon) => {
                const lat = Number(salon.latitude);
                const lng = Number(salon.longitude);
                
                return (
                  <Marker
                    key={salon.id}
                    position={[lat, lng]}
                    eventHandlers={{
                      click: () => {
                        if (handleMarkerClick) {
                          handleMarkerClick(salon.id);
                        }
                      },
                    }}
                  />
                );
              })}
              <FitBounds />
            </MapContainer>
          );
        });
      }).catch((error) => {
        console.error("Failed to load map:", error);
      });
    }
  }, [salonsWithCoords]);

  if (!isMounted || !MapComponent) {
    return (
      <div className="w-full h-full min-h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden relative z-0">
      <MapComponent />
      {salonsWithCoords.length === 0 && (
        <div className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded shadow-lg z-[1000]">
          <p className="text-sm text-gray-600">
            No salon locations with coordinates. Add latitude and longitude to salons to see them on the map.
          </p>
        </div>
      )}
    </div>
  );
}
