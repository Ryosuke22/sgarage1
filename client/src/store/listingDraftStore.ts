import { useSyncExternalStore } from "react";

export type ListingDraft = {
  title: string;
  category: "car" | "motorcycle" | "";
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  mileageVerified: boolean;
  ownershipMileage: number | null;
  locationText: string;
  city: string;
  displacementCc: number | null;
  transmission: string;
  color: string;
  vin: string;
  hasShaken: boolean;
  shakenYear: string;
  shakenMonth: string;
  isTemporaryRegistration: boolean;
  description: string;
  specifications: string;
  condition: string;
  highlights: string;
  modifications: string;
  maintenance: string;
  knownIssues: string;
  additionalInfo: string;
  images: string[];
  videoUrl: string;
  reservePrice: number | null;
  buyNowPrice: number | null;
  auctionStartAt: string;
  auctionEndAt: string;
  hasAccidentHistory: string;
  purchaseYear: string;
  modifiedParts: string;
  prePurchaseInfo: string;
  ownerMaintenance: string;
  startingPrice: string;
  preferredDayOfWeek: string;
  preferredStartTime: string;
  auctionDuration: string;
};

const INITIAL_DRAFT: ListingDraft = {
  title: "",
  category: "",
  make: "",
  model: "",
  year: null,
  mileage: null,
  mileageVerified: false,
  ownershipMileage: null,
  locationText: "",
  city: "",
  displacementCc: null,
  transmission: "",
  color: "",
  vin: "",
  hasShaken: false,
  shakenYear: "",
  shakenMonth: "",
  isTemporaryRegistration: false,
  description: "",
  specifications: "",
  condition: "",
  highlights: "",
  modifications: "",
  maintenance: "",
  knownIssues: "",
  additionalInfo: "",
  images: [],
  videoUrl: "",
  reservePrice: null,
  buyNowPrice: null,
  auctionStartAt: "",
  auctionEndAt: "",
  hasAccidentHistory: "",
  purchaseYear: "",
  modifiedParts: "",
  prePurchaseInfo: "",
  ownerMaintenance: "",
  startingPrice: "",
  preferredDayOfWeek: "",
  preferredStartTime: "",
  auctionDuration: "",
};

type Listener = () => void;
let draft: ListingDraft = (() => {
  try {
    const raw = sessionStorage.getItem("listing:draft");
    return raw ? { ...INITIAL_DRAFT, ...JSON.parse(raw) } : INITIAL_DRAFT;
  } catch {
    return INITIAL_DRAFT;
  }
})();
const listeners = new Set<Listener>();

function emit() {
  try {
    sessionStorage.setItem("listing:draft", JSON.stringify(draft));
  } catch {}
  for (const l of listeners) l();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return draft;
}

function getServerSnapshot() {
  return INITIAL_DRAFT;
}

export function setAll(next: Partial<ListingDraft> | ListingDraft) {
  draft = { ...draft, ...(next as ListingDraft) };
  emit();
}

export function setField<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
  draft = { ...draft, [key]: value };
  emit();
}

export function clearDraft() {
  draft = INITIAL_DRAFT;
  emit();
}

export function useListingDraftStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    draft: data,
    setAll,
    setField,
    clearDraft,
  };
}
