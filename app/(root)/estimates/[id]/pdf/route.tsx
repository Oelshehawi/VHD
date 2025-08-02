import { NextRequest } from "next/server";
import { fetchEstimateById } from "../../../../lib/estimates.data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const estimate = await fetchEstimateById(id);

    if (!estimate) {
      return new Response("Estimate not found", { status: 404 });
    }

    // Calculate totals from items
    const subtotal = estimate.items.reduce((sum, item) => sum + item.price, 0);
    const gst = subtotal * 0.05; // 5% GST
    const total = subtotal + gst;

    // Get client name
    const clientName =
      estimate.clientId && (estimate as any).clientId?.clientName
        ? (estimate as any).clientId.clientName
        : estimate.prospectInfo?.businessName || "Unknown Client";

    // Create HTML template identical to estimate.html but populated with data
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Estimate ${estimate.estimateNumber} - Vancouver Hood Doctors</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 900px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 30px;
        margin: 20px;
      }
      .header {
        position: relative;
        margin-bottom: 30px;
        background-color: #003e29;
        color: white;
        padding: 20px;
        border-radius: 4px;
        overflow: hidden;
      }
      .header-title {
        font-size: 28px;
        margin-bottom: 5px;
        font-weight: bold;
      }
      .header-subtitle {
        font-size: 16px;
      }
      h1 {
        color: #003e29;
        text-align: center;
        margin-bottom: 30px;
      }
      .form-row {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }
      .form-group {
        margin-bottom: 20px;
        flex: 1;
      }
      label {
        display: block;
        margin-bottom: 6px;
        font-weight: bold;
        color: #333;
      }
      input,
      textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
        box-sizing: border-box;
      }
      .item-row {
        display: flex;
        margin-bottom: 10px;
        gap: 10px;
      }
      .item-row input {
        padding: 8px;
      }
      .number-col {
        width: 8%;
      }
      .description-col {
        width: 52%;
      }
      .price-col,
      .total-col {
        width: 20%;
      }
      .button-container {
        text-align: center;
        margin-top: 30px;
      }
      button {
          background-color: #003e29; 
          color: white; 
          border: none; 
        padding: 12px 30px;
        font-size: 16px;
        border-radius: 4px;
          cursor: pointer;
        transition: background-color 0.3s;
      }
      button:hover {
        background-color: #002918;
      }
      .table-container {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 20px;
      }
      .table-header {
        background-color: #003e29;
        color: white;
        padding: 12px 10px;
        display: flex;
        gap: 10px;
        font-weight: bold;
      }
      .itemsContainer {
        padding: 10px;
        background-color: #f9f9f9;
      }
      .totals-row {
        display: flex;
        background-color: #f0f0f0;
        padding: 8px 10px;
        border-top: 1px solid #ddd;
        font-weight: bold;
      }
      .totals-row.final {
        background-color: #e0f0e8;
        color: #003e29;
          font-size: 16px;
      }
      .totals-label {
        flex-grow: 1;
        text-align: right;
        padding-right: 15px;
      }
      .totals-value {
        width: 20%;
        text-align: right;
        padding-right: 10px;
      }
      h2 {
        color: #003e29;
        margin-top: 30px;
        border-bottom: 2px solid #003e29;
        padding-bottom: 8px;
      }
      .loading {
        display: none;
        text-align: center;
        margin-top: 20px;
        font-weight: bold;
      }
      .company-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .company-info .form-group {
        width: 48%;
      }
      textarea.description-textarea {
        height: 120px;
        margin-bottom: 20px;
      }
      .service-checkbox {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .service-checkbox input {
        width: auto;
        margin-right: 10px;
      }
      .add-item-btn {
        background-color: #003e29;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      }
      .section-title {
        background-color: #f0f0f0;
        padding: 10px;
        border-left: 4px solid #003e29;
        margin-bottom: 15px;
        margin-top: 25px;
        font-weight: bold;
      }
      #totalEstimate {
        color: #003e29;
        font-size: 18px;
      }
      .logo-preview {
        max-width: 200px;
        margin: 0 auto 20px;
        display: block;
      }
      #logoDropArea {
        border: 2px dashed #ccc;
        border-radius: 4px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        margin-bottom: 15px;
      }
      #logoDropArea.highlight {
        border-color: #003e29;
        background-color: rgba(0, 62, 41, 0.05);
      }
      .services-section {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 4px;
        margin-top: 20px;
        margin-bottom: 20px;
      }
      .services-title {
        font-weight: bold;
        margin-bottom: 15px;
        color: #003e29;
      }
      .services-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .service-item {
        display: flex;
        align-items: center;
        padding: 5px 0;
      }
      .service-item:before {
        content: '✓';
        color: #003e29;
        font-weight: bold;
        margin-right: 8px;
        margin-left: 5px;
      }
      .gst-row {
        display: flex;
        align-items: center;
      }
      .gst-number {
        width: 30%;
        text-align: left;
      }
      .gst-rate {
        width: 50%;
        text-align: right;
        padding-right: 15px;
      }
      .gst-amount {
        width: 20%;
        text-align: right;
        padding-right: 10px;
      }
      .delete-btn {
        background-color: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 5px;
      }
      .delete-btn:hover {
        background-color: #c0392b;
      }
      .item-row-container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
    </style>
</head>
<body>
    <div class="container">
      <div class="header">
        <div class="header-title">VANCOUVER HOOD DOCTORS</div>
        <div class="header-subtitle">Kitchen Exhaust Cleaning Specialists</div>
      </div>

      <div class="section-title">Company Information</div>
      <div class="form-row">
        <div class="form-group">
          <label for="companyName">Company Name:</label>
          <input type="text" id="companyName" value="Vancouver Hood Doctors" readonly />
        </div>
        <div class="form-group">
          <label for="companyPhone">Phone:</label>
          <input type="text" id="companyPhone" value="604-273-8717" readonly />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="companyStreet">Street Address:</label>
          <input type="text" id="companyStreet" value="51-11020 Williams Rd." readonly />
        </div>
        <div class="form-group">
          <label for="companyEmail">Email:</label>
          <input
            type="text"
            id="companyEmail"
            value="adam@vancouverventcleaning.ca"
            readonly
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="companyCityState">City/Province/Postal Code:</label>
          <input type="text" id="companyCityState" value="Richmond BC V7A1X8" readonly />
        </div>
      </div>

      <div class="section-title">Estimate Details</div>
      <div class="form-row">
        <div class="form-group">
          <label for="estimateNumber">Estimate No:</label>
          <input
            type="text"
            id="estimateNumber"
            value="${estimate.estimateNumber}"
            readonly
          />
        </div>
        <div class="form-group">
          <label for="estimateDate">Date:</label>
          <input type="text" id="estimateDate" value="${new Date(estimate.createdDate).toLocaleDateString()}" readonly />
        </div>
      </div>

      <div class="section-title">Client Information & Prepared For</div>
      <div class="form-row">
        <div class="form-group">
          <label for="clientBusinessName">Business Name:</label>
          <input
            type="text"
            id="clientBusinessName"
            value="${clientName}"
            readonly
          />
        </div>
        <div class="form-group">
          <label for="clientContactPerson">Contact Person:</label>
          <input
            type="text"
            id="clientContactPerson"
            value="${estimate.prospectInfo?.contactPerson || ""}"
            readonly
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="clientStreet">Street Address:</label>
          <input
            type="text"
            id="clientStreet"
            value="${estimate.prospectInfo?.address || ""}"
            readonly
          />
        </div>
        <div class="form-group">
          <label for="clientPhone">Phone:</label>
          <input
            type="text"
            id="clientPhone"
            value="${estimate.prospectInfo?.phone || ""}"
            readonly
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="clientCityState">City/Province/Postal Code:</label>
          <input
            type="text"
            id="clientCityState"
            value=""
            readonly
          />
        </div>
        <div class="form-group">
          <label for="clientEmail">Email:</label>
          <input
            type="text"
            id="clientEmail"
            value="${estimate.prospectInfo?.email || ""}"
            readonly
          />
        </div>
    </div>

      <div class="form-group">
        <label for="preparedFor"
          >Project Location (if different from address above):</label
        >
        <input
          type="text"
          id="preparedFor"
          value="${estimate.prospectInfo?.projectLocation || ""}"
          readonly
        />
    </div>

      <h2>Estimated Costs</h2>

      <div class="table-container">
        <div class="table-header">
          <div class="number-col">#</div>
          <div class="description-col">Item Description</div>
          <div class="price-col">Price</div>
          <div class="total-col">Total</div>
    </div>

        <div id="itemsContainer" class="itemsContainer">
            ${estimate.items
              .map(
                (item, index) => `
          <div class="item-row-container">
            <div class="item-row">
              <input type="text" class="number-col" value="${index + 1}" readonly />
              <input
                type="text"
                class="description-col"
                value="${item.description}"
                readonly
              />
              <input
                type="text"
                class="price-col"
                value="$${item.price.toFixed(2)}"
                readonly
              />
              <input
                type="text"
                class="total-col"
                value="$${item.price.toFixed(2)}"
                readonly
              />
            </div>
          </div>
            `,
              )
              .join("")}
        </div>

        <div class="totals-row">
          <div class="totals-label">Subtotal:</div>
          <div class="totals-value" id="subtotal-display">$${subtotal.toFixed(2)}</div>
        </div>

        <div class="totals-row gst-row">
          <div class="gst-number">GST# 814301065</div>
          <div class="gst-rate">GST (5%):</div>
          <div class="gst-amount" id="gst-display">$${gst.toFixed(2)}</div>
        </div>

        <div class="totals-row final">
          <div class="totals-label">Total Estimate:</div>
          <div class="totals-value" id="total-display">$${total.toFixed(2)}</div>
        </div>
    </div>

      <input type="hidden" id="subtotal" value="$${subtotal.toFixed(2)}" />
      <input type="hidden" id="gst" value="$${gst.toFixed(2)}" />
      <input type="hidden" id="totalEstimate" value="$${total.toFixed(2)}" />

      <div class="services-section">
        <div class="services-title">Our vent cleaning service includes:</div>
        <div class="services-list">
    ${
      estimate.services && estimate.services.length > 0
        ? estimate.services
            .map(
              (service) => `
          <div class="service-item">${service}</div>
          `,
            )
            .join("")
        : `
          <div class="service-item">Hood from inside and outside</div>
          <div class="service-item">All filters</div>
          <div class="service-item">Access panels to duct work (accessible area only)</div>
          <div class="service-item">Rooftop fan (If safe access)</div>
          <div class="service-item">Fire wall behind equipment</div>
          <div class="service-item">ASTTBC Sticker</div>
          <div class="service-item">Fire Dept Report</div>
          <div class="service-item">Before/After pictures</div>
          `
    }
        </div>
      </div>

      <div class="form-group">
        <label for="terms">Terms & Conditions:</label>
        <textarea id="terms" rows="4" readonly>
${estimate.terms || "Payment is due upon completion of service. Prices subject to change if scope of work differs from initial assessment."}
        </textarea>
      </div>

      <div class="button-container">
        <button id="generateButton">Generate PDF Estimate</button>
    </div>

      <div id="loading" class="loading">Generating PDF...</div>
    </div>

    <script>
      // Pre-load the logo
      let logoImage = new Image();
      logoImage.src = '/images/logo.png';
      logoImage.onload = function() {
        console.log('Logo loaded successfully');
      };
      logoImage.onerror = function() {
        console.log('Logo failed to load, continuing without logo');
        logoImage = null;
      };

      // Auto-generate PDF when page loads
      document.addEventListener('DOMContentLoaded', function () {
        // Automatically trigger PDF generation
        setTimeout(function() {
          document.getElementById('generateButton').click();
        }, 500);
      });

      // Generate PDF when button is clicked
      document
        .getElementById('generateButton')
        .addEventListener('click', function () {
          document.getElementById('loading').style.display = 'block';

          // Get form values
          const estimateNumber = document.getElementById('estimateNumber').value || 'N/A';
          const estimateDate = document.getElementById('estimateDate').value || new Date().toLocaleDateString('en-CA');

          // Company information
          const companyName = document.getElementById('companyName').value || '';
          const companyStreet = document.getElementById('companyStreet').value || '';
          const companyCityState = document.getElementById('companyCityState').value || '';
          const companyPhone = document.getElementById('companyPhone').value || '';
          const companyEmail = document.getElementById('companyEmail').value || '';

          // Client information
          const clientBusinessName = document.getElementById('clientBusinessName').value || 'N/A';
          const clientContactPerson = document.getElementById('clientContactPerson').value || '';
          const clientStreet = document.getElementById('clientStreet').value || '';
          const clientCityState = document.getElementById('clientCityState').value || '';
          const clientPhone = document.getElementById('clientPhone').value || '';
          const clientEmail = document.getElementById('clientEmail').value || '';

          // Prepared for
          const preparedFor = document.getElementById('preparedFor').value || '';

          const subtotal = document.getElementById('subtotal').value;
          const gst = document.getElementById('gst').value;
          const totalEstimate = document.getElementById('totalEstimate').value;
          const terms = document.getElementById('terms').value || 'N/A';

          // Collect services
          const services = [];
          const serviceItems = document.querySelectorAll('.service-item');
          serviceItems.forEach(item => {
            services.push(item.textContent.trim());
          });

          // Get items
          const rows = document.querySelectorAll('.item-row');
          const items = [];

          rows.forEach((row) => {
            const descElement = row.querySelector('.description-col');
            const priceElement = row.querySelector('.price-col');
            const totalElement = row.querySelector('.total-col');

            if (descElement && priceElement && totalElement) {
              const description = descElement.value || '';
              const price = priceElement.value || '$0.00';
              const total = totalElement.value || '$0.00';

              items.push({
                description,
                price,
                total,
              });
            }
          });

          // Generate PDF
          setTimeout(function () {
            try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
              // Add watermark if logo is available
              if (logoImage && logoImage.complete) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas dimensions to match the image
                canvas.width = logoImage.width;
                canvas.height = logoImage.height;

                // Draw the image with transparency
                ctx.globalAlpha = 0.1; // 10% opacity
                ctx.drawImage(logoImage, 0, 0);

                // Get the transparent image data
                const transparentLogoData = canvas.toDataURL('image/png');

                // Calculate position to center the logo
                const logoWidth = 120;
                const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2;

                // Add as background watermark
                doc.addImage(
                  transparentLogoData,
                  'PNG',
                  logoX,
                  70,
                  logoWidth,
                  logoWidth * (logoImage.height / logoImage.width)
                );
              }

              // Add header with green background
              doc.setFillColor(0, 62, 41); // #003e29
              doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');

              // Add company header
            doc.setFontSize(20);
              doc.setTextColor(255, 255, 255); // White text
              doc.text('VANCOUVER HOOD DOCTORS', 105, 15, { align: 'center' });
            doc.setFontSize(12);
              doc.text('ESTIMATE', 105, 25, { align: 'center' });
            
              // Company and client info in a more compact layout
              doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
              // Modified layout for company and client info - cleaner side-by-side format
              let yPos = 45;

              // Info headers with background
              doc.setFillColor(240, 240, 240);
              doc.rect(15, yPos - 5, 85, 7, 'F');
              doc.rect(110, yPos - 5, 85, 7, 'F');

              doc.setFont('helvetica', 'bold');
              doc.text('COMPANY INFORMATION', 57.5, yPos, { align: 'center' });
              doc.text('CLIENT INFORMATION', 152.5, yPos, { align: 'center' });
              doc.setFont('helvetica', 'normal');

            yPos += 10;

              // Two-column table-like structure for company and client info
              doc.text(companyName, 15, yPos);
              doc.text(clientBusinessName, 110, yPos);
              yPos += 5;

              if (clientContactPerson) {
                doc.text(companyStreet, 15, yPos);
                doc.text(\`Attn: \${clientContactPerson}\`, 110, yPos);
                yPos += 5;
                doc.text(companyCityState, 15, yPos);
                doc.text(clientStreet, 110, yPos);
                yPos += 5;
                doc.text(\`Tel: \${companyPhone}\`, 15, yPos);
                doc.text(clientCityState, 110, yPos);
                yPos += 5;
                doc.text(companyEmail, 15, yPos);
                if (clientPhone) {
                  doc.text(\`Tel: \${clientPhone}\`, 110, yPos);
                  yPos += 5;
                  if (clientEmail) {
                    doc.text(clientEmail, 110, yPos);
                  }
                } else {
                  if (clientEmail) {
                    doc.text(clientEmail, 110, yPos);
                  }
                }
              } else {
                doc.text(companyStreet, 15, yPos);
                doc.text(clientStreet, 110, yPos);
                yPos += 5;
                doc.text(companyCityState, 15, yPos);
                doc.text(clientCityState, 110, yPos);
                yPos += 5;
                doc.text(\`Tel: \${companyPhone}\`, 15, yPos);
                if (clientPhone) {
                  doc.text(\`Tel: \${clientPhone}\`, 110, yPos);
                }
                yPos += 5;
                doc.text(companyEmail, 15, yPos);
                if (clientEmail) {
                  doc.text(clientEmail, 110, yPos);
                }
                yPos += 5;
              }

              // Add estimate details - move below the company and client info
            yPos += 15;
              doc.setDrawColor(0, 62, 41);
              doc.line(15, yPos - 5, 195, yPos - 5);

              doc.setFont('helvetica', 'bold');
              doc.text('Estimate No:', 15, yPos);
              doc.setFont('helvetica', 'normal');
              doc.text(estimateNumber, 45, yPos);

              doc.setFont('helvetica', 'bold');
              doc.text('Date:', 110, yPos);
              doc.setFont('helvetica', 'normal');
              doc.text(estimateDate, 130, yPos);

              // Add prepared for section
              if (preparedFor) {
            yPos += 10;
                doc.setFont('helvetica', 'bold');
                doc.text('Project Location:', 15, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(preparedFor, 60, yPos);
              }

              // Add intro text
              yPos += 10;
              doc.setFontSize(11);
              doc.text(
                'Thank you for your request. We are pleased to provide you with the following quote for your consideration.',
                15,
                yPos
              );

              // Add table header
              yPos += 15;
              doc.setFillColor(0, 62, 41); // #003e29
              doc.setDrawColor(0, 62, 41);
              doc.setTextColor(255, 255, 255);
              doc.rect(15, yPos, 180, 10, 'F');
              doc.text('#', 20, yPos + 7);
              doc.text('Item Description', 40, yPos + 7);
              doc.text('Price', 140, yPos + 7);
              doc.text('Total', 170, yPos + 7);

              // Add items
              doc.setTextColor(0, 0, 0);
              yPos += 10;

              // Add table grid
              doc.setDrawColor(200, 200, 200);

              items.forEach((item, index) => {
                const startY = yPos;

                // Draw item number
                doc.text((index + 1).toString(), 20, yPos + 5);

                // Word wrap for description
                const descriptionLines = doc.splitTextToSize(item.description, 90);
                doc.text(descriptionLines, 40, yPos + 5);

                // Draw price and total
                doc.text(item.price, 140, yPos + 5);
                doc.text(item.total, 170, yPos + 5);

                // Calculate row height based on description lines
                const rowHeight = Math.max(10, descriptionLines.length * 5);

                // Draw horizontal line for the bottom of the row
                yPos += rowHeight;
                doc.line(15, yPos, 195, yPos);

                // Draw vertical lines
                doc.line(15, startY, 15, yPos); // Left border
                doc.line(30, startY, 30, yPos); // After item number
                doc.line(130, startY, 130, yPos); // Before price
                doc.line(160, startY, 160, yPos); // Before total
                doc.line(195, startY, 195, yPos); // Right border
              });

              // Add totals
              let totalRowHeight = 8;

              // Subtotal row
              doc.setFillColor(240, 240, 240);
              doc.rect(15, yPos, 180, totalRowHeight, 'F');
              doc.text('Subtotal:', 130, yPos + 6);
              doc.text(subtotal, 170, yPos + 6);
              yPos += totalRowHeight;

              // GST row
              doc.setFillColor(240, 240, 240);
              doc.rect(15, yPos, 180, totalRowHeight, 'F');
              // Split into two cells for GST
              doc.text(\`GST# 814301065\`, 20, yPos + 6);
              doc.text('GST (5%):', 130, yPos + 6);
              doc.text(gst, 170, yPos + 6);
              yPos += totalRowHeight;

              // Total row
              doc.setFillColor(224, 240, 232);
              doc.rect(15, yPos, 180, totalRowHeight + 2, 'F');
              doc.setFont('helvetica', 'bold');
              doc.text('Total Estimate:', 130, yPos + 7);
              doc.text(totalEstimate, 170, yPos + 7);
              doc.setFont('helvetica', 'normal');
              yPos += totalRowHeight + 2;

              // Add services section
              yPos += 15;
              doc.setFont('helvetica', 'bold');
              doc.text('Our vent cleaning service includes:', 15, yPos);
              doc.setFont('helvetica', 'normal');
              yPos += 8;

              // Create two-column layout for services
              const leftColumnServices = services.slice(0, Math.ceil(services.length / 2));
              const rightColumnServices = services.slice(Math.ceil(services.length / 2));

              let serviceY = yPos;
              leftColumnServices.forEach((service, index) => {
                doc.text(\`• \${service}\`, 15, serviceY);
                serviceY += 8;
              });

              serviceY = yPos;
              rightColumnServices.forEach((service, index) => {
                doc.text(\`• \${service}\`, 107, serviceY);
                serviceY += 8;
              });

              yPos = Math.max(
                yPos + leftColumnServices.length * 8,
                yPos + rightColumnServices.length * 8
              );

              // Add thank you note
              yPos += 15;
              doc.setFont('helvetica', 'bold');
              doc.text('THANK YOU FOR YOUR INQUIRY', 105, yPos, {
                align: 'center',
              });
              doc.setFont('helvetica', 'normal');

              // Add terms
              yPos += 15;
              doc.setTextColor(0, 62, 41);
              doc.setFont('helvetica', 'bold');
              doc.text('TERMS & CONDITIONS', 15, yPos);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);

              // Split terms into lines
              const termsLines = doc.splitTextToSize(terms, 180);
              yPos += 7;
              doc.text(termsLines, 15, yPos);

              // Create a dynamic filename based on client business name
              let fileName = 'Vancouver Hood Doctors - Estimate.pdf';
              if (clientBusinessName && clientBusinessName !== 'N/A') {
                // Remove invalid filename characters and trim whitespace
                const cleanBusinessName = clientBusinessName
                  .replace(/[\\\\/:*?"<>|]/g, '')
                  .trim();
                if (cleanBusinessName) {
                  fileName = \`\${cleanBusinessName} - Estimate.pdf\`;
                }
              }

              // Save the PDF with dynamic filename
              doc.save(fileName);
              document.getElementById('loading').style.display = 'none';
              
              // Close the window after a brief delay
              setTimeout(function() {
                window.close();
              }, 1000);
              
            } catch (error) {
              console.error('Error generating PDF:', error);
              document.getElementById('loading').style.display = 'none';
              alert('Error generating PDF: ' + error.message);
            }
          }, 100);
        });
    </script>
</body>
</html>`;

    return new Response(htmlTemplate, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error generating estimate PDF:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
