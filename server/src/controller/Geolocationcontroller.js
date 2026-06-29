/* ==========================================================
   REVERSE GEOCODING
   GET /api/geolocation/reverse?lat=..&lng=..
   Response: { address: "..." }

   FieldAgentAttendance.jsx calls this on every GPS fix to resolve a
   human-readable address; it already falls back to a raw "Lat, Lng"
   string client-side if this call fails or omits `address`, so this
   endpoint can fail soft (still return 200 with a best-effort string,
   or any non-2xx — the UI handles both).

   Uses OpenStreetMap's free Nominatim API (no key required). Swap the
   fetch URL/headers below for Google Maps Geocoding, Mapbox, or any
   other provider if you already hold a key for one — the response
   contract the UI expects ({ address }) stays the same either way.
========================================================== */

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

export const reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: "Valid lat and lng query parameters are required.",
            });
        }

        const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                // Nominatim's usage policy requires a descriptive UA /
                // contact identifier on every request.
                "User-Agent": process.env.GEOCODING_USER_AGENT || "field-visit-crm/1.0",
                "Accept-Language": "en",
            },
        });

        if (!response.ok) {
            return res.status(200).json({
                success: true,
                address: null,
            });
        }

        const data = await response.json();

        const address = data?.display_name || null;

        return res.status(200).json({
            success: true,
            address,
        });
    } catch (error) {
        console.error("reverseGeocode:", error);
        // Soft-fail: the UI already has its own coordinate-string
        // fallback when `address` is missing, so a 200 with a null
        // address degrades the experience less than a thrown 500 would.
        return res.status(200).json({
            success: true,
            address: null,
        });
    }
};