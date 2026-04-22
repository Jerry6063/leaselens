// Generates /public/sample-lease.pdf per PRD §15.1.
//
// Intentional composition:
//   RED   — §4 unlimited rent increases, §5 non-refundable deposit,
//           §13 waiver of right to sue
//   YELLOW — §10 strict guest policy, §11 landlord-designated insurance,
//            §12 mandatory arbitration with class waiver, §15 early-termination penalty
//   GREEN  — §7 habitability, §8 24-hour written notice before entry,
//            §9 30-day deposit return with itemized statement
//
// Run:  node scripts/generate-sample-lease.js

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outPath = path.join(__dirname, "..", "public", "sample-lease.pdf");

const sections = [
  {
    heading: "RESIDENTIAL LEASE AGREEMENT",
    centered: true,
    body: [
      "This Residential Lease Agreement (this \"Lease\") is entered into as of the date last signed below by and between Riverbend Properties LLC, a Delaware limited liability company (the \"Landlord\"), and the undersigned tenant or tenants (individually and collectively, the \"Tenant\"). Landlord and Tenant are sometimes referred to herein individually as a \"Party\" and collectively as the \"Parties.\"",
    ],
  },
  {
    heading: "RECITALS",
    body: [
      "WHEREAS, Landlord is the owner of that certain residential unit described below (the \"Premises\"); and",
      "WHEREAS, Tenant desires to lease the Premises from Landlord on the terms and subject to the conditions set forth herein;",
      "NOW, THEREFORE, in consideration of the mutual covenants contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows.",
    ],
  },
  {
    heading: "1. PREMISES",
    body: [
      "Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the residential unit located at the address provided on the signature page (the \"Premises\"), together with any furnishings, fixtures, and appliances specifically identified in the move-in inventory. The Premises shall be used solely as a private residence by Tenant and Tenant's immediate family and for no other purpose.",
      "Tenant acknowledges that Tenant has inspected the Premises and accepts the Premises in its present \"as-is\" condition, subject only to Landlord's express obligations in Section 7.",
    ],
  },
  {
    heading: "2. TERM",
    body: [
      "The term of this Lease shall be twelve (12) consecutive calendar months, commencing on the start date set forth on the signature page (the \"Commencement Date\") and ending at 11:59 p.m. local time on the day immediately preceding the first anniversary of the Commencement Date (the \"Term\"), unless sooner terminated in accordance with the provisions of this Lease.",
      "If Tenant holds over after expiration of the Term without Landlord's written consent, Tenant shall be deemed a tenant at sufferance and shall pay, as liquidated damages, rent at one hundred fifty percent (150%) of the then-current monthly rent for each month of holdover.",
    ],
  },
  {
    heading: "3. RENT",
    body: [
      "Tenant shall pay to Landlord, without deduction, offset, notice, or demand, the sum of Two Thousand Four Hundred Dollars ($2,400.00) per month (\"Base Rent\") as rent for the Premises. Base Rent shall be payable in advance on or before the first (1st) day of each calendar month during the Term.",
      "If any installment of Base Rent is not received by Landlord within five (5) days after its due date, Tenant shall pay a late charge equal to five percent (5%) of the delinquent amount, which the Parties agree represents a fair and reasonable estimate of the costs Landlord will incur by reason of such late payment.",
    ],
  },
  {
    heading: "4. RENT ADJUSTMENTS",
    body: [
      "Notwithstanding anything to the contrary in Section 3, Landlord may increase the Base Rent at any time during the Term, and from time to time, with seven (7) days' written notice to Tenant, in any amount Landlord in its sole and absolute discretion determines is appropriate, without limitation as to frequency or magnitude. Tenant agrees that any such adjustment shall be binding upon Tenant and shall not constitute grounds for termination of this Lease by Tenant.",
      "Tenant's failure to pay the adjusted Base Rent within five (5) days following the effective date of any such notice shall constitute a material default under this Lease.",
    ],
  },
  {
    heading: "5. SECURITY DEPOSIT",
    body: [
      "Upon execution of this Lease, Tenant shall deposit with Landlord the sum of Four Thousand Eight Hundred Dollars ($4,800.00), equal to two (2) months' Base Rent, as a security deposit (the \"Security Deposit\"). The Security Deposit shall be retained by Landlord in full regardless of the condition of the Premises upon move-out, and no portion of the Security Deposit shall be refundable to Tenant for any reason.",
      "The Security Deposit is not an advance payment of rent and shall not be applied by Tenant to any installment of Base Rent, including the final month of the Term.",
    ],
  },
  {
    heading: "6. UTILITIES AND SERVICES",
    body: [
      "Tenant shall be solely responsible for, and shall promptly pay when due, all charges for electricity, natural gas, internet, cable television, and any other services (other than those listed below) supplied to the Premises. Tenant shall place all such accounts in Tenant's name prior to the Commencement Date.",
      "Landlord shall be responsible for water, sewer, and municipal trash collection serving the Premises. In the event of any interruption in such services due to causes beyond Landlord's reasonable control, Landlord shall have no liability to Tenant, and Tenant shall not be entitled to any abatement of rent.",
    ],
  },
  {
    heading: "7. MAINTENANCE AND HABITABILITY",
    body: [
      "Landlord shall maintain the Premises in a habitable condition consistent with all applicable state, local, and municipal housing codes, including without limitation the maintenance of working plumbing, heating, hot water, electrical systems, and weatherproofing. Landlord shall use commercially reasonable efforts to address any habitability issue reported by Tenant within a reasonable time after written notice.",
      "Tenant shall keep the Premises in a clean and sanitary condition, shall promptly notify Landlord in writing of any condition requiring repair, and shall not undertake any alteration, addition, or improvement to the Premises without Landlord's prior written consent.",
    ],
  },
  {
    heading: "8. LANDLORD'S RIGHT OF ENTRY",
    body: [
      "Except in cases of bona fide emergency, Landlord shall provide Tenant with at least twenty-four (24) hours' written notice before entering the Premises, and such entry shall occur only during reasonable hours. Permitted purposes include inspection, repair, maintenance, and showing the Premises to prospective tenants or purchasers during the final sixty (60) days of the Term.",
      "In an emergency involving imminent risk of injury or property damage, Landlord may enter the Premises without prior notice, and shall provide Tenant with written notice of such entry as promptly as reasonably practicable thereafter.",
    ],
  },
  {
    heading: "9. RETURN OF DEPOSIT (IF ANY)",
    body: [
      "Any refundable portion of a deposit, to the extent such refundable portion is determined by Landlord to exist, shall be returned to Tenant within thirty (30) days after the later of (a) the surrender of possession of the Premises and (b) Tenant's delivery of a forwarding address in writing, together with an itemized statement identifying any deductions and their basis.",
      "Nothing in this Section 9 shall be construed to limit or modify the provisions of Section 5 regarding the non-refundable nature of the Security Deposit.",
    ],
  },
  {
    heading: "10. GUESTS",
    body: [
      "Tenant shall not permit any guest, visitor, or other person not named on this Lease to remain on the Premises for more than two (2) consecutive nights in any thirty (30) day period without the prior written consent of Landlord, which consent may be withheld in Landlord's sole discretion.",
      "Any violation of this Section 10 shall constitute a material breach of this Lease and, at Landlord's election, grounds for immediate termination.",
    ],
  },
  {
    heading: "11. RENTER'S INSURANCE",
    body: [
      "Tenant shall obtain and maintain, throughout the Term and at Tenant's sole cost and expense, a renter's insurance policy providing liability coverage of not less than Three Hundred Thousand Dollars ($300,000) per occurrence and personal property coverage of not less than Fifty Thousand Dollars ($50,000). Such policy shall be issued by a carrier designated in writing by Landlord and shall name Landlord as an additional interested party.",
      "Tenant shall deliver to Landlord a certificate of insurance evidencing such coverage prior to the Commencement Date and upon any renewal thereafter.",
    ],
  },
  {
    heading: "12. DISPUTE RESOLUTION",
    body: [
      "Any dispute, claim, or controversy arising out of or relating to this Lease, or the breach, termination, enforcement, interpretation, or validity thereof (each, a \"Dispute\"), shall be settled exclusively by final and binding arbitration administered by a private arbitrator selected by Landlord, in the county of Landlord's choosing, pursuant to such rules as Landlord shall designate in writing.",
      "Tenant hereby waives any and all rights to pursue any Dispute in any court of law or equity, and further waives any and all rights to participate in any class, collective, or representative action relating to any Dispute.",
    ],
  },
  {
    heading: "13. WAIVER OF LEGAL RIGHTS",
    body: [
      "Tenant waives all rights to pursue legal action against Landlord in any court of law, including but not limited to claims for damages, injunctive relief, specific performance, or declaratory judgment, arising out of or relating to Tenant's occupancy of the Premises or this Lease, whether sounding in contract, tort, statute, or otherwise.",
      "This waiver is a material inducement for Landlord to enter into this Lease and shall survive the termination or expiration hereof.",
    ],
  },
  {
    heading: "14. HOUSE RULES",
    body: [
      "Tenant shall abide by all house rules issued by Landlord, as the same may be amended from time to time in Landlord's sole discretion. Without limiting the generality of the foregoing, Tenant shall not (a) smoke any substance, including tobacco or cannabis, on the Premises or in any common area; (b) burn candles, incense, or open flames; or (c) keep any pet, companion animal, or service animal on the Premises without Landlord's prior written consent.",
    ],
  },
  {
    heading: "15. EARLY TERMINATION",
    body: [
      "Tenant may terminate this Lease prior to expiration of the Term upon (a) not less than sixty (60) days' prior written notice to Landlord and (b) payment to Landlord of a termination fee equal to one (1) month's Base Rent, together with the forfeiture of any installments of Base Rent accrued to the date of termination but not yet paid.",
      "Landlord's acceptance of any such termination fee shall not be deemed a waiver of Landlord's rights or remedies with respect to any prior breach by Tenant.",
    ],
  },
  {
    heading: "16. SURRENDER",
    body: [
      "Upon termination or expiration of this Lease, Tenant shall peaceably surrender possession of the Premises to Landlord, broom-clean and in the same condition as received, ordinary wear and tear excepted. Tenant shall remove all of Tenant's personal property from the Premises; any personal property remaining on the Premises after surrender shall be deemed abandoned and may be disposed of by Landlord without liability.",
    ],
  },
  {
    heading: "17. NOTICES",
    body: [
      "All notices, demands, and other communications required or permitted to be given under this Lease shall be in writing and shall be deemed duly given when (a) personally delivered, (b) sent by certified or registered mail, return receipt requested, or (c) sent by nationally recognized overnight courier, in each case addressed to the intended recipient at the address set forth on the signature page, or to such other address as either Party may from time to time designate by written notice to the other.",
    ],
  },
  {
    heading: "18. GOVERNING LAW",
    body: [
      "This Lease shall be governed by, and construed in accordance with, the internal laws of the State in which the Premises are located, without regard to any choice-of-law or conflict-of-laws principles that would result in the application of the laws of any other jurisdiction.",
    ],
  },
  {
    heading: "19. ENTIRE AGREEMENT; AMENDMENTS",
    body: [
      "This Lease (together with any exhibits or riders attached hereto) constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous negotiations, representations, understandings, and agreements, whether oral or written. This Lease may be amended only by a writing signed by both Parties.",
    ],
  },
  {
    heading: "20. SEVERABILITY",
    body: [
      "If any provision of this Lease is held to be invalid, illegal, or unenforceable under any applicable law, such provision shall be modified to the minimum extent necessary to render it enforceable, or, if no such modification is possible, shall be severed from this Lease, and the remaining provisions shall continue in full force and effect.",
    ],
  },
  {
    heading: "21. SIGNATURES",
    body: [
      "IN WITNESS WHEREOF, the Parties have executed this Lease as of the dates set forth below.",
      "LANDLORD:  Riverbend Properties LLC",
      "By: ______________________________   Name: ______________________________",
      "Title: ______________________________   Date: ______________________________",
      "TENANT:",
      "Signature: ______________________________   Printed name: ______________________________",
      "Date: ______________________________",
    ],
  },
];

function render() {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    bufferPages: true,
    info: {
      Title: "Residential Lease Agreement (LeaseLens sample)",
      Author: "LeaseLens",
    },
  });

  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  sections.forEach((s, i) => {
    if (s.centered) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(s.heading, { align: "center" });
    } else {
      doc.moveDown(i === 0 ? 0 : 0.8);
      doc.font("Helvetica-Bold").fontSize(11).text(s.heading);
    }
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(11);
    s.body.forEach((para) => {
      doc.text(para, {
        align: "justify",
        lineGap: 2,
        paragraphGap: 6,
      });
    });
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

render()
  .then(() => {
    const bytes = fs.statSync(outPath).size;
    console.log(`wrote ${outPath} (${(bytes / 1024).toFixed(1)} KB)`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
