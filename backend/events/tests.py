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
