import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Notification,
  Student,
  StudyMaterial,
  Test,
  TestAttempt,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Students ──────────────────────────────────────────────

export function useStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyProfile(email: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Student | null>({
    queryKey: ["profile", email],
    queryFn: async () => {
      if (!actor || !email) return null;
      return actor.getMyProfile(email);
    },
    enabled: !!actor && !isFetching && !!email,
  });
}

// ── Study Materials ────────────────────────────────────────

export function useStudyMaterials() {
  const { actor, isFetching } = useActor();
  return useQuery<StudyMaterial[]>({
    queryKey: ["studyMaterials"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudyMaterials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddStudyMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      blobId,
      fileName,
    }: {
      title: string;
      description: string;
      blobId: string;
      fileName: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addStudyMaterial(title, description, blobId, fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyMaterials"] });
    },
  });
}

export function useDeleteStudyMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteStudyMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyMaterials"] });
    },
  });
}

// ── Tests ──────────────────────────────────────────────────

export function useTests() {
  const { actor, isFetching } = useActor();
  return useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      questionBlobId,
      startTime,
      durationMinutes,
    }: {
      title: string;
      questionBlobId: string;
      startTime: bigint;
      durationMinutes: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTest(
        title,
        questionBlobId,
        startTime,
        durationMinutes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

export function useDeleteTest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

// ── Test Attempts (Teacher) ────────────────────────────────

export function useTestAttempts(testId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TestAttempt[]>({
    queryKey: ["testAttempts", testId?.toString()],
    queryFn: async () => {
      if (!actor || !testId) return [];
      return actor.getTestAttempts(testId);
    },
    enabled: !!actor && !isFetching && !!testId,
  });
}

export function useAssignMarks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      testId,
      studentEmail,
      marks,
    }: {
      testId: bigint;
      studentEmail: string;
      marks: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.assignMarks(testId, studentEmail, marks);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["testAttempts", variables.testId.toString()],
      });
    },
  });
}

// ── Test Taking (Student) ──────────────────────────────────

export function useMyAttempts(email: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TestAttempt[]>({
    queryKey: ["myAttempts", email],
    queryFn: async () => {
      if (!actor || !email) return [];
      return actor.getMyAttempts(email);
    },
    enabled: !!actor && !isFetching && !!email,
  });
}

// ── Notifications ──────────────────────────────────────────

export function useNotifications(email: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications", email],
    queryFn: async () => {
      if (!actor || !email) return [];
      return actor.getNotifications(email);
    },
    enabled: !!actor && !isFetching && !!email,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(email: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unreadCount", email],
    queryFn: async () => {
      if (!actor || !email) return BigInt(0);
      return actor.getUnreadCount(email);
    },
    enabled: !!actor && !isFetching && !!email,
    refetchInterval: 30_000,
  });
}

export function useMarkAllRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.markAllNotificationsRead(email);
    },
    onSuccess: (_data, email) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", email] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount", email] });
    },
  });
}

// ── Admin check ────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin", actor ? "actor" : "noactor"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        // Backend may trap if the principal is not yet registered
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Invite code ────────────────────────────────────────────

export function useInviteCode() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["inviteCode"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getInviteCode();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inviteCode"] });
    },
  });
}
