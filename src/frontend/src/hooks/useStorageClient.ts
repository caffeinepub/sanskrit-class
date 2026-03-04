import { HttpAgent } from "@icp-sdk/core/agent";
import { useMemo } from "react";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

const STORAGE_GATEWAY_URL =
  import.meta.env.VITE_STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";
const BACKEND_CANISTER_ID = import.meta.env.CANISTER_ID_BACKEND as string;

export function useStorageClient(): StorageClient | null {
  const { identity } = useInternetIdentity();

  const storageClient = useMemo(() => {
    if (!BACKEND_CANISTER_ID) return null;

    const agentOptions = identity ? { identity } : {};
    const agent = HttpAgent.createSync({
      host: import.meta.env.VITE_IC_HOST || "https://icp-api.io",
      ...agentOptions,
    });

    return new StorageClient(
      "default",
      STORAGE_GATEWAY_URL,
      BACKEND_CANISTER_ID,
      BACKEND_CANISTER_ID,
      agent,
    );
  }, [identity]);

  return storageClient;
}
