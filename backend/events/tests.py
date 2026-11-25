from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from config.helpers import make_event, make_user
from events.models import Event


def payload(**overrides):
    data = {"title": "New Event", "description": "d", "event_type": "Workshop",
            "date": str(timezone.localdate() + timedelta(days=10)), "start_time": "10:00:00",
            "end_time": "12:00:00", "venue": "Lab", "max_participants": 30,
            "registration_fee": "0.00", "status": "Upcoming",
            "registration_deadline": (timezone.now() + timedelta(days=5)).isoformat()}
    data.update(overrides)
    return data


class EventTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin")
        self.student = make_user("student")

    def test_admin_creates_event(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/events/", payload(), format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Event.objects.get().created_by, self.admin)

    def test_student_cannot_create_event(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post("/api/events/", payload(), format="json").status_code, 403)

    def test_past_date_rejected(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/events/", payload(date=str(timezone.localdate() - timedelta(days=1))),
                               format="json")
        self.assertEqual(res.status_code, 400)

    def test_deadline_after_event_date_rejected(self):
        self.client.force_authenticate(self.admin)
        late = (timezone.now() + timedelta(days=30)).isoformat()
        res = self.client.post("/api/events/", payload(registration_deadline=late), format="json")
        self.assertEqual(res.status_code, 400)

    def test_student_can_retrieve_and_filter_events(self):
        make_event(self.admin, title="Alpha", event_type="Workshop")
        make_event(self.admin, title="Beta", event_type="Hackathon")
        self.client.force_authenticate(self.student)
        res = self.client.get("/api/events/", {"event_type": "Hackathon"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual([e["title"] for e in res.data["results"]], ["Beta"])
        res = self.client.get("/api/events/", {"search": "alp"})
        self.assertEqual(res.data["count"], 1)

    def test_admin_update_and_delete(self):
        event = make_event(self.admin)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(f"/api/events/{event.id}/", {"venue": "New Hall"},
                                           format="json").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/events/{event.id}/").status_code, 204)


class PosterUploadTests(APITestCase):
    """File upload: only real, small JPG/PNG/WEBP images are accepted."""

    def setUp(self):
        self.admin = make_user("admin")
        self.client.force_authenticate(self.admin)

    def _image(self, name="poster.png", size=(10, 10), fmt="PNG", content_type="image/png"):
        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        buf = BytesIO()
        Image.new("RGB", size, "blue").save(buf, format=fmt)
        return SimpleUploadedFile(name, buf.getvalue(), content_type=content_type)

    def test_admin_uploads_poster(self):
        import tempfile

        from django.test import override_settings

        with tempfile.TemporaryDirectory() as tmp, override_settings(MEDIA_ROOT=tmp):
            res = self.client.post("/api/events/", {**payload(), "poster": self._image()}, format="multipart")
            self.assertEqual(res.status_code, 201, res.data)
            self.assertTrue(res.data["poster"].endswith(".png"))

    def test_non_image_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake = SimpleUploadedFile("evil.png", b"not an image", content_type="image/png")
        res = self.client.post("/api/events/", {**payload(), "poster": fake}, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_gif_type_rejected(self):
        res = self.client.post("/api/events/", {**payload(), "poster": self._image("a.gif", fmt="GIF", content_type="image/gif")},
                               format="multipart")
        self.assertEqual(res.status_code, 400)


class ManyToManyTests(APITestCase):
    def test_event_volunteers_m2m(self):
        admin, vol = make_user("admin"), make_user("volunteer")
        e1, e2 = make_event(admin, title="A"), make_event(admin, title="B")
        from config.helpers import assign
        assign(e1, vol)
        assign(e2, vol)
        self.assertEqual(vol.assigned_events.count(), 2)
        self.assertEqual(list(e1.volunteers.all()), [vol])
