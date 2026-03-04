import { HttpAgent } from "@icp-sdk/core/agent";
import { useMemo } from "react";
import { StorageClient } from "../utils/StorageClient";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

const STORAGE_GATEWAY_URL =
  import.meta.env.VITE_STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";
const BACKEND_CANISTER_ID = import.meta.env.CANISTER_ID_BACKEND as string;

export function useStorageClient(): StorageClient | null {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();

  const storageClient = useMemo(() => {
    // Don't create a storage client until the actor is fully initialized.
    // The StorageClient calls _caffeineStorageCreateCertificate which requires
    // the actor to be authenticated and access control to be initialized.
    if (!BACKEND_CANISTER_ID) return null;
    if (!actor || isFetching) return null;
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
  }, [identity, actor, isFetching]);

  return storageClient;
}
