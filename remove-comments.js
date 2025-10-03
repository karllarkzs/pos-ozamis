const fs = require("fs");
const path = require("path");

function removeCommentsExceptTodos(content) {
  let result = "";
  let i = 0;

  while (i < content.length) {
    if (content[i] === "/" && content[i + 1] === "/") {
      const lineStart = i;
      let lineEnd = i;
      while (lineEnd < content.length && content[lineEnd] !== "\n") {
        lineEnd++;
      }
      const comment = content.substring(lineStart, lineEnd);

      if (comment.toUpperCase().includes("TODO")) {
        result += comment;
      }

      i = lineEnd;
    } else if (content[i] === "/" && content[i + 1] === "*") {
      const commentStart = i;
      let commentEnd = i + 2;

      while (commentEnd < content.length - 1) {
        if (content[commentEnd] === "*" && content[commentEnd + 1] === "/") {
          commentEnd += 2;
          break;
        }
        commentEnd++;
      }

      const comment = content.substring(commentStart, commentEnd);

      if (comment.toUpperCase().includes("TODO")) {
        result += comment;
      } else {
        const newlines = (comment.match(/\n/g) || []).length;
        result += "\n".repeat(newlines);
      }

      i = commentEnd;
    } else if (content[i] === '"' || content[i] === "'" || content[i] === "`") {
      const quote = content[i];
      result += content[i];
      i++;

      while (i < content.length) {
        if (content[i] === "\\") {
          result += content[i];
          i++;
          if (i < content.length) {
            result += content[i];
            i++;
          }
        } else if (content[i] === quote) {
          result += content[i];
          i++;
          break;
        } else {
          result += content[i];
          i++;
        }
      }
    } else {
      result += content[i];
      i++;
    }
  }

  return result.replace(/\n\n\n+/g, "\n\n");
}

const files = [
  "src/components/inventory/RestockingTab.tsx",
  "src/pages/admin/ReportsPage.tsx",
  "src/components/TopProductsWidget.tsx",
  "src/components/DashboardOverview.tsx",
  "src/components/FinancialSummary.tsx",
  "src/pages/admin/DashboardPage.tsx",
  "src/hooks/api/useReports.ts",
  "src/components/TransactionListModal.tsx",
  "src/hooks/api/useTransactions.ts",
  "src/lib/api.ts",
  "src/pages/POSPage.tsx",
  "src/hooks/api/useReagents.ts",
  "src/pages/admin/InventoryPage.tsx",
  "src/components/inventory/ReagentsTab.tsx",
  "src/components/ReagentSummaryStats.tsx",
  "src/hooks/api/useTests.ts",
  "src/components/inventory/TestsTab.tsx",
  "src/components/EditTestModal.tsx",
  "src/components/TestModal.tsx",
  "src/types/global.d.ts",
  "src/components/ReagentModal.tsx",
  "src/components/ComprehensiveDashboardOverview.tsx",
  "src/components/inventory/ProductsTab.tsx",
  "src/components/ProductEntryCard.tsx",
  "src/components/EditProductModal.tsx",
  "src/components/BulkAddProductModal.tsx",
  "src/components/ProductSummaryStats.tsx",
  "src/hooks/api/useProducts.ts",
  "src/hooks/api/useRestockBatches.ts",
  "src/components/PaymentModal.tsx",
  "src/hooks/api/index.ts",
  "src/components/BatchEditProductModal.tsx",
  "src/App.tsx",
  "src/components/AdminLayout.tsx",
  "src/utils/tauri-api.ts",
];

files.forEach((file) => {
  const filePath = path.join(__dirname, file);

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const cleaned = removeCommentsExceptTodos(content);
    fs.writeFileSync(filePath, cleaned, "utf8");
    console.log(`✓ Processed: ${file}`);
  } catch (err) {
    console.error(`✗ Error processing ${file}:`, err.message);
  }
});

console.log("\nDone! All comments removed except TODOs.");
