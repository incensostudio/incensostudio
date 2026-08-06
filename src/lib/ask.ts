// Ask Incenso — the prototype's canned advisory answers, kept verbatim.
export function answerFor(q: string): string {
  const t = q.toLowerCase()
  let a =
    'I can answer that from the ticket history, the product ledger and the booking channels. Ask me about a client, a staff member, a product, a day of the week, or a price.'
  if (/wednesday|slow|quiet/.test(t))
    a =
      'Wednesday has run at 41% chair utilisation for five weeks — 19 points under your other weekdays. It is not demand, it is staffing: Rania and Maher are both off, so colour capacity drops to one chair and colour is 62% of your revenue. Two options. Move one colourist to Wednesday and hold prices, or keep the roster and run a 15% Wednesday colour offer, which my model says fills 6 of the 9 empty slots and nets $780 a month more than the discount costs. I would move the roster first — discounting a day teaches clients to wait for it.'
  if (/waste|wast|colour|color.*staff|staff.*colour/.test(t))
    a =
      'Lynn. On an identical gel set she draws 2.1ml of rubber base against a 1.4ml benchmark — 50% over, and she is the only one over. That is $41 of product a month at current volume. Rania is 6% under benchmark, which is why her margin is the best in the salon. This is a technique fix, not a discipline one: she is over-flooding the cuticle. Half an hour with Joud closes it.'
  if (/balayage.*price|raise.*price|price.*balayage/.test(t))
    a =
      "Yes, to $175. Your balayage has a $150 floor but the average ticket actually charged is $268, so the floor is not what people pay — it is only anchoring you low on the price list. In the last 90 days nobody paid less than $170. Raising the floor to $175 changes no existing client's bill and lifts the perceived position of the whole colour menu. Do not touch the ceiling."
  if (/rubber base|run out|how many.*manicure/.test(t))
    a =
      'You have 18.4ml of rubber base across two bottles. At the 1.4ml benchmark that is 13 sets, but at the rate Lynn and Joud are actually drawing it — 1.7ml blended — it is 10. You have 14 nail appointments on the books in the next nine days, so you run dry on Wednesday 5 August mid-shift. Supplier lead time is 4 days. Order today.'
  if (/60 days|not been|lapsed|win.?back/.test(t))
    a =
      'Eleven clients, but only four are worth a call. Rim Aoun — 6 visits then 41 days quiet, keratin client, $940 lifetime and she answers the phone. Carla Sfeir — 63 days, was every 5 weeks for two years, that is a real break in rhythm. Mira Dagher — 71 days, always booked with Maher, and Maher has Wednesday gaps. Rana Zein — 68 days, highest retail attach in the file. The other seven are single-visit Google bookings; a message to them costs you nothing and returns nothing.'
  if (/margin|profit|money|revenue/.test(t))
    a =
      'Month to date you are at $38,410 revenue and 61% gross margin. Colour carries it — 62% of revenue at 68% margin. Nails are 21% of revenue at 74% margin, your best product per hour. Retail is only 9% but it is 41% margin and it is the line with the most headroom: your retail attach rate is 18% and every comparable salon of your size runs 26%.'
  return a
}

export const askSuggestions = [
  'Why was last Wednesday so slow?',
  'Which staff member wastes the most colour?',
  'Should I raise the balayage starting price?',
  'How many manicures can I still do before I run out of rubber base?',
  'Who has not been in for 60 days and is worth a call?',
]
