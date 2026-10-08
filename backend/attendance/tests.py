from rest_framework.test import APITestCase

from config.helpers import assign, make_event, make_user
from registrations.models import Registration


class CheckInTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin")
        self.volunteer = make_user("volunteer")
        self.student = make_user("student")
        self.event = make_event(self.admin)
        assign(self.event, self.volunteer)
        self.reg = Registration.objects.create(student=self.student, event=self.event)
        self.url = "/api/attendance/check-in/"

    def test_volunteer_checks_in_student(self):
        self.client.force_authenticate(self.volunteer)
        res = self.client.post(self.url, {"registration_id": self.reg.registration_id}, format="json")
        self.assertEqual(res.status_code, 200)
        self.reg.refresh_from_db()
        self.assertEqual(self.reg.attendance_status, "Checked In")
        self.assertEqual(self.reg.checked_in_by, self.volunteer)
        self.assertIsNotNone(self.reg.check_in_time)

    def test_duplicate_check_in_rejected(self):
        self.client.force_authenticate(self.volunteer)
        self.client.post(self.url, {"registration_id": self.reg.registration_id}, format="json")
        res = self.client.post(self.url, {"registration_id": self.reg.registration_id}, format="json")
        self.assertEqual(res.status_code, 409)

    def test_unknown_registration_id(self):
        self.client.force_authenticate(self.volunteer)
        res = self.client.post(self.url, {"registration_id": "ACE-0000-99999"}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_unassigned_volunteer_forbidden(self):
        self.client.force_authenticate(make_user("volunteer"))
        res = self.client.post(self.url, {"registration_id": self.reg.registration_id}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_student_cannot_check_in(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(self.url, {"registration_id": self.reg.registration_id}, format="json")
        self.assertEqual(res.status_code, 403)
