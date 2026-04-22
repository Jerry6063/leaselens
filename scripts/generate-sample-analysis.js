// §15.2 fast-path fallback for the "Try with a sample lease" button.
//
// NOTE: the authoritative /public/sample-analysis.json in the repo was
// captured from a real Claude run (see probe-full-prompt.js) so the demo
// reflects actual model output. This script exists as a deterministic
// fallback that re-runs pdf-parse and emits hand-curated findings,
// useful when rebuilding offline or pinning a known-good shape.
//
// Run:  npm run generate:samples

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse/lib/pdf-parse.js");

const pdfPath = path.join(__dirname, "..", "public", "sample-lease.pdf");
const outPath = path.join(__dirname, "..", "public", "sample-analysis.json");

const red = [
  {
    id: "R1",
    title: "Unlimited rent increases on 7 days' notice",
    quote:
      "Landlord may increase the Base Rent at any time during the Term, and from time to time, with seven (7) days' written notice to Tenant, in any amount Landlord in its sole and absolute discretion determines is appropriate",
    plain_english:
      "The landlord can raise your rent by any amount at any time with only seven days' notice.",
    why_it_matters:
      "Most states cap how often and how much rent can rise. This clause could expose you to surprise increases of hundreds or thousands of dollars with almost no warning.",
    negotiation_script:
      "Hi [Landlord], I'd like to revise Section 4 so that rent stays fixed during the 12-month term, or adjusts only at renewal with 30 days' notice. Standard leases don't allow unlimited mid-term increases. Would you consider that?",
  },
  {
    id: "R2",
    title: "Non-refundable security deposit",
    quote:
      "Security Deposit shall be retained by Landlord in full regardless of the condition of the Premises upon move-out, and no portion of the Security Deposit shall be refundable to Tenant for any reason",
    plain_english:
      "The landlord keeps your entire $4,800 deposit even if you leave the apartment in perfect condition.",
    why_it_matters:
      "In most states, deposits must be returned minus documented damages. This clause likely violates state law and could cost you the full $4,800.",
    negotiation_script:
      "Hi [Landlord], I'd like to align Section 5 with standard practice — full deposit refunded within 30 days of move-out, less documented damages with receipts. Most jurisdictions require this. Would you be open to the change?",
  },
  {
    id: "R3",
    title: "Blanket waiver of right to sue",
    quote:
      "Tenant waives all rights to pursue legal action against Landlord in any court of law, including but not limited to claims for damages, injunctive relief, specific performance, or declaratory judgment",
    plain_english:
      "You're giving up the right to sue the landlord, even if they break the lease or cause you real harm.",
    why_it_matters:
      "This is almost certainly unenforceable in most states, but signing it can still discourage you from asserting legitimate claims and complicate later disputes.",
    negotiation_script:
      "Hi [Landlord], I'm not comfortable with Section 13 as drafted — a blanket waiver of legal rights is unusual and in most states unenforceable. Could we strike it, or narrow it to a mutual mediation-first clause?",
  },
];

const yellow = [
  {
    id: "Y1",
    title: "Strict 2-night guest cap every 30 days",
    quote:
      "Tenant shall not permit any guest, visitor, or other person not named on this Lease to remain on the Premises for more than two (2) consecutive nights in any thirty (30) day period",
    plain_english:
      "A partner, parent, or friend staying more than two nights a month technically violates the lease.",
    why_it_matters:
      "This is restrictive even for a studio. Since violations are flagged as material breach, a routine visit could be used as grounds to evict you.",
    negotiation_script:
      "Hi [Landlord], Section 10 is tighter than normal. Could we extend to 10–14 overnight guest stays per month? That still protects against subletting while accommodating normal visits.",
  },
  {
    id: "Y2",
    title: "Insurance carrier picked by landlord",
    quote:
      "Such policy shall be issued by a carrier designated in writing by Landlord and shall name Landlord as an additional interested party",
    plain_english:
      "You can only buy renter's insurance from a specific company the landlord tells you to use.",
    why_it_matters:
      "Designated carriers are often pricier than the market. Over a 12-month lease, this could cost an extra $100–300.",
    negotiation_script:
      "Hi [Landlord], I'd like to update Section 11 so I can use any A-rated carrier that meets the coverage limits, with you named as an additional interest. That's the normal market practice.",
  },
  {
    id: "Y3",
    title: "Mandatory arbitration with landlord-picked arbitrator",
    quote:
      "settled exclusively by final and binding arbitration administered by a private arbitrator selected by Landlord, in the county of Landlord's choosing",
    plain_english:
      "If there's a dispute, only the landlord's chosen arbitrator can decide it, and class actions are waived.",
    why_it_matters:
      "Having one side pick the arbitrator is widely seen as unfair and can invalidate the clause in some states. It also makes legitimate claims much harder to pursue.",
    negotiation_script:
      "Hi [Landlord], can we update Section 12 to a mutually selected arbitrator (AAA or JAMS panel) in our county? That keeps arbitration but ensures neutrality.",
  },
];

const green = [
  {
    id: "G1",
    title: "Explicit habitability obligation",
    quote:
      "Landlord shall maintain the Premises in a habitable condition consistent with all applicable state, local, and municipal housing codes",
    plain_english:
      "The landlord is formally on the hook for keeping the apartment habitable and up to code.",
    why_it_matters:
      "An explicit habitability clause makes it easier to demand repairs or escrow rent if the landlord lets conditions deteriorate.",
    negotiation_script:
      "Hi [Landlord], Section 7 looks good — no changes requested.",
  },
  {
    id: "G2",
    title: "24-hour written notice before entry",
    quote:
      "Except in cases of bona fide emergency, Landlord shall provide Tenant with at least twenty-four (24) hours' written notice before entering the Premises",
    plain_english:
      "The landlord can't just walk in — you get 24 hours' notice, with exceptions only for real emergencies.",
    why_it_matters:
      "This matches or beats most state minimums and gives you real privacy protection during the lease.",
    negotiation_script:
      "Hi [Landlord], Section 8 matches standard practice — no changes requested.",
  },
  {
    id: "G3",
    title: "30-day deposit return with itemized statement",
    quote:
      "shall be returned to Tenant within thirty (30) days after the later of (a) the surrender of possession of the Premises and (b) Tenant's delivery of a forwarding address in writing, together with an itemized statement",
    plain_english:
      "Whatever deposit is considered refundable comes back within 30 days with a line-item explanation of deductions.",
    why_it_matters:
      "Matches most state statutes. The itemized requirement is a meaningful protection — without it, landlords can hide vague charges.",
    negotiation_script:
      "Hi [Landlord], Section 9 is good as drafted. Can we confirm in writing that it controls over Section 5 for any disputed deductions?",
  },
];

async function main() {
  const buf = fs.readFileSync(pdfPath);
  const parsed = await pdf(buf);
  const pdfText = (parsed.text ?? "").trim();

  const analysis = {
    meta: {
      overall_risk: "high",
      summary:
        "This lease contains three clauses tilted significantly against the tenant — unlimited mid-term rent increases, a non-refundable deposit, and a blanket waiver of the right to sue.",
      doc_length_chars: pdfText.length,
    },
    red,
    yellow,
    green,
    pdf_text: pdfText,
    filename: "sample-lease.pdf",
  };

  fs.writeFileSync(outPath, JSON.stringify(analysis, null, 2) + "\n");
  const bytes = fs.statSync(outPath).size;
  console.log(`wrote ${outPath} (${(bytes / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
