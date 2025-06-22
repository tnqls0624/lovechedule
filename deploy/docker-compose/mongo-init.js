// MongoDB 초기화 스크립트 - 실제 스키마 기반 테스트용 계정 생성

// admin 데이터베이스에서 시작
db = db.getSiblingDB("admin");

// lovechedule 데이터베이스 존재 여부 확인 및 생성
const dbList = db.adminCommand("listDatabases").databases;
const lovecheduleExists = dbList.some(
  (database) => database.name === "lovechedule"
);

if (!lovecheduleExists) {
  print("🔨 lovechedule 데이터베이스를 생성합니다...");
} else {
  print("✅ lovechedule 데이터베이스가 이미 존재합니다.");
}

// lovechedule 데이터베이스로 전환
db = db.getSiblingDB("lovechedule");

// 고유한 초대 코드 생성 함수
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 테스트용 사용자 1: testuser1
const user1Id = new ObjectId();
const inviteCode1 = generateInviteCode();

db.users.insertOne({
  _id: user1Id,
  email: "testuser1@lovechedule.com",
  password: "$2a$12$M3zjq/74rz0IVrhG2F4.Q.US.Vw9FOVnQogTS/GGSQjwZ/D1X0anq", // test123 (salt rounds 12)
  name: "테스트유저1",
  login_type: "BASIC",
  gender: "male",
  birthday: "1995-01-01",
  invite_code: inviteCode1,
  fcm_token: null,
  push_enabled: true,
  schedule_alarm: true,
  anniversary_alarm: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 테스트용 사용자 2: testuser2
const user2Id = new ObjectId();
const inviteCode2 = generateInviteCode();

db.users.insertOne({
  _id: user2Id,
  email: "testuser2@lovechedule.com",
  password: "$2a$12$M3zjq/74rz0IVrhG2F4.Q.US.Vw9FOVnQogTS/GGSQjwZ/D1X0anq", // test123 (salt rounds 12)
  name: "테스트유저2",
  login_type: "BASIC",
  gender: "female",
  birthday: "1996-02-02",
  invite_code: inviteCode2,
  fcm_token: null,
  push_enabled: true,
  schedule_alarm: true,
  anniversary_alarm: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 테스트용 워크스페이스 생성 (커플 워크스페이스)
const workspaceId = new ObjectId();

db.workspaces.insertOne({
  _id: workspaceId,
  master: user1Id,
  users: [user1Id, user2Id],
  tags: {
    anniversary: { color: "#FF6B6B" },
    together: { color: "#4ECDC4" },
    guest: { color: "#45B7D1" },
    master: { color: "#96CEB4" },
  },
  love_day: "2024-01-01",
  thumbnail_image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 인덱스 생성
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ invite_code: 1 }, { unique: true });
db.workspaces.createIndex({ master: 1 });
db.workspaces.createIndex({ users: 1 });

print("🎉 MongoDB 초기화가 완료되었습니다!");
print("📂 데이터베이스: lovechedule");
print("✅ 테스트용 계정 2개가 성공적으로 생성되었습니다:");
print(
  "🔹 testuser1@lovechedule.com (패스워드: test123, 초대코드: " +
    inviteCode1 +
    ")"
);
print(
  "🔹 testuser2@lovechedule.com (패스워드: test123, 초대코드: " +
    inviteCode2 +
    ")"
);
print("💕 두 계정은 워크스페이스에서 연결되어 있습니다.");
print("📅 연애 시작일: 2024-01-01");
