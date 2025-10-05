import type { Transaction } from "../lib/api";
import type { SystemSettings } from "../store/slices/settingsSlice";

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

class EscPosBuilder {
  private commands: number[] = [];

  // Initialize printer
  init(): this {
    this.commands.push(ESC, 0x40);
    return this;
  }

  // Text alignment: 0=left, 1=center, 2=right
  align(mode: 0 | 1 | 2): this {
    this.commands.push(ESC, 0x61, mode);
    return this;
  }

  // Bold text
  bold(enabled: boolean): this {
    this.commands.push(ESC, 0x45, enabled ? 1 : 0);
    return this;
  }

  // Double height text
  doubleHeight(enabled: boolean): this {
    this.commands.push(ESC, 0x21, enabled ? 0x10 : 0x00);
    return this;
  }

  // Write text
  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.commands.push(...Array.from(bytes));
    return this;
  }

  // Write line (text + newline)
  line(str: string): this {
    return this.text(str).text("\n");
  }

  // Feed lines
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.commands.push(LF);
    }
    return this;
  }

  // Cut paper
  cut(): this {
    this.commands.push(GS, 0x56, 0x00);
    return this;
  }

  // Get final byte array
  build(): Uint8Array {
    return new Uint8Array(this.commands);
  }
}

function padRight(str: string, length: number): string {
  return str.length > length
    ? str.substring(0, length)
    : str.padEnd(length, " ");
}

function padLeft(str: string, length: number): string {
  return str.length > length
    ? str.substring(0, length)
    : str.padStart(length, " ");
}

export function generateReceiptESCPOS(
  transaction: Transaction,
  settings?: SystemSettings
): Uint8Array {
  const builder = new EscPosBuilder();

  const storeName = settings?.storeName || "OCT PHARMACY";
  const storeLocation = settings?.storeLocation || "";
  const storeContact = settings?.storeContact || "";

  builder.init().align(1);

  builder.doubleHeight(true).line(storeName).doubleHeight(false);

  if (storeLocation) {
    builder.line(storeLocation);
  }

  if (storeContact) {
    builder.line(storeContact);
  }

  builder
    .line("--------------------------------")
    .feed(1)
    .align(0) // Left
    .line(`Receipt: ${transaction.receiptNumber}`)
    .line(`Date: ${new Date(transaction.transactionDate).toLocaleDateString()}`)
    .line(`Time: ${new Date(transaction.transactionDate).toLocaleTimeString()}`)
    .line(`Cashier: ${transaction.cashierName}`)
    .line("--------------------------------");

  if (transaction.items && transaction.items.length > 0) {
    builder
      .feed(1)
      .bold(true)
      .line("Name          Qty Price  Total")
      .bold(false)
      .line("--------------------------------");

    transaction.items.forEach((item) => {
      const name = padRight(item.itemName, 12);
      const qty = padLeft(`${item.quantity}`, 3);
      const price = padLeft(item.unitPrice.toFixed(2), 6);
      const total = padLeft(item.lineTotal.toFixed(2), 6);
      builder.line(`${name} ${qty} ${price} ${total}`);
    });
  }

  builder
    .line("--------------------------------")
    .feed(1)
    .line(`Subtotal:       P${transaction.subTotal.toFixed(2)}`);

  if (transaction.regularDiscount > 0) {
    builder.line(`Discount:      -P${transaction.regularDiscount.toFixed(2)}`);
  }

  if (transaction.specialDiscount > 0) {
    builder.line(`Sp. Discount:  -P${transaction.specialDiscount.toFixed(2)}`);
  }

  if (settings?.showVat && transaction.vatAmount > 0) {
    const vatPercentage = settings?.vatAmount || 12;
    builder.line(
      `VAT (${vatPercentage}%):      P${transaction.vatAmount.toFixed(2)}`
    );
  }

  builder
    .feed(1)
    .doubleHeight(true)
    .line(`TOTAL:  P${transaction.totalAmount.toFixed(2)}`)
    .doubleHeight(false)
    .feed(1)
    .line("--------------------------------")
    .line(`Payment: ${transaction.paymentMethod}`);

  if (transaction.paymentMethod === "Cash" && transaction.cashInHand) {
    builder
      .line(`Cash:           P${transaction.cashInHand.toFixed(2)}`)
      .line(`Change:         P${transaction.changeAmount.toFixed(2)}`);
  }

  if (transaction.paymentMethod !== "Cash" && transaction.referenceNumber) {
    builder.line(`Ref: ${transaction.referenceNumber}`);
  }

  builder.feed(3).cut();

  return builder.build();
}

export function generateTestReceiptESCPOS(
  settings?: SystemSettings
): Uint8Array {
  const builder = new EscPosBuilder();

  const storeName = settings?.storeName || "OCT PHARMACY";

  builder
    .init()
    .align(1) // Center
    .line("================================")
    .doubleHeight(true)
    .line(storeName)
    .doubleHeight(false)
    .line("================================")
    .feed(1)
    .bold(true)
    .line("TEST PRINT OK")
    .bold(false)
    .feed(1)
    .line("================================")
    .feed(3)
    .cut();

  return builder.build();
}
