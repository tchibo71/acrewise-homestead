import { printReport } from "@/components/utils/printUtils";
import { getUnitLabel, getSpeciesLabel, getPaymentTermsLabel } from "./wholesaleConstants";
import { format } from "date-fns";

export function printWholesaleInvoice(order, account) {
  const total = order.total_amount || (order.quantity * order.price_per_unit) || 0;

  // Build a custom invoice HTML instead of the generic table format
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${order.invoice_number || ""}</title>
      <style>
        @media print { body { margin: 0; padding: 20px; } .no-print { display: none; } }
        body { font-family: Arial, sans-serif; color: #1f2937; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 15px; }
        .brand { font-size: 22px; font-weight: bold; color: #16a34a; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #1f2937; }
        .invoice-meta { text-align: right; font-size: 12px; color: #666; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .party { font-size: 12px; }
        .party h3 { font-size: 11px; text-transform: uppercase; color: #999; margin-bottom: 4px; }
        .party p { margin: 2px 0; }
        .line-items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .line-items th { background-color: #16a34a; color: white; padding: 8px; text-align: left; font-size: 12px; }
        .line-items td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        .line-items tr:nth-child(even) { background-color: #f9f9f9; }
        .totals { margin-top: 20px; margin-left: auto; width: 250px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .totals-row.grand { border-top: 2px solid #16a34a; margin-top: 8px; padding-top: 8px; font-size: 16px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">Homestead Acres</div>
          <div class="invoice-meta">Generated on ${new Date().toLocaleDateString()}</div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">INVOICE</div>
          <div>${order.invoice_number || ""}</div>
          <div class="status-badge" style="background:${order.invoice_status === 'paid' ? '#dcfce7' : '#fef3c7'};color:${order.invoice_status === 'paid' ? '#166534' : '#92400e'};">
            ${order.invoice_status?.toUpperCase() || 'DRAFT'}
          </div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <h3>From</h3>
          <p><strong>Homestead Acres</strong></p>
          <p>Your Farm</p>
        </div>
        <div class="party">
          <h3>Bill To</h3>
          <p><strong>${account?.account_name || "—"}</strong></p>
          <p>${account?.contact_name || ""}</p>
          <p>${account?.contact_phone || ""}</p>
          <p>${account?.contact_email || ""}</p>
        </div>
      </div>

      <div style="margin-bottom: 15px; font-size: 12px;">
        <strong>Order Date:</strong> ${order.order_date ? format(new Date(order.order_date), 'MMM d, yyyy') : "—"}<br>
        <strong>Delivery Date:</strong> ${order.delivery_date ? format(new Date(order.delivery_date), 'MMM d, yyyy') : "—"}<br>
        <strong>Payment Terms:</strong> ${account ? getPaymentTermsLabel(account.payment_terms) : "—"}
      </div>

      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${getSpeciesLabel(order.species)} mushrooms</td>
            <td>${order.quantity || 0}</td>
            <td>${getUnitLabel(order.unit)}</td>
            <td>$${(order.price_per_unit || 0).toFixed(2)}</td>
            <td>$${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand">
          <span>Total Due</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        ${order.payment_received_date ? `<div class="totals-row" style="color:#16a34a;"><span>Paid</span><span>${format(new Date(order.payment_received_date), 'MMM d, yyyy')}</span></div>` : ''}
      </div>

      ${order.fulfilled_from_flush_ids?.length > 0 ? `
      <div style="margin-top: 20px; font-size: 11px; color: #666;">
        <strong>Traceability:</strong> Fulfilled from ${order.fulfilled_from_flush_ids.length} harvest flush(es)
      </div>` : ''}

      <div class="footer">
        <p>Invoice generated by Homestead Acres</p>
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  } else {
    console.error('Failed to open print window. Popup blockers might be preventing it.');
    alert('Please allow pop-ups for this site to print the invoice.');
  }
}