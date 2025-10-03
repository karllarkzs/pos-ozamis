import { ReactNode } from "react";

interface POSLayoutProps {
  header: ReactNode;
  filters: ReactNode;
  productCatalog: ReactNode;
  cart: ReactNode;
  transactionSummary: ReactNode;
}

export function POSLayout({
  header,
  filters,
  productCatalog,
  cart,
  transactionSummary,
}: POSLayoutProps) {
  return (
    <div
      style={{
        minWidth: "1280px",
        width: "100vw",
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gridTemplateColumns: "2fr 1fr",
        gap: "12px",
        padding: "12px",
        backgroundColor: "#f8f9fa",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          gridColumn: "1 / -1",
          gridRow: "1",
          overflow: "hidden",
        }}
      >
        {header}
      </div>

      <div
        style={{
          gridColumn: "1 / -1",
          gridRow: "2",
          overflow: "hidden",
        }}
      >
        {filters}
      </div>

      <div
        style={{
          gridColumn: "1",
          gridRow: "3",
          minHeight: 0,
          maxHeight: "100%",
          overflow: "hidden",
        }}
      >
        {productCatalog}
      </div>

      <div
        style={{
          gridColumn: "2",
          gridRow: "3",
          display: "grid",
          gridTemplateRows: "1fr auto",
          gap: "12px",
          minHeight: 0,
          maxHeight: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            gridRow: "1",
            minHeight: 0,
            maxHeight: "100%",
            overflow: "hidden",
          }}
        >
          {cart}
        </div>

        <div
          style={{
            gridRow: "2",
            minHeight: 0,
            overflow: "visible",
          }}
        >
          {transactionSummary}
        </div>
      </div>
    </div>
  );
}
