from django.contrib import admin

# Register your models here.
from dvp_user_side.models import Collections, Feedback
admin.site.register(Collections)
admin.site.register(Feedback)
