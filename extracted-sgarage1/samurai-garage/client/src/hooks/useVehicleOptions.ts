import { useQuery } from "@tanstack/react-query";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
};

// English to Japanese make mapping
const makeMapping: Record<string, string> = {
  "Honda": "ホンダ",
  "Toyota": "トヨタ", 
  "Daihatsu": "ダイハツ",
  "Nissan": "ニッサン",
  "Mazda": "マツダ",
  "Mitsubishi": "ミツビシ",
  "Subaru": "スバル",
  "Suzuki": "スズキ",
  "Isuzu": "いすゞ",
  "Lexus": "レクサス",
  "Hino": "日野"
};

export function convertToJapaneseMake(englishMake: string): string {
  return makeMapping[englishMake] || englishMake;
}

export function useMakes(category: "car" | "motorcycle") {
  return useQuery({
    queryKey: ["makes", category],
    queryFn: () => fetcher<{ makes: string[] }>(`/api/makes?category=${category}`),
  });
}

export function useYears(category: "car" | "motorcycle", make?: string) {
  return useQuery({
    enabled: !!make,
    queryKey: ["years", category, make],
    queryFn: () => fetcher<{ years: number[] }>(`/api/years?category=${category}&make=${encodeURIComponent(make!)}`),
  });
}

export function useModels(category: "car" | "motorcycle", make?: string, year?: number) {
  return useQuery({
    enabled: !!make && !!year,
    queryKey: ["models", category, make, year],
    queryFn: () =>
      fetcher<{ models: string[] }>(
        `/api/models?category=${category}&make=${encodeURIComponent(make!)}&year=${year}`,
      ),
  });
}

export function useYearlyModels(makeJa: string, year: number) {
  return useQuery({
    queryKey: ["models", makeJa, year],
    enabled: !!makeJa && !!year,
    queryFn: async () => {
      const r = await fetch(`/api/models?category=car&make=${encodeURIComponent(makeJa)}&year=${year}`);
      if (!r.ok) throw new Error("モデル取得に失敗");
      const data = await r.json();
      return (data.models as string[]) ?? [];
    },
    staleTime: 60_000
  });
}

// Enhanced hook that automatically converts English make to Japanese
export function useJapaneseModels(englishMake: string, year: number) {
  const makeJa = convertToJapaneseMake(englishMake);
  return useYearlyModels(makeJa, year);
}