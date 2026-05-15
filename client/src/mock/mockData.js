export const initialData = {
  groups: [
    {
      id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e",
      name: "נבחרת גודו בן גוריון",
      group_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4ddlL4AV-qkZhVhILEaNzd0VM8FNJ97yNiA&s",
      created_at: "2026-04-28 10:21:23.521886"
    },
    {
      id: "8e7ee019-f2c3-4b05-9c03-9298a17f991b",
      name: "נבחרת גודו חיפה",
      group_image: "https://www.gov.il/BlobFolder/generalpage/haifa_ac/he/haifa.png",
      created_at: "2026-04-28 10:21:43.305039"
    }
  ],
  users: [
    {
      id: "71d48bb9-4e8d-4c8f-b497-68fcff143dfa",
      first_name: "System",
      second_name: "Administrator",
      username: "admin",
      password: "$2b$12$DDHKOp5toEhgZGAB9UrqauaTDhh8i1GpGk.15z6qO5aYEMWVrJYOK",
      password_raw: "admin", 
      role: "admin",
      email: "admin@mitamnim.com",
      phone: null,
      profile_picture: "https://picsum.photos/seed/71d48bb9/200",
      created_at: "2026-04-28 13:10:40.175822",
      last_login: "2026-04-28 14:21:11.560975",
      group_id: null
    },
    {
      id: "503a53d9-49a1-4f1a-b616-adf51e5c85a9",
      first_name: "רוני",
      second_name: "מאמן",
      username: "מ1",
      password_raw: "מ1", 
      role: "trainer",
      phone: "2222222",
      profile_picture: "https://picsum.photos/seed/503a53d9/200",
      created_at: "2026-04-28 10:35:54.261464",
      group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e"
    },
    {
      id: "033d7915-ea1d-483c-b319-c3e1e7b61d82",
      first_name: "מתאמן1",
      username: "1",
      password_raw: "1",
      role: "trainee",
      profile_picture: "https://picsum.photos/seed/033d7915/200",
      group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e"
    }
  ],
  parameters: [
    { id: 6, name: "משקל", unit: 'ק"ג', group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", aggregation_strategy: "max", is_virtual: false },
    { id: 7, name: "חזרות", unit: "חזרות", group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", aggregation_strategy: "sum", is_virtual: false },
    { id: 9, name: "בריכות", unit: "בריכות", group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", aggregation_strategy: "sum", is_virtual: false },
    { id: 13, name: "מרחק (מטרים)", unit: "מטרים", group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", aggregation_strategy: "sum", is_virtual: false },
    { id: 17, name: "מרחק שחייה", unit: "מטרים", group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", aggregation_strategy: "sum", is_virtual: true, calculation_type: "conversion", source_parameter_ids: [9], multiplier: 25 }
  ],
  
  // Exercises Registry - Essential for UI selection
  group_exercise_registry: [
    { id: 101, name: "סקוואט", active_parameter_ids: [6, 7], group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e" },
    { id: 102, name: "שחייה חופשית", active_parameter_ids: [9, 17], group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e" },
    { id: 103, name: "ריצת 2000", active_parameter_ids: [13], group_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e" }
  ],

  // Dashboard Config - Determines what shows on the Leaderboard
  stats_dashboard_config: [
    { id: 1, exercise_id: 101, parameter_id: 6, ranking_direction: "desc", display_order: 0, is_public: true },
    { id: 2, exercise_id: 103, parameter_id: 13, ranking_direction: "asc", display_order: 1, is_public: true }
  ],

  // Messages - For the notice board on LandingPage
  messages: [
    { id: 1, title: "ברוכים הבאים", content: "מערכת Mitamnim2 עלתה לאוויר!", type: "general", target_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", created_at: "2026-05-15" },
    { id: 2, title: "מחנה אימונים", content: "ההרשמה למחנה הקיץ נסגרת השבוע.", type: "banner", target_id: "1dca60e6-fc1b-4857-b1e3-9dea57e78f4e", created_at: "2026-05-14" }
  ],

  // Workout Sessions - Necessary for history tracking
  workout_sessions: [
    { id: "s1", user_id: "033d7915-ea1d-483c-b319-c3e1e7b61d82", template_id: null, start_time: "2026-05-15T10:00:00", duration: 3600, summary: "אימון בוקר חזק" }
  ],

  // Activity Logs - Historical data to see stats in action
  activity_logs: [
    { id: 501, session_id: "s1", user_id: "033d7915-ea1d-483c-b319-c3e1e7b61d82", exercise_name: "סקוואט", performance_data: { 6: 100, 7: 10 }, created_at: "2026-05-15T10:15:00" },
    { id: 502, session_id: "s1", user_id: "033d7915-ea1d-483c-b319-c3e1e7b61d82", exercise_name: "סקוואט", performance_data: { 6: 105, 7: 8 }, created_at: "2026-05-15T10:20:00" }
  ],

  workout_templates: []
};