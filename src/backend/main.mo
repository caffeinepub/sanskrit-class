import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import BlobMixin "./blob-storage/Mixin";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";

actor Main {
  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include BlobMixin();

  public type Student = {
    email : Text;
    displayName : Text;
    joinedAt : Int;
  };

  public type StudyMaterial = {
    id : Nat;
    title : Text;
    description : Text;
    blobId : Text;
    fileName : Text;
    uploadedAt : Int;
  };

  public type Test = {
    id : Nat;
    title : Text;
    questionBlobId : Text;
    startTime : Int;
    durationMinutes : Nat;
    createdAt : Int;
  };

  public type TestAttempt = {
    studentEmail : Text;
    testId : Nat;
    startedAt : Int;
    answerBlobId : ?Text;
    tabSwitchCount : Nat;
    marks : ?Nat;
    isComplete : Bool;
  };

  public type Notification = {
    id : Nat;
    studentEmail : Text;
    message : Text;
    testId : Nat;
    createdAt : Int;
    isRead : Bool;
  };

  var inviteCode : Text = "scl001abc2";
  var nextMaterialId : Nat = 0;
  var nextTestId : Nat = 0;
  var nextNotifId : Nat = 0;

  let students : Map.Map<Text, Student> = Map.empty();
  let materials : Map.Map<Nat, StudyMaterial> = Map.empty();
  let tests : Map.Map<Nat, Test> = Map.empty();
  let attempts : Map.Map<Text, TestAttempt> = Map.empty();
  let notifications : Map.Map<Nat, Notification> = Map.empty();

  func attemptKey(email : Text, testId : Nat) : Text {
    email # "##" # testId.toText()
  };

  func isTestActive(test : Test) : Bool {
    let now = Time.now();
    let endTime = test.startTime + (test.durationMinutes * 60_000_000_000);
    now >= test.startTime and now < endTime
  };

  func generateCode(seed : Nat) : Text {
    let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let charsArray = chars.toArray();
    let len = charsArray.size();
    var code = "";
    var s = seed;
    var i = 0;
    while (i < 10) {
      let idx = s % len;
      code := code # Text.fromChar(charsArray[idx]);
      s := (s * 1103515245 + 12345) % 2147483648;
      i += 1;
    };
    code
  };

  public query func getInviteCode() : async Text {
    inviteCode
  };

  public shared func generateInviteCode() : async Text {
    let seed = Int.abs(Time.now()) % 1000000000;
    inviteCode := generateCode(seed);
    inviteCode
  };

  public shared func joinClass(code : Text, email : Text, displayName : Text) : async { #ok : Student; #err : Text } {
    if (code != inviteCode) {
      return #err("Invalid invite code");
    };
    if (email.size() == 0) {
      return #err("Email is required");
    };
    if (displayName.size() == 0) {
      return #err("Display name is required");
    };
    switch (students.get(email)) {
      case (?existing) { return #ok(existing) };
      case (null) {
        let student : Student = {
          email = email;
          displayName = displayName;
          joinedAt = Time.now();
        };
        students.add(email, student);
        return #ok(student);
      };
    };
  };

  public query func getMyProfile(email : Text) : async ?Student {
    students.get(email)
  };

  public query func getStudents() : async [Student] {
    students.values().toArray()
  };

  public shared func addStudyMaterial(title : Text, description : Text, blobId : Text, fileName : Text) : async Nat {
    let id = nextMaterialId;
    nextMaterialId += 1;
    let material : StudyMaterial = {
      id = id;
      title = title;
      description = description;
      blobId = blobId;
      fileName = fileName;
      uploadedAt = Time.now();
    };
    materials.add(id, material);
    id
  };

  public shared func deleteStudyMaterial(id : Nat) : async () {
    materials.remove(id)
  };

  public query func getStudyMaterials() : async [StudyMaterial] {
    materials.values().toArray().sort(func(a : StudyMaterial, b : StudyMaterial) : { #less; #equal; #greater } {
      if (a.uploadedAt > b.uploadedAt) { #less }
      else if (a.uploadedAt < b.uploadedAt) { #greater }
      else { #equal }
    })
  };

  public shared func createTest(title : Text, questionBlobId : Text, startTime : Int, durationMinutes : Nat) : async Nat {
    let id = nextTestId;
    nextTestId += 1;
    let test : Test = {
      id = id;
      title = title;
      questionBlobId = questionBlobId;
      startTime = startTime;
      durationMinutes = durationMinutes;
      createdAt = Time.now();
    };
    tests.add(id, test);
    for (student in students.values()) {
      let notifId = nextNotifId;
      nextNotifId += 1;
      let notif : Notification = {
        id = notifId;
        studentEmail = student.email;
        message = "New test uploaded: " # title;
        testId = id;
        createdAt = Time.now();
        isRead = false;
      };
      notifications.add(notifId, notif);
    };
    id
  };

  public shared func deleteTest(id : Nat) : async () {
    tests.remove(id)
  };

  public query func getTests() : async [Test] {
    tests.values().toArray().sort(func(a : Test, b : Test) : { #less; #equal; #greater } {
      if (a.createdAt > b.createdAt) { #less }
      else if (a.createdAt < b.createdAt) { #greater }
      else { #equal }
    })
  };

  public shared func startTest(email : Text, testId : Nat) : async { #ok; #err : Text } {
    switch (students.get(email)) {
      case (null) { return #err("Student not found. Please join the class first.") };
      case (?_) {};
    };
    switch (tests.get(testId)) {
      case (null) { return #err("Test not found") };
      case (?test) {
        if (not isTestActive(test)) {
          return #err("Test is not currently active");
        };
        let key = attemptKey(email, testId);
        switch (attempts.get(key)) {
          case (?existing) {
            if (existing.isComplete) {
              return #err("You have already completed this test");
            };
            return #ok;
          };
          case (null) {
            let attempt : TestAttempt = {
              studentEmail = email;
              testId = testId;
              startedAt = Time.now();
              answerBlobId = null;
              tabSwitchCount = 0;
              marks = null;
              isComplete = false;
            };
            attempts.add(key, attempt);
            return #ok;
          };
        };
      };
    };
  };

  public query func getQuestionPaper(email : Text, testId : Nat) : async { #ok : Text; #err : Text } {
    switch (tests.get(testId)) {
      case (null) { return #err("Test not found") };
      case (?test) {
        if (not isTestActive(test)) {
          return #err("Test has ended or not started yet");
        };
        let key = attemptKey(email, testId);
        switch (attempts.get(key)) {
          case (null) { return #err("You must start the test first") };
          case (?attempt) {
            if (attempt.isComplete) {
              return #err("You have already completed this test");
            };
            return #ok(test.questionBlobId);
          };
        };
      };
    };
  };

  public shared func submitAnswerPaper(email : Text, testId : Nat, answerBlobId : Text) : async { #ok; #err : Text } {
    switch (tests.get(testId)) {
      case (null) { return #err("Test not found") };
      case (?test) {
        if (not isTestActive(test)) {
          return #err("Test has ended. Submissions are closed.");
        };
        let key = attemptKey(email, testId);
        switch (attempts.get(key)) {
          case (null) { return #err("You have not started this test") };
          case (?existing) {
            let updated : TestAttempt = {
              studentEmail = existing.studentEmail;
              testId = existing.testId;
              startedAt = existing.startedAt;
              answerBlobId = ?answerBlobId;
              tabSwitchCount = existing.tabSwitchCount;
              marks = existing.marks;
              isComplete = true;
            };
            attempts.add(key, updated);
            return #ok;
          };
        };
      };
    };
  };

  public shared func reportTabSwitch(email : Text, testId : Nat) : async () {
    let key = attemptKey(email, testId);
    switch (attempts.get(key)) {
      case (null) {};
      case (?existing) {
        let updated : TestAttempt = {
          studentEmail = existing.studentEmail;
          testId = existing.testId;
          startedAt = existing.startedAt;
          answerBlobId = existing.answerBlobId;
          tabSwitchCount = existing.tabSwitchCount + 1;
          marks = existing.marks;
          isComplete = existing.isComplete;
        };
        attempts.add(key, updated);
      };
    };
  };

  public query func getMyAttempts(email : Text) : async [TestAttempt] {
    attempts.values().toArray().filter(func(a : TestAttempt) : Bool { a.studentEmail == email })
  };

  public query func getTestAttempts(testId : Nat) : async [TestAttempt] {
    attempts.values().toArray().filter(func(a : TestAttempt) : Bool { a.testId == testId })
  };

  public shared func assignMarks(testId : Nat, studentEmail : Text, marks : Nat) : async { #ok; #err : Text } {
    let key = attemptKey(studentEmail, testId);
    switch (attempts.get(key)) {
      case (null) { return #err("Attempt not found") };
      case (?existing) {
        let updated : TestAttempt = {
          studentEmail = existing.studentEmail;
          testId = existing.testId;
          startedAt = existing.startedAt;
          answerBlobId = existing.answerBlobId;
          tabSwitchCount = existing.tabSwitchCount;
          marks = ?marks;
          isComplete = existing.isComplete;
        };
        attempts.add(key, updated);
        return #ok;
      };
    };
  };

  public query func getNotifications(email : Text) : async [Notification] {
    notifications.values().toArray()
      .filter(func(n : Notification) : Bool { n.studentEmail == email })
      .sort(func(a : Notification, b : Notification) : { #less; #equal; #greater } {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal }
      })
  };

  public query func getUnreadCount(email : Text) : async Nat {
    var count = 0;
    for (n in notifications.values()) {
      if (n.studentEmail == email and not n.isRead) {
        count += 1;
      };
    };
    count
  };

  public shared func markNotificationRead(email : Text, notifId : Nat) : async () {
    switch (notifications.get(notifId)) {
      case (null) {};
      case (?existing) {
        if (existing.studentEmail == email) {
          let updated : Notification = {
            id = existing.id;
            studentEmail = existing.studentEmail;
            message = existing.message;
            testId = existing.testId;
            createdAt = existing.createdAt;
            isRead = true;
          };
          notifications.add(notifId, updated);
        };
      };
    };
  };

  public shared func markAllNotificationsRead(email : Text) : async () {
    for ((id, n) in notifications.entries()) {
      if (n.studentEmail == email and not n.isRead) {
        let updated : Notification = {
          id = n.id;
          studentEmail = n.studentEmail;
          message = n.message;
          testId = n.testId;
          createdAt = n.createdAt;
          isRead = true;
        };
        notifications.add(id, updated);
      };
    };
  };
}
