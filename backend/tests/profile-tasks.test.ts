import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestApp, createVerifiedUser, type TestApp } from "./helpers/test-app";

let t: TestApp;
let auth: { Authorization: string };

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await t.reset();
  const { token } = await createVerifiedUser(t, "meera@example.com");
  auth = { Authorization: `Bearer ${token}` };
});
afterAll(() => t.close());

const saveProfile = (body: object) => t.api.put("/api/me/profile").set(auth).send(body);
const PROFILE = {
  name: "Meera Iyer",
  mobile: "+91 98765-43210",
  addressLine1: "Flat 4B, Lake View Apartments",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

describe("profile", () => {
  it("saves the profile, normalises the mobile and marks it complete", async () => {
    const res = await saveProfile({ ...PROFILE, addressLine2: "", businessName: "  " });
    expect(res.status).toBe(200);
    expect(res.body.user.profileCompleted).toBe(true);
    expect(res.body.user.profile).toEqual({
      name: "Meera Iyer",
      mobile: "+919876543210",
      addressLine1: PROFILE.addressLine1,
      addressLine2: null,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      businessName: null,
    });
  });

  it.each([
    ["56001", "5 digits"],
    ["056001", "starts with 0"],
    ["5600 01", "has a space"],
  ])("rejects PIN code %s (%s)", async (pincode) => {
    const res = await saveProfile({ ...PROFILE, pincode });
    expect(res.body.error.fields.pincode).toBe("Enter a valid 6-digit PIN code.");
  });

  it("only accepts a real Indian state or union territory", async () => {
    const res = await saveProfile({ ...PROFILE, state: "Atlantis" });
    expect(res.body.error.fields.state).toBe("Choose your state.");
    expect((await saveProfile({ ...PROFILE, state: "Delhi" })).status).toBe(200);
  });

  it.each([
    ["12345", "too short"],
    ["5876543210", "starts with 5"],
    ["+1 9876543210", "wrong country code"],
    ["98765432100", "11 digits"],
  ])("rejects mobile %s (%s)", async (mobile) => {
    const res = await saveProfile({ ...PROFILE, mobile });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.mobile).toBe("Enter a valid 10-digit Indian mobile number.");
  });

  it("reports every missing field", async () => {
    const res = await saveProfile({});
    expect(Object.keys(res.body.error.fields).sort()).toEqual(["addressLine1", "city", "mobile", "name", "pincode", "state"]);
  });
});

describe("tasks", () => {
  it("serves at least 20 tasks across at least 4 categories", async () => {
    const res = await t.api.get("/api/tasks");
    const categories = res.body.categories as { tasks: { id: string; name: string; description: string }[] }[];
    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(categories.flatMap((category) => category.tasks).length).toBeGreaterThanOrEqual(20);
  });

  it("saves the selection, replacing the previous one", async () => {
    await t.api.put("/api/me/tasks").set(auth).send({ taskIds: ["plumbing", "bill-payments"] });
    const res = await t.api.put("/api/me/tasks").set(auth).send({ taskIds: ["wifi-setup", "plumbing", "plumbing"] });
    expect(res.status).toBe(200);
    expect(res.body.tasks.map((task: { id: string }) => task.id).sort()).toEqual(["plumbing", "wifi-setup"]);

    const saved = await t.api.get("/api/me/tasks").set(auth);
    expect(saved.body.tasks).toHaveLength(2);
    expect((await t.api.get("/api/me").set(auth)).body.user.selectedTaskCount).toBe(2);
  });

  it("rejects an empty selection and unknown task ids", async () => {
    const empty = await t.api.put("/api/me/tasks").set(auth).send({ taskIds: [] });
    expect(empty.body.error.fields.taskIds).toBe("Select at least one task.");

    const unknown = await t.api.put("/api/me/tasks").set(auth).send({ taskIds: ["plumbing", "time-travel"] });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toMatchObject({ code: "UNKNOWN_TASKS", unknownTaskIds: ["time-travel"] });
  });

  it("requires a session", async () => {
    expect((await t.api.get("/api/me/tasks")).status).toBe(401);
  });
});
