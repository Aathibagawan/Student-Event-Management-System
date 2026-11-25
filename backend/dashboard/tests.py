from rest_framework.test import APITestCase

from config.helpers import make_event, make_user
from registrations.models import Registration


class DashboardTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin")
        self.student = make_user("student")
        self.event = make_event(self.admin, max_participants=4)
        Registration.objects.create(student=self.student, event=self.event)

    def test_each_role_gets_its_own_stats(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/dashboard/").data["role"], "student")
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/dashboard/").data["role"], "admin")

    def test_sql_event_report_for_admin(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/dashboard/event-report/")
        self.assertEqual(res.status_code, 200)
        row = res.data[0]
        self.assertEqual(row["registered"], 1)
        self.assertEqual(row["fill_percent"], 25.0)

    def test_sql_event_report_forbidden_for_student(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/dashboard/event-report/").status_code, 403)


class HealthTests(APITestCase):
    def test_health_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["database"], "up")
        self.assertIn("X-Response-Time", res)  # set by our custom middleware
