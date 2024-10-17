import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  fetchTechnicianById,
  fetchPayrollPeriodById,
  fetchScheduledJobsByPayrollPeriod,
} from "../../../lib//scheduleAndShifts";
import React from "react";

interface PaystubProps {
  employer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  employee: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  payPeriod: {
    startDate: string;
    endDate: string;
    payDate: string;
  };
  hoursWorked: number;
  hourlyRate: number;
  grossPay: number;
  cpp: number;
  ei: number;
  incomeTax: number;
  netPay: number;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 30,
    color: "#222a27", // darkGray
  },
  header: {
    marginBottom: 20,
  },
  employerInfo: {
    marginBottom: 10,
  },
  employeeInfo: {
    marginBottom: 10,
  },
  payPeriodInfo: {
    marginBottom: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#467061", // borderGreen
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#467061", // borderGreen
    backgroundColor: "#003e29", // darkGreen
    padding: 5,
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#467061", // borderGreen
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff", // white text on darkGreen
  },
  tableCell: {
    fontSize: 12,
    color: "#222a27", // darkGray
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  summaryLabel: {
    width: "50%",
    textAlign: "right",
    paddingRight: 10,
    fontWeight: "bold",
    color: "#222a27", // darkGray
  },
  summaryValue: {
    width: "50%",
    textAlign: "right",
    color: "#222a27", // darkGray
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 10,
    color: "#555555", // darkGrayish
  },
});

export const PaystubDocument = ({
  employer,
  employee,
  payPeriod,
  hoursWorked,
  hourlyRate,
  grossPay,
  cpp,
  ei,
  incomeTax,
  netPay,
}: PaystubProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#003e29" }}>
          {employer.name}
        </Text>
        <Text>{employer.address}</Text>
        <Text>
          Phone: {employer.phone} | Email: {employer.email}
        </Text>
      </View>

      {/* Employee Information */}
      <View style={styles.employeeInfo}>
        <Text style={{ fontWeight: "bold", fontSize: 14, color: "#003e29" }}>
          Employee Information
        </Text>
        <Text>Name: {employee.name}</Text>
        <Text>Address: {employee.address}</Text>
        <Text>Phone: {employee.phone}</Text>
        <Text>Email: {employee.email}</Text>
      </View>

      {/* Pay Period Information */}
      <View style={styles.payPeriodInfo}>
        <Text style={{ fontWeight: "bold", fontSize: 14, color: "#003e29" }}>
          Pay Period
        </Text>
        <Text>
          Start Date: {new Date(payPeriod.startDate).toLocaleDateString()}
        </Text>
        <Text>
          End Date: {new Date(payPeriod.endDate).toLocaleDateString()}
        </Text>
        <Text>
          Pay Date: {new Date(payPeriod.payDate).toLocaleDateString()}
        </Text>
      </View>

      {/* Earnings Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableColHeader, styles.tableCellHeader]}>
            Description
          </Text>
          <Text
            style={[
              styles.tableColHeader,
              styles.tableCellHeader,
              { textAlign: "right" },
            ]}
          >
            Amount ($)
          </Text>
        </View>
        {/* Table Rows */}
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>Hours Worked</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            {hoursWorked.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>Hourly Rate</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            ${hourlyRate.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>Gross Pay</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            ${grossPay.toFixed(2)}
          </Text>
        </View>
        {/* Deductions */}
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>CPP Contribution</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            ${cpp.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>EI Premium</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            ${ei.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCol}>Income Tax</Text>
          <Text style={[styles.tableCol, { textAlign: "right" }]}>
            ${incomeTax.toFixed(2)}
          </Text>
        </View>
        {/* Net Pay */}
        <View style={styles.tableRow}>
          <Text
            style={[styles.tableCol, { fontWeight: "bold", color: "#003e29" }]}
          >
            Net Pay
          </Text>
          <Text
            style={[
              styles.tableCol,
              { textAlign: "right", fontWeight: "bold", color: "#003e29" },
            ]}
          >
            ${netPay.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This paystub is a record of your earnings and deductions for the
        specified pay period. Please keep it for your records.
      </Text>
    </Page>
  </Document>
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const technicianId = searchParams.get("technicianId");
    const payrollPeriodId = searchParams.get("payrollPeriodId");


    if (!technicianId || !payrollPeriodId) {
      return NextResponse.json(
        { error: "Missing technicianId or payrollPeriodId" },
        { status: 400 },
      );
    }

    const technician = await fetchTechnicianById(technicianId as string);
    const payrollPeriod = await fetchPayrollPeriodById(
      payrollPeriodId as string,
    );
    const schedulesByPayrollPeriod = await fetchScheduledJobsByPayrollPeriod(
      payrollPeriodId as string,
    );

    if (!technician || !payrollPeriod) {
      return NextResponse.json(
        { error: "Technician or Payroll Period not found" },
        { status: 404 },
      );
    }

    // Calculate payroll details
    const hoursWorked = schedulesByPayrollPeriod
      .filter((schedule) => schedule.assignedTechnicians.includes(technicianId))
      .reduce((acc, schedule) => acc + (schedule.hours || 0), 0);

    const hourlyRate = technician.hourlyRate || 0;
    const grossPay = hoursWorked * hourlyRate;

    // Calculate CPP
    const cppRate = 0.0595; // 5.95%
    const cppBasicExemption = 3500;
    const cppMaxEarnings = 66600;
    let cpp = 0;
    if (grossPay > cppBasicExemption) {
      cpp = Math.min(
        (grossPay - cppBasicExemption) * cppRate,
        (cppMaxEarnings - cppBasicExemption) * cppRate,
      );
      cpp = Math.round(cpp * 100) / 100; // Round to 2 decimal places
    }

    // Calculate EI
    const eiRate = 0.0163; // 1.63%
    const eiMaxEarnings = 61500;
    let ei = Math.min(grossPay * eiRate, eiMaxEarnings * eiRate);
    ei = Math.round(ei * 100) / 100; // Round to 2 decimal places

    // Calculate Income Tax (Simplified)
    const federalTax = calculateFederalTax(grossPay - cpp);
    const provincialTax = calculateProvincialTax(grossPay - cpp);
    const incomeTax = federalTax + provincialTax;

    // Calculate Net Pay
    const netPay = grossPay - cpp - ei - incomeTax;

    // Define employer and employee information
    const employer = {
      name: "Vancouver Hood Doctors",
      address: "1234 Hood Street, Vancouver, BC V5K 0A1",
      phone: "604-273-8717",
      email: "info@vancouverhooddoctors.ca",
    };

    const employee = {
      name: technician.name,
      address: technician.address || "N/A",
      phone: technician.phone || "N/A",
      email: technician.email || "N/A",
    };

    const payPeriod = {
      startDate: payrollPeriod.startDate as string,
      endDate: payrollPeriod.endDate as string,
      payDate: payrollPeriod.payDay as string,
    };

    // Create the PDF document
    const pdfBuffer = await renderToBuffer(
      <PaystubDocument
        employer={employer}
        employee={employee}
        payPeriod={payPeriod}
        hoursWorked={hoursWorked}
        hourlyRate={hourlyRate}
        grossPay={grossPay}
        cpp={cpp}
        ei={ei}
        incomeTax={incomeTax}
        netPay={netPay}
      />,
    );

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Paystub-${technician.name.replace(/\s+/g, "_")}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("Error generating paystub:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

// Simplified Federal Tax Calculation (2023 Rates)
function calculateFederalTax(income: number): number {
  let tax = 0;
  if (income <= 50197) {
    tax = income * 0.15;
  } else if (income <= 100392) {
    tax = 50197 * 0.15 + (income - 50197) * 0.205;
  } else if (income <= 155625) {
    tax = 50197 * 0.15 + (100392 - 50197) * 0.205 + (income - 100392) * 0.26;
  } else if (income <= 221708) {
    tax =
      50197 * 0.15 +
      (100392 - 50197) * 0.205 +
      (155625 - 100392) * 0.26 +
      (income - 155625) * 0.29;
  } else {
    tax =
      50197 * 0.15 +
      (100392 - 50197) * 0.205 +
      (155625 - 100392) * 0.26 +
      (221708 - 155625) * 0.29 +
      (income - 221708) * 0.33;
  }
  return Math.round(tax * 100) / 100;
}

// Simplified Provincial Tax Calculation for BC (2023 Rates)
function calculateProvincialTax(income: number): number {
  let tax = 0;
  if (income <= 42184) {
    tax = income * 0.0506;
  } else if (income <= 84369) {
    tax = 42184 * 0.0506 + (income - 42184) * 0.077;
  } else if (income <= 96866) {
    tax = 42184 * 0.0506 + (84369 - 42184) * 0.077 + (income - 84369) * 0.105;
  } else if (income <= 117623) {
    tax =
      42184 * 0.0506 +
      (84369 - 42184) * 0.077 +
      (96866 - 84369) * 0.105 +
      (income - 96866) * 0.1229;
  } else if (income <= 159483) {
    tax =
      42184 * 0.0506 +
      (84369 - 42184) * 0.077 +
      (96866 - 84369) * 0.105 +
      (117623 - 96866) * 0.1229 +
      (income - 117623) * 0.147;
  } else {
    tax =
      42184 * 0.0506 +
      (84369 - 42184) * 0.077 +
      (96866 - 84369) * 0.105 +
      (117623 - 96866) * 0.1229 +
      (159483 - 117623) * 0.147 +
      (income - 159483) * 0.168;
  }
  return Math.round(tax * 100) / 100;
}
