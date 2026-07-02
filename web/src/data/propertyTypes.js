// Listings' own property-type taxonomy — deliberately independent of
// lib/format.js's TYPE_LABELS, which is a fraud-report label set ("Land
// agent flagged", "Rental agent flagged", etc). A lister picking a
// property type for their own listing was seeing those report labels
// because both features shared one object; this is the fix — two
// separate, independent category lists, one per feature.
//
// transactionType (rent/sale) is already a separate field on a listing
// (see SubmitListing.jsx), so this taxonomy is purely "what is it,"
// not "who is the counterparty" the way the report categories are.
export const PROPERTY_TYPE_LABELS = {
  land: 'Land',
  house: 'House / Duplex',
  apartment: 'Apartment / Flat',
  commercial: 'Commercial / Office space',
  estate: 'Estate / Development unit'
}

// Listings submitted before this split still have report-style type keys
// stored in Firestore (agent/house_agent/landlord) — this keeps them
// readable instead of showing a raw key or "undefined", without forcing
// a data migration on existing documents.
const LEGACY_LISTING_TYPE_LABELS = {
  agent: 'House / Duplex',
  house_agent: 'House / Duplex',
  landlord: 'House / Duplex'
}

export function getPropertyTypeLabel(type) {
  return PROPERTY_TYPE_LABELS[type] || LEGACY_LISTING_TYPE_LABELS[type] || type
}

// Types that need a size-in-sqm field — same set as before (land/estate),
// just now keyed to the new taxonomy.
export const SIZE_PROPERTY_TYPES = ['land', 'estate']
