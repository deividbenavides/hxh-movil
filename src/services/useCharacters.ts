// src/services/useCharacters.ts
import { useCallback, useEffect, useState } from "react";
import { getPgCharacters, getMongoCharacters } from "./hxh";

type Source = "pg" | "mongo" | null;

export function useCharactersResilient() {
  const [data, setData] = useState<any[]>([]);
  const [source, setSource] = useState<Source>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1) intenta PG
    try {
      const pg = await getPgCharacters();
      setData(pg);
      setSource("pg");
      setLoading(false);
      return;
    } catch (e) {
      // cae a Mongo
    }

    // 2) intenta Mongo
    try {
      const mongo = await getMongoCharacters();
      setData(mongo);
      setSource("mongo");
      setLoading(false);
    } catch (e: any) {
      setError("No fue posible cargar ni desde PG ni desde Mongo");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, source, loading, error, reload: load };
}
