import { HttpAgent } from "@icp-sdk/core/agent";
import { useMemo } from "react";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

const STORAGE_GATEWAY_URL =
  import.meta.env.VITE_STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";
const BACKEND_CANISTER_ID = import.meta.env.CANISTER_ID_BACKEND as string;

export function useStorageClient(): {
  storageClient: StorageClient | null;
  isReady: boolean;
} {
  const { identity } = useInternetIdentity();

  const storageClient = useMemo(() => {
    // The StorageClient only needs a signed HttpAgent to call
    // _caffeineStorageCreateCertificate directly via agent.call().
    // It does NOT need the Motoko actor — so we don't block on actor
    // initialization here. This avoids the "Connecting…" spinner that
    // appeared when useActor's query failed (e.g. empty admin token).
    if (!BACKEND_CANISTER_ID) return null;
    if (!identity) return null;

    const agent = HttpAgent.createSync({
      host: import.meta.env.VITE_IC_HOST || "https://icp-api.io",
      identity,
    });

    return new StorageClient(
      "default",
      STORAGE_GATEWAY_URL,
      BACKEND_CANISTER_ID,
      BACKEND_CANISTER_ID,
      agent,
    );
  }, [identity]);

  // isReady: storage client is available as soon as identity is present
  const isReady = storageClient !== null;

  return { storageClient, isReady };
}
