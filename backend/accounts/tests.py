from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from config.helpers import make_user


class AuthTests(APITestCase):
    def test_student_can_register(self):
        """Public sign-up creates a student with a hashed password."""
        res = self.client.post("/api/auth/register/", {
            "first_name": "Asha", "email": "asha@test.local", "password": "StrongPass123!"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="asha@test.local")
        self.assertEqual(user.role, "student")
        self.assertNotEqual(user.password, "StrongPass123!")

    def test_register_cannot_choose_admin_role(self):
        """Extra 'role' in the payload is ignored - nobody can self-register as admin."""
        self.client.post("/api/auth/register/", {
            "first_name": "Eve", "email": "eve@test.local", "password": "StrongPass123!", "role": "admin"})
        self.assertEqual(User.objects.get(email="eve@test.local").role, "student")

    def test_duplicate_email_rejected(self):
        make_user("student", "dup@test.local")
        res = self.client.post("/api/auth/register/", {
            "first_name": "X", "email": "dup@test.local", "password": "StrongPass123!"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_role(self):
        make_user("student", "log@test.local")
        res = self.client.post("/api/auth/login/", {"username": "log@test.local", "password": "StrongPass123!"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["role"], "student")

    def test_login_wrong_password(self):
        make_user("student", "bad@test.local")
        res = self.client.post("/api/auth/login/", {"username": "bad@test.local", "password": "nope"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        make_user("student", "ref@test.local")
        tokens = self.client.post("/api/auth/login/", {"username": "ref@test.local",
                                                       "password": "StrongPass123!"}).data
        res = self.client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)


class PermissionTests(APITestCase):
    def test_protected_endpoint_needs_token(self):
        self.assertEqual(self.client.get("/api/events/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_cannot_list_users(self):
        self.client.force_authenticate(make_user("student"))
        self.assertEqual(self.client.get("/api/users/").status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users(self):
        self.client.force_authenticate(make_user("admin"))
        self.assertEqual(self.client.get("/api/users/").status_code, 200)

    def test_admin_creates_volunteer(self):
        self.client.force_authenticate(make_user("admin"))
        res = self.client.post("/api/volunteers/", {
            "first_name": "Vol", "email": "vol@test.local", "password": "StrongPass123!"})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(User.objects.get(email="vol@test.local").role, "volunteer")
