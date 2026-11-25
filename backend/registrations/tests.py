import tempfile
from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from config.helpers import make_event, make_user
from registrations.models import Registration


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class RegistrationTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin")
        self.student = make_user("student")
        self.event = make_event(self.admin, max_participants=1)
        self.url = f"/api/events/{self.event.id}/register/"

    def test_student_registers_and_gets_qr(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 201)
        reg = Registration.objects.get()
        self.assertTrue(reg.registration_id.startswith("ACE-"))
        self.assertTrue(reg.qr_code.name.endswith(".png"))
        qr = self.client.get(f"/api/registrations/{reg.id}/qr/")
        self.assertEqual(qr.status_code, 200)
        self.assertEqual(qr["Content-Type"], "image/png")

    def test_confirmation_email_sent(self):
        self.client.force_authenticate(self.student)
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(self.url)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.event.title, mail.outbox[0].subject)

    def test_duplicate_registration_conflict(self):
        self.client.force_authenticate(self.student)
        self.client.post(self.url)
        self.assertEqual(self.client.post(self.url).status_code, 409)
        self.assertEqual(Registration.objects.count(), 1)

    def test_capacity_reached(self):
        self.client.force_authenticate(self.student)
        self.client.post(self.url)  # takes the only seat
        self.client.force_authenticate(make_user("student"))
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 409)

    def test_registration_after_deadline_rejected(self):
        self.event.registration_deadline = timezone.now() - timedelta(hours=1)
        self.event.save()
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_registration_closed_status_rejected(self):
        self.event.status = "Registration Closed"
        self.event.save()
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post(self.url).status_code, 400)

    def test_admin_cannot_register_as_student(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(self.url).status_code, 403)

    def test_student_sees_only_own_registrations(self):
        other = make_user("student")
        Registration.objects.create(student=other, event=self.event)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get("/api/registrations/").data["count"], 0)
