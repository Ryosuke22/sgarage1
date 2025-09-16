import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/health"); // プロキシで5001へ
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    },
  });

 return (
  <div className="min-h-screen grid place-items-center p-10">
    {isLoading && <div>Loading...</div>}
    {error && (
      <div style={{color:"red", whiteSpace:"pre-wrap"}}>
        ❌ Error: {String(error)}
      </div>
    )}
    {data && (
      <div className="rounded-xl bg-emerald-500 text-white text-2xl font-bold p-6 shadow-lg">
        API OK ✅ ts: {data.ts ?? "n/a"}
      </div>
    )}
  </div>
);

}
