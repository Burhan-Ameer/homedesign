from django.urls import path,include
from homeusers.views import *
urlpatterns = [
   path("login/",Login_page,name="login"),
   path("register/",Register,name="register"),
   path("logout/",logout_page,name="logout")
]
