import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const city = searchParams.get("city");
    const postalCode = searchParams.get("postalCode");

    if (!address || !city) {
      return NextResponse.json(
        { error: "Address and city are required" },
        { status: 400 }
      );
    }

    // Build query string - try multiple formats for better results
    const queryParts = [address, city, postalCode, "Portugal"].filter(Boolean);
    const query = queryParts.join(", ");

    console.log("Geocoding query:", query);

    // Use Nominatim geocoding API with a delay to respect rate limits
    // Nominatim requires a User-Agent and has rate limits (1 request per second)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=pt&addressdetails=1`,
      {
        headers: {
          "User-Agent": "BioSculpture-Salon-Manager/1.0 (contact@biosculpture.com)",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nominatim API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Geocoding service returned error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Geocoding response:", data);

    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates in response:", result);
        return NextResponse.json(
          { error: "Invalid coordinates returned from geocoding service" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        lat,
        lng,
        display_name: result.display_name,
      });
    }

    // If no results, try a simpler query with just city
    if (queryParts.length > 2) {
      console.log("Trying simpler query with just city...");
      const simpleQuery = `${city}, Portugal`;
      const simpleResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simpleQuery)}&limit=1&countrycodes=pt`,
        {
          headers: {
            "User-Agent": "BioSculpture-Salon-Manager/1.0 (contact@biosculpture.com)",
            "Accept-Language": "en",
          },
        }
      );

      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        if (simpleData && Array.isArray(simpleData) && simpleData.length > 0) {
          const result = simpleData[0];
          return NextResponse.json({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            display_name: result.display_name,
            note: "Found city center coordinates. Please verify the exact address.",
          });
        }
      }
    }

    return NextResponse.json(
      { error: `No results found for "${query}". Please check the address and try again, or enter coordinates manually.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: error?.message || "Geocoding service unavailable. Please try again later or enter coordinates manually." },
      { status: 500 }
    );
  }
}

