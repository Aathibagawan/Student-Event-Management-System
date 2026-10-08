import logging
from io import BytesIO

import qrcode
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def make_qr_png(registration_id: str) -> bytes:
    """QR payload is ONLY the registration ID - nothing sensitive is encoded."""
    img = qrcode.make(registration_id, box_size=8, border=2)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def attach_qr_code(registration):
    registration.qr_code.save(f"{registration.registration_id}.png",
                              ContentFile(make_qr_png(registration.registration_id)), save=True)


def send_registration_email(registration):
    event, student = registration.event, registration.student
    body = (
        f"Hi {student.get_full_name() or student.username},\n\n"
        f"Your registration is confirmed.\n\n"
        f"Event: {event.title}\n"
        f"Registration ID: {registration.registration_id}\n"
        f"Date: {event.date:%d %b %Y}, {event.start_time:%I:%M %p}\n"
        f"Venue: {event.venue}\n\n"
        "Show your QR code (available in the ACE Events app) at the entrance.\n\n- ACE Events"
    )
    try:
        send_mail(f"Registration confirmed: {event.title}", body,
                  settings.DEFAULT_FROM_EMAIL, [student.email])
    except Exception:  # an email problem must never break a successful registration
        logger.exception("Could not send confirmation email for %s", registration.registration_id)
