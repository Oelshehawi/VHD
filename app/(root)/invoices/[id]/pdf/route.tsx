import { fetchClientById, fetchInvoiceById } from "../../../../lib/data";
import {
  ClientType,
  InvoiceData,
  InvoiceType,
} from "../../../../lib/typeDefinitions";
import {
  calculateGST,
  calculateSubtotal,
  formatDateToString,
} from "../../../../lib/utils";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
  Link,
  Svg,
  Path,
  Image,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

const logoPath = path.resolve(process.cwd(), "public", "images", "logo.png");
const logoBuffer = fs.readFileSync(logoPath);

Font.register({
  family: "Lato",
  fonts: [
    { src: path.resolve(process.cwd(), "public", "fonts", "Lato-Regular.ttf") },
    {
      src: path.resolve(process.cwd(), "public", "fonts", "Lato-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Lato",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
    color: "#000",
  },

  // New styles for the logo and overlay text
  logoContainer: {
    position: "absolute",
    left: 540,
    top: 10,
    bottom: 0,
    right: 0,
    width: "10%",
    padding: 0,
    height: 100,
    zIndex: 1,
    opacity: 0.7,
  },

  // Header styles
  header: {
    position: "relative",
    marginBottom: 20,
  },
  headerWave: {
    position: "absolute",
    top: -270,
    left: -700,
    width: 1000,
    height: 500,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceTitle: {
    fontSize: 36,
    color: "#003e29",
    fontWeight: "bold",
  },
  companyTitle: {
    fontSize: 18,
    color: "#003e29",
    fontWeight: "bold",
    zIndex: 2,
  },
  // Footer styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#003e29",
    color: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  footerText: {
    fontSize: 10,
  },
  section: {
    marginTop: 20,
  },
  infoGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoList: {
    flexGrow: 1,
  },
  table: {
    display: "flex",
    width: "auto",
    marginTop: 20,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#003e29",
    color: "#fff",
  },
  tableCell: {
    padding: 5,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  thankYou: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  terms: {
    marginTop: 20,
  },
  signature: {
    marginTop: 60,
    alignItems: "flex-end",
  },
  signatureLine: {
    width: "50%",
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  signatureText: {
    marginTop: 5,
  },
  noBreak: {
    flexGrow: 1,
    wrap: false,
  },
});

interface InvoicePdfProps {
  invoiceData: InvoiceData;
}

const InvoicePdf: React.FC<InvoicePdfProps> = ({ invoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {/* SVG Wave */}
        <Svg style={styles.headerWave}>
          <Path
            fill="#003e29"
            d="M0,320L17.1,288C34.3,256,69,192,103,186.7C137.1,181,171,235,206,224C240,213,274,139,309,112C342.9,85,377,107,411,144C445.7,181,480,235,514,261.3C548.6,288,583,288,617,282.7C651.4,277,686,267,720,256C754.3,245,789,235,823,229.3C857.1,224,891,224,926,224C960,224,994,224,1029,234.7C1062.9,245,1097,267,1131,256C1165.7,245,1200,203,1234,181.3C1268.6,160,1303,160,1337,154.7C1371.4,149,1406,139,1423,133.3L1440,128L1440,0L1422.9,0C1405.7,0,1371,0,1337,0C1302.9,0,1269,0,1234,0C1200,0,1166,0,1131,0C1097.1,0,1063,0,1029,0C994.3,0,960,0,926,0C891.4,0,857,0,823,0C788.6,0,754,0,720,0C685.7,0,651,0,617,0C582.9,0,549,0,514,0C480,0,446,0,411,0C377.1,0,343,0,309,0C274.3,0,240,0,206,0C171.4,0,137,0,103,0C68.6,0,34,0,17,0L0,0Z"
          />
        </Svg>
        {/* Header Content */}
        <View style={styles.headerContent}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.companyTitle}>Vancouver Hood Doctors</Text>
        </View>
      </View>

      {/* Logo and Overlay Text */}
      <View style={styles.logoContainer}>
        <Image src={{ data: logoBuffer, format: "png" }} />
      </View>

      {/* Invoice Info */}
      <View style={styles.section}>
        <View style={styles.infoGroup}>
          <View style={styles.infoList}>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Invoice No</Text>: #
              {invoiceData.invoiceId}
            </Text>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Date</Text>:{" "}
              {invoiceData.dateIssued}
            </Text>
          </View>
          <View style={styles.infoList}>
            <Text
              style={{ color: "#003e29", fontWeight: "bold", marginBottom: 5 }}
            >
              Payment Info
            </Text>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Mail To</Text>:{" "}
              {invoiceData.cheque}
            </Text>
            <Text>
              <Text style={{ fontWeight: "bold" }}>E-transfer</Text>:{" "}
              {invoiceData.eTransfer}
            </Text>
          </View>
        </View>
      </View>

      {/* Billing Info */}
      <View style={styles.section}>
        <Text style={{ fontWeight: "bold", margin: 0 }}>Bill To:</Text>
        <Text
          style={{
            color: "#003e29",
            fontWeight: "bold",
            paddingVertical: 3,
          }}
        >
          {invoiceData.jobTitle.trim()}
        </Text>
        <Text style={{ margin: 0, paddingVertical: 3 }}>
          {invoiceData.location}
        </Text>
        <Text style={{ margin: 0, paddingVertical: 3 }}>
          {invoiceData.phoneNumber}
        </Text>
      </View>

      {/* Items Table */}
      <View style={styles.section}>
        <Text style={{ color: "red", textAlign: "center", marginBottom: 10 }}>
          Accessible Areas Serviced Only
        </Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: "10%" }]}>#</Text>
            <Text style={[styles.tableCell, { width: "50%" }]}>
              Item Description
            </Text>
            <Text
              style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
            >
              Price
            </Text>
            <Text
              style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
            >
              Total
            </Text>
          </View>
          {/* Table Rows */}
          {invoiceData.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text
                style={[
                  styles.tableCell,
                  { width: "10%", textAlign: "center" },
                ]}
              >
                {index + 1}
              </Text>
              <Text style={[styles.tableCell, { width: "50%" }]}>
                {item.description}
              </Text>
              <Text
                style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
              >
                ${item.price.toFixed(2)}
              </Text>
              <Text
                style={[styles.tableCell, { width: "20%", textAlign: "right" }]}
              >
                ${item.total.toFixed(2)}
              </Text>
            </View>
          ))}
          {/* Subtotal, GST, Total */}
          <View style={styles.tableRow}>
            <Text
              style={[
                styles.tableCell,
                { width: "80%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              Subtotal:
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "20%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              ${invoiceData.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text
              style={[
                styles.tableCell,
                { width: "60%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              GST# 814301065
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "20%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              GST (5%):
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "20%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              ${invoiceData.gst.toFixed(2)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text
              style={[
                styles.tableCell,
                { width: "80%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              Total:
            </Text>
            <Text
              style={[
                styles.tableCell,
                { width: "20%", textAlign: "right", fontWeight: "bold" },
              ]}
            >
              ${invoiceData.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Thank You Note */}
      <Text style={styles.thankYou}>THANK YOU FOR YOUR BUSINESS</Text>

      <View style={styles.terms}>
        <Text style={{ color: "#003e29", fontWeight: "bold", marginBottom: 5 }}>
          TERMS & CONDITIONS
        </Text>
        <Text>{invoiceData.terms}</Text>
        <Text>
          Invoices due within one month of cleaning date; 5% interest on overdue
          amounts.
        </Text>
      </View>

      {/* Signature */}
      <View style={styles.signature}>
        <View style={styles.signatureLine}></View>
        <Text style={styles.signatureText}>Authorized Signature</Text>
      </View>
      {/* Terms and Conditions */}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { marginLeft: 25 }]}>
          604-273-8717
        </Text>
        <Text style={[styles.footerText, { marginRight: 25 }]}>
          <Link
            src="http://vancouverventcleaning.ca"
            style={{ color: "#FFFFFF", textDecoration: "none" }}
          >
            vancouverventcleaning.ca
          </Link>
        </Text>
      </View>
    </Page>
  </Document>
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Add rate limiting header
    const response = new Response();
    response.headers.set("X-RateLimit-Limit", "100");

    // Fetch data and prepare invoiceData
    const invoice = (await fetchInvoiceById(params.id)) as InvoiceType;
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = (await fetchClientById(
      invoice.clientId as string,
    )) as ClientType;
    if (!client) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const invoiceData = {
      invoiceId: invoice.invoiceId,
      dateIssued: formatDateToString(invoice.dateIssued as string),
      jobTitle: invoice.jobTitle,
      location: invoice.location,
      clientName: client.clientName,
      email: client.email,
      phoneNumber: client.phoneNumber,
      items: invoice.items.map((item: { description: any; price: any }) => ({
        description: item.description,
        price: item.price,
        total: item.price,
      })),
      subtotal: calculateSubtotal(invoice.items),
      gst: calculateGST(calculateSubtotal(invoice.items)),
      totalAmount:
        calculateSubtotal(invoice.items) +
        calculateGST(calculateSubtotal(invoice.items)),
      cheque: "51-11020 Williams Rd Richmond, BC V7A 1X8",
      eTransfer: "adam@vancouverventcleaning.ca",
      terms:
        "Please report any and all cleaning inquiries within 5 business days.",
      thankYou: "Thank you for choosing Vancouver Hood Doctors!",
    };

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      <InvoicePdf invoiceData={invoiceData} />,
    );

    // Return response with enhanced security headers
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${invoiceData.invoiceId}.pdf`,
        "Cache-Control": "no-store, max-age=0",
        "Content-Security-Policy": "default-src 'self'",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to generate PDF",
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
