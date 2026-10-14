export interface ClientReportItem {
  id: string;
  name: string;
  phone: string;
  service: string;
  doctor: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: number;
}

export const pdfService = {
  printClientsReport(
    clinicName: string,
    clients: ClientReportItem[],
    doctorName?: string,
    phone?: string
  ): void {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير / حفظ كـ PDF');
      return;
    }

    const todayDate = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const todayTime = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const rowsHtml = clients
      .map(
        (c, idx) => `
        <tr class="table-row">
          <td class="col-num">${idx + 1}</td>
          <td class="col-name"><strong>${c.name}</strong></td>
          <td class="col-phone" dir="ltr">${c.phone}</td>
          <td class="col-service">${c.service}</td>
          <td class="col-doctor">${c.doctor}</td>
          <td class="col-visit">${c.lastVisit || '-'}</td>
          <td class="col-count">${c.totalVisits}</td>
          <td class="col-price">${c.totalSpent > 0 ? c.totalSpent.toLocaleString() + ' ر.س' : '0'}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>تقرير بيانات العملاء - ${clinicName}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm 12mm 15mm 12mm;
            @top-center {
              content: element(pageHeader);
            }
            @bottom-center {
              content: "صفحة " counter(page) " من " counter(pages);
            }
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #1e293b;
            font-size: 11pt;
            direction: rtl;
          }

          /* Header on each page */
          .report-header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .clinic-branding {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .clinic-logo {
            width: 44px;
            height: 44px;
            background: #0284c7;
            color: #ffffff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: bold;
          }

          .clinic-title {
            font-size: 16pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }

          .clinic-subtitle {
            font-size: 9pt;
            color: #64748b;
            margin: 2px 0 0 0;
          }

          .report-meta {
            text-align: left;
            font-size: 8.5pt;
            color: #475569;
          }

          .report-badge {
            display: inline-block;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 600;
            color: #0369a1;
            margin-bottom: 4px;
          }

          /* Table with repeating headers */
          table.report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
          }

          table.report-table thead {
            display: table-header-group; /* Repeats on every printed page */
          }

          table.report-table tbody {
            display: table-row-group;
          }

          table.report-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          table.report-table th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            padding: 9px 8px;
            text-align: right;
            font-weight: 700;
            border: 1px solid #334155;
            font-size: 9pt;
          }

          table.report-table td {
            padding: 7px 8px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
          }

          table.report-table tr:nth-child(even) td {
            background-color: #f8fafc;
          }

          .col-num { width: 4%; text-align: center; font-weight: bold; }
          .col-name { width: 22%; }
          .col-phone { width: 14%; text-align: center; }
          .col-service { width: 18%; }
          .col-doctor { width: 16%; }
          .col-visit { width: 12%; text-align: center; }
          .col-count { width: 7%; text-align: center; font-weight: bold; }
          .col-price { width: 7%; text-align: center; font-weight: bold; color: #0369a1; }

          .report-summary {
            margin-top: 15px;
            padding: 10px 14px;
            background: #f1f5f9;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            font-weight: 600;
            color: #334155;
            page-break-inside: avoid;
          }

          .print-actions {
            position: fixed;
            bottom: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }

          .btn {
            background: #0284c7;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 12pt;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
          }

          .btn-cancel {
            background: #64748b;
          }

          @media print {
            .print-actions {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button class="btn" onclick="window.print()">🖨️ طباعة التقرير / حفظ كـ PDF</button>
          <button class="btn btn-cancel" onclick="window.close()">إغلاق</button>
        </div>

        <div class="report-header">
          <div class="clinic-branding">
            <div class="clinic-logo">🏥</div>
            <div>
              <h1 class="clinic-title">${clinicName}</h1>
              <p class="clinic-subtitle">
                ${doctorName ? 'المدير الطبي: ' + doctorName : 'نظام إدارة العيادات الذكي'} 
                ${phone ? ' • هاتف: ' + phone : ''}
              </p>
            </div>
          </div>
          <div class="report-meta">
            <div class="report-badge">تقرير بيانات العملاء الشامل</div>
            <div><strong>تاريخ الاستخراج:</strong> ${todayDate}</div>
            <div><strong>توقيت الاستخراج:</strong> ${todayTime}</div>
            <div><strong>إجمالي العملاء بالتقرير:</strong> ${clients.length} عميل</div>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th class="col-num">م</th>
              <th class="col-name">اسم العميل / المريض</th>
              <th class="col-phone">رقم الهاتف</th>
              <th class="col-service">الخدمة الطبية</th>
              <th class="col-doctor">الدكتور المعالج</th>
              <th class="col-visit">ميعاد آخر زيارة</th>
              <th class="col-count">الزيارات</th>
              <th class="col-price">المدفوعات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="report-summary">
          <div>إجمالي عدد العملاء المسجلين: <strong>${clients.length}</strong></div>
          <div>إجمالي الزيارات المنفذة: <strong>${clients.reduce((acc, c) => acc + c.totalVisits, 0)}</strong></div>
          <div>إجمالي المبالغ والمدفوعات: <strong>${clients.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()} ر.س</strong></div>
        </div>

        <script>
          // Automatic print trigger on load
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },
};
