from locust import HttpUser, task

class SimpleLoadTest(HttpUser):
    host = "http://localhost:8080"

    @task
    def health(self):
        self.client.get("/health")
