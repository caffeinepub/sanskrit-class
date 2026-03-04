import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Student {
    displayName: string;
    joinedAt: bigint;
    email: string;
}
export interface StudyMaterial {
    id: bigint;
    title: string;
    description: string;
    fileName: string;
    blobId: string;
    uploadedAt: bigint;
}
export interface Test {
    id: bigint;
    startTime: bigint;
    title: string;
    createdAt: bigint;
    durationMinutes: bigint;
    questionBlobId: string;
}
export interface Notification {
    id: bigint;
    studentEmail: string;
    createdAt: bigint;
    isRead: boolean;
    message: string;
    testId: bigint;
}
export interface TestAttempt {
    marks?: bigint;
    studentEmail: string;
    startedAt: bigint;
    answerBlobId?: string;
    testId: bigint;
    tabSwitchCount: bigint;
    isComplete: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudyMaterial(title: string, description: string, blobId: string, fileName: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignMarks(testId: bigint, studentEmail: string, marks: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createTest(title: string, questionBlobId: string, startTime: bigint, durationMinutes: bigint): Promise<bigint>;
    deleteStudyMaterial(id: bigint): Promise<void>;
    deleteTest(id: bigint): Promise<void>;
    generateInviteCode(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getInviteCode(): Promise<string>;
    getMyAttempts(email: string): Promise<Array<TestAttempt>>;
    getMyProfile(email: string): Promise<Student | null>;
    getNotifications(email: string): Promise<Array<Notification>>;
    getQuestionPaper(email: string, testId: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStudents(): Promise<Array<Student>>;
    getStudyMaterials(): Promise<Array<StudyMaterial>>;
    getTestAttempts(testId: bigint): Promise<Array<TestAttempt>>;
    getTests(): Promise<Array<Test>>;
    getUnreadCount(email: string): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    joinClass(code: string, email: string, displayName: string): Promise<{
        __kind__: "ok";
        ok: Student;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markAllNotificationsRead(email: string): Promise<void>;
    markNotificationRead(email: string, notifId: bigint): Promise<void>;
    reportTabSwitch(email: string, testId: bigint): Promise<void>;
    startTest(email: string, testId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitAnswerPaper(email: string, testId: bigint, answerBlobId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
