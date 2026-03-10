import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The House Ledger — Professional Home Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1d3557",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              lineHeight: 1,
            }}
          >
            🏠
          </div>
          <div
            style={{
              fontSize: "52px",
              fontWeight: "800",
              color: "#ffffff",
              letterSpacing: "-1px",
            }}
          >
            The House Ledger
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#a8c7e8",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
            marginBottom: "48px",
          }}
        >
          The complete home management platform for homeowners and their household managers.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["Tasks & Calendar", "Real-time Chat", "SOPs & Vendors", "Purchase Approvals", "Payroll Tracking"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "100px",
                  padding: "10px 22px",
                  fontSize: "18px",
                  color: "#e2edf7",
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "20px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          thehouseledger.com
        </div>
      </div>
    ),
    { ...size }
  );
}
