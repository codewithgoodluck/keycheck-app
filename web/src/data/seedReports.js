// Seed reports — covers land disputes, land agent fraud, rental/house
// agent fraud, landlord fraud, and estate/developer fraud. Compiled from
// EFCC press releases, court reporting, and verified Nigerian news coverage
// (sourced through July 2026, 24 entries). Every entry has a real
// sourceUrl. Status reflects the legal stage at time of writing:
//   "disputed"   = arrested/charged/arraigned, case ongoing, not yet decided
//   "verified"   = court has convicted/sentenced
//   "unverified" = community/victim allegation reported in press, not yet
//                  before a court (e.g. omo-onile extortion complaints)
//
// IMPORTANT: these are *allegations* reported by EFCC or the press unless
// marked "verified" (convicted). Keep the "alleged" framing in any public
// display, and update status as cases progress through court.
//
// This list is a starting point, not exhaustive. EFCC publishes new land
// fraud press releases regularly at efcc.gov.ng/efcc/news-and-information —
// check it periodically (or set a Google Alert for "EFCC land fraud") to
// keep growing this dataset honestly rather than inventing entries.

export const seedReports = [
  {
    type: 'agent',
    locationText: 'Multiple FCT districts (Kurudu, Sabon Lugbe, Kpeyegyi, Jikwoyi, Karsana, Pyakasa, Katampe Extension, Guzape 2, Kuje), Abuja',
    agentName: 'Nwobo Williams Chibuike / C&C Reality & Construction Ltd, Dream-Krest Homes and Properties Ltd, Dan Faith Shelters Ltd',
    status: 'disputed',
    description:
      'EFCC alleges Chibuike marketed and sold plots of land in multiple FCT locations that the Federal Capital Development Authority confirmed do not exist, collecting payments ranging from roughly N3.5 million to N60 million from individual victims. Arrested April 2025, expected to be arraigned once investigations conclude.',
    evidenceUrls: [],
    lat: 9.0765,
    lng: 7.3986,
    source: 'public_news',
    sourceUrl: 'https://www.premiumtimesng.com/news/top-news/790052-efcc-to-arraign-fake-abuja-land-vendor-warns-residents-against-fraudulent-marketers.html',
    dateReported: '2025-04-24'
  },
  {
    type: 'agent',
    locationText: 'Guzape and Katampe districts, Abuja',
    agentName: 'Homadil Realty Limited (Rebecca Isaac aka Bilkisu Ishaku Aliyu, Ishaku Isaac); Richard John / Rychado Homes',
    status: 'disputed',
    description:
      'Police charged a couple and company executives over an alleged fraud involving four prime plots in Guzape and Katampe. The Federal High Court in Abuja granted an interim forfeiture order over the disputed plots in December 2024 while investigations continued. Defendants appeared before the FCT High Court in Apo in January 2025.',
    evidenceUrls: [],
    lat: 9.05,
    lng: 7.47,
    source: 'public_news',
    sourceUrl: 'https://www.premiumtimesng.com/news/top-news/790052-efcc-to-arraign-fake-abuja-land-vendor-warns-residents-against-fraudulent-marketers.html',
    dateReported: '2025-01-28'
  },
  {
    type: 'land',
    locationText: 'Millennium City and Unguwan Hazo, Rigachikun, Kaduna',
    agentName: 'Danlami Bala Alafiya (aka Dalhatu Mikailu)',
    status: 'disputed',
    description:
      "EFCC alleges the defendant forged a \"Provisional Offer of Grant/Re-grant of Statutory Right of Occupancy\" document for a Millennium City plot, and separately swapped a fake plot at Rigachikun for a complainant's BMW. When the buyer discovered the land belonged to someone else and asked for a refund, he was allegedly offered a second plot that also turned out to be fake. Defendant pleaded not guilty and was granted bail at Kaduna State High Court.",
    evidenceUrls: [],
    lat: 10.5105,
    lng: 7.4165,
    source: 'public_news',
    sourceUrl: 'https://www.eonsintelligence.com/details/news-108923456/efcc-arraigns-land-agent-over-property-fraud-2111720883',
    dateReported: '2024-01-01'
  },
  {
    type: 'land',
    locationText: 'Plot 677 Owo/Premier Layout, Ogui Nike, Enugu',
    agentName: null,
    status: 'disputed',
    description:
      'A petitioner alleged he paid roughly N10 million for a plot, only to find it already being developed by unrelated parties. EFCC said preliminary checks found no layout matching the combined "Owo/Premier" name exists, that Owo and Premier are in fact two separate layouts, and that the suspect became unreachable after being confronted.',
    evidenceUrls: [],
    lat: 6.473,
    lng: 7.528,
    source: 'public_news',
    sourceUrl: 'https://advocatengr.com/2026/03/09/efcc-arrests-man-over-n10m-land-fraud-in-enugu/',
    dateReported: '2026-03-09'
  },
  {
    type: 'agent',
    locationText: 'Ifa Ikot Ubo / Ifa Ikot Okpon-Etoi, Uyo, Akwa Ibom',
    agentName: 'Enobong Clement Etim (alias Edet Nsem Udo) and five others',
    status: 'disputed',
    description:
      "EFCC's Uyo office arrested six suspects accused of posing as landowners and presenting forged documents to a buyer who paid N6 million for land that preliminary investigation found does not belong to the suspects. Part of the payment was traced to a UBA account linked to the prime suspect.",
    evidenceUrls: [],
    lat: 5.0377,
    lng: 7.9128,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/11446-efcc-arrests-six-for-alleged-land-fraud-in-uyo',
    dateReported: '2025-09-29'
  },
  {
    type: 'agent',
    locationText: 'Ogombo, Ajah and Ayogbemi Village, Ibeju-Lekki, Lagos',
    agentName: 'Murtala Adebayo',
    status: 'disputed',
    description:
      'EFCC re-arraigned the defendant on charges of obtaining N4.5 million in cash and three vehicles (valued around N9 million) from a complainant under the false representation that payment was for plots at Ogombo, Ajah and Ayogbemi Village. Case adjourned for trial.',
    evidenceUrls: [],
    lat: 6.45,
    lng: 3.9,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/10642-alleged-n19m-fraud-efcc-re-arraigns-man-in-lagos',
    dateReported: '2025-01-29'
  },
  {
    type: 'land',
    locationText: 'Lagos State (location undisclosed in report)',
    agentName: null,
    status: 'verified',
    description:
      'A Lagos court convicted and sentenced a defendant to eight years imprisonment over an alleged N62 million land fraud, per EFCC reporting.',
    evidenceUrls: [],
    lat: 6.5244,
    lng: 3.3792,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/10426-lagos-court-jails-man-eight-years-for-n62m-land-fraud',
    dateReported: '2024-10-03'
  },
  {
    type: 'agent',
    locationText: 'Umuagu Ndiukwuanu / Umuagu Ozu Village, Orumba North LGA, Anambra',
    agentName: 'Barrister Mike Ikegbunam',
    status: 'disputed',
    description:
      'EFCC alleges the defendant, a lawyer, collected N25 million and N20 million in separate payments from members of a university staff association under the pretense of securing land for them in Orumba North. Re-arraigned on a seven-count charge; trial set for October 2026.',
    evidenceUrls: [],
    lat: 6.08,
    lng: 7.2,
    source: 'public_news',
    sourceUrl: 'https://dailypost.ng/2026/05/04/efcc-re-arraigns-lawyer-over-alleged-n91m-land-fraud-in-enugu/',
    dateReported: '2026-05-04'
  },
  {
    type: 'land',
    locationText: 'Kano State (location undisclosed in report)',
    agentName: null,
    status: 'disputed',
    description: 'EFCC arraigned a defendant over an alleged N31 million land fraud; case adjourned for commencement of trial.',
    evidenceUrls: [],
    lat: 12.0022,
    lng: 8.592,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/11017-efcc-arraigns-one-for-alleged-n31million-land-fraud-in-kano',
    dateReported: '2025-05-20'
  },
  {
    type: 'land',
    locationText: 'Surulere Estate, Agbado/Oke-Odo LCDA, Lagos',
    agentName: null,
    status: 'unverified',
    description:
      'Residents reported that groups identified as omo-onile, accompanied by thugs and allegedly by police, demanded roughly N15.1 million per house to halt ongoing demolitions. The Federal Housing Authority reportedly stated it did not authorise any demolition in the area. Community allegation reported in press; not yet before a court at time of writing.',
    evidenceUrls: [],
    lat: 6.63,
    lng: 3.29,
    source: 'public_news',
    sourceUrl: 'https://www.akelicious.net/omo-onile-thugs-accused-of-terrorising-surulere-estate-with-police-support/',
    dateReported: '2026-02-14'
  },
  {
    type: 'land',
    locationText: 'Amikanle community, near Command, Alimosho LGA, Lagos',
    agentName: null,
    status: 'unverified',
    description:
      'Press reports describe suspected land grabbers demolishing approximately 50 houses after demanding N15-25 million from individual homeowners who could not pay. Reported as an ongoing dispute; community allegation, not yet adjudicated.',
    evidenceUrls: [],
    lat: 6.61,
    lng: 3.26,
    source: 'public_news',
    sourceUrl: 'https://punchng.com/land-grabbers-stain-lagos-megacity/',
    dateReported: '2026-03-25'
  },
  {
    type: 'land',
    locationText: 'Lagos State (multiple LGAs — citywide pattern)',
    agentName: null,
    status: 'unverified',
    description:
      'The Lagos State Government reported that, as of early 2025, its anti-land-grabbing task force had received about 7,500 petitions (1,251 dismissed as frivolous), with 205 suspects arrested and roughly 60 cases on trial. The Lagos State Attorney General publicly stated that omo-onile and ajagungbale activity has significantly hindered property transactions statewide. General citywide pattern, not a single incident.',
    evidenceUrls: [],
    lat: 6.55,
    lng: 3.42,
    source: 'public_news',
    sourceUrl: 'https://tribuneonlineng.com/lagos-declares-war-on-land-grabbers-60-on-trial-205-arrested-7500-petitions-received/',
    dateReported: '2025-02-22'
  },
  {
    type: 'land',
    locationText: 'Lagos and Ogun States — construction-stage extortion pattern',
    agentName: null,
    status: 'unverified',
    description:
      'Multiple homeowners interviewed in press reporting describe a recurring pattern: after paying for land and a "family receipt," groups known as omo-onile return during construction to demand further unreceipted payments at each stage (foundation, decking, roofing, fencing) under threat of stopping work. One homeowner reported paying about N1.5 million in such fees on top of an initial N200,000 family receipt. Ogun State enacted an Anti-Land Grabbing Act in 2016 in response to the same pattern.',
    evidenceUrls: [],
    lat: 6.7,
    lng: 3.5,
    source: 'public_news',
    sourceUrl: 'https://businessday.ng/news/article/how-omo-onile-menace-in-lagos-ogun-is-worsening-builders-woes/',
    dateReported: '2023-10-08'
  },
  {
    type: 'land',
    locationText: 'Federal Capital Territory — fake company allocation pattern',
    agentName: null,
    status: 'unverified',
    description:
      'The Corporate Affairs Commission disclosed it had identified 189 unregistered or fraudulently registered companies used by a criminal syndicate to fraudulently secure land allocations across the FCT, uncovered after the FCT Administration asked CAC to verify a company seeking land allocation. General pattern disclosure, not a single victim incident.',
    evidenceUrls: [],
    lat: 9.0950,
    lng: 7.4250,
    source: 'public_news',
    sourceUrl: 'https://nairametrics.com/2025/04/24/efcc-alerts-nigerians-about-fake-land-vendors-in-multi-million-naira-fraud-arrests-suspect-in-abuja/',
    dateReported: '2023-10-24'
  },
  {
    type: 'agent',
    locationText: 'Rumuapu / Rukpokwu, Obio/Akpor LGA, Rivers State',
    agentName: 'Blessing Webilor Nchelem and Deborah Jack',
    status: 'disputed',
    description:
      "EFCC's Port Harcourt office alleges the pair obtained N6 million from a complainant as payment for three plots of land, under a false pretense. Both pleaded not guilty at the Federal High Court in Port Harcourt and were remanded pending a formal bail application.",
    evidenceUrls: [],
    lat: 4.85,
    lng: 7.03,
    source: 'public_news',
    sourceUrl: 'https://www.eonsintelligence.com/details/news-108923456/efcc-arraigns-woman-daughter-in-law-over-alleged-n6m-land-fraud-in-port-harcourt-235445833',
    dateReported: '2025-06-01'
  },
  {
    type: 'agent',
    locationText: 'Effurun, Warri, Delta State',
    agentName: 'Rita Izehia Iyoha and Fidelia Oghenetejiri',
    status: 'disputed',
    description:
      'EFCC alleges the sisters, presenting themselves as rightful owners of an inherited property, collected N446 million from a couple for a property in Effurun. The buyers were unable to take possession because a court order restraining the sisters from disposing of the property was already in force at the time of sale.',
    evidenceUrls: [],
    lat: 5.532,
    lng: 5.75,
    source: 'public_news',
    sourceUrl: 'https://247ureports.com/2025/10/efcc-to-arraign-woman-for-n446m-property-fraud-in-benin-city/',
    dateReported: '2025-10-25'
  },
  {
    type: 'agent',
    locationText: 'Ikeja, Lagos',
    agentName: 'Victor Azubike Awah / Sparkan Ives Limited',
    status: 'disputed',
    description:
      'EFCC alleges the defendant, a lawyer, and his company collected N27 million from a complainant for a plot of land he had advertised for sale, using false documents and issuing a dud cheque. Arraigned on a six-count charge at the Lagos State High Court in Ikeja; remanded in EFCC custody.',
    evidenceUrls: [],
    lat: 6.6018,
    lng: 3.3515,
    source: 'public_news',
    sourceUrl: 'https://www.nationalaccordnewspaper.com/efcc-arraigns-lawyer-company-for-alleged-n27m-land-fraud-in-lagos/',
    dateReported: '2025-10-23'
  },
  {
    type: 'agent',
    locationText: 'Independence Layout, Enugu',
    agentName: 'Barrister Benjamin Chukwuemeka Nwobodo',
    status: 'disputed',
    description:
      'EFCC alleges the defendant, a lawyer, forged land purchase receipts (including a N9 million receipt falsely attributed to one family and a further N5.5 million document) and presented them to victims. Re-arraigned on an amended 20-count charge at the Federal High Court in Enugu after an earlier five-count arraignment in January 2025; trial ongoing as of April 2026.',
    evidenceUrls: [],
    lat: 6.4483,
    lng: 7.5,
    source: 'public_news',
    sourceUrl: 'https://blueprint.ng/efcc-re-arraigns-lawyer-for-alleged-n15-7m-land-fraud-in-enugu/',
    dateReported: '2026-04-30'
  },
  {
    type: 'land',
    locationText: 'Behind Borno State University, Konduga, Borno State',
    agentName: null,
    status: 'disputed',
    description:
      'EFCC alleges the defendant sold plots of land belonging to the Borno State Government to a complainant without ever delivering the property, collecting N5.555 million. Arraigned on a three-count charge and remanded in a correctional centre pending trial.',
    evidenceUrls: [],
    lat: 11.8833,
    lng: 13.4333,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/11420-efcc-arraigns-man-for-n5m-land-fraud-in-maiduguri',
    dateReported: '2025-09-16'
  },
  {
    type: 'landlord',
    locationText: 'Tunbosun Osobu Street, Lekki, Lagos',
    agentName: 'Blessing Okoro (aka "Blessing CEO")',
    status: 'disputed',
    description:
      'EFCC alleges the defendant, a relationship influencer, collected N69.15 million from a health clinic company by falsely representing that she owned a Lekki property and leasing it to them for five years. She faces a separate N36 million fraud case in a different court, bringing total allegations against her to over N105 million across two matters. Pleaded not guilty in both; neither case has gone to trial.',
    evidenceUrls: [],
    lat: 6.4433,
    lng: 3.4738,
    source: 'public_news',
    sourceUrl: 'https://www.pulse.ng/story/efcc-arraigns-blessing-ceo-69m-property-fraud-2026061012264327506',
    dateReported: '2026-06-10'
  },
  {
    type: 'house_agent',
    locationText: 'Abuja (multiple locations)',
    agentName: null,
    status: 'disputed',
    description:
      'EFCC arrested an Abuja-based property agent accused of collecting roughly N288 million from multiple prospective buyers under the pretext of facilitating land and housing transactions, then failing to deliver the promised properties. The arrest followed petitions from several affected clients.',
    evidenceUrls: [],
    lat: 9.0765,
    lng: 7.3986,
    source: 'public_news',
    sourceUrl: 'https://www.nigeriahousingmarket.com/news/efcc-abuja-property-fraud-288m-agent-arrest',
    dateReported: '2026-04-02'
  },
  {
    type: 'estate',
    locationText: 'Independence Layout, Enugu',
    agentName: 'Ikedinachi Grace Nonyelum',
    status: 'disputed',
    description:
      'EFCC alleges the defendant induced a buyer to pay N9 million for a bungalow, then resold the same property to a different buyer. Trial began in October 2025 at the Federal High Court in Enugu with the prosecution\'s first witness, an EFCC investigator, testifying to bank records showing the initial payment.',
    evidenceUrls: [],
    lat: 6.4483,
    lng: 7.5,
    source: 'public_news',
    sourceUrl: 'https://www.efcc.gov.ng/news-and-information/news-release/11484-alleged-n9m-property-fraud-efcc-presents-first-witness-against-alleged-serial-fraudster-in-enugu',
    dateReported: '2025-10-15'
  },
  {
    type: 'house_agent',
    locationText: 'Lagos State (citywide) — rental and estate agency pattern',
    agentName: null,
    status: 'unverified',
    description:
      'The Lagos State Real Estate Regulatory Authority (LASRERA) reported receiving 505 petitions relating to tenancy disputes and fraudulent real estate activity between 2025 and 2026, resolving 39 of them and recovering approximately N270 million from fraudulent operators. Lagos State rules cap estate agency fees at 10% of annual rent; the government has repeatedly warned residents against dealing with unregistered agents. General citywide pattern, not a single incident.',
    evidenceUrls: [],
    lat: 6.45,
    lng: 3.4,
    source: 'public_news',
    sourceUrl: 'https://www.nigeriahousingmarket.com/news/lagos-targets-real-estate-fraud-delivers-over-10000-housing-units',
    dateReported: '2026-05-29'
  },
  {
    type: 'house_agent',
    locationText: 'Ikoyi and Lekki, Lagos — shortlet rental pattern',
    agentName: null,
    status: 'unverified',
    description:
      'Press reporting describes a diaspora family defrauded of N1.3 million after booking a shortlet apartment through an Instagram page showing photos of luxury properties across Ikoyi and Lekki. The "agent" deactivated her account immediately after payment. Reported as part of a wider pattern of fake shortlet listings targeting travellers during the December peak season.',
    evidenceUrls: [],
    lat: 6.45,
    lng: 3.43,
    source: 'public_news',
    sourceUrl: 'https://propertyaccess.ng/lagos-shortlet-scam-agent-defrauded-family/',
    dateReported: '2025-10-28'
  }
]

// --- One-time seed script ---
// Run with: node -e "require('./seedReports.js').seedDatabase()"
// after adapting the import below to your Firebase Admin setup, or paste
// these objects directly into Firestore via the console for a quick start.
//
// import { db } from '../lib/firebase.js'
// import { collection, addDoc } from 'firebase/firestore'
//
// export async function seedDatabase() {
//   for (const report of seedReports) {
//     await addDoc(collection(db, 'reports'), {
//       ...report,
//       upvotes: 0,
//       createdAt: new Date().toISOString()
//     })
//   }
//   console.log(`Seeded ${seedReports.length} reports.`)
// }
