export const toLocalInput = date => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

// Resolve at submission so a form left open overnight still creates today's QR.
export function todayAttendanceSession(locationUuid = "", now = new Date()) {
  const start = new Date(now);
  start.setHours(6, 0, 0, 0);
  const end = new Date(now);
  end.setHours(14, 0, 0, 0);
  return {
    attendance_type: "CHECK_IN",
    location_uuid: locationUuid,
    target_type: "ALL",
    valid_from: start.toISOString(),
    valid_until: end.toISOString(),
  };
}
